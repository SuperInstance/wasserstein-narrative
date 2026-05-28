"use strict";
// — Simplex and SimplicialComplex —
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplicialComplex = exports.Simplex = void 0;
class Simplex {
    constructor(vertices) {
        this.vertices = [...vertices].sort((a, b) => a - b);
        // Remove duplicates
        this.vertices = [...new Set(this.vertices)];
        this.dimension = this.vertices.length - 1;
    }
    equals(other) {
        if (this.dimension !== other.dimension)
            return false;
        return this.vertices.every((v, i) => v === other.vertices[i]);
    }
    hash() {
        return this.vertices.join(',');
    }
    /** Boundary: all (d-1)-faces */
    boundary() {
        if (this.dimension === 0)
            return [];
        const faces = [];
        for (let i = 0; i < this.vertices.length; i++) {
            const face = this.vertices.filter((_, j) => j !== i);
            faces.push(new Simplex(face));
        }
        return faces;
    }
    /** All faces of any dimension */
    allFaces() {
        const result = [this];
        if (this.dimension === 0)
            return result;
        // Generate all subsets of vertices
        const n = this.vertices.length;
        for (let mask = 1; mask < (1 << n) - 1; mask++) {
            const subset = [];
            for (let i = 0; i < n; i++) {
                if (mask & (1 << i))
                    subset.push(this.vertices[i]);
            }
            result.push(new Simplex(subset));
        }
        return result;
    }
}
exports.Simplex = Simplex;
class SimplicialComplex {
    constructor() {
        this.simplices = new Map();
        this.maxDimension = -1;
    }
    addSimplex(s) {
        const h = s.hash();
        if (!this.simplices.has(h)) {
            this.simplices.set(h, s);
            if (s.dimension > this.maxDimension)
                this.maxDimension = s.dimension;
        }
    }
    has(s) {
        return this.simplices.has(s.hash());
    }
    getSimplicesOfDimension(d) {
        const result = [];
        for (const s of this.simplices.values()) {
            if (s.dimension === d)
                result.push(s);
        }
        return result;
    }
    get allSimplices() {
        return [...this.simplices.values()];
    }
}
exports.SimplicialComplex = SimplicialComplex;
