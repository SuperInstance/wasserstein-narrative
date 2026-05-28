// — Filtration —
import { Simplex, SimplicialComplex } from './simplex';

export interface FiltrationStep {
  threshold: number;
  simplex: Simplex;
}

export class Filtration {
  steps: FiltrationStep[] = [];
  complex: SimplicialComplex = new SimplicialComplex();

  addStep(threshold: number, simplex: Simplex): void {
    this.steps.push({ threshold, simplex });
  }

  /** Sort by threshold, then by dimension (lower dim first at same threshold) */
  sort(): void {
    this.steps.sort((a, b) => {
      if (a.threshold !== b.threshold) return a.threshold - b.threshold;
      return a.simplex.dimension - b.simplex.dimension;
    });
  }

  /** Build the complex at a given threshold */
  complexAtThreshold(t: number): SimplicialComplex {
    const c = new SimplicialComplex();
    for (const step of this.steps) {
      if (step.threshold <= t) {
        c.addSimplex(step.simplex);
      }
    }
    return c;
  }

  get thresholds(): number[] {
    return [...new Set(this.steps.map(s => s.threshold))].sort((a, b) => a - b);
  }
}

/**
 * Build a Vietoris-Rips filtration from pairwise distances.
 * distances[i][j] = distance between vertex i and j (symmetric, 0 on diagonal).
 */
export function buildRipsFiltration(
  distances: number[][],
  maxDimension: number = 2
): Filtration {
  const n = distances.length;
  const filt = new Filtration();
  const seen = new Map<string, number>();

  // Add vertices at threshold 0
  for (let i = 0; i < n; i++) {
    const s = new Simplex([i]);
    const h = s.hash();
    if (!seen.has(h)) {
      seen.set(h, 0);
      filt.addStep(0, s);
    }
  }

  // Add edges at their distance
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = distances[i][j];
      const s = new Simplex([i, j]);
      const h = s.hash();
      if (!seen.has(h)) {
        seen.set(h, d);
        filt.addStep(d, s);
      }
    }
  }

  // Add higher simplices (triangles etc.) at max of edge distances
  if (maxDimension >= 2) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          const d = Math.max(distances[i][j], distances[i][k], distances[j][k]);
          const s = new Simplex([i, j, k]);
          const h = s.hash();
          if (!seen.has(h)) {
            seen.set(h, d);
            filt.addStep(d, s);
          }
        }
      }
    }
  }

  filt.sort();
  return filt;
}
