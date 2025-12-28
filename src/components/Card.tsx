import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
}

// Use Platform.select to completely avoid shadow* props on web
const elevatedStyle: ViewStyle = Platform.select({
  web: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
  } as ViewStyle,
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
}) as ViewStyle;

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], variant === 'elevated' && elevatedStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: 20,
  },
  default: {
    backgroundColor: '#1f2937',
  },
  elevated: {
    backgroundColor: '#1f2937',
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
  },
});
