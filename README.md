# wasserstein-narrative

Persistent homology and Wasserstein distance for narrative/story analysis. Pure TypeScript, browser-compatible.

## Concepts

- **Characters** are vertices (0-simplices)
- **Interactions** are edges (1-simplices)
- **Three-way relationships** are 2-simplices
- **Persistence diagrams** track which relationships survive across the narrative
- **Wasserstein distance** measures topological similarity between stories

## Installation

```bash
npm install wasserstein-narrative
```

## Quick Start

```typescript
import { NarrativeComplex, genreSimilarity, classifyGenre } from 'wasserstein-narrative';

const story = new NarrativeComplex();

story.addCharacter({ id: 'alice', name: 'Alice' });
story.addCharacter({ id: 'bob', name: 'Bob' });
story.addCharacter({ id: 'carol', name: 'Carol' });

story.addInteraction({ characters: ['alice', 'bob'], scene: 's1', strength: 0.9 });
story.addInteraction({ characters: ['bob', 'carol'], scene: 's2', strength: 0.6 });
story.addInteraction({ characters: ['alice', 'carol'], scene: 's3', strength: 0.3 });

const diag = story.persistenceDiagram();
console.log('Betti numbers:', story.bettiNumbers());
console.log('Total persistence:', diag.totalPersistence());
console.log('Genre:', classifyGenre(story));
```

## API

### NarrativeComplex

- `addCharacter(c)` / `addInteraction(i)` — Build the narrative
- `buildFiltration()` — Vietoris-Rips filtration from interaction strengths
- `persistenceDiagram()` — Compute persistence diagram
- `bettiNumbers()` — Betti numbers at maximum threshold
- `summary()` — Full narrative summary

### PersistenceDiagram

- `bottleneckDistance(other)` — ∞-Wasserstein distance
- `wassersteinDistance(other, p?)` — p-Wasserstein distance (default p=2)
- `totalPersistence(q?)` — Total persistence sum
- `essentialFeatures()` — Features that never die

### Utilities

- `analyzeText(text)` — Simple NLP extraction → NarrativeComplex
- `genreSimilarity(story1, story2)` — Topological similarity [0,1]
- `classifyGenre(story)` — Heuristic genre classification

## License

MIT

Part of the [SuperInstance OpenConstruct](https://github.com/SuperInstance/OpenConstruct) ecosystem.
