# amalgamemnon's Flanking for Foundry VTT (PF2e)

A Foundry VTT module for the Pathfinder Second Edition system that expands which positions count as flanking. You get more valid flanking positions than the rules as written, and they match what most tables would call "on opposite sides."

## How it works

By default, PF2e checks a line between the centers of you and your ally: it must pass through opposite sides of the target's space.

This module also draws a line from every square you occupy to every square your ally occupies. If any of those lines passes through the target's *flank zone*, a circle in the middle of its space, you're flanking. Any position that flanks under the default PF2e rule still flanks.

The flank zone fills a Medium target's square and grows half as fast as the target after that: 1½ squares across for Large, 2 for Huge, 2½ for Gargantuan. That way you need about the same "opposite" positioning against a dragon as against a goblin. For a target whose space isn't square, the zone is an ellipse.

For a Medium target (`T`) and an attacker (`A`), these are the squares where an ally completes the flank (`✓`):

```
 PF2e default         This module
 .  .  .              .  .  ✓
 A  T  ✓              A  T  ✓
 .  .  .              .  .  ✓

 A  .  .              A  .  .
 .  T  .              .  T  ✓
 .  .  ✓              .  ✓  ✓
```

Larger targets follow the same pattern. For a Huge target:

```
 Attacker at the side   Attacker at a corner
 . . . . ✓              A . . . .
 . T T T ✓              . T T T .
 A T T T ✓              . T T T ✓
 . T T T ✓              . T T T ✓
 . . . . ✓              . . ✓ ✓ ✓
```

## Sizes and reach

PF2e still decides *who* can flank, and this module only changes *where* they need to stand:

- **Reach** is PF2e's own reach for each creature. That covers natural reach from the stat block or ancestry, size changes like Enlarge, and reach weapons, but only while they're wielded. For your own Strike, the reach of the weapon you're attacking with is used.
- **Distance** is measured from the edges of each creature's space, so it works for every size from Tiny to Gargantuan, including the 10-foot reach diagonal exception.
- **Allies** must meet PF2e's normal requirements: they have to be able to act, and have the target within their reach. Gang Up and similar abilities keep working as usual.
- **Creatures bigger than Medium** flank at least as well as a Medium creature standing in any one of their squares would. A big creature whose space wraps around the target's corner can therefore flank from more positions.
- **Tiny creatures** count as filling their square. A Tiny creature inside the target's space can't flank, because there's no line *through* the target from there.

The expanded rule applies on square grids. Hex and gridless scenes use the default PF2e rule.

## Requirements

- Foundry VTT v14
- Pathfinder Second Edition system 8.x
- [libWrapper](https://foundryvtt.com/packages/lib-wrapper)

For Foundry v12 or v13, use version 1.0.1.

## Installation

In Foundry's **Add-on Modules** tab, choose **Install Module** and search for **amalgamemnon's Flanking**.

Or paste this manifest URL into the **Manifest URL** field:

```
https://github.com/amalgamemnon/amalgamemnon-Flanking/releases/latest/download/module.json
```

## Settings

- **Debug logging** (per user, off by default): logs every flanking position check to the browser console (F12). Useful when a flank doesn't behave the way you expect.

## Contributing

Contributions are welcome. Fork this repo, make changes, and submit a pull request. The geometry tests run with `node --test tests/*.test.mjs`.
