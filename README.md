# amalgamemnon's Flanking for Foundry VTT (PF2e)
Simple module for Foundry VTT that modifies the default Pathfinder 2nd Edition flanking rule to allow for additional valid and intuitive flanking positions.

This module utilizes the line-segment/circle intersection to first draw a line segment drawn from any squares occupied by an attacker to any allies that have the target within their reach, then determines whether that line segment intersects the circle centered the target (size adjusted based on the target's size).

This results in more valid flanking positions than the default rules-as-written, but the valid flanking positions are far more intuitive.

## 📥 Installation
1. Download the module from [GitHub Releases](https://github.com/YOUR-GITHUB-USERNAME/flanking-override/releases).
2. Place the `flanking-override` folder into your `FoundryVTT/Data/modules/` directory.
3. Enable the module in Foundry VTT.

## ⚙️ Features
- Uses a **line-segment/circle intersection** test for flanking.
- Supports **multi-space creatures** and **multiple allies**.
- Ensures **proper reach validation** before counting an ally.

## 🛠️ Contributing
Contributions are welcome! Fork this repo, make changes, and submit a pull request.
