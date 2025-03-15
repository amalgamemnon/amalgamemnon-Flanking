Hooks.once('init', () => {
    if (!game.modules.get('lib-wrapper')?.active) {
        ui.notifications.error("This module requires 'libWrapper'. Please install and activate it.");
        return;
    }

    libWrapper.register(
        "amalgamemnon-flanking",
        "CONFIG.Token.objectClass.prototype.onOppositeSides",
        function (flankerA, flankerB, flankee) {
            console.log("[Flanking Override] FlankerA (Attacker) assigned:", flankerA.name);
            console.log("[Flanking Override] Flankee (Target) assigned:", flankee.name);
            console.log("[Flanking Override] Checking potential allies...");

            let allies = canvas.tokens.placeables.filter(token => {
                if (token === flankerA || token === flankee) return false;
                if (token.document.disposition !== flankerA.document.disposition) return false;

                let reach = getTokenReach(token);
                let distance = computeGridDistance(token, flankee);
                console.log(`Checking: ${token.name} | Disposition: ${token.document.disposition} | Reach: ${reach} | Distance to Flankee: ${distance}`);

                if (distance <= reach) {
                    console.log(`✅ ${token.name} is a valid flanking ally.`);
                    return true;
                } else {
                    console.log(`❌ ${token.name} is too far (Dist: ${distance}, Reach: ${reach}).`);
                    return false;
                }
            });

            if (allies.length === 0) {
                console.log("[Flanking Override] ❌ No valid flanking allies found.");
                return false;
            }

            console.log(`[Flanking Override] Valid allies found: ${allies.map(a => a.name).join(", ")}`);
            allies.sort((a, b) => computeGridDistance(b, flankee) - computeGridDistance(a, flankee));
            console.log("[Flanking Override] Allies sorted from farthest to nearest.");

            let flankerA_positions = getOccupiedGridCenters(flankerA);
            let flankee_positions = getOccupiedGridCenters(flankee);

            console.log(`[Flanking Override] FlankerA occupies: ${JSON.stringify(flankerA_positions)}`);
            console.log(`[Flanking Override] Flankee occupies: ${JSON.stringify(flankee_positions)}`);

            let flankee_radius = flankee.document.width * 0.5;
            console.log(`[Flanking Override] Flankee radius: ${flankee_radius}`);

            for (let ally of allies) {
                let flankerB_positions = getOccupiedGridCenters(ally);
                console.log(`[Flanking Override] Checking ally: ${ally.name} (Occupied squares: ${JSON.stringify(flankerB_positions)})`);

                for (let posA of flankerA_positions) {
                    for (let posB of flankerB_positions) {
                        console.log("[Flanking Override] Checking line-circle intersection");
                        console.log(`   Line: (${posA.x}, ${posA.y}) → (${posB.x}, ${posB.y})`);
                        console.log(`   Circle Center: (${flankee_positions[0].x}, ${flankee_positions[0].y}), Radius: ${flankee_radius}`);

                        if (lineIntersectsCircle(posA, posB, flankee_positions[0], flankee_radius)) {
                            console.log(`[Flanking Override] Flanking confirmed between (${posA.x},${posA.y}) and (${posB.x},${posB.y}) via ${ally.name}`);
                            return true;
                        }
                    }
                }
            }

            console.log("[Flanking Override] ❌ No valid flanking position found.");
            return false;
        },
        "OVERRIDE"
    );
});

/**
 * Computes the Pathfinder-style grid distance between two tokens.
 */
function computeGridDistance(tokenA, tokenB) {
    let positionsA = getOccupiedGridCenters(tokenA);
    let positionsB = getOccupiedGridCenters(tokenB);

    let minDistance = Infinity;
    for (let posA of positionsA) {
        for (let posB of positionsB) {
            let dx = Math.abs(posA.x - posB.x);
            let dy = Math.abs(posA.y - posB.y);
            let distance = Math.max(dx, dy) + Math.floor(Math.min(dx, dy) / 2); // Pathfinder-style diagonal movement
            minDistance = Math.min(minDistance, distance);
        }
    }
    return minDistance * 5; // Convert squares to feet
}

/**
 * Returns an array of the grid centers occupied by a token.
 */
function getOccupiedGridCenters(token) {
    let occupied = [];
    let { x, y } = token.document;
    let size = token.document.width;
    let gridSize = canvas.grid.size;
    let startX = x / gridSize;
    let startY = y / gridSize;

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            occupied.push({ x: startX + i + 0.5, y: startY + j + 0.5 });
        }
    }
    return occupied;
}

/**
 * Determines whether a line segment intersects a circle.
 */
function lineIntersectsCircle(p1, p2, circleCenter, radius) {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let fx = p1.x - circleCenter.x;
    let fy = p1.y - circleCenter.y;

    let a = dx * dx + dy * dy;
    let b = 2 * (fx * dx + fy * dy);
    let c = (fx * fx + fy * fy) - (radius * radius);

    let discriminant = b * b - 4 * a * c;
    console.log(`[Flanking Override] Discriminant: ${discriminant} → Intersects: ${discriminant >= 0}`);
    return discriminant >= 0;
}

/**
 * Determines a token's melee reach based on size and weapons.
 */
function getTokenReach(token) {
    if (!token?.document?.actor) {
        console.warn(`[Flanking Override] ⚠️ No actor found for token: ${token?.name || "Unknown"}`);
        return 5; // Default melee reach for unknown cases.
    }

    // Get the actor's size category
    let sizeCategory = token.document.actor.system.traits.size.value;
    let baseReach;

    // Assign reach based on size category
    switch (sizeCategory) {
        case "tiny":
            baseReach = 0;
            break;
        case "sm":
        case "med":
            baseReach = 5;
            break;
        case "lg":
            baseReach = 10;
            break;
        case "huge":
            baseReach = 15;
            break;
        case "gargantuan":
            baseReach = 20;
            break;
        default:
            console.warn(`[Flanking Override] ⚠️ Unknown size category: ${sizeCategory}. Using default 5 feet.`);
            baseReach = 5; // Default if unknown.
    }

    console.log(`[Flanking Override] ${token.name} Base reach before weapon check: ${baseReach} feet.`);

    // Check for weapon reach property
    let weaponReachBonus = 0;
    let actor = token.document.actor;
    if (actor && actor.items) {
        for (let item of actor.items) {
            if (item.type === "weapon" && item.system?.traits?.value?.includes("reach")) {
                weaponReachBonus = 5; // Extend reach if weapon has "reach" property
                console.log(`[Flanking Override] ${token.name} has a reach weapon, increasing reach by 5 feet.`);
                break;
            }
        }
    }

    let totalReach = baseReach + weaponReachBonus;
    console.log(`[Flanking Override] ${token.name} total melee reach calculated as: ${totalReach} feet.`);
    return totalReach;
}
