export declare class Simplex {
    readonly vertices: number[];
    readonly dimension: number;
    constructor(vertices: number[]);
    equals(other: Simplex): boolean;
    hash(): string;
    /** Boundary: all (d-1)-faces */
    boundary(): Simplex[];
    /** All faces of any dimension */
    allFaces(): Simplex[];
}
export declare class SimplicialComplex {
    simplices: Map<string, Simplex>;
    maxDimension: number;
    addSimplex(s: Simplex): void;
    has(s: Simplex): boolean;
    getSimplicesOfDimension(d: number): Simplex[];
    get allSimplices(): Simplex[];
}
