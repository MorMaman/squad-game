/**
 * ShopCategoryTabs Component
 * Horizontal scrollable category tabs for filtering shop items
 */

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { ShopCategory, CATEGORY_INFO } from '../../types/shop';

// Colors
const COLORS = {
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',
  ICE_WHITE: '#F0F8FF',
  PURPLE: '#9B59FF',
  CYAN: '#00D4FF',
};

type CategoryOption = ShopCategory | 'all';

interface CategoryTabProps {
  category: CategoryOption;
  isActive: boolean;
  onPress: (category: CategoryOption) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CategoryTab({ category, isActive, onPress }: CategoryTabProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.95, { duration: 100 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  }, []);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(category);
  }, [category, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get display info for category
  const getTabInfo = (): { label: string; icon: keyof typeof Ionicons.glyphMap } => {
    if (category === 'all') {
      return {
        label: t('shop.categories.all', 'All'),
        icon: 'grid',
      };
    }
    const info = CATEGORY_INFO[category];
    return {
      label: t(info.nameKey, category.replace('_', ' ')),
      icon: info.icon as keyof typeof Ionicons.glyphMap,
    };
  };

  const { label, icon } = getTabInfo();

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.tab,
        isActive && styles.tabActive,
        animatedStyle,
      ]}
    >
      <View style={[styles.tabContent, isActive && styles.tabContentActive]}>
        <Ionicons
          name={icon}
          size={18}
          color={isActive ? COLORS.CYAN : COLORS.ICE_WHITE}
          style={{ opacity: isActive ? 1 : 0.6 }}
        />
        <Text
          style={[
            styles.tabLabel,
            isActive && styles.tabLabelActive,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      {isActive && <View style={styles.activeIndicator} />}
    </AnimatedPressable>
  );
}

interface ShopCategoryTabsProps {
  selectedCategory: CategoryOption;
  onCategoryChange: (category: CategoryOption) => void;
}

const CATEGORIES: CategoryOption[] = [
  'all',
  'avatar_frame',
  'theme',
  'wild_card',
  'power_boost',
  'headline_pack',
];

export function ShopCategoryTabs({
  selectedCategory,
  onCategoryChange,
}: ShopCategoryTabsProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  const handleCategoryPress = useCallback(
    (category: CategoryOption) => {
      onCategoryChange(category);

      // Scroll to make the selected tab visible
      const index = CATEGORIES.indexOf(category);
      if (scrollViewRef.current && index >= 0) {
        const scrollToX = Math.max(0, index * 100 - 50);
        scrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
      }
    },
    [onCategoryChange]
  );

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={100}
        snapToAlignment="start"
      >
        {CATEGORIES.map((category) => (
          <CategoryTab
            key={category}
            category={category}
            isActive={selectedCategory === category}
            onPress={handleCategoryPress}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.DARK_NAVY,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DEEP_PURPLE,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    position: 'relative',
    minWidth: 90,
  },
  tabActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.CYAN,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabContentActive: {
    // Active state handled by parent
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
    opacity: 0.6,
  },
  tabLabelActive: {
    color: COLORS.CYAN,
    opacity: 1,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: COLORS.CYAN,
    borderRadius: 1,
  },
});

export default ShopCategoryTabs;
