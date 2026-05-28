import { Simplex, SimplicialComplex } from './simplex';
export interface FiltrationStep {
    threshold: number;
    simplex: Simplex;
}
export declare class Filtration {
    steps: FiltrationStep[];
    complex: SimplicialComplex;
    addStep(threshold: number, simplex: Simplex): void;
    /** Sort by threshold, then by dimension (lower dim first at same threshold) */
    sort(): void;
    /** Build the complex at a given threshold */
    complexAtThreshold(t: number): SimplicialComplex;
    get thresholds(): number[];
}
/**
 * Build a Vietoris-Rips filtration from pairwise distances.
 * distances[i][j] = distance between vertex i and j (symmetric, 0 on diagonal).
 */
export declare function buildRipsFiltration(distances: number[][], maxDimension?: number): Filtration;
