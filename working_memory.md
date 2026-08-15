# Working Memory: Arrow Tap

This document serves as the internal record for architectural decisions, strategic policies, technology evaluations, and roadmap planning for the **Arrow Tap** game project. 

---

## 1. Project Overview & Core Constraints

- **Project Name:** Arrow Tap
- **Genre:** Fast-paced, hyper-juicy puzzle game.
- **Interaction Model:** Pure tap-only input (no swipe, drag, or multi-touch gestures required).
- **Target Platforms:** 
  - Web (Cross-browser, desktop, mobile web)
  - Mobile Native (Android first via Apache Cordova / WebView wrapper, iOS capable)
- **Visual & Audio Vibe:** High-energy arcade polish ("game juice") — popping text, particle bursts, screen shakes, emoji floods, dynamic responsive progress bars, and tactile audiovisual feedback.

---

## 2. Technology Stack Evaluation & Architectural Rationale

### 2.1 Rendering Engine: **PixiJS (v8)**
- **Why chosen:**
  - **High-Performance WebGL/WebGPU Pipeline:** Capable of rendering thousands of concurrent sprites, bouncing text meshes, and particle floods at solid 60–120 FPS inside mobile WebViews.
  - **Lightweight & Modular:** Avoids the heavy overhead and rigid scene hierarchies of monolithic game engines (e.g. Phaser or Unity WebGL), which can cause sluggish startup times in Cordova.
  - **Dynamic Viewport Scaling:** Built-in resolution handling, automatic canvas resizing, and custom coordinate mapping suited for varying aspect ratios (from 4:3 tablets to 21:9 modern smartphones).

### 2.2 Build Tool & Runtime: **Vite + TypeScript**
- **Why chosen:**
  - **Zero-Friction Dev Loop:** Instant Hot Module Replacement (HMR) for rapid tweaking of game juice, animations, and puzzle mechanics.
  - **Clean Static Output:** Outputs optimized, tree-shaken static assets directly to Cordova’s `www/` distribution directory.
  - **Strict Type Safety:** Strongly typed game states, level configurations, particle schemas, and event pipelines.

### 2.3 Animation & Game Juice: **GSAP (GreenSock) + Custom Particle Emitter**
- **Why chosen:**
  - **Fluid Tweening:** High-precision easing curves (elastic, back, bounce) for pop-in text, floating scores, and expanding progress rings.
  - **Batch Particle Flooding:** Dedicated lightweight particle pool for emoji rains, starbursts, and ripple effects without triggering garbage collection spikes.

### 2.4 Audio & Haptics: **Howler.js + Cordova Vibration Plugin**
- **Why chosen:**
  - Robust Web Audio API fallback handling for locked audio contexts on mobile browsers and Android WebViews.
  - Low-latency sound playback triggered on tap events with volume pooling.

### 2.5 Mobile Packaging: **Apache Cordova**
- **Why chosen:**
  - Standards-compliant WebView wrapping for Android APK/AAB generation.
  - Native hooks for immersive fullscreen, hardware back-button handling, splash screen control, and haptic feedback.

---

## 3. Dynamic Rendering & Viewport Policy

To guarantee seamless gameplay across phones, tablets, foldables, and desktops:

1. **Virtual Base Resolution:**
   - Base design canvas coordinates (e.g., `1080 x 1920` portrait).
2. **Dynamic Letterbox / Safe Area Adaptation:**
   - Canvas scales dynamically to fill 100% of the screen width and height.
   - Core puzzle elements are anchored within a defined "Safe Zone" (guaranteed visible on any aspect ratio between 4:3 and 21:9).
   - Peripheral animations (emoji floods, background particles, dynamic progress bars) extend into bleed margins to provide a full bleed borderless experience.
3. **High-DPI / Device Pixel Ratio (DPR) Scaling:**
   - Pixel ratio automatically clamped (e.g., `Math.min(window.devicePixelRatio, 2)`) to balance sharp visuals with battery/thermal performance on mid-range Android devices.

---

## 3. Game Mechanics & Mathematical Architecture Specification

### 3.1 Game Overview & Loop
- **Genre:** Infinite-level procedural rope untangling puzzle.
- **Board:** Strictly square grid ($N \times N$, scaling from $6 \times 6$ upwards with level progression: $N = \min(12, 6 + \lfloor \text{Level} / 3 \rfloor \times 2)$).
- **Board Filling:** Maximally expands to fit the smaller viewport dimension (width/height) maintaining a centered square layout with safe padding for HUD (Top bar: Level & Score; Bottom bar: 3 Lives & Streak).

### 3.2 Procedural Audio (90s Upbeat Techno Chiptune Engine)
- **Zero-Download Audio:** Synthesized in real-time via Web Audio API (`AudioContext`).
- **Composition:**
  - 135 BPM driving 4-on-the-floor kick & synthesized noise snare.
  - Random 16th-note arpeggiator (pentatonic / Dorian modes) using bandpass-filtered square/sawtooth waves.
  - Sub-bass synth line with frequency modulation.
  - Dynamic interactive sound FX (satisfying plop on tap, slither whoosh on rope exit, error buzz on wrong tap, party fanfare on level clear).

### 3.3 Start Button "Funny Exit" System
- **Requirement:** Disappears within $\le 0.15\text{s}$ (150ms) using a randomized comedic animation upon tap:
  1. *Meltdown:* Quick vertical stretch & dissolve.
  2. *Rocket Launch:* High-velocity upward snap with smoke sparks.
  3. *Squish & Pop:* Instant scale inversion to 0 with shockwave ring.
  4. *Pixel Vaporize:* Scatter burst into tiny colorful confetti particles.

