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

## 4. Internal Engineering Policies

1. **Tap-First Interaction:**
   - All interactive elements must bind to `pointerdown` / `pointerup` with touch feedback latency under 16ms.
   - Avoid mouse click delay (prevent default touch action via CSS `touch-action: manipulation;`).
2. **Zero Garbage Collection Spikes:**
   - Particle bursts and animated text elements must use object pooling instead of runtime instantiation/destruction during gameplay loops.
3. **Cordova Compatibility Baseline:**
   - Keep external package dependencies minimal and browser-native.
   - Ensure all asset paths use relative referencing (`./assets/...`) so files resolve correctly under `file://` or `cdvfile://` schemes.
4. **Documentation Rules:**
   - `README.md` must be written strictly in **Australian English** (e.g., *colour*, *optimised*, *customise*, *programme*) in an engaging, story-telling tone for public presentation.
   - `working_memory.md` holds technical strategy, policies, and internal notes.

---

## 5. Development Milestones

- [x] **Milestone 0: Project Inception & Tech Stack Definition**
  - Git repository initialized.
  - Architecture rationale documented.
  - `README.md` and `working_memory.md` created.
- [ ] **Milestone 1: Project Scaffolding & Build Setup**
  - Vite + TypeScript + PixiJS setup.
  - Responsive canvas manager and safe-area scaling system.
- [ ] **Milestone 2: Core Gameplay & Tap Mechanics**
  - Arrow puzzle logic, grid generation, and directional mechanics.
- [ ] **Milestone 3: Visual Juice, Particles & Dynamic UI**
  - Bouncy text animations, emoji flooding FX, dynamic progress bars.
- [ ] **Milestone 4: Audio & Haptic Integration**
  - Low-latency sound FX and tap feedback.
- [ ] **Milestone 5: Cordova Android Packaging & Testing**
  - Cordova container configuration, APK build, and performance profiling.
