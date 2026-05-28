import { Filtration } from './filtration';
export interface PersistencePoint {
    birth: number;
    death: number;
    dimension: number;
}
export interface EssentialFeature {
    birth: number;
    dimension: number;
}
export declare class PersistenceDiagram {
    points: PersistencePoint[];
    essential: EssentialFeature[];
    bottleneckDistance(other: PersistenceDiagram): number;
    wassersteinDistance(other: PersistenceDiagram, p?: number): number;
    totalPersistence(q?: number): number;
    private finitePoints;
    essentialFeatures(): EssentialFeature[];
}
/**
 * Compute persistence diagram from a filtration using the standard
 * boundary matrix reduction algorithm.
 *
 * Convention: low[col] = pivot row of that column.
 * A pivot at row r in column j means: simplex r's feature is killed by simplex j.
 */
export declare function computePersistence(filtration: Filtration): PersistenceDiagram;
/** Compute Betti numbers at a given threshold */
export declare function bettiNumbersAt(filtration: Filtration, threshold: number): number[];
