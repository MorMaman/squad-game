/**
 * RTL-Aware Wrapper Components
 * Provides View, Text, Icon, and ScrollView components that automatically
 * handle RTL layout for Hebrew language support
 */

import React, { forwardRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ViewProps,
  TextProps,
  ScrollViewProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
  I18nManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  AnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  useRTL,
  flipStyle,
  getFlexDirection,
  getTextAlign,
  shouldFlipIcon,
  getIconFlipStyle,
  getWritingDirection,
} from '../utils/rtl';

/**
 * RTLView Props
 */
interface RTLViewProps extends ViewProps {
  /** Whether to flip the flex direction for row layouts */
  flipRow?: boolean;
  /** Force a specific direction regardless of RTL setting */
  forceDirection?: 'ltr' | 'rtl';
  /** Whether this is a row container (applies row flex direction) */
  row?: boolean;
  /** Reverse the default direction */
  reverse?: boolean;
}

/**
 * RTLView Component
 * A View that automatically handles RTL layout
 */
export const RTLView = forwardRef<View, RTLViewProps>(
  ({ style, flipRow = true, forceDirection, row, reverse, children, ...props }, ref) => {
    const { isRTL } = useRTL();

    const computedStyle = useMemo(() => {
      const styles: ViewStyle[] = [];
      const flatStyle = StyleSheet.flatten(style) || {};

      // Apply row direction if specified
      if (row) {
        const shouldFlip = forceDirection
          ? forceDirection === 'rtl'
          : flipRow && isRTL;

        styles.push({
          flexDirection: shouldFlip
            ? reverse
              ? 'row'
              : 'row-reverse'
            : reverse
            ? 'row-reverse'
            : 'row',
        });
      }

      // Flip existing styles if needed
      if (isRTL && flipRow && !forceDirection) {
        const flippedStyle = flipStyle(flatStyle);
        styles.push(flippedStyle);
      } else {
        styles.push(flatStyle);
      }

      return styles;
    }, [style, isRTL, flipRow, forceDirection, row, reverse]);

    return (
      <View ref={ref} style={computedStyle} {...props}>
        {children}
      </View>
    );
  }
);

RTLView.displayName = 'RTLView';

/**
 * RTLText Props
 */
interface RTLTextProps extends TextProps {
  /** Text alignment relative to layout direction */
  align?: 'start' | 'end' | 'center' | 'left' | 'right';
  /** Force a specific direction regardless of RTL setting */
  forceDirection?: 'ltr' | 'rtl';
}

/**
 * RTLText Component
 * A Text component that automatically handles RTL text alignment
 */
export const RTLText = forwardRef<Text, RTLTextProps>(
  ({ style, align, forceDirection, children, ...props }, ref) => {
    const { isRTL } = useRTL();

    const computedStyle = useMemo(() => {
      const styles: TextStyle[] = [];
      const flatStyle = StyleSheet.flatten(style) || {};

      // Apply text alignment
      if (align) {
        const shouldUseRTL = forceDirection
          ? forceDirection === 'rtl'
          : isRTL;

        let textAlign: TextStyle['textAlign'];

        if (align === 'start') {
          textAlign = shouldUseRTL ? 'right' : 'left';
        } else if (align === 'end') {
          textAlign = shouldUseRTL ? 'left' : 'right';
        } else {
          textAlign = align;
        }

        styles.push({ textAlign });
      }

      // Apply writing direction
      const direction = forceDirection || (isRTL ? 'rtl' : 'ltr');
      styles.push({
        writingDirection: direction,
      });

      styles.push(flatStyle);

      return styles;
    }, [style, isRTL, align, forceDirection]);

    return (
      <Text ref={ref} style={computedStyle} {...props}>
        {children}
      </Text>
    );
  }
);

RTLText.displayName = 'RTLText';

/**
 * RTLIcon Props
 */
interface RTLIconProps {
  /** Icon name from Ionicons */
  name: keyof typeof Ionicons.glyphMap;
  /** Icon size */
  size?: number;
  /** Icon color */
  color?: string;
  /** Additional style */
  style?: ViewStyle;
  /** Force flip the icon regardless of RTL setting */
  forceFlip?: boolean;
  /** Never flip the icon */
  noFlip?: boolean;
}

/**
 * RTLIcon Component
 * An Icon component that automatically flips directional icons in RTL mode
 */
