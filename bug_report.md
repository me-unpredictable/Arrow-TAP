# Bug Report & Resolution Log

This document tracks all bugs, discrepancies, and regressions encountered during the development of Arrow Tap.

---

## Bug Registry Schema

When logging a bug, use the following structure:

```markdown
### [BUG-XXX] Bug Title / Brief Summary
- **Status:** Open / Fixed / In Progress
- **Affected Function(s):** `functionName(args)` in `path/to/file.ts`
- **Root Cause / Reason:** Technical explanation of why the bug occurred.
- **Effect / Symptoms:** What happens in gameplay or rendering when the bug is triggered.
- **Fix History:**
  - **Bug Fix Try #1:**
    - *Approach:* Explanation of the proposed fix.
    - *Result:* Resolved / Failed (with notes on why).
```

---

## Active & Historical Bug Entries

### [BUG-001] Rigid Translation Instead of Path-Following Snake Slither
- **Status:** Fixed
- **Affected Function(s):** `animateSlitherOut(cellSize, originX, originY, onComplete)` in `src/rendering/ropeRenderer.ts`
- **Root Cause / Reason:** The previous animation translated the entire container as a single rigid body (`container.x += dx * dist`) rather than simulating a dynamic snake slithering where the tail and body follow the exact path vertices forward along the track.
- **Effect / Symptoms:** Ropes looked like floating rigid sticks when tapped rather than a rope being pulled through a winding maze.
- **Fix History:**
  - **Bug Fix Try #1:**
    - *Approach:* Implemented dynamic polyline track extrusion in `animateSlitherOut`. The head advances along the exit vector while the entire polyline slice snakes through intermediate vertices and dissolves out of bounds.
    - *Result:* Resolved. Ropes now slither smoothly along their winding tracks like pulled threads/snakes.

### [BUG-002] Fixed Square Grid vs Silhouette Shapes & Thick Ropes
- **Status:** Fixed
- **Affected Function(s):** `generateSolvableLevel()` in `src/math/mazeGenerator.ts`, `createRopeGraphic()` in `src/rendering/ropeRenderer.ts`
- **Root Cause / Reason:** Ropes had overly thick line widths without braided rope texture, and levels only generated plain square bounding boxes instead of dynamic silhouette shapes (e.g., Apple, Heart, Diamond, Shield, Circle).
- **Effect / Symptoms:** Mazes lacked visual variety, density, and tactile rope feel shown in reference designs.
- **Fix History:**
  - **Bug Fix Try #1:**
    - *Approach:* Introduced mathematical silhouette shape masks (Apple, Heart, Diamond, Shield, Circle, Square) on high-density matrices (up to 20x20), rendered realistic braided fiber twist patterns, sharp directional arrowheads, and tactile knot tails.
    - *Result:* Resolved. Mazes now generate high-density winding ropes matched to geometric silhouettes.

