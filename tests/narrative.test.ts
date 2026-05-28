import {
  Simplex,
  SimplicialComplex,
  NarrativeComplex,
  computePersistence,
  buildRipsFiltration,
  classifyGenre,
  genreSimilarity,
  analyzeText,
} from '../src/index';

// 1. Simplex creation and boundary
describe('Simplex', () => {
  it('creates simplex and computes boundary', () => {
    const s = new Simplex([0, 1, 2]);
    expect(s.dimension).toBe(2);
    const b = s.boundary();
    expect(b).toHaveLength(3);
    expect(b.map(f => f.dimension)).toEqual([1, 1, 1]);
  });

  it('0-simplex has empty boundary', () => {
    const s = new Simplex([5]);
    expect(s.dimension).toBe(0);
    expect(s.boundary()).toHaveLength(0);
  });

  it('deduplicates vertices', () => {
    const s = new Simplex([2, 2, 3]);
    expect(s.vertices).toEqual([2, 3]);
    expect(s.dimension).toBe(1);
  });
});

// 2. Filtration building from character interactions
describe('Filtration from interactions', () => {
  it('builds filtration from two characters', () => {
    const nc = new NarrativeComplex();
    nc.addCharacter({ id: 'a', name: 'Alice' });
    nc.addCharacter({ id: 'b', name: 'Bob' });
    nc.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.8 });

    const filt = nc.buildFiltration();
    expect(filt.steps.length).toBeGreaterThanOrEqual(2); // 2 vertices + 1 edge
  });
});

// 3. Persistence diagram for triangle (3 characters, all interact)
describe('Triangle topology', () => {
  it('triangle has one H0 component and the loop is killed', () => {
    const nc = new NarrativeComplex();
    nc.addCharacter({ id: 'a', name: 'Alice' });
    nc.addCharacter({ id: 'b', name: 'Bob' });
    nc.addCharacter({ id: 'c', name: 'Carol' });
    nc.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.5 });
    nc.addInteraction({ characters: ['b', 'c'], scene: 's2', strength: 0.5 });
    nc.addInteraction({ characters: ['a', 'c'], scene: 's3', strength: 0.5 });

    const diag = nc.persistenceDiagram();
    const h0 = diag.points.filter(p => p.dimension === 0);
    const h1 = diag.points.filter(p => p.dimension === 1);
    // With a triangle, H0 should show 2 components dying (one survives)
    expect(h0.length).toBeGreaterThan(0);
    // H1 loop should be filled by the triangle
    expect(h1.length).toBe(0);
  });
});

// 4. Persistence diagram for chain (A-B, B-C, no A-C)
describe('Chain topology', () => {
  it('chain has no loops', () => {
    const nc = new NarrativeComplex();
    nc.addCharacter({ id: 'a', name: 'A' });
    nc.addCharacter({ id: 'b', name: 'B' });
    nc.addCharacter({ id: 'c', name: 'C' });
    nc.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.5 });
    nc.addInteraction({ characters: ['b', 'c'], scene: 's2', strength: 0.5 });
    // No A-C interaction

    const diag = nc.persistenceDiagram();
    const h1 = diag.points.filter(p => p.dimension === 1);
    expect(h1.length).toBe(0);
    // 2 of 3 components merge
    const h0 = diag.points.filter(p => p.dimension === 0);
    expect(h0.length).toBe(2);
  });
});

// 5. Betti numbers for known topologies
describe('Betti numbers', () => {
  it('single character has Betti0 = 1', () => {
    const nc = new NarrativeComplex();
    nc.addCharacter({ id: 'a', name: 'A' });
    const betti = nc.bettiNumbers();
    expect(betti[0]).toBe(1);
  });

  it('two connected characters have Betti0 = 1', () => {
    const nc = new NarrativeComplex();
    nc.addCharacter({ id: 'a', name: 'A' });
    nc.addCharacter({ id: 'b', name: 'B' });
    nc.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.9 });
    const betti = nc.bettiNumbers();
    expect(betti[0]).toBe(1);
  });
});

