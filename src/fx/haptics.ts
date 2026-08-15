/**
 * @file haptics.ts
 * @author @me__unpredictable
 * @description Cross-platform haptic feedback engine supporting mobile browsers (Android/iOS) and Cordova container vibration.
 */

/**
 * Checks if the current environment supports mobile vibration/haptics.
 * 
 * @returns {boolean} True if vibration API is available.
 * @description Detects navigator.vibrate or Cordova notification.vibrate.
 */
export function isHapticsSupported(): boolean {
  return typeof window !== 'undefined' && (
    (typeof navigator !== 'undefined' && 'vibrate' in navigator) ||
    (typeof (navigator as any)?.notification?.vibrate === 'function')
  );
}

/**
 * Triggers a randomized short haptic vibration pulse for every tap on mobile devices.
 * 
 * @returns {void}
 * @description Generates a random short pulse (15ms to 35ms) to give responsive tactile feedback.
 */
export function triggerTapHaptic(): void {
  if (!isHapticsSupported()) return;

  try {
    // Random short pulse between 15ms and 35ms
    const duration = 15 + Math.floor(Math.random() * 20);

    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(duration);
    } else if (typeof (navigator as any)?.notification?.vibrate === 'function') {
      (navigator as any).notification.vibrate(duration);
    }
  } catch (_err) {
    // Graceful fallback for restricted environments
  }
}

/**
 * Triggers a 0.10 second (100ms) celebratory random vibration burst upon level completion.
 * 
 * @returns {void}
 * @description Fires a 100ms multi-pulse victory pattern [40ms pulse, 20ms pause, 40ms pulse].
 */
export function triggerVictoryHaptic(): void {
  if (!isHapticsSupported()) return;

  try {
    // 0.10s (100ms) celebratory pattern: 40ms buzz, 20ms pause, 40ms buzz
    const victoryPattern = [40, 20, 40];

    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(victoryPattern);
    } else if (typeof (navigator as any)?.notification?.vibrate === 'function') {
      (navigator as any).notification.vibrate(100);
    }
  } catch (_err) {
    // Graceful fallback
  }
}
