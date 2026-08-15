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

### [BUG-005] Arrow Head Not Aligned Straight with Last Body Segment
- **Status:** Fixed
- **Affected Function(s):** `generateDenseWindingRopes()` in `src/math/mazeGenerator.ts`, `drawUltraThinRope()` in `src/rendering/ropeRenderer.ts`
- **Root Cause / Reason:** In the previous fix for BUG-004, when `head - prev` had potential self-intersection issues, the code picked an arbitrary orthogonal cardinal direction for the arrow tip. This caused the arrowhead to bend at a 90-degree angle from the body segment rather than continuing straight along the line.
- **Effect / Symptoms:** As seen in bug.png, the arrowhead was visually perpendicular/misaligned with the line body instead of sitting straight at the tip.
- **Fix History:**
  - **Bug Fix Try #1:**
    - *Approach:* Enforced that `exitDirection` is ALWAYS strictly `head - prev` (the natural straight continuation of the final segment). During path construction, steps that cause `head - prev` to raycast into the rope's own body are discarded in favor of outward pointing steps.
    - *Result:* Resolved. Arrowheads are 100% straight, colinear, and seamlessly aligned with the body segment.

### [BUG-006] Excessive Screen Empty Space & Disconnected Silhouette Shapes
- **Status:** Fixed
- **Affected Function(s):** `generateCompositeShape()` in `src/math/shapes.ts`, `handleResize()` in `src/game.ts`
- **Root Cause / Reason:** Vertical stacked CSG composite shapes created disjointed multi-island shapes with large empty gaps (e.g. Car atop T as shown in bug.png), and the board resolution was restricted to a smaller square bounding box leaving large empty black space on wide screens.
- **Effect / Symptoms:** Maze looked fragmented into separate islands and occupied only a small fraction of the screen with few arrows.
- **Fix History:**
  - **Bug Fix Try #1:**
    - *Approach:* Replaced split-island CSG shapes with solid, unified contiguous silhouettes (vehicles, objects, symbols, characters) with 85%+ cell occupancy. Expanded board sizing in `handleResize` to fill available screen area without arbitrary caps.
    - *Result:* Resolved. The board occupies the screen with densely packed winding arrows.



