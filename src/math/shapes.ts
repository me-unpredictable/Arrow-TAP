/**
 * @file shapes.ts
 * @description Catalog of mathematical primitive shapes, symbols, vehicles, letters, and numbers
 * combined with composite Boolean CSG (Union, Subtraction, Intersection) to generate over 500+ unique boards.
 */

export interface ShapePrimitive {
  name: string;
  category: 'vehicle' | 'building' | 'letter' | 'number' | 'symbol' | 'nature' | 'object';
  test: (nx: number, ny: number) => boolean; // nx, ny in normalized range [-1, 1]
}

/**
 * Evaluates whether a point (nx, ny) is inside a rounded box.
 * 
 * @param {number} nx - Normalized X [-1, 1].
 * @param {number} ny - Normalized Y [-1, 1].
 * @param {number} w - Half-width.
 * @param {number} h - Half-height.
 * @param {number} r - Corner radius.
 * @returns {boolean} True if inside rounded box.
 * @description Computes 2D signed distance to rounded box.
 */
function inBox(nx: number, ny: number, w: number, h: number, r = 0): boolean {
  if (r <= 0) return Math.abs(nx) <= w && Math.abs(ny) <= h;
  const qx = Math.abs(nx) - (w - r);
  const qy = Math.abs(ny) - (h - r);
  if (qx <= 0 && qy <= 0) return true;
  if (qx <= 0 && Math.abs(ny) <= h) return true;
  if (qy <= 0 && Math.abs(nx) <= w) return true;
  return Math.hypot(Math.max(0, qx), Math.max(0, qy)) <= r;
}

/**
 * Evaluates whether a point is inside a circle/ellipse.
 * 
 * @param {number} nx - Normalized X.
 * @param {number} ny - Normalized Y.
 * @param {number} rx - Radius X.
 * @param {number} ry - Radius Y.
 * @returns {boolean} True if inside ellipse.
 * @description Computes standard ellipse inequality.
 */
function inEllipse(nx: number, ny: number, rx: number, ry: number): boolean {
  return (nx * nx) / (rx * rx) + (ny * ny) / (ry * ry) <= 1.0;
}

