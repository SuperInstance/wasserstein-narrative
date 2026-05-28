import { Filtration } from './filtration';
import { PersistenceDiagram } from './persistence';
export interface Character {
    id: string;
    name: string;
}
export interface Interaction {
    characters: string[];
    scene: string;
    strength: number;
}
export interface NarrativeSummary {
    characterCount: number;
    interactionCount: number;
    bettiNumbers: number[];
    totalPersistence: number;
    essentialFeatures: number;
    topologicalComplexity: number;
}
export declare class NarrativeComplex {
    private characters;
    private interactions;
    private _cachedDiagram;
    addCharacter(c: Character): void;
    addInteraction(i: Interaction): void;
    buildFiltration(maxDimension?: number): Filtration;
    persistenceDiagram(maxDimension?: number): PersistenceDiagram;
    bettiNumbers(): number[];
    summary(): NarrativeSummary;
    get characterCount(): number;
    get characterList(): Character[];
}
/** Simple NLP-based text analysis to extract characters and interactions */
export declare function analyzeText(text: string): NarrativeComplex;
/** Compute genre similarity between two narratives */
export declare function genreSimilarity(story1: NarrativeComplex, story2: NarrativeComplex): number;
export interface GenrePrediction {
    genre: string;
    confidence: number;
    scores: Record<string, number>;
}
/** Classify genre based on persistence diagram features */
export declare function classifyGenre(story: NarrativeComplex): GenrePrediction;
