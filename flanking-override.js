import { isExpandedFlank } from "./geometry.js";

const MODULE_ID = "amalgamemnon-flanking";

Hooks.once("init", () => {
    game.settings.register(MODULE_ID, "debug", {
        name: "Debug logging",
        hint: "Log every flanking position check to the browser console (F12).",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
    });

    // PF2e calls this only with flankers that already pass its own checks (reach, able to act, allies, etc.),
    // so only the positioning rule is replaced here.
    libWrapper.register(
        MODULE_ID,
        "CONFIG.Token.objectClass.prototype.onOppositeSides",
        function (wrapped, flankerA, flankerB, flankee) {
            // Positions the PF2e rule accepts always count. Hex and gridless scenes use only the PF2e rule.
            let flanking = wrapped(flankerA, flankerB, flankee);
            if (!flanking && canvas.grid.type === CONST.GRID_TYPES.SQUARE) {
                flanking = isExpandedFlank(toGridRect(flankerA), toGridRect(flankerB), toGridRect(flankee));
            }
            debug(`${flankerA.name} + ${flankerB.name} vs ${flankee.name}: ${flanking ? "flanking" : "not flanking"}`);
            return flanking;
        },
        "MIXED"
    );
});

/**
 * Returns a token's space in grid units, using PF2e's mechanical bounds (Tiny tokens fill their square).
 */
function toGridRect(token) {
    const bounds = token.mechanicalBounds ?? token.bounds;
    const size = canvas.grid.size;
    return { x: bounds.x / size, y: bounds.y / size, width: bounds.width / size, height: bounds.height / size };
}

function debug(message) {
    if (game.settings.get(MODULE_ID, "debug")) console.log(`[${MODULE_ID}] ${message}`);
}