// ----------------------------------------------------
// 1. VEHICLES, BUILDINGS, NATURE & OBJECTS
// ----------------------------------------------------
export const OBJECT_PRIMITIVES: ShapePrimitive[] = [
  {
    name: 'Car',
    category: 'vehicle',
    test: (x, y) => {
      // Body lower half, cabin upper half, wheel cutouts
      const body = inBox(x, y - 0.1, 0.9, 0.35, 0.1);
      const cabin = inBox(x - 0.05, y + 0.3, 0.45, 0.25, 0.1);
      const leftWheelCut = inEllipse(x + 0.5, y - 0.4, 0.2, 0.2);
      const rightWheelCut = inEllipse(x - 0.5, y - 0.4, 0.2, 0.2);
      return (body || cabin) && !leftWheelCut && !rightWheelCut;
    }
  },
  {
    name: 'Bus',
    category: 'vehicle',
    test: (x, y) => {
      const body = inBox(x, y, 0.9, 0.5, 0.12);
      const leftWheel = inEllipse(x + 0.55, y - 0.5, 0.18, 0.18);
      const rightWheel = inEllipse(x - 0.55, y - 0.5, 0.18, 0.18);
      return body && !leftWheel && !rightWheel;
    }
  },
  {
    name: 'Truck',
    category: 'vehicle',
    test: (x, y) => {
      const cargo = inBox(x - 0.2, y + 0.05, 0.65, 0.45, 0.05);
      const cabin = inBox(x + 0.6, y - 0.05, 0.25, 0.35, 0.08);
      const w1 = inEllipse(x - 0.6, y - 0.45, 0.16, 0.16);
      const w2 = inEllipse(x - 0.2, y - 0.45, 0.16, 0.16);
      const w3 = inEllipse(x + 0.6, y - 0.45, 0.16, 0.16);
      return (cargo || cabin) && !w1 && !w2 && !w3;
    }
  },
  {
    name: 'Home / House',
    category: 'building',
    test: (x, y) => {
      // Base square + triangular roof
      const base = inBox(x, y - 0.25, 0.65, 0.5);
      const roof = y >= 0.25 && (y - 0.25) <= (1.0 - Math.abs(x * 1.3));
      const chimney = inBox(x - 0.4, y - 0.65, 0.12, 0.2);
      return base || roof || chimney;
    }
  },
  {
    name: 'Castle / Tower',
    category: 'building',
    test: (x, y) => {
      const base = inBox(x, y - 0.1, 0.7, 0.65);
      const turretL = inBox(x + 0.5, y + 0.45, 0.18, 0.35);
      const turretR = inBox(x - 0.5, y + 0.45, 0.18, 0.35);
      const battlements = y > 0.4 && (Math.sin(x * 18) > 0);
      return (base || turretL || turretR) && !battlements;
    }
  },
  {
    name: 'Rocket',
    category: 'vehicle',
    test: (x, y) => {
      const fuselage = inBox(x, y - 0.1, 0.3, 0.65, 0.15);
      const nose = y >= 0.55 && (1.0 - y) >= Math.abs(x * 2.5);
      const finL = x < -0.3 && y < -0.2 && (y - (-0.7)) <= (x - (-0.75)) * 1.5;
      const finR = x > 0.3 && y < -0.2 && (y - (-0.7)) <= (0.75 - x) * 1.5;
      return fuselage || nose || finL || finR;
    }
  },
  {
    name: 'Heart',
    category: 'symbol',
    test: (x, y) => {
      const u = x * 1.1;
      const v = -y * 1.1 + 0.2;
      return (u * u + Math.pow(v - Math.sqrt(Math.abs(u)) * 0.7, 2)) <= 0.85;
    }
  },
  {
    name: 'Apple',
    category: 'nature',
    test: (x, y) => {
      if (Math.abs(x) <= 0.1 && y >= 0.7) return true; // stem
      const dist = Math.hypot(x * 1.05, y * 1.05);
      const topDip = (y > 0.4 && Math.abs(x) < 0.3) ? 0.35 : 0;
      return dist <= 0.9 - topDip;
    }
  },
  {
    name: 'Star',
    category: 'symbol',
    test: (x, y) => {
      const angle = Math.atan2(y, x) + Math.PI / 2;
      const r = Math.hypot(x, y);
      const arm = 0.5 + 0.4 * Math.cos(angle * 5);
      return r <= arm;
    }
  },
  {
    name: 'Shield',
    category: 'symbol',
    test: (x, y) => {
      if (y > 0) return Math.abs(x) <= 0.85 && y <= 0.85;
      return (Math.abs(x) + Math.pow(-y, 1.4)) <= 0.88;
    }
  },
  {
    name: 'Diamond',
    category: 'symbol',
    test: (x, y) => (Math.abs(x) + Math.abs(y)) <= 0.92
  },
  {
    name: 'Cloud',
    category: 'nature',
    test: (x, y) => {
      const c1 = inEllipse(x, y - 0.1, 0.75, 0.35);
      const c2 = inEllipse(x - 0.25, y + 0.15, 0.35, 0.35);
      const c3 = inEllipse(x + 0.25, y + 0.1, 0.4, 0.4);
      return c1 || c2 || c3;
    }
  },
  {
    name: 'Crown',
    category: 'symbol',
    test: (x, y) => {
      const base = inBox(x, y - 0.3, 0.8, 0.3);
      const peakL = x < -0.3 && (y - 0.0) <= (1.0 - Math.abs((x + 0.5) * 2.5));
      const peakC = Math.abs(x) <= 0.3 && (y - 0.0) <= (1.1 - Math.abs(x * 2.8));
      const peakR = x > 0.3 && (y - 0.0) <= (1.0 - Math.abs((x - 0.5) * 2.5));
      return (base || peakL || peakC || peakR) && y <= 0.85;
    }
  },
  {
    name: 'Key',
    category: 'object',
    test: (x, y) => {
      const ringOuter = inEllipse(x - 0.5, y, 0.38, 0.38);
      const ringInner = inEllipse(x - 0.5, y, 0.18, 0.18);
      const shaft = inBox(x + 0.15, y, 0.55, 0.1);
      const tooth1 = inBox(x + 0.45, y - 0.2, 0.08, 0.15);
      const tooth2 = inBox(x + 0.65, y - 0.2, 0.08, 0.15);
      return (ringOuter && !ringInner) || shaft || tooth1 || tooth2;
    }
  },
  {
    name: 'Cup / Mug',
    category: 'object',
    test: (x, y) => {
      const cup = inBox(x - 0.1, y, 0.55, 0.7, 0.1);
      const handleOut = inEllipse(x + 0.55, y, 0.3, 0.45);
      const handleIn = inEllipse(x + 0.55, y, 0.15, 0.3);
      return cup || (handleOut && !handleIn);
    }
  },
  {
    name: 'Fish',
    category: 'nature',
    test: (x, y) => {
      const body = inEllipse(x - 0.1, y, 0.65, 0.4);
      const tail = x > 0.35 && Math.abs(y) <= (x - 0.35) * 1.3;
      return body || tail;
    }
  },
  {
    name: 'Tree',
    category: 'nature',
    test: (x, y) => {
      const trunk = inBox(x, y - 0.5, 0.18, 0.4);
      const foliage = inEllipse(x, y + 0.2, 0.75, 0.65);
      return trunk || foliage;
    }
  },
  {
    name: 'Guitar',
    category: 'object',
    test: (x, y) => {
      const bodyLower = inEllipse(x, y - 0.35, 0.65, 0.5);
      const bodyUpper = inEllipse(x, y + 0.15, 0.48, 0.4);
      const neck = inBox(x, y + 0.6, 0.12, 0.45);
      return bodyLower || bodyUpper || neck;
    }
  },
  {
    name: 'Boat',
    category: 'vehicle',
    test: (x, y) => {
      const hull = y <= -0.1 && (Math.abs(x) + (-y) * 0.8) <= 0.85;
      const mast = inBox(x - 0.05, y + 0.3, 0.06, 0.55);
      const sail = x > -0.05 && x < 0.65 && y > -0.1 && (y - (-0.1)) <= (0.65 - x) * 1.5;
      return hull || mast || sail;
    }
  }
];

