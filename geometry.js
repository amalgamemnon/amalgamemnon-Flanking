/**
 * Flanking geometry, kept free of Foundry globals so it can be tested with `node --test`.
 * All values are in grid units. Rectangles are { x, y, width, height }.
 */

const EPSILON = 1e-9;

/**
 * Returns the centers of the grid squares a rectangle occupies (at least one per axis).
 */
export function cellCenters({ x, y, width, height }) {
    const columns = Math.max(1, Math.round(width));
    const rows = Math.max(1, Math.round(height));
    const centers = [];

    for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
            centers.push({ x: x + ((i + 0.5) * width) / columns, y: y + ((j + 0.5) * height) / rows });
        }
    }
    return centers;
}

/**
 * Determines whether a point lies strictly inside a rectangle.
 */
export function isInside(point, { x, y, width, height }) {
    return (
        point.x > x + EPSILON &&
        point.x < x + width - EPSILON &&
        point.y > y + EPSILON &&
        point.y < y + height - EPSILON
    );
}

/**
 * Determines whether the line segment from a to b touches the ellipse inscribed in a rectangle.
 */
export function segmentCrossesEllipse(a, b, { x, y, width, height }) {
    // Scale space so the ellipse becomes a unit circle centered on the origin
    const rx = width / 2;
    const ry = height / 2;
    const ax = (a.x - x - rx) / rx;
    const ay = (a.y - y - ry) / ry;
    const dx = (b.x - a.x) / rx;
    const dy = (b.y - a.y) / ry;

    // Closest point to the center on the segment itself, not the infinite line through it
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq === 0 ? 0 : Math.min(1, Math.max(0, -(ax * dx + ay * dy) / lengthSq));
    const cx = ax + t * dx;
    const cy = ay + t * dy;

    return cx * cx + cy * cy <= 1 + EPSILON;
}

/**
 * Returns the rectangle, centered on a target, whose inscribed ellipse a flanking line must pass through. It fills a
 * Medium target's square and grows half as fast as the target after that (Large 1.5 squares across, Huge 2,
 * Gargantuan 2.5), so larger targets need about the same "opposite" positioning as Medium ones.
 */
export function flankZone({ x, y, width, height }) {
    const zoneWidth = (width + 1) / 2;
    const zoneHeight = (height + 1) / 2;
    return { x: x + (width - zoneWidth) / 2, y: y + (height - zoneHeight) / 2, width: zoneWidth, height: zoneHeight };
}

/**
 * Determines whether two flankers flank a target: a line segment from any square of one flanker to any square of
 * the other passes through the target's flank zone. Squares inside the target's space can't draw a line through
 * it, so they never count.
 */
export function isExpandedFlank(flankerA, flankerB, flankee) {
    const zone = flankZone(flankee);
    const outsideFlankee = (rect) => cellCenters(rect).filter((point) => !isInside(point, flankee));
    const pointsA = outsideFlankee(flankerA);
    const pointsB = outsideFlankee(flankerB);

    return pointsA.some((a) => pointsB.some((b) => segmentCrossesEllipse(a, b, zone)));
}
