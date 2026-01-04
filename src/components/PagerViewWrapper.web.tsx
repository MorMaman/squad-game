// Web PagerView wrapper - uses simple View since PagerView is native-only
import React, { forwardRef, ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';

interface PagerViewProps {
  children: ReactNode;
  style?: ViewStyle;
  initialPage?: number;
  onPageSelected?: (e: { nativeEvent: { position: number } }) => void;
  overdrag?: boolean;
  overScrollMode?: string;
  layoutDirection?: 'ltr' | 'rtl';
}

// Simple View wrapper for web - actual paging handled by parent component
export const PagerView = forwardRef<View, PagerViewProps>(
  ({ children, style, ...props }, ref) => {
    return (
      <View ref={ref} style={style}>
        {children}
      </View>
    );
  }
);

PagerView.displayName = 'PagerView';
