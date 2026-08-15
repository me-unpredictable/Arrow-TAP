# 🏹 Arrow Tap: The Great Neon Arrow Untangle

> *G’day and welcome! Step right up and discover the story of Arrow Tap — a high-octane, ultra-juicy puzzle adventure where your sharp eyes, quick wits, and the pure satisfaction of a single tap untangle the wildest knot mazes ever spun.*

---

## 📖 The Story: Untangling the Neon Chaos

Imagine diving headfirst into an electric, neon-lit labyrinth of vibrant, multi-coloured arrows. They twist, snake, and loop around one another in a dazzling arena shaped like classic silhouettes — from roaring sports cars and mighty trucks to towering castles, blazing rockets, and shining stars!

There are no tangled knots that can’t be solved — but there is a catch: **only the arrow with a clear escape path to the outside world can slither free!**

Every arrow snakes through long, winding corridors with razor-sharp chevrons at the tip. Spot the arrow with an unobstructed route to the perimeter, give it a tap, feel the snappy mobile haptic pulse, and watch it gracefully slide out like a speedy snake escaping into the wild. 

Watch your step, mate: tap a blocked arrow and you’ll cop a penalty! With **3 lives** up your sleeve and the maze dynamically re-synthesising every 3 successful moves, you will need sharp eyes and lightning reflexes to conquer infinite levels of brain-teasing fun.

To top it all off, every round is powered by an authentic, procedurally generated **90s upbeat techno chiptune soundtrack** synthesized in real-time right inside your browser — complete with a handy top HUD mute button so you can play anywhere, anytime!

---

## 🛠️ The Tech Engine: Built for Universal Reach

To ensure Arrow Tap runs like a dream on any screen — from Android mobiles and iPhones to high-resolution desktop browsers — the entire game is built on modern web standards packaged for native mobile via **Apache Cordova**.

```
┌──────────────────────────────────────────────────────────────────┐
│                   🏹 ARROW TAP ENGINE ARCHITECTURE               │
├────────────────────────────┬─────────────────────────────────────┤
│ 🚀 Rendering Core           │ PixiJS (v8) WebGL & WebGPU          │
│ ⚡ Build & Language         │ Vite + TypeScript (Functional)      │
│ 🎶 90s Techno Synth Engine  │ Web Audio API Procedural Chiptunes  │
│ 📳 Mobile Haptics Engine    │ HTML5 & Cordova Tactile Vibrations  │
│ 🔇 Audio Mute Controls      │ Master Gain Toggle on Top HUD       │
│ ✨ Visual Juice & Shakes    │ GSAP & High-Density Particle Pools  │
│ 📐 Dynamic Responsive Grid  │ Auto-Scaling Full-Screen Silhouette │
│ 📱 Mobile Distribution      │ Apache Cordova Native Packaging     │
└────────────────────────────┴─────────────────────────────────────┘
```

### 1. 🎨 Blazing-Fast 2D Visuals with PixiJS (v8)
When the screen is flooding with celebratory emoji fountains, bouncing combo text, and animated slithering arrows, standard web DOM simply cannot keep pace. PixiJS harnesses hardware-accelerated WebGL/WebGPU to batch-render thousands of vibrant elements at a rock-solid 60 to 120 FPS.

### 2. 📳 Tactile Mobile Vibration & Victory Haptics
- **Snappy Tap Vibration:** Every tap on mobile triggers an instant, randomized short haptic pulse (15ms–35ms).
- **Celebration Buzz:** Clearing an entire level triggers a 0.10s (100ms) celebratory multi-pulse victory vibration!

### 3. 🎛️ Real-Time 90s Techno Synthesizer & Mute Switch
No waiting for audio tracks to download! Arrow Tap features a built-in procedural synthesizer crafting high-energy 135 BPM 90s techno beats, basslines, and punchy sound effects directly through the Web Audio API. Need some quiet time? Just tap the sleek **🔊 / 🔇 Mute Button** on the top HUD.

### 4. 🏹 Sleek Longer Multi-Colored Winding Arrows
Arrows snake across 5 to 9 segments with vibrant 90s techno neon palettes (Electric Cyan, Hot Coral, Lime Emerald, Radiant Gold, Neon Violet, Tangerine, and Rose) with seamless colinear arrowheads and clean round line tips.

### 5. 🕹️ Hilarious Instant Start Button FX
The moment you hit "Start Game", the button vanishes in an instant (under 0.15 seconds) with a randomly selected comedic animation — melting into a puddle, blasting off like a rocket, squishing into a shockwave, or exploding into confetti!

### 6. 🧮 Mathematical Zero-Deadlock DAG Generation
Every infinite level and 3-tap shuffle is mathematically constructed and verified for $100\%$ solvability using Potential-Gradient Directed Acyclic Graph (DAG) construction — guaranteed zero deadlocks!

---

## 🎮 How to Play

1. **Spot the Unblocked Arrow:** Examine the maze to find an arrow whose exit trajectory to the perimeter is completely unobstructed.
2. **Tap & Feel the Haptic:** Tap the arrow and watch it snake its way out of the maze to score points with responsive mobile vibration.
3. **Beware the Blockers:** Tapping a blocked arrow costs 1 life (you start with 3 lives).
4. **The 3-Tap Dynamic Shuffle:** Every 3 successful untangles, the remaining arrows dynamically re-route into brand new winding paths while strictly preserving full solvability.
5. **Level Clear Fanfare:** Clear all arrows to trigger the victory fanfare, 100ms celebration haptics, and cheering phrase explosions!

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm or yarn

### Installation & Local Play
```bash
# Clone the repository
git clone git@github.com:me-unpredictable/Arrow-TAP.git
cd Arrow-TAP

# Install dependencies
npm install

# Launch local development server
npm run dev
```

### Production Web Build
```bash
npm run build
```

### 📱 Android APK Compilation (Cordova)
Targeting **Android 15 (API 35)** with backwards compatibility down to API 24+:
```bash
# Build web assets and compile debug APK
npm run build:apk

# Output APK path:
# platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 👨‍💻 Author & Creator

Crafted with passion by **[@me__unpredictable](https://github.com/me-unpredictable)**.

---

## 🗺️ Project Roadmap & The Journey Ahead

- [x] **Chapter 1: Blueprint & Architecture** — Project initialized, coding guidelines locked in, and story established.
- [x] **Chapter 2: Framework & Tooling Selection** — PixiJS (v8) + Vite + TypeScript selected.
- [x] **Chapter 3: Real-Time Audio & Mute Controls** — Procedural 90s techno synth, countdown audio sync, and HUD mute button.
- [x] **Chapter 4: The Mathematical Maze Engine** — Potential-gradient DAG generator, winding arrow trajectories, and zero-deadlock proofs.
- [x] **Chapter 5: Tactile Mobile Haptics** — Tap vibration and 100ms victory celebration bursts.
- [x] **Chapter 6: Visual Polish & Celebration Juice** — Dynamic progress bars, 50 cheering phrases, bouncing text, and emoji floods.
- [x] **Chapter 7: Cordova Mobile Packaging** — Native Android APK compiled and verified for Android 15 (API 35) & Android 5.0+.

---

*Keep an eye on this space as we continue rolling out updates and bringing the vibrant world of Arrow Tap to life!*