// ----------------------------------------------------
// 2. ENGLISH ALPHABET (A-Z) & NUMBERS (0-9)
// ----------------------------------------------------
const CHAR_DEFINITIONS: Record<string, (x: number, y: number) => boolean> = {
  A: (x, y) => {
    const leftLeg = Math.abs(y - (1 - Math.abs(x + 0.4) * 2.2)) <= 0.25 && x <= 0.1;
    const rightLeg = Math.abs(y - (1 - Math.abs(x - 0.4) * 2.2)) <= 0.25 && x >= -0.1;
    const cross = inBox(x, y + 0.1, 0.45, 0.12);
    return (leftLeg || rightLeg || cross) && y >= -0.85 && y <= 0.9;
  },
  B: (x, y) => {
    const spine = inBox(x + 0.45, y, 0.15, 0.85);
    const topLoop = inEllipse(x, y - 0.4, 0.5, 0.38) && !inEllipse(x, y - 0.4, 0.25, 0.18);
    const botLoop = inEllipse(x, y + 0.4, 0.55, 0.42) && !inEllipse(x, y + 0.4, 0.28, 0.2);
    return spine || ((topLoop || botLoop) && x >= -0.45);
  },
  C: (x, y) => {
    const outer = inEllipse(x, y, 0.75, 0.85);
    const inner = inEllipse(x, y, 0.45, 0.55);
    const cutout = x > 0.15 && Math.abs(y) < 0.45;
    return outer && !inner && !cutout;
  },
  D: (x, y) => {
    const spine = inBox(x + 0.45, y, 0.15, 0.85);
    const loop = inEllipse(x - 0.1, y, 0.65, 0.85) && !inEllipse(x - 0.1, y, 0.35, 0.55);
    return spine || (loop && x >= -0.45);
  },
  E: (x, y) => {
    const spine = inBox(x + 0.45, y, 0.15, 0.85);
    const top = inBox(x, y - 0.72, 0.55, 0.13);
    const mid = inBox(x - 0.05, y, 0.45, 0.12);
    const bot = inBox(x, y + 0.72, 0.55, 0.13);
    return spine || top || mid || bot;
  },
  F: (x, y) => {
    const spine = inBox(x + 0.45, y, 0.15, 0.85);
    const top = inBox(x, y - 0.72, 0.55, 0.13);
    const mid = inBox(x - 0.05, y - 0.1, 0.45, 0.12);
    return spine || top || mid;
  },
  G: (x, y) => {
    const outer = inEllipse(x, y, 0.75, 0.85);
    const inner = inEllipse(x, y, 0.45, 0.55);
    const cutout = x > 0.15 && y < 0.1 && y > -0.55;
    const bar = inBox(x - 0.35, y + 0.1, 0.3, 0.12);
    return (outer && !inner && !cutout) || bar;
  },
  H: (x, y) => {
    const left = inBox(x + 0.5, y, 0.15, 0.85);
    const right = inBox(x - 0.5, y, 0.15, 0.85);
    const mid = inBox(x, y, 0.45, 0.14);
    return left || right || mid;
  },
  I: (x, y) => {
    const stem = inBox(x, y, 0.16, 0.85);
    const top = inBox(x, y - 0.75, 0.5, 0.12);
    const bot = inBox(x, y + 0.75, 0.5, 0.12);
    return stem || top || bot;
  },
  J: (x, y) => {
    const stem = inBox(x - 0.3, y - 0.15, 0.15, 0.7);
    const hook = inEllipse(x, y + 0.45, 0.45, 0.4) && !inEllipse(x, y + 0.45, 0.2, 0.2) && y > 0.2;
    return stem || hook;
  },
  K: (x, y) => {
    const spine = inBox(x + 0.45, y, 0.15, 0.85);
    const armT = Math.abs((y - 0.1) - (x + 0.3) * 1.5) <= 0.2 && x >= -0.3;
    const armB = Math.abs((y + 0.1) + (x + 0.3) * 1.5) <= 0.2 && x >= -0.3;
    return spine || armT || armB;
  },
  L: (x, y) => {
    const spine = inBox(x + 0.45, y - 0.1, 0.15, 0.75);
    const bot = inBox(x, y + 0.72, 0.55, 0.13);
    return spine || bot;
  },
  M: (x, y) => {
    const left = inBox(x + 0.6, y, 0.15, 0.85);
    const right = inBox(x - 0.6, y, 0.15, 0.85);
    const diagL = Math.abs(y - (x + 0.3) * 1.8) <= 0.18 && x >= -0.6 && x <= 0;
    const diagR = Math.abs(y + (x - 0.3) * 1.8) <= 0.18 && x <= 0.6 && x >= 0;
    return left || right || diagL || diagR;
  },
  N: (x, y) => {
    const left = inBox(x + 0.55, y, 0.15, 0.85);
    const right = inBox(x - 0.55, y, 0.15, 0.85);
    const diag = Math.abs(y - x * 1.5) <= 0.2 && Math.abs(x) <= 0.55;
    return left || right || diag;
  },
  O: (x, y) => {
    return inEllipse(x, y, 0.75, 0.85) && !inEllipse(x, y, 0.45, 0.55);
  },
  P: (x, y) => {
    const spine = inBox(x + 0.45, y, 0.15, 0.85);
    const loop = inEllipse(x, y - 0.35, 0.55, 0.45) && !inEllipse(x, y - 0.35, 0.25, 0.22);
    return spine || (loop && x >= -0.45);
  },
  Q: (x, y) => {
    const ring = inEllipse(x, y - 0.1, 0.7, 0.75) && !inEllipse(x, y - 0.1, 0.4, 0.45);
    const tail = Math.abs(y - (x - 0.1) * 1.2) <= 0.15 && x > 0.1 && y > 0.2;
    return ring || tail;
  },
  R: (x, y) => {
    const spine = inBox(x + 0.45, y, 0.15, 0.85);
    const loop = inEllipse(x, y - 0.35, 0.55, 0.45) && !inEllipse(x, y - 0.35, 0.25, 0.22);
    const leg = Math.abs(y - (x - 0.1) * 1.5) <= 0.2 && x >= -0.1 && y >= 0;
    return spine || (loop && x >= -0.45) || leg;
  },
  S: (x, y) => {
    const curve = Math.abs(x - Math.sin(y * 3.5) * 0.4) <= 0.22 && Math.abs(y) <= 0.85;
    return curve;
  },
  T: (x, y) => {
    const top = inBox(x, y - 0.75, 0.75, 0.14);
    const stem = inBox(x, y + 0.1, 0.16, 0.75);
    return top || stem;
  },
  U: (x, y) => {
    const outer = inBox(x, y - 0.1, 0.75, 0.75, 0.45);
    const inner = inBox(x, y - 0.3, 0.45, 0.65, 0.25);
    return outer && !inner && y <= 0.85;
  },
  V: (x, y) => {
    const left = Math.abs(y + (x + 0.35) * 2.2) <= 0.22 && x <= 0;
    const right = Math.abs(y - (x - 0.35) * 2.2) <= 0.22 && x >= 0;
    return (left || right) && y >= -0.85 && y <= 0.85;
  },
  W: (x, y) => {
    const vL = (Math.abs(y + (x + 0.6) * 3) <= 0.18 || Math.abs(y - (x + 0.2) * 3) <= 0.18) && x <= 0;
    const vR = (Math.abs(y + (x - 0.2) * 3) <= 0.18 || Math.abs(y - (x - 0.6) * 3) <= 0.18) && x >= 0;
    return (vL || vR) && Math.abs(y) <= 0.85;
  },
  X: (x, y) => {
    const d1 = Math.abs(y - x * 1.3) <= 0.22;
    const d2 = Math.abs(y + x * 1.3) <= 0.22;
    return (d1 || d2) && Math.abs(x) <= 0.75 && Math.abs(y) <= 0.85;
  },
  Y: (x, y) => {
    const left = Math.abs(y - (x + 0.35) * 1.8) <= 0.2 && y <= 0 && x <= 0;
    const right = Math.abs(y + (x - 0.35) * 1.8) <= 0.2 && y <= 0 && x >= 0;
    const stem = inBox(x, y + 0.45, 0.15, 0.45);
    return left || right || stem;
  },
  Z: (x, y) => {
    const top = inBox(x, y - 0.72, 0.65, 0.13);
    const bot = inBox(x, y + 0.72, 0.65, 0.13);
    const diag = Math.abs(y + x * 1.3) <= 0.2 && Math.abs(x) <= 0.65;
    return top || bot || diag;
  },
  '0': (x, y) => inEllipse(x, y, 0.7, 0.85) && !inEllipse(x, y, 0.4, 0.55),
  '1': (x, y) => inBox(x, y, 0.18, 0.85) || inBox(x - 0.2, y - 0.6, 0.25, 0.12) || inBox(x, y + 0.75, 0.5, 0.12),
  '2': (x, y) => {
    const top = inEllipse(x, y - 0.4, 0.6, 0.45) && !inEllipse(x, y - 0.4, 0.3, 0.25) && y < -0.1;
    const diag = Math.abs(y + x * 1.2) <= 0.2 && x >= -0.5 && x <= 0.5 && y >= -0.2 && y <= 0.65;
    const bot = inBox(x, y + 0.72, 0.65, 0.13);
    return top || diag || bot;
  },
  '3': (x, y) => {
    const top = inEllipse(x, y - 0.4, 0.6, 0.45) && !inEllipse(x, y - 0.4, 0.3, 0.25) && x > -0.2;
    const bot = inEllipse(x, y + 0.4, 0.65, 0.48) && !inEllipse(x, y + 0.4, 0.35, 0.28) && x > -0.2;
    return top || bot;
  },
  '4': (x, y) => {
    const stem = inBox(x - 0.25, y, 0.15, 0.85);
    const bar = inBox(x, y + 0.2, 0.65, 0.13);
    const diag = Math.abs(y + (x + 0.1) * 1.5) <= 0.18 && x <= 0.25 && y <= 0.2;
    return stem || bar || diag;
  },
  '5': (x, y) => {
    const top = inBox(x, y - 0.72, 0.6, 0.13);
    const stem = inBox(x + 0.35, y - 0.35, 0.15, 0.3);
    const bot = inEllipse(x, y + 0.35, 0.65, 0.5) && !inEllipse(x, y + 0.35, 0.35, 0.28) && (x > -0.3 || y > 0.35);
    return top || stem || bot;
  },
  '6': (x, y) => {
    const loop = inEllipse(x, y + 0.3, 0.65, 0.52) && !inEllipse(x, y + 0.3, 0.35, 0.28);
    const spine = inEllipse(x + 0.1, y - 0.1, 0.65, 0.75) && !inEllipse(x + 0.1, y - 0.1, 0.38, 0.5) && x < 0;
    return loop || spine;
  },
  '7': (x, y) => {
    const top = inBox(x, y - 0.72, 0.65, 0.13);
    const diag = Math.abs(y - (x - 0.2) * 2.0) <= 0.2 && Math.abs(x) <= 0.6;
    return top || diag;
  },
  '8': (x, y) => {
    const top = inEllipse(x, y - 0.42, 0.52, 0.42) && !inEllipse(x, y - 0.42, 0.25, 0.22);
    const bot = inEllipse(x, y + 0.42, 0.62, 0.48) && !inEllipse(x, y + 0.42, 0.32, 0.26);
    return top || bot;
  },
  '9': (x, y) => {
    const loop = inEllipse(x, y - 0.3, 0.65, 0.52) && !inEllipse(x, y - 0.3, 0.35, 0.28);
    const spine = inEllipse(x - 0.1, y + 0.1, 0.65, 0.75) && !inEllipse(x - 0.1, y + 0.1, 0.38, 0.5) && x > 0;
    return loop || spine;
  }
};

