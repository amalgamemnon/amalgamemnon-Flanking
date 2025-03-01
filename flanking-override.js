Hooks.once('init', () => {
    if (!game.modules.get('lib-wrapper')?.active) {
        ui.notifications.error("This module requires 'libWrapper'. Please install and activate it.");
        return;
    }

    libWrapper.register(
        'amalgamemnon-flanking', // Correct module ID
        'CONFIG.Token.objectClass.prototype.onOppositeSides', // Correct target
        function (wrapped, _, Flankee) {
            // FlankerA should always be the attacking token (this)
            const FlankerA = this;
            console.log(`[Flanking Override] FlankerA (Attacker) assigned: ${FlankerA.name}`);

            // Flankee should always be the targeted token
            if (!Flankee) {
                const targets = Array.from(game.user.targets);
                if (targets.length === 1) {
                    Flankee = targets[0];
                    console.log(`[Flanking Override] Retrieved Flankee (Target): ${Flankee.name}`);
                } else {
                    console.warn("[Flanking Override] Multiple or no targets selected. Flanking check aborted.");
                    return false;
                }
            }

            // Debug log: show all tokens before filtering
            console.log("[Flanking Override] Checking potential allies...");

            let potentialAllies = [];
            for (const token of canvas.tokens.placeables) {
                if (token === FlankerA || token === Flankee) continue;

                const disposition = token.document.disposition;
                const reachFeet = token.actor?.system.attributes?.reach?.value || 5; // Default to 5ft if undefined
                const reachSquares = reachFeet / canvas.grid.distance; // Convert reach from feet to squares

                const distX = Math.abs(token.document.x - Flankee.document.x) / canvas.grid.size;
                const distY = Math.abs(token.document.y - Flankee.document.y) / canvas.grid.size;
                const distance = Math.max(distX, distY); // Manhattan distance in squares

                console.log(`Checking: ${token.name} | Disposition: ${disposition} | Reach (ft): ${reachFeet} | Reach (squares): ${reachSquares} | Distance to Flankee: ${distance}`);

                if (disposition !== FlankerA.document.disposition) {
                    console.log(`❌ Excluded: Not an ally (Disposition: ${disposition})`);
                    continue;
                }

                if (distance > reachSquares) {
                    console.log(`❌ Excluded: Insufficient reach (Reach: ${reachSquares} squares, Needed: ${distance} squares)`);
                    continue;
                }

                potentialAllies.push(token);
            }

            if (potentialAllies.length === 0) {
                console.warn("[Flanking Override] No valid allies found for flanking.");
                return false;
            }

            console.log(`[Flanking Override] Valid allies found: ${potentialAllies.map(a => a.name).join(", ")}`);

            // Sort allies from farthest to nearest FlankerA
            potentialAllies.sort((a, b) => {
                const distA = Math.hypot(a.document.x - FlankerA.document.x, a.document.y - FlankerA.document.y);
                const distB = Math.hypot(b.document.x - FlankerA.document.x, b.document.y - FlankerA.document.y);
                return distB - distA; // Sort descending (farthest first)
            });

            console.log(`[Flanking Override] Allies sorted from farthest to nearest.`);

            // Helper function to get all occupied squares (center points) for larger tokens
            function getOccupiedCenters(token) {
                const centers = [];
                const xStart = token.document.x / canvas.grid.size;
                const yStart = token.document.y / canvas.grid.size;
                const width = token.document.width;
                const height = token.document.height;

                for (let i = 0; i < width; i++) {
                    for (let j = 0; j < height; j++) {
                        centers.push({ x: xStart + i + 0.5, y: yStart + j + 0.5 });
                    }
                }
                return centers;
            }

            // Generate center points for all occupied squares
            const flankerAPoints = getOccupiedCenters(FlankerA);
            const flankeeCenter = {
                x: (Flankee.document.x / canvas.grid.size) + (Flankee.document.width / 2),
                y: (Flankee.document.y / canvas.grid.size) + (Flankee.document.height / 2)
            };

            console.log(`[Flanking Override] FlankerA occupies: ${JSON.stringify(flankerAPoints)}`);
            console.log(`[Flanking Override] Flankee center: (${flankeeCenter.x}, ${flankeeCenter.y})`);

            // Determine the radius of the flanking circle based on Flankee's size
            const sizeToRadius = {
                'tiny': 0.25,
                'sm': 0.5,
                'med': 0.5,
                'lg': 1,
                'huge': 1.5,
                'grg': 2
            };
            const radius = sizeToRadius[Flankee.actor?.size] || 0.5;

            console.log(`[Flanking Override] Flankee radius: ${radius}`);

            // Function to check if a line segment (FlankerA → FlankerB) intersects the Flankee's circle
            function lineIntersectsCircle(p1, p2, circleCenter, r) {
                console.log(`[Flanking Override] Checking line-circle intersection`);
                console.log(`   Line: (${p1.x}, ${p1.y}) → (${p2.x}, ${p2.y})`);
                console.log(`   Circle Center: (${circleCenter.x}, ${circleCenter.y}), Radius: ${r}`);

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const fx = p1.x - circleCenter.x;
                const fy = p1.y - circleCenter.y;

                const a = dx * dx + dy * dy;
                const b = 2 * (fx * dx + fy * dy);
                const c = (fx * fx + fy * fy) - (r * r);

                const discriminant = b * b - 4 * a * c;
                const intersects = discriminant >= 0;

                console.log(`[Flanking Override] Discriminant: ${discriminant} → Intersects: ${intersects}`);
                return intersects;
            }

            // Perform the flanking check using all occupied squares
            let flankingConfirmed = false;
            for (const ally of potentialAllies) {
                const flankerBPoints = getOccupiedCenters(ally);
                console.log(`[Flanking Override] Checking ally: ${ally.name} (Occupied squares: ${JSON.stringify(flankerBPoints)})`);

                for (const pointA of flankerAPoints) {
                    for (const pointB of flankerBPoints) {
                        if (lineIntersectsCircle(pointA, pointB, flankeeCenter, radius)) {
                            flankingConfirmed = true;
                            console.log(`[Flanking Override] Flanking confirmed between (${pointA.x},${pointA.y}) and (${pointB.x},${pointB.y}) via ${ally.name}`);
                            break;
                        }
                    }
                    if (flankingConfirmed) break;
                }

                if (flankingConfirmed) break;
            }

            if (!flankingConfirmed) {
                console.warn("[Flanking Override] Allies found, but no valid flanking line detected.");
            }

            console.log(`[Flanking Override] Final flanking result: ${flankingConfirmed}`);
            return flankingConfirmed;
        },
        'OVERRIDE'
    );
});
