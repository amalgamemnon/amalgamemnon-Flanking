# Changelog

## 2.0.0

Requires Foundry VTT v14 and PF2e 8.x. If you're on Foundry v12 or v13, keep using 1.0.1.

### Changed
- Reach and ally checks now come from the PF2e system. That includes stat-block reach, size changes such as Enlarge, wielded reach weapons, the 10-foot reach diagonal exception, and whether an ally is able to act. This module now only decides *where* flankers must stand.
- Flanking positions work for creatures of every size: each square the attacker occupies is checked against each square the ally occupies.
- The circle a flanking line must cross (the flank zone) now grows half as fast as the target. Medium targets are unchanged, but Huge and Gargantuan targets are no longer flanked by creatures standing at right angles to each other.
- Any position that flanks under the default PF2e rule always counts.
- Hex and gridless scenes use the default PF2e flanking rule.
- The manifest uses the current Foundry format, so the PF2e system and libWrapper requirements are enforced again.

### Fixed
- A reach attacker standing behind an ally on the same side no longer counts as flanking.
- Gargantuan creatures no longer fall back to 5-foot reach.
- Large creatures with 5-foot reach no longer get 10 feet, and reach weapons that aren't wielded no longer add reach.
- Allies who can't act (unconscious, paralyzed, and so on) and non-creature tokens no longer complete a flank.
- Non-square and Tiny tokens use their actual space.
- A Tiny creature inside the target's space no longer flanks.

### Added
- A "Debug logging" client setting. Flanking checks no longer write to the console unless it's on.

## 1.0.1
- Reworked flanking detection: lines from every square of the attacker to every square of an ally, tested against a circle inscribed in the target, plus size-based reach.

## 1.0.0
- Initial release.
