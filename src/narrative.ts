// — Narrative Analysis —
import { Simplex, SimplicialComplex } from './simplex';
import { Filtration, buildRipsFiltration } from './filtration';
import { PersistenceDiagram, computePersistence, bettiNumbersAt } from './persistence';

export interface Character {
  id: string;
  name: string;
}

export interface Interaction {
  characters: string[];
  scene: string;
  strength: number; // 0-1, higher = stronger bond
}

export interface NarrativeSummary {
  characterCount: number;
  interactionCount: number;
  bettiNumbers: number[];
  totalPersistence: number;
  essentialFeatures: number;
  topologicalComplexity: number;
}

export class NarrativeComplex {
  private characters: Map<string, Character> = new Map();
  private interactions: Interaction[] = [];
  private _cachedDiagram: PersistenceDiagram | null = null;

  addCharacter(c: Character): void {
    this.characters.set(c.id, c);
    this._cachedDiagram = null;
  }

  addInteraction(i: Interaction): void {
    this.interactions.push(i);
    this._cachedDiagram = null;
  }

  buildFiltration(maxDimension: number = 2): Filtration {
    const charIds = [...this.characters.keys()];
    const idxMap = new Map<string, number>();
    charIds.forEach((id, i) => idxMap.set(id, i));
    const n = charIds.length;

    // Build distance matrix from interaction strengths
    // distance = 1 - maxStrength (stronger interaction = smaller distance = appears earlier)
    const maxStrength: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (const inter of this.interactions) {
      for (let a = 0; a < inter.characters.length; a++) {
        for (let b = a + 1; b < inter.characters.length; b++) {
          const iA = idxMap.get(inter.characters[a]);
          const iB = idxMap.get(inter.characters[b]);
          if (iA !== undefined && iB !== undefined) {
            maxStrength[iA][iB] = Math.max(maxStrength[iA][iB], inter.strength);
            maxStrength[iB][iA] = Math.max(maxStrength[iB][iA], inter.strength);
          }
        }
      }
    }

    const distances = maxStrength.map((row, i) =>
      row.map((s, j) => (i === j ? 0 : 1 - s))
    );

    return buildRipsFiltration(distances, maxDimension);
  }

  persistenceDiagram(maxDimension: number = 2): PersistenceDiagram {
    if (this._cachedDiagram) return this._cachedDiagram;
    const filt = this.buildFiltration(maxDimension);
    this._cachedDiagram = computePersistence(filt);
    return this._cachedDiagram;
  }

  bettiNumbers(): number[] {
    const filt = this.buildFiltration();
    return bettiNumbersAt(filt, 1); // At full threshold
  }

  summary(): NarrativeSummary {
    const diag = this.persistenceDiagram();
    const betti = this.bettiNumbers();
    return {
      characterCount: this.characters.size,
      interactionCount: this.interactions.length,
      bettiNumbers: betti,
      totalPersistence: diag.totalPersistence(),
      essentialFeatures: diag.essentialFeatures().length,
      topologicalComplexity: diag.points.length,
    };
  }

  get characterCount(): number {
    return this.characters.size;
  }

  get characterList(): Character[] {
    return [...this.characters.values()];
  }
}

/** Simple NLP-based text analysis to extract characters and interactions */
export function analyzeText(text: string): NarrativeComplex {
  const nc = new NarrativeComplex();

  // Split into scenes (paragraphs or "Scene" markers)
  const scenes = text.split(/\n\s*\n/).filter(s => s.trim().length > 10);

  // Simple name extraction: look for capitalized words that appear multiple times
  const namePattern = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g;
  const nameCounts = new Map<string, number>();
  const sceneChars: Set<string>[] = [];

  for (const scene of scenes) {
    const names = new Set<string>();
    let match: RegExpExecArray | null;
    const localPattern = new RegExp(namePattern.source, namePattern.flags);
    while ((match = localPattern.exec(scene)) !== null) {
      const name = match[1];
      // Filter common non-name words
      const common = ['The', 'This', 'That', 'Then', 'When', 'Where', 'What', 'There', 'Here', 'They', 'Their', 'These', 'Those', 'And', 'But', 'For', 'Not', 'She', 'His', 'Her', 'Was', 'Had', 'Has', 'Did', 'With', 'From', 'Into', 'Upon', 'After', 'Before', 'Just', 'Some', 'Like', 'Even', 'Very', 'Much', 'Only', 'Over', 'Such'];
      if (!common.includes(name)) {
        names.add(name);
        nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
      }
    }
    sceneChars.push(names);
  }

  // Characters: names that appear 2+ times
  const chars = [...nameCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  const charSet = new Set(chars.map(c => c[0]));
  for (const [name] of chars) {
    nc.addCharacter({ id: name, name });
  }

  // Interactions: characters in the same scene
  for (let si = 0; si < sceneChars.length; si++) {
    const names = [...sceneChars[si]].filter(n => charSet.has(n));
    if (names.length >= 2) {
      nc.addInteraction({
        characters: names,
        scene: `scene_${si}`,
        strength: 1 / names.length, // More characters = weaker pairwise
      });
    }
  }

  return nc;
}

/** Compute genre similarity between two narratives */
export function genreSimilarity(story1: NarrativeComplex, story2: NarrativeComplex): number {
  const d1 = story1.persistenceDiagram();
  const d2 = story2.persistenceDiagram();
  const dist = d1.wassersteinDistance(d2, 2);
  return 1 / (1 + dist);
}

export interface GenrePrediction {
  genre: string;
  confidence: number;
  scores: Record<string, number>;
}

/** Classify genre based on persistence diagram features */
export function classifyGenre(story: NarrativeComplex): GenrePrediction {
  const diag = story.persistenceDiagram();
  const totalPers = diag.totalPersistence();
  const h0 = diag.points.filter(p => p.dimension === 0);
  const h1 = diag.points.filter(p => p.dimension === 1);

  const avgH0Death = h0.length > 0
    ? h0.reduce((s, p) => s + (p.death - p.birth), 0) / h0.length
    : 0;
  const avgH1Death = h1.length > 0
    ? h1.reduce((s, p) => s + (p.death - p.birth), 0) / h1.length
    : 0;
  const h1Count = h1.length;

  // Heuristic genre scoring
  const scores: Record<string, number> = {};

  // Tragedy: high persistence (long-lived features), many loops
  scores['tragedy'] = Math.min(1, (avgH0Death * 2 + h1Count * 0.3 + totalPers * 0.5) / 3);

  // Comedy: low persistence, things resolve quickly
  scores['comedy'] = Math.min(1, (1 - avgH0Death) * 0.5 + (1 - totalPers * 0.3) * 0.3 + 0.2);

  // Drama: moderate persistence, lots of connected components
  scores['drama'] = Math.min(1, (h0.length * 0.1 + avgH0Death * 0.5 + avgH1Death * 0.4));

  // Romance: few high-persistence features, small loops
  scores['romance'] = Math.min(1, (h0.length <= 3 ? 0.4 : 0.1) + (avgH1Death > 0.3 ? 0.3 : 0) + 0.3);

  // Epic: many characters, many loops, high persistence
  scores['epic'] = Math.min(1, (story.characterCount * 0.05) + (h1Count * 0.2) + (totalPers * 0.3));

  // Normalize
  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  for (const k of Object.keys(scores)) {
    scores[k] /= total;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { genre: best[0], confidence: best[1], scores };
}
