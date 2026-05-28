"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceDiagram = void 0;
exports.computePersistence = computePersistence;
exports.bettiNumbersAt = bettiNumbersAt;
class PersistenceDiagram {
    constructor() {
        this.points = [];
        this.essential = [];
    }
    bottleneckDistance(other) {
        const pts1 = this.finitePoints();
        const pts2 = other.finitePoints();
        const dim = new Set([...pts1.map(p => p.dimension), ...pts2.map(p => p.dimension)]);
        let maxDist = 0;
        for (const d of dim) {
            const a = pts1.filter(p => p.dimension === d);
            const b = pts2.filter(p => p.dimension === d);
            const dist = bottleneckDim(a, b);
            maxDist = Math.max(maxDist, dist);
        }
        return maxDist;
    }
    wassersteinDistance(other, p = 2) {
        const dim = new Set([
            ...this.finitePoints().map(x => x.dimension),
            ...other.finitePoints().map(x => x.dimension),
        ]);
        let total = 0;
        for (const d of dim) {
            const a = this.finitePoints().filter(x => x.dimension === d);
            const b = other.finitePoints().filter(x => x.dimension === d);
            total += Math.pow(wassersteinDim(a, b, p), p);
        }
        return Math.pow(total, 1 / p);
    }
    totalPersistence(q = 1) {
        return this.finitePoints().reduce((sum, pt) => {
            return sum + Math.pow(Math.abs(pt.death - pt.birth), q);
        }, 0);
    }
    finitePoints() {
        return this.points.filter(p => isFinite(p.death));
    }
    essentialFeatures() {
        return [...this.essential];
    }
}
exports.PersistenceDiagram = PersistenceDiagram;
/**
 * Compute persistence diagram from a filtration using the standard
 * boundary matrix reduction algorithm.
 *
 * Convention: low[col] = pivot row of that column.
 * A pivot at row r in column j means: simplex r's feature is killed by simplex j.
 */
