# amalgamemnon-s-Flanking
Simple module for Foundry VTT that modifies the default Pathfinder 2nd Edition flanking rule to allow for additional valid and intuitive flanking positions.

This module utilizes the line-segment/circle intersection to first draw a line segment drawn from any squares occupied by an attacker to any allies that have the target within their reach, then determines whether that line segment intersects the circle centered the target (size adjusted based on the target's size).

This results in more valid flanking positions than the default rules-as-written, but the valid flanking positions are far more intuitive.
