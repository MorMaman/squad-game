/**
 * Reanimated web polyfills
 * These globals are required by react-native-reanimated on web
 * Must be imported before any Reanimated code runs
 */

if (typeof window !== 'undefined') {
  // Polyfill for _getAnimationTimestamp
  (global as any)._getAnimationTimestamp = () => {
    return performance.now();
  };

  // Polyfill for _notifyAboutProgress
  (global as any)._notifyAboutProgress = () => {};

  // Polyfill for _setGestureState
  (global as any)._setGestureState = () => {};

  // Polyfill for _updateProps
  (global as any)._updateProps = () => {};

  // Polyfill for _removeFromPropsRegistry
  (global as any)._removeFromPropsRegistry = () => {};

  // Polyfill for _measureText
  (global as any)._measureText = () => ({ width: 0, height: 0 });

  // Polyfill for _frameTimestamp
  (global as any)._frameTimestamp = null;

  // Polyfill for _frameCallbacks
  if (!(global as any)._frameCallbacks) {
    (global as any)._frameCallbacks = [];
  }
}

export {};
