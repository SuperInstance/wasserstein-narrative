# wasserstein-narrative

**Persistent homology and Wasserstein distance for narrative analysis — measure the topological shape of stories.**

Pure TypeScript, browser-compatible. Characters are vertices, interactions are edges, three-way relationships are triangles. Compute persistence diagrams, Betti numbers, and topological similarity between stories using Wasserstein distance.

## What This Gives You

- **Narrative → topology** — characters, interactions, and relationships become simplicial complexes
- **Persistence diagrams** — which relationships survive across the narrative arc
- **Wasserstein distance** — rigorous topological similarity between any two stories
- **Genre classification** — heuristic genre detection from topological structure
- **Text analysis** — simple NLP extraction that converts raw text to a `NarrativeComplex`
- **Zero dependencies** — pure TypeScript, works in browser and Node.js

## The Core Idea

A story has topological structure. Characters form connections. Some connections are fleeting (born late, die early = low persistence). Others span the entire narrative (born early, die late = high persistence). The persistence diagram captures this shape, and Wasserstein distance measures how different two stories' shapes are.

```
Romeo & Juliet:                    A mystery novel:

  High persistence edges            Many short-lived edges
  (Romeo↔Juliet, families)          (suspect↔detective per chapter)
  Few triangles                     Many triangles, low persistence
  Low H₁                            High H¹
```

## Quick Start

```typescript
import { NarrativeComplex, genreSimilarity, classifyGenre } from 'wasserstein-narrative';

// Build a story
const story = new NarrativeComplex();

story.addCharacter({ id: 'alice', name: 'Alice' });
story.addCharacter({ id: 'bob', name: 'Bob' });
story.addCharacter({ id: 'carol', name: 'Carol' });

story.addInteraction({ characters: ['alice', 'bob'], scene: 's1', strength: 0.9 });
story.addInteraction({ characters: ['bob', 'carol'], scene: 's2', strength: 0.6 });
story.addInteraction({ characters: ['alice', 'carol'], scene: 's3', strength: 0.3 });

// Topological analysis
const diag = story.persistenceDiagram();
console.log('Betti numbers:', story.bettiNumbers());
console.log('Total persistence:', diag.totalPersistence());
console.log('Essential features:', diag.essentialFeatures());
console.log('Genre:', classifyGenre(story));

// Compare two stories topologically
const similarity = genreSimilarity(story1, story2); // ∈ [0, 1]

// Bottleneck distance (Wasserstein ∞)
const bottleneck = diag1.bottleneckDistance(diag2);

// p-Wasserstein distance
const w2 = diag1.wassersteinDistance(diag2, 2);
```

## API Reference

### NarrativeComplex

| Method | Description |
|--------|-------------|
| `addCharacter(c)` | Add a character (vertex) |
| `addInteraction(i)` | Add an interaction (edge with strength) |
| `buildFiltration()` | Vietoris-Rips filtration from interaction strengths |
| `persistenceDiagram()` | Compute full persistence diagram |
| `bettiNumbers()` | Betti numbers at maximum threshold |
| `summary()` | Full narrative topological summary |

### PersistenceDiagram

| Method | Description |
|--------|-------------|
| `bottleneckDistance(other)` | ∞-Wasserstein distance |
| `wassersteinDistance(other, p?)` | p-Wasserstein distance (default p=2) |
| `totalPersistence(q?)` | Total persistence sum |
| `essentialFeatures()` | Features that never die |

### Utilities

| Function | Description |
|----------|-------------|
| `analyzeText(text)` | Simple NLP → NarrativeComplex |
| `genreSimilarity(s1, s2)` | Topological similarity ∈ [0,1] |
| `classifyGenre(story)` | Heuristic genre classification |

## Installation

```bash
npm install wasserstein-narrative
```

## How It Fits

Part of the SuperInstance topological ecosystem:

- **[topology-lab](https://github.com/SuperInstance/topology-lab)** — Interactive persistence homology visualization
- **[topological-flow](https://github.com/SuperInstance/topological-flow)** — Persistence for flow networks (Rust)
- **wasserstein-narrative** — Persistence for stories (this repo)

## Testing

```bash
npm test
```

## License

MIT

Part of the [SuperInstance](https://github.com/SuperInstance) ecosystem.