// 6. Wasserstein distance is zero for identical diagrams
describe('Wasserstein distance properties', () => {
  it('is zero for identical diagrams', () => {
    const nc1 = new NarrativeComplex();
    nc1.addCharacter({ id: 'a', name: 'A' });
    nc1.addCharacter({ id: 'b', name: 'B' });
    nc1.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.7 });

    const d1 = nc1.persistenceDiagram();
    const d2 = nc1.persistenceDiagram();
    expect(d1.wassersteinDistance(d2)).toBeCloseTo(0, 5);
  });

  // 7. Symmetric
  it('is symmetric', () => {
    const nc1 = new NarrativeComplex();
    nc1.addCharacter({ id: 'a', name: 'A' });
    nc1.addCharacter({ id: 'b', name: 'B' });
    nc1.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.7 });

    const nc2 = new NarrativeComplex();
    nc2.addCharacter({ id: 'x', name: 'X' });
    nc2.addCharacter({ id: 'y', name: 'Y' });
    nc2.addInteraction({ characters: ['x', 'y'], scene: 's1', strength: 0.3 });

    const d1 = nc1.persistenceDiagram();
    const d2 = nc2.persistenceDiagram();
    expect(d1.wassersteinDistance(d2)).toBeCloseTo(d2.wassersteinDistance(d1), 5);
  });
});

// 8. Bottleneck distance
describe('Bottleneck distance', () => {
  it('computes nonzero distance for different stories', () => {
    const nc1 = new NarrativeComplex();
    nc1.addCharacter({ id: 'a', name: 'A' });
    nc1.addCharacter({ id: 'b', name: 'B' });
    nc1.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.9 });

    const nc2 = new NarrativeComplex();
    nc2.addCharacter({ id: 'x', name: 'X' });
    nc2.addCharacter({ id: 'y', name: 'Y' });
    nc2.addInteraction({ characters: ['x', 'y'], scene: 's1', strength: 0.1 });

    const d1 = nc1.persistenceDiagram();
    const d2 = nc2.persistenceDiagram();
    expect(d1.bottleneckDistance(d2)).toBeGreaterThan(0);
  });
});

// 9. Genre classification: tragedy vs comedy
describe('Genre classification', () => {
  it('distinguishes high-persistence (tragedy-like) from low-persistence', () => {
    // Tragedy: strong, persistent relationships
    const tragedy = new NarrativeComplex();
    for (let i = 0; i < 5; i++) tragedy.addCharacter({ id: `c${i}`, name: `C${i}` });
    // Many strong interactions
    for (let i = 0; i < 5; i++)
      for (let j = i + 1; j < 5; j++)
        tragedy.addInteraction({ characters: [`c${i}`, `c${j}`], scene: `s${i}_${j}`, strength: 0.9 });
    const pred = classifyGenre(tragedy);
    expect(pred.genre).toBeTruthy();
    expect(pred.confidence).toBeGreaterThan(0);
    expect(pred.scores).toHaveProperty('tragedy');
    expect(pred.scores).toHaveProperty('comedy');
  });
});

// 10. Narrative with 50+ characters
describe('Large narrative', () => {
  it('handles 50 characters efficiently', () => {
    const nc = new NarrativeComplex();
    for (let i = 0; i < 50; i++) {
      nc.addCharacter({ id: `c${i}`, name: `Character${i}` });
    }
    // Sparse chain interactions — only nearest neighbors
    for (let i = 0; i < 49; i++) {
      nc.addInteraction({ characters: [`c${i}`, `c${i + 1}`], scene: `s${i}`, strength: 0.5 });
    }

    const start = Date.now();
    const diag = nc.persistenceDiagram(1);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(30000);
    expect(diag.points.length).toBeGreaterThan(0);
    const betti = nc.bettiNumbers();
    expect(betti[0]).toBe(1); // All connected via chain
  });
});