export function RTLIcon({
  name,
  size = 24,
  color = '#FFFFFF',
  style,
  forceFlip,
  noFlip,
}: RTLIconProps) {
  const { isRTL } = useRTL();

  const iconStyle = useMemo(() => {
    const styles: ViewStyle[] = [];

    if (noFlip) {
      // Never flip
    } else if (forceFlip) {
      // Always flip
      styles.push({ transform: [{ scaleX: -1 }] });
    } else if (isRTL && shouldFlipIcon(name)) {
      // Auto-flip based on icon name
      styles.push({ transform: [{ scaleX: -1 }] });
    }

    if (style) {
      styles.push(style);
    }

    return styles;
  }, [name, isRTL, forceFlip, noFlip, style]);

  return (
    <View style={iconStyle}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

/**
 * RTLScrollView Props
 */
interface RTLScrollViewProps extends ScrollViewProps {
  /** Flip the scroll direction for horizontal scrolling */
  flipHorizontal?: boolean;
}

/**
 * RTLScrollView Component
 * A ScrollView that handles RTL scrolling correctly
 */
export const RTLScrollView = forwardRef<ScrollView, RTLScrollViewProps>(
  ({ style, contentContainerStyle, horizontal, flipHorizontal = true, children, ...props }, ref) => {
    const { isRTL } = useRTL();

    const computedStyle = useMemo(() => {
      const flatStyle = StyleSheet.flatten(style) || {};

      // For horizontal scrolling in RTL, we may need to adjust
      if (horizontal && isRTL && flipHorizontal) {
        return {
          ...flatStyle,
          transform: [{ scaleX: -1 }],
        };
      }

      return flatStyle;
    }, [style, isRTL, horizontal, flipHorizontal]);

    const computedContentContainerStyle = useMemo(() => {
      const flatStyle = StyleSheet.flatten(contentContainerStyle) || {};

      // Flip the content when the container is flipped
      if (horizontal && isRTL && flipHorizontal) {
        return {
          ...flatStyle,
          transform: [{ scaleX: -1 }],
        };
      }

      return flatStyle;
    }, [contentContainerStyle, isRTL, horizontal, flipHorizontal]);

    // For horizontal scrolling in RTL on iOS, we may need to invert
    const shouldInvertContent = horizontal && isRTL && flipHorizontal && Platform.OS === 'ios';

    return (
      <ScrollView
        ref={ref}
        horizontal={horizontal}
        style={computedStyle}
        contentContainerStyle={computedContentContainerStyle}
        {...props}
      >
        {shouldInvertContent
          ? React.Children.toArray(children).reverse()
          : children}
      </ScrollView>
    );
  }
);

RTLScrollView.displayName = 'RTLScrollView';

/**
 * Animated RTLView Props
 */
interface AnimatedRTLViewProps extends AnimatedProps<ViewProps> {
  flipRow?: boolean;
  forceDirection?: 'ltr' | 'rtl';
  row?: boolean;
  reverse?: boolean;
}

/**
 * AnimatedRTLView Component
 * An animated version of RTLView for use with react-native-reanimated
 */
export function AnimatedRTLView({
  style,
  flipRow = true,
  forceDirection,
  row,
  reverse,
  children,
  ...props
}: AnimatedRTLViewProps) {
  const { isRTL } = useRTL();

  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle: ViewStyle = {};

    if (row) {
      const shouldFlip = forceDirection
        ? forceDirection === 'rtl'
        : flipRow && isRTL;

      baseStyle.flexDirection = shouldFlip
        ? reverse
          ? 'row'
          : 'row-reverse'
        : reverse
        ? 'row-reverse'
        : 'row';
    }

    return baseStyle;
  }, [isRTL, flipRow, forceDirection, row, reverse]);

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

/**
 * RTLRow Component
 * A convenience component for horizontal row layouts
 */
export function RTLRow({
  children,
  style,
  reverse = false,
  ...props
}: Omit<RTLViewProps, 'row'>) {
  return (
    <RTLView row reverse={reverse} style={style} {...props}>
      {children}
    </RTLView>
  );
}

/**
 * StyleSheet for RTL components
 */
export const rtlStyles = StyleSheet.create({
  row: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  rowReverse: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
  },
  textStart: {
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  textEnd: {
    textAlign: I18nManager.isRTL ? 'left' : 'right',
  },
  flexStart: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  flexEnd: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
});

/**
 * Export all components
 */
export default {
  RTLView,
  RTLText,
  RTLIcon,
  RTLScrollView,
  AnimatedRTLView,
  RTLRow,
  rtlStyles,
};
