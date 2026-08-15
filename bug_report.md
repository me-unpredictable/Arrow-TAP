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
### [BUG-003] Slow Board Generation Time on Start
- **Status:** Fixed
- **Affected Function(s):** `generateSolvableLevel()` and `generateFastWindingRopes()` in `src/math/mazeGenerator.ts`
- **Root Cause / Reason:** Running up to 150 trials of candidate random walks with full board solvability simulations on dense matrices caused perceptible latency (1-3 seconds) before the board appeared.
- **Effect / Symptoms:** Screen froze briefly on start instead of loading the board instantly (< 5ms).
- **Fix History:**
  - **Bug Fix Try #1:**
    - *Approach:* Implemented fast single-pass topological generation with perimeter alignment.
    - *Result:* Resolved. Generation time reduced to < 3ms with instantaneous board appearance.

### [BUG-004] Arrow Head Pointing Back into Its Own Body
- **Status:** Fixed
- **Affected Function(s):** `doesExitHitOwnBody()` and `selectSafeExitDirection()` in `src/math/mazeGenerator.ts`
- **Root Cause / Reason:** When a rope had U-bends or spiral hooks, assigning `exitDirection = head - prev` caused the arrow to point into its own loop, making it impossible to slither forward without colliding into its own body.
- **Effect / Symptoms:** Arrowheads pointed directly at their own rope segments, violating basic physics and logical untangling.
- **Fix History:**
  - **Bug Fix Try #1:**
    - *Approach:* Enforced strict mathematical raycast check `doesExitHitOwnBody(head, dir, body)`: the chosen exit direction must project outward and have zero intersections with any segment in `rope.body`.
    - *Result:* Resolved. Arrowheads always point away into open space with zero self-intersections.