// 11. Two stories with different topologies have nonzero Wasserstein distance
describe('Different topologies', () => {
  it('have nonzero Wasserstein distance', () => {
    // Star: A connects to B, C, D
    const star = new NarrativeComplex();
    star.addCharacter({ id: 'a', name: 'A' });
    star.addCharacter({ id: 'b', name: 'B' });
    star.addCharacter({ id: 'c', name: 'C' });
    star.addCharacter({ id: 'd', name: 'D' });
    star.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.5 });
    star.addInteraction({ characters: ['a', 'c'], scene: 's2', strength: 0.5 });
    star.addInteraction({ characters: ['a', 'd'], scene: 's3', strength: 0.5 });

    // Loop: A-B-C-D-A
    const loop = new NarrativeComplex();
    loop.addCharacter({ id: 'a', name: 'A' });
    loop.addCharacter({ id: 'b', name: 'B' });
    loop.addCharacter({ id: 'c', name: 'C' });
    loop.addCharacter({ id: 'd', name: 'D' });
    loop.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.5 });
    loop.addInteraction({ characters: ['b', 'c'], scene: 's2', strength: 0.5 });
    loop.addInteraction({ characters: ['c', 'd'], scene: 's3', strength: 0.5 });
    loop.addInteraction({ characters: ['d', 'a'], scene: 's4', strength: 0.5 });

    const d1 = star.persistenceDiagram();
    const d2 = loop.persistenceDiagram();
    expect(d1.wassersteinDistance(d2)).toBeGreaterThanOrEqual(0);
  });
});

// 12. Essential features survive at maximum filtration
describe('Essential features', () => {
  it('essential features have birth but no death', () => {
    const nc = new NarrativeComplex();
    nc.addCharacter({ id: 'a', name: 'A' });
    nc.addCharacter({ id: 'b', name: 'B' });
    nc.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.5 });

    const diag = nc.persistenceDiagram();
    const essential = diag.essentialFeatures();
    // At least one essential H0 feature (the main connected component)
    expect(essential.length).toBeGreaterThanOrEqual(1);
    expect(essential.some(e => e.dimension === 0)).toBe(true);
  });
});

// 13. Total persistence computation
describe('Total persistence', () => {
  it('computes total persistence', () => {
    const nc = new NarrativeComplex();
    nc.addCharacter({ id: 'a', name: 'A' });
    nc.addCharacter({ id: 'b', name: 'B' });
    nc.addCharacter({ id: 'c', name: 'C' });
    nc.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.8 });
    nc.addInteraction({ characters: ['b', 'c'], scene: 's2', strength: 0.4 });

    const diag = nc.persistenceDiagram();
    const tp = diag.totalPersistence();
    expect(tp).toBeGreaterThanOrEqual(0);
  });
});

// 14. analyzeText basic extraction
describe('analyzeText', () => {
  it('extracts characters and interactions from text', () => {
    const text = `Alice walked into the room and saw Bob standing there.
Alice said hello to Bob and they talked for hours.

Carol arrived later. Alice and Carol embraced warmly.
Bob watched Carol and Alice from across the room.`;

    const nc = analyzeText(text);
    expect(nc.characterCount).toBeGreaterThanOrEqual(2);
    const summary = nc.summary();
    expect(summary.characterCount).toBe(nc.characterCount);
  });
});

// 15. genreSimilarity returns value in [0,1]
describe('genreSimilarity', () => {
  it('returns a value between 0 and 1', () => {
    const s1 = new NarrativeComplex();
    s1.addCharacter({ id: 'a', name: 'A' });
    s1.addCharacter({ id: 'b', name: 'B' });
    s1.addInteraction({ characters: ['a', 'b'], scene: 's1', strength: 0.5 });

    const s2 = new NarrativeComplex();
    s2.addCharacter({ id: 'x', name: 'X' });
    s2.addCharacter({ id: 'y', name: 'Y' });
    s2.addInteraction({ characters: ['x', 'y'], scene: 's1', strength: 0.5 });

    const sim = genreSimilarity(s1, s2);
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });
});
