/**
 * SwipeableTabView.tsx
 * Wrapper component that enables swipe navigation between tabs
 */

import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter, useSegments } from 'expo-router';

// Tab order for navigation
const TAB_ORDER = ['index', 'games', 'leaderboard', 'shop', 'settings'];

interface SwipeableTabViewProps {
  children: ReactNode;
  currentTab: string;
}

export function SwipeableTabView({ children, currentTab }: SwipeableTabViewProps) {
  const router = useRouter();
  const translateX = useSharedValue(0);

  const currentIndex = TAB_ORDER.indexOf(currentTab);

  const navigateToTab = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left'
      ? Math.min(currentIndex + 1, TAB_ORDER.length - 1)
      : Math.max(currentIndex - 1, 0);

    if (newIndex !== currentIndex) {
      const newTab = TAB_ORDER[newIndex];
      router.replace(`/(tabs)/${newTab === 'index' ? '' : newTab}` as any);
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      // Limit the drag distance
      translateX.value = Math.max(-50, Math.min(50, event.translationX * 0.3));
    })
    .onEnd((event) => {
      const threshold = 50;

      if (event.translationX < -threshold && currentIndex < TAB_ORDER.length - 1) {
        // Swipe left - go to next tab
        runOnJS(navigateToTab)('left');
      } else if (event.translationX > threshold && currentIndex > 0) {
        // Swipe right - go to previous tab
        runOnJS(navigateToTab)('right');
      }

      // Reset position
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SwipeableTabView;
