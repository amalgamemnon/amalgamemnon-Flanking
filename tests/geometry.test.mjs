import { test } from "node:test";
import assert from "node:assert/strict";
import { cellCenters, flankZone, isExpandedFlank, segmentCrossesEllipse } from "../geometry.js";

/** A size×size token whose top-left corner is at (x, y), in grid units */
const token = (x, y, size = 1) => ({ x, y, width: size, height: size });

/** Places a token of the given size centered (rounded to the grid) on one side of a target */
function beside(target, side, size) {
    const offset = Math.floor((target.width - size) / 2);
    switch (side) {
        case "W":
            return token(target.x - size, target.y + offset, size);
        case "E":
            return token(target.x + target.width, target.y + offset, size);
        case "N":
            return token(target.x + offset, target.y - size, size);
        case "S":
            return token(target.x + offset, target.y + target.height, size);
    }
}

/** Places a token of the given size diagonally off one corner of a target, touching it */
function corner(target, side, size) {
    const west = target.x - size;
    const east = target.x + target.width;
    const north = target.y - size;
    const south = target.y + target.height;
    switch (side) {
        case "NW":
            return token(west, north, size);
        case "NE":
            return token(east, north, size);
        case "SW":
            return token(west, south, size);
        case "SE":
            return token(east, south, size);
    }
}

// Tiny, Small and Medium all fill one square (PF2e's mechanical bounds), then Large, Huge, Gargantuan, and the
// bigger tokens some Gargantuan creatures use
const SIZES = [1, 2, 3, 4, 5, 6];

test("cellCenters returns the center of every occupied square", () => {
    assert.deepEqual(cellCenters(token(0, 0, 2)), [
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 1.5 },
        { x: 1.5, y: 0.5 },
        { x: 1.5, y: 1.5 },
    ]);
    assert.deepEqual(cellCenters({ x: 3, y: 1, width: 2, height: 1 }), [
        { x: 3.5, y: 1.5 },
        { x: 4.5, y: 1.5 },
    ]);
    assert.deepEqual(cellCenters({ x: 0, y: 0, width: 0.5, height: 0.5 }), [{ x: 0.25, y: 0.25 }]);
});

for (const targetSize of SIZES) {
    for (const sizeA of SIZES) {
        for (const sizeB of SIZES) {
            const label = `attacker ${sizeA}x${sizeA}, ally ${sizeB}x${sizeB}, target ${targetSize}x${targetSize}`;
            const target = token(0, 0, targetSize);

            test(`${label}: opposite sides flank`, () => {
                assert.ok(isExpandedFlank(beside(target, "W", sizeA), beside(target, "E", sizeB), target));
                assert.ok(isExpandedFlank(beside(target, "N", sizeA), beside(target, "S", sizeB), target));
            });

            test(`${label}: opposite corners flank`, () => {
                assert.ok(isExpandedFlank(corner(target, "NW", sizeA), corner(target, "SE", sizeB), target));
                assert.ok(isExpandedFlank(corner(target, "NE", sizeA), corner(target, "SW", sizeB), target));
            });

            test(`${label}: a side and the far corner flank`, () => {
                assert.ok(isExpandedFlank(beside(target, "W", sizeA), corner(target, "SE", sizeB), target));
                assert.ok(isExpandedFlank(beside(target, "N", sizeA), corner(target, "SE", sizeB), target));
            });

            test(`${label}: two corners on the same side don't flank`, () => {
                assert.equal(isExpandedFlank(corner(target, "NW", sizeA), corner(target, "SW", sizeB), target), false);
                assert.equal(isExpandedFlank(corner(target, "NW", sizeA), corner(target, "NE", sizeB), target), false);
            });

            test(`${label}: an ally directly behind the attacker doesn't flank`, () => {
                const attacker = beside(target, "W", sizeA);
                const offset = Math.floor((targetSize - sizeB) / 2);
                const behind = token(attacker.x - sizeB, offset, sizeB);
                assert.equal(isExpandedFlank(attacker, behind, target), false);
            });

            test(`${label}: swapping attacker and ally gives the same result`, () => {
                const positions = [
                    ...["W", "E", "N", "S"].map((side) => beside(target, side, sizeB)),
                    token(-sizeB, -sizeB, sizeB),
                    token(targetSize, -sizeB, sizeB),
                    token(-sizeB, targetSize, sizeB),
                    token(targetSize, targetSize, sizeB),
                ];
                for (const side of ["W", "N"]) {
                    const attacker = beside(target, side, sizeA);
                    for (const ally of positions) {
                        assert.equal(
                            isExpandedFlank(attacker, ally, target),
                            isExpandedFlank(ally, attacker, target)
                        );
                    }
                }
            });
        }

        test(`a Tiny creature inside a ${targetSize}x${targetSize} target's space doesn't flank with a ${sizeA}x${sizeA} ally`, () => {
            const target = token(0, 0, targetSize);
            for (let x = 0; x < targetSize; x++) {
                for (let y = 0; y < targetSize; y++) {
                    for (const side of ["W", "E", "N", "S"]) {
                        assert.equal(isExpandedFlank(token(x, y), beside(target, side, sizeA), target), false);
                    }
                }
            }
        });
    }
}