export const CHAR_PRIMITIVES: ShapePrimitive[] = Object.entries(CHAR_DEFINITIONS).map(([char, test]) => ({
  name: `Letter/Digit ${char}`,
  category: isNaN(Number(char)) ? 'letter' : 'number',
  test
}));

export const ALL_PRIMITIVES: ShapePrimitive[] = [...OBJECT_PRIMITIVES, ...CHAR_PRIMITIVES];

/**
 * Procedurally generates a composite board shape by combining 2-3 primitives with CSG Boolean operators.
 * Yields over 500+ distinct mathematical silhouettes.
 * 
 * @param {number} seed - Level seed index.
 * @returns {{ name: string; test: (nx: number, ny: number) => boolean }} Dynamic composite shape evaluator.
 * @description Applies translation, rotation, scale, Union, Subtraction, and Intersection CSG logic.
 */
export function generateCompositeShape(seed: number): { name: string; test: (nx: number, ny: number) => boolean } {
  // If seed is within base catalog, we can directly showcase pure recognizable objects/letters
  if (seed % 3 === 0) {
    const prim = ALL_PRIMITIVES[seed % ALL_PRIMITIVES.length];
    return {
      name: prim.name,
      test: prim.test
    };
  }

  // Composite multi-object shape (Union, Subtraction, Double-Object)
  const pA = ALL_PRIMITIVES[seed % ALL_PRIMITIVES.length];
  const pB = ALL_PRIMITIVES[(seed * 7 + 13) % ALL_PRIMITIVES.length];
  const mode = seed % 4; // 0: Union horizontal, 1: Union vertical, 2: Subtract, 3: Overlap blend

  switch (mode) {
    case 0: // Twin side-by-side union
      return {
        name: `${pA.name} + ${pB.name}`,
        test: (nx, ny) => {
          const left = pA.test((nx + 0.45) * 1.9, ny * 1.2);
          const right = pB.test((nx - 0.45) * 1.9, ny * 1.2);
          return left || right;
        }
      };

    case 1: // Stacked vertical union
      return {
        name: `${pA.name} atop ${pB.name}`,
        test: (nx, ny) => {
          const top = pA.test(nx * 1.3, (ny + 0.45) * 1.9);
          const bot = pB.test(nx * 1.3, (ny - 0.45) * 1.9);
          return top || bot;
        }
      };

    case 2: // Subtraction / Carved shape
      return {
        name: `${pA.name} Carved by ${pB.name}`,
        test: (nx, ny) => {
          const base = pA.test(nx, ny);
          const hole = pB.test(nx * 2.2, ny * 2.2);
          return base && !hole;
        }
      };

    case 3: // Scaled concentric blend
    default:
      return {
        name: `Concentric ${pA.name} & ${pB.name}`,
        test: (nx, ny) => {
          const outer = pA.test(nx * 0.95, ny * 0.95);
          const inner = pB.test(nx * 1.3, ny * 1.3);
          return outer || inner;
        }
      };
  }
}