function computePersistence(filtration) {
    filtration.sort();
    const steps = filtration.steps;
    const n = steps.length;
    // Map simplex hash -> column index
    const simplexIndex = new Map();
    for (let i = 0; i < n; i++) {
        simplexIndex.set(steps[i].simplex.hash(), i);
    }
    // Build boundary columns: for each simplex, list of boundary simplex indices
    const boundary = [];
    for (let i = 0; i < n; i++) {
        const faces = steps[i].simplex.boundary();
        const col = faces
            .map(f => simplexIndex.get(f.hash()))
            .filter((x) => x !== undefined);
        col.sort((a, b) => a - b);
        boundary.push(col);
    }
    // Standard reduction: track pivot row for each column
    // pivotOwner[row] = column index that owns this pivot row, or -1
    const pivotOwner = new Int32Array(n).fill(-1);
    // colPivot[col] = pivot row for this column, or -1
    const colPivot = new Int32Array(n).fill(-1);
    // Store reduced columns (sorted ascending)
    const reduced = boundary.map(c => [...c]);
    for (let col = 0; col < n; col++) {
        let current = [...boundary[col]];
        while (current.length > 0) {
            const row = current[current.length - 1]; // largest index = pivot
            if (pivotOwner[row] === -1) {
                // Claim this pivot
                pivotOwner[row] = col;
                colPivot[col] = row;
                reduced[col] = current;
                break;
            }
            else {
                // Reduce with the column that owns this pivot
                const other = pivotOwner[row];
                current = symmetricDifference(current, reduced[other]);
            }
        }
        // If current is empty, colPivot stays -1
    }
    // Extract pairs: colPivot[col] = row means simplex col kills the feature born at simplex row
    const diagram = new PersistenceDiagram();
    const killed = new Set();
    for (let col = 0; col < n; col++) {
        if (colPivot[col] !== -1) {
            const row = colPivot[col];
            killed.add(row);
            const birthThreshold = steps[row].threshold;
            const deathThreshold = steps[col].threshold;
            if (deathThreshold > birthThreshold) {
                diagram.points.push({
                    birth: birthThreshold,
                    death: deathThreshold,
                    dimension: steps[row].simplex.dimension,
                });
            }
        }
    }
    // Essential features: positive simplices (colPivot == -1) that were never killed
    for (let i = 0; i < n; i++) {
        if (!killed.has(i) && colPivot[i] === -1) {
            diagram.essential.push({
                birth: steps[i].threshold,
                dimension: steps[i].simplex.dimension,
            });
        }
    }
    return diagram;
}
/** Symmetric difference of two sorted-ascending arrays */
function symmetricDifference(a, b) {
    const result = [];
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] < b[j]) {
            result.push(a[i++]);
        }
        else if (a[i] > b[j]) {
            result.push(b[j++]);
        }
        else {
            i++;
            j++;
        }
    }
    while (i < a.length)
        result.push(a[i++]);
    while (j < b.length)
        result.push(b[j++]);
    return result;
}
/** Bottleneck distance between two sets of persistence points of same dimension */
function bottleneckDim(a, b) {
    if (a.length === 0 && b.length === 0)
        return 0;
    const m = Math.max(a.length, b.length);
    const A = padPoints(a, m);
    const B = padPoints(b, m);
    // Compute all pairwise costs and find the bottleneck matching
    const n = A.length;
    const costs = [];
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            costs.push(persistenceDist(A[i], B[j]));
        }
    }
    costs.sort((a, b) => a - b);
    // Binary search for the bottleneck value
    let lo = 0, hi = costs.length - 1;
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (hasPerfectMatching(A, B, costs[mid])) {
            hi = mid;
        }
        else {
            lo = mid + 1;
        }
    }
    return costs[lo];
}
/** Check if there's a perfect matching with all costs <= maxCost (greedy) */
function hasPerfectMatching(A, B, maxCost) {
    const used = new Set();
    for (const a of A) {
        let found = false;
        for (let j = 0; j < B.length; j++) {
            if (!used.has(j) && persistenceDist(a, B[j]) <= maxCost) {
                used.add(j);
                found = true;
                break;
            }
        }
        if (!found)
            return false;
    }
    return true;
}
/** Wasserstein distance between two sets using greedy matching */
function wassersteinDim(a, b, p) {
    const m = Math.max(a.length, b.length);
    if (m === 0)
        return 0;
    const A = padPoints(a, m);
    const B = padPoints(b, m);
    // Sort by persistence descending for greedy matching
    const sortedA = A.map((pt, i) => ({ pt, persistence: Math.abs(pt.death - pt.birth), idx: i }))
        .sort((x, y) => y.persistence - x.persistence);
    let total = 0;
    const usedB = new Set();
    for (const a of sortedA) {
        let bestJ = -1;
        let bestCost = Infinity;
        for (let j = 0; j < B.length; j++) {
            if (usedB.has(j))
                continue;
            const cost = Math.pow(persistenceDist(a.pt, B[j]), p);
            if (cost < bestCost) {
                bestCost = cost;
                bestJ = j;
            }
        }
        if (bestJ >= 0) {
            usedB.add(bestJ);
            total += bestCost;
        }
    }
    return Math.pow(total, 1 / p);
}
function persistenceDist(a, b) {
    return Math.max(Math.abs(a.birth - b.birth), Math.abs(a.death - b.death));
}
function padPoints(pts, n) {
    const result = [...pts];
    while (result.length < n) {
        result.push({ birth: 0, death: 0, dimension: pts.length > 0 ? pts[0].dimension : 0 });
    }
    return result;
}
/** Compute Betti numbers at a given threshold */
function bettiNumbersAt(filtration, threshold) {
    const diag = computePersistence(filtration);
    const maxDim = Math.max(...diag.points.map(p => p.dimension), ...diag.essential.map(p => p.dimension), 0);
    const betti = new Array(maxDim + 1).fill(0);
    for (const pt of diag.points) {
        if (pt.birth <= threshold && pt.death > threshold) {
            betti[pt.dimension]++;
        }
    }
    for (const ef of diag.essential) {
        if (ef.birth <= threshold) {
            betti[ef.dimension]++;
        }
    }
    return betti;
}
