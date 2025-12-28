import React from 'react';
import { View, Image, Text, StyleSheet, ImageStyle, ViewStyle } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ImageStyle | ViewStyle;
}

const SIZES = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
};

const FONT_SIZES = {
  small: 12,
  medium: 18,
  large: 24,
  xlarge: 36,
};

export function Avatar({ uri, name, size = 'medium', style }: AvatarProps) {
  const dimension = SIZES[size];
  const fontSize = FONT_SIZES[size];

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: dimension, height: dimension, borderRadius: dimension / 2 },
          style as ImageStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#374151',
  },
  placeholder: {
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '600',
  },
});
