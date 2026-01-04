/**
 * DiamondBackground.tsx
 * Clash Royale-style blue diamond checkerboard background pattern
 * Optimized for performance
 */

import React, { memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Clash Royale exact blue colors from reference
const COLORS = {
  tileDark: '#1a6fc4',
  tileLight: '#2180d4',
};

interface DiamondBackgroundProps {
  style?: any;
}

// Tile configuration
const TILE_SIZE = 42;
const GRID_SIZE = 22;

// Pre-generate tile data once
const TILES = (() => {
  const tiles = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      tiles.push({
        key: `${row}-${col}`,
        left: col * TILE_SIZE,
        top: row * TILE_SIZE,
        isDark: (row + col) % 2 === 0,
      });
    }
  }
  return tiles;
})();

// Memoized tile component
const Tile = memo(({ left, top, isDark }: { left: number; top: number; isDark: boolean }) => (
  <View
    style={[
      styles.tile,
      {
        left,
        top,
        backgroundColor: isDark ? COLORS.tileDark : COLORS.tileLight,
        borderColor: isDark ? '#135a9e' : '#1a6fc4',
      },
    ]}
  />
));

export function DiamondBackground({ style }: DiamondBackgroundProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.gridWrapper}>
        <View style={styles.grid}>
          {TILES.map(({ key, left, top, isDark }) => (
            <Tile key={key} left={left} top={top} isDark={isDark} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.tileDark,
    overflow: 'hidden',
  },
  gridWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    width: GRID_SIZE * TILE_SIZE,
    height: GRID_SIZE * TILE_SIZE,
    transform: [
      { rotate: '45deg' },
      { scale: 1.5 },
    ],
    position: 'relative',
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderWidth: 1,
  },
});

export default DiamondBackground;