### 3.4 Rope untangling & Mathematical Solvability
- **Rope Representation:**
  - Each rope $R_i$ is a sequence of discrete adjacent grid coordinates: $R_i = \{(x_0, y_0), (x_1, y_1), \dots, (x_k, y_k)\}$.
  - Ropes do not overlap: $\forall i \ne j, R_i \cap R_j = \emptyset$.
- **Knot:**
  - Placed at the terminal endpoints of each rope.
  - Only knots are interactive / tappable.
- **Exit Path & Collision Checking:**
  - For a knot at $(x_e, y_e)$, the slither exit path projects along the rope's trajectory out towards the board edge.
  - A rope can slither out if and only if its forward exit path to the perimeter is completely unobstructed by any other rope's occupied grid cells:
    $$\text{CanExit}(R_i) \iff \forall \text{step in ExitPath}(R_i), \text{Grid}(\text{step}) = \text{Empty} \lor \text{Grid}(\text{step}) \in R_i$$
- **Wrong Tap:**
  - Tapping a blocked knot deducts 1 life (starts with 3 lives) and triggers screen shake.
  - 0 lives returns the player to the Home Screen.
- **Every 3 Successful Taps Shuffle:**
  - A shuffle event triggers every 3 successful rope removals.
  - The remaining ropes are reorganized mathematically such that at least one valid unblocked rope exit is guaranteed:
    $$\exists R_k \in \text{RemainingRopes} \text{ such that } \text{CanExit}(R_k) = \text{True}$$

---

## 4. Internal Engineering Policies & Coding Standards

1. **Functional & Modular Paradigm:**
   - Write highly functional, testable, and deterministic code with minimal side effects.
2. **Mandatory Function Documentation Standard:**
   - Every single function must be documented with explicit JSDoc / TSDoc blocks covering:
     - `@param` / **Input**: Parameter name, type, and detailed description.
     - `@returns` / **Output**: Return type and description of the returned data.
     - `@description` / **Use**: Clear explanation of the function's purpose and usage.
3. **Mathematical Level Generation:**
   - Level generation algorithms must rely on deterministic mathematical formulas (coordinate matrices, raycasts, vector math) rather than bloated chains of `if-else` conditions. This enables direct mathematical validation and solvability checks.
4. **Tap-First Interaction:**
   - All interactive elements must bind to `pointerdown` / `pointerup` with touch feedback latency under 16ms.
   - Avoid mouse click delay (prevent default touch action via CSS `touch-action: manipulation;`).
5. **Zero Garbage Collection Spikes:**
   - Particle bursts and animated text elements must use object pooling instead of runtime instantiation/destruction during gameplay loops.
6. **Cordova Compatibility Baseline:**
   - Keep external package dependencies minimal and browser-native.
   - Ensure all asset paths use relative referencing (`./assets/...`) so files resolve correctly under `file://` or `cdvfile://` schemes.
7. **Documentation Rules:**
   - `README.md`: Maintained strictly in **Australian English** (*colour*, *optimised*, *customise*, etc.) in an engaging, story-telling tone for public presentation.
   - `working_memory.md`: Actively updated with architecture notes, state transitions, and milestone progress.
   - `bug_report.md`: Mandatory bug registry tracking root causes, affected functions, and fix attempts (`Bug Fix Try #X`).

---

## 5. Bug Tracking Protocol (`bug_report.md`)

- Whenever a bug is discovered or reported:
  1. Record the bug in `bug_report.md` with:
     - **Bug ID / Title**
     - **Affected Function(s)**
     - **Root Cause / Reason**
     - **Effect / Symptom**
  2. Before applying a fix, inspect `bug_report.md` to avoid repeating past errors.
  3. Log each fix attempt under `Bug Fix Try #[number]` with the applied solution and verification outcome.

---

## 6. Development Milestones

- [x] **Milestone 0: Project Inception & Tech Stack Definition**
  - Git repository initialized.
  - Selected Stack: PixiJS (v8) + Vite + TypeScript + GSAP.
  - Architecture rationale & game rules documented.
  - `README.md`, `working_memory.md`, and `bug_report.md` established.
- [x] **Milestone 1: Project Scaffolding & Build Setup**
  - Vite + TypeScript + PixiJS v8 setup.
  - Strict TypeScript compilation with zero lint/type errors.
  - Dynamic aspect-ratio preserving square canvas manager and safe-area scaling system.
- [x] **Milestone 2: Procedural Audio Engine & UI Flow**
  - Real-time 90s techno synth engine (zero audio downloads) with Web Audio API.
  - Start screen with randomized <= 0.15s comedic animations (Meltdown, Rocket, Squish, Vaporize).
  - HUD top/bottom bars (levels, score pop, progress bar, 3 lives with heart fracture animations).
- [x] **Milestone 3: Mathematical Maze Generation & Untangling Logic**
  - Non-overlapping curved rope generator with solvability verification.
  - Knot detection, slithering exit animations, and wrong-tap penalty.
  - Dynamic 3-tap shuffle mechanism with guaranteed solvability.
- [x] **Milestone 4: Visual Juice, Particles & Dynamic UI**
  - Bouncy floating texts, screen shake, emoji flood cascades, dynamic progress bars.
- [ ] **Milestone 5: Cordova Android Packaging & Testing**
  - Cordova container configuration, APK build, and performance profiling.