test("a Medium target flanks from exactly 12 of the 28 pairs of adjacent squares", () => {
    const target = token(0, 0);
    const neighbors = {
        N: token(0, -1),
        NE: token(1, -1),
        E: token(1, 0),
        SE: token(1, 1),
        S: token(0, 1),
        SW: token(-1, 1),
        W: token(-1, 0),
        NW: token(-1, -1),
    };
    const expected = new Set([
        // Opposite sides (the PF2e default)
        "N+S",
        "E+W",
        "NE+SW",
        "NW+SE",
        // Expanded positions
        "N+SE",
        "N+SW",
        "E+NW",
        "E+SW",
        "S+NE",
        "S+NW",
        "W+NE",
        "W+SE",
    ]);

    const names = Object.keys(neighbors);
    const flanking = new Set();
    for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
            if (isExpandedFlank(neighbors[names[i]], neighbors[names[j]], target)) {
                flanking.add(`${names[i]}+${names[j]}`);
            }
        }
    }

    const normalize = (set) => new Set([...set].map((pair) => pair.split("+").sort().join("+")));
    assert.deepEqual(normalize(flanking), normalize(expected));
});

test("a reach attacker standing behind an ally on the same side doesn't flank", () => {
    const target = token(0, 0);
    const attacker = token(0, -2);
    const ally = token(0, -1);
    assert.equal(isExpandedFlank(attacker, ally, target), false);
    assert.equal(segmentCrossesEllipse({ x: 0.5, y: -1.5 }, { x: 0.5, y: -0.5 }, target), false);
});

test("a Huge attacker wrapped around a Medium target's corner flanks with an ally to the north", () => {
    const target = token(0, 0);
    const huge = token(-3, -1, 3); // its southeast square sits southwest of the target
    assert.ok(isExpandedFlank(huge, token(0, -1), target));
    assert.equal(isExpandedFlank(token(-2, -1, 2), token(0, -1), target), false); // a Large attacker doesn't reach around
});

test("a Gargantuan target is flanked from diagonal corners but not from one side", () => {
    const target = token(0, 0, 4);
    assert.ok(isExpandedFlank(token(-1, -1), token(4, 4), target));
    assert.ok(isExpandedFlank(token(-1, 0), token(4, 3), target));
    assert.equal(isExpandedFlank(token(-1, -1), token(4, -1), target), false);
    assert.equal(isExpandedFlank(token(-1, 0), token(3, -1), target), false);
});

test("squares inside a Gargantuan target's corner never count, even outside its flank zone", () => {
    const target = token(0, 0, 4);
    assert.equal(segmentCrossesEllipse({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, flankZone(target)), false);
    assert.equal(isExpandedFlank(token(0, 0), token(4, 3), target), false);
});

test("the flank zone fills a Medium target and grows half as fast as larger ones", () => {
    assert.deepEqual(flankZone(token(0, 0, 1)), token(0, 0, 1));
    assert.deepEqual(flankZone(token(0, 0, 2)), token(0.25, 0.25, 1.5));
    assert.deepEqual(flankZone(token(0, 0, 3)), token(0.5, 0.5, 2));
    assert.deepEqual(flankZone(token(0, 0, 4)), token(0.75, 0.75, 2.5));
});

/** Lists the 1x1 squares around a target where an ally completes the flank with the attacker */
function allySquares(attacker, target) {
    const squares = [];
    for (let y = target.y - 1; y <= target.y + target.height; y++) {
        for (let x = target.x - 1; x <= target.x + target.width; x++) {
            const inTarget = x >= target.x && x < target.x + target.width && y >= target.y && y < target.y + target.height;
            if (inTarget || (x === attacker.x && y === attacker.y)) continue;
            if (isExpandedFlank(attacker, token(x, y), target)) squares.push(`${x},${y}`);
        }
    }
    return squares.sort();
}

test("larger targets keep the Medium pattern: an attacker at the side flanks with the far side and its corners", () => {
    assert.deepEqual(allySquares(token(-1, 0), token(0, 0)), ["1,-1", "1,0", "1,1"]);
    assert.deepEqual(allySquares(token(-1, 1), token(0, 0, 3)), ["3,-1", "3,0", "3,1", "3,2", "3,3"]);
});

test("larger targets keep the Medium pattern: an attacker at a corner flanks with the far corner and its sides", () => {
    assert.deepEqual(allySquares(token(-1, -1), token(0, 0)), ["0,1", "1,0", "1,1"]);
    assert.deepEqual(allySquares(token(-1, -1), token(0, 0, 3)), ["1,3", "2,3", "3,1", "3,2", "3,3"]);
    assert.deepEqual(allySquares(token(-1, -1), token(0, 0, 4)), ["2,4", "3,4", "4,2", "4,3", "4,4"]);
});

test("creatures at right angles around a Huge target don't flank", () => {
    assert.equal(isExpandedFlank(token(-1, 1), token(1, -1), token(0, 0, 3)), false);
});

test("a 2x1 target uses an elliptical flank zone", () => {
    const target = { x: 0, y: 0, width: 2, height: 1 };
    assert.ok(isExpandedFlank(token(-1, 0), token(2, 0), target));
    assert.ok(isExpandedFlank(token(0, -1), token(1, 1), target));
    assert.equal(isExpandedFlank(token(0, -1), token(1, -1), target), false);
});
