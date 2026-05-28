// — Simplex and SimplicialComplex —

export class Simplex {
  readonly vertices: number[];
  readonly dimension: number;

  constructor(vertices: number[]) {
    this.vertices = [...vertices].sort((a, b) => a - b);
    // Remove duplicates
    this.vertices = [...new Set(this.vertices)];
    this.dimension = this.vertices.length - 1;
  }

  equals(other: Simplex): boolean {
    if (this.dimension !== other.dimension) return false;
    return this.vertices.every((v, i) => v === other.vertices[i]);
  }

  hash(): string {
    return this.vertices.join(',');
  }

  /** Boundary: all (d-1)-faces */
  boundary(): Simplex[] {
    if (this.dimension === 0) return [];
    const faces: Simplex[] = [];
    for (let i = 0; i < this.vertices.length; i++) {
      const face = this.vertices.filter((_, j) => j !== i);
      faces.push(new Simplex(face));
    }
    return faces;
  }

  /** All faces of any dimension */
  allFaces(): Simplex[] {
    const result: Simplex[] = [this];
    if (this.dimension === 0) return result;
    // Generate all subsets of vertices
    const n = this.vertices.length;
    for (let mask = 1; mask < (1 << n) - 1; mask++) {
      const subset: number[] = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) subset.push(this.vertices[i]);
      }
      result.push(new Simplex(subset));
    }
    return result;
  }
}

export class SimplicialComplex {
  simplices: Map<string, Simplex> = new Map();
  maxDimension = -1;

  addSimplex(s: Simplex): void {
    const h = s.hash();
    if (!this.simplices.has(h)) {
      this.simplices.set(h, s);
      if (s.dimension > this.maxDimension) this.maxDimension = s.dimension;
    }
  }

  has(s: Simplex): boolean {
    return this.simplices.has(s.hash());
  }

  getSimplicesOfDimension(d: number): Simplex[] {
    const result: Simplex[] = [];
    for (const s of this.simplices.values()) {
      if (s.dimension === d) result.push(s);
    }
    return result;
  }

  get allSimplices(): Simplex[] {
    return [...this.simplices.values()];
  }
}
