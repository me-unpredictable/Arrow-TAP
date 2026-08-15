/**
 * @file phrases.ts
 * @author @me__unpredictable
 * @description Catalog of 50 enthusiastic, joyful, and cheering celebratory phrases displayed after clearing levels.
 */

export const CHEERING_PHRASES: string[] = [
  'LEGENDARY UNTANGLE! 🌟',
  'UNSTOPPABLE! 🔥',
  'CLEVER AS A FOX! 🦊',
  'PURE GENIUS! 🧠✨',
  'MAZE MASTER! 🏆',
  'LIGHTNING FAST! ⚡',
  'ABSOLUTE PERFECTION! 💎',
  'SMOOTH OPERATOR! 🎩',
  'BRAINPOWER 1000! 🚀',
  'INCREDIBLE REFLEXES! 🎯',
  'SPECTACULAR PLAY! 🌈',
  'CRACKED THE CODE! 🔓',
  'FLAWLESS VICTORY! 👑',
  'OFF THE CHARTS! 📈',
  'TOO EASY FOR YOU! 😎',
  'SUPREME TALENT! 🥇',
  'MAGIC FINGERS! ✨',
  'OUTSTANDING MOVES! 🌟',
  'EAGLE EYE PRECISION! 🦅',
  'PUZZLE WIZARD! 🧙‍♂️',
  'ASTONISHING! 💥',
  'YOU MAKE IT LOOK EASY! 💫',
  'EPIC ROPE PULL! 🧵',
  'HIGH VOLTAGE PLAY! ⚡',
  'TOTAL DOMINATION! 💥',
  'PURE SATISFACTION! 🍰',
  'UNBELIEVABLE SKILL! 🛸',
  'MAZE WHISPERER! 🌿',
  'SHARP AS A TACK! 📌',
  'MIND BLOWN! 🤯',
  'STELLAR PERFORMANCE! 🌠',
  'ON A ROLL! 🎲',
  'MASTERMIND AT WORK! 💡',
  'ROPE NINJA! 🥷',
  'DAZZLING SPEED! 💫',
  'SWEET SUCCESS! 🍭',
  'SUPERCHARGED! 🔋',
  'BRILLIANT EXECUTION! 🎨',
  'GOLDEN TOUCH! 🪙',
  'CHAMPION ENERGY! 🦁',
  'KNOT TODAY! 🪢',
  'MAZE OBLITERATED! 💣',
  'TAKE A BOW! 👏',
  'FLAWLESS FLOW! 🌊',
  'COMMANDING WIN! 🎖️',
  'MEGA MIND! 🌌',
  'SPECTACLE OF SKILL! 🎪',
  'TOP TIER UNTANGLE! 🔝',
  'RECORD BREAKER! ⏱️',
  'YOU ARE UNSTOPPABLE! 🏁'
];

/**
 * Returns a random cheering phrase from the 50-phrase catalog.
 * 
 * @param {void} - No input parameters.
 * @returns {string} Cheering phrase.
 * @description Selects a uniformly random string from CHEERING_PHRASES.
 */
export function getRandomCheeringPhrase(): string {
  return CHEERING_PHRASES[Math.floor(Math.random() * CHEERING_PHRASES.length)];
}
