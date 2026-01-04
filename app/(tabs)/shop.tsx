/**
 * Shop Tab Screen - Battle Game UI Style
 * Browse and purchase items with rarity-based color coding
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RTLView } from '../../src/components/RTLView';
import {
  PurchaseModal,
  WildCardGrid,
} from '../../src/components/shop';
import { useShopStore } from '../../src/store/shopStore';
import { useStarsStore } from '../../src/store/starsStore';
import { useSquadStore } from '../../src/store/squadStore';
import { ShopItem, ShopCategory, ItemRarity, CATEGORY_INFO } from '../../src/types/shop';

// Battle Game UI Colors
const COLORS = {
  // Base
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',
  ICE_WHITE: '#F0F8FF',

  // Rarity Colors (varied accent colors)
  GOLD: '#FFD700',        // Legendary / Premium
  PURPLE: '#9B59FF',      // Epic
  CYAN: '#00D4FF',        // Rare
  LIME: '#A3E635',        // Common
  ORANGE: '#FF6B00',      // Limited Time
  PINK: '#FF69B4',        // Cosmetics

  // Badges
  SALE_RED: '#FF4757',
  NEW_GREEN: '#10B981',
  HOT_ORANGE: '#FF6B35',

  // UI
  SUCCESS: '#10B981',
  STAR_GOLD: '#FFD700',
};

// Enhanced rarity colors with more variety
const RARITY_STYLES: Record<ItemRarity, {
  primary: string;
  secondary: string;
  gradient: [string, string, string];
  glow: string;
}> = {
  common: {
    primary: COLORS.LIME,
    secondary: '#84CC16',
    gradient: ['#A3E635', '#84CC16', COLORS.DEEP_PURPLE],
    glow: COLORS.LIME,
  },
  rare: {
    primary: COLORS.CYAN,
    secondary: '#0EA5E9',
    gradient: ['#00D4FF', '#0EA5E9', COLORS.DEEP_PURPLE],
    glow: COLORS.CYAN,
  },
  epic: {
    primary: COLORS.PURPLE,
    secondary: '#7C3AED',
    gradient: ['#9B59FF', '#7C3AED', COLORS.DEEP_PURPLE],
    glow: COLORS.PURPLE,
  },
  legendary: {
    primary: COLORS.GOLD,
    secondary: '#F59E0B',
    gradient: ['#FFD700', '#F59E0B', COLORS.DEEP_PURPLE],
    glow: COLORS.GOLD,
  },
};

// Category colors for visual variety
const CATEGORY_COLORS: Record<ShopCategory | 'all', string> = {
  all: COLORS.CYAN,
  avatar_frame: COLORS.PINK,
  theme: COLORS.PURPLE,
  wild_card: COLORS.GOLD,
  power_boost: COLORS.ORANGE,
  headline_pack: COLORS.LIME,
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// ============================================================
// SHIMMER EFFECT COMPONENT
// ============================================================
function ShimmerEffect({ width = 100, height = 100, style }: {
  width?: number;
  height?: number;
  style?: any;
}) {
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmerPosition.value, [-1, 1], [-width, width]) },
    ],
    opacity: interpolate(shimmerPosition.value, [-1, -0.5, 0, 0.5, 1], [0, 0.3, 0.6, 0.3, 0]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: width * 0.5,
            height: height * 2,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            transform: [{ rotate: '25deg' }],
          },
          shimmerStyle,
        ]}
      />
    </Animated.View>
  );
}

// ============================================================
// BADGE COMPONENTS
// ============================================================
function SaleBadge({ discount }: { discount?: number }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.badge, styles.saleBadge, animatedStyle]}>
      <Ionicons name="pricetag" size={10} color={COLORS.ICE_WHITE} />
      <Text style={styles.badgeText}>
        {discount ? `-${discount}%` : 'SALE'}
      </Text>
    </Animated.View>
  );
}

function NewBadge() {
  const shine = useSharedValue(0);

  useEffect(() => {
    shine.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      shine.value,
      [0, 1],
      [COLORS.NEW_GREEN, '#34D399']
    ),
  }));

  return (
    <Animated.View style={[styles.badge, styles.newBadge, animatedStyle]}>
      <Ionicons name="sparkles" size={10} color={COLORS.ICE_WHITE} />
      <Text style={styles.badgeText}>NEW</Text>
    </Animated.View>
  );
}

function HotBadge() {
  const flame = useSharedValue(0);

  useEffect(() => {
    flame.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.7, { duration: 300 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(flame.value, [0.7, 1], [0.95, 1.05]) }],
  }));

  return (
    <Animated.View style={[styles.badge, styles.hotBadge, animatedStyle]}>
      <Ionicons name="flame" size={10} color={COLORS.ICE_WHITE} />
      <Text style={styles.badgeText}>HOT</Text>
    </Animated.View>
  );
}

function LimitedBadge() {
  return (
    <View style={[styles.badge, styles.limitedBadge]}>
      <Ionicons name="time" size={10} color={COLORS.ICE_WHITE} />
      <Text style={styles.badgeText}>LIMITED</Text>
    </View>
  );
}

// ============================================================
// STAR CURRENCY COMPONENT
// ============================================================
function StarPrice({
  price,
  size = 'medium',
  showGlow = false,
}: {
  price: number;
  size?: 'small' | 'medium' | 'large';
  showGlow?: boolean;
}) {
  const glow = useSharedValue(0.3);

  useEffect(() => {
    if (showGlow) {
      glow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [showGlow]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value,
  }));

  const sizeStyles = {
    small: { iconSize: 14, fontSize: 14, padding: { paddingHorizontal: 8, paddingVertical: 4 } },
    medium: { iconSize: 18, fontSize: 16, padding: { paddingHorizontal: 12, paddingVertical: 6 } },
    large: { iconSize: 22, fontSize: 20, padding: { paddingHorizontal: 16, paddingVertical: 8 } },
  };

  const currentSize = sizeStyles[size];

  return (
    <Animated.View
      style={[
        styles.starPriceContainer,
        currentSize.padding,
        showGlow && glowStyle,
        showGlow && { shadowColor: COLORS.STAR_GOLD },
      ]}
    >
      <Ionicons name="star" size={currentSize.iconSize} color={COLORS.STAR_GOLD} />
      <Text style={[styles.starPriceText, { fontSize: currentSize.fontSize }]}>
        {price.toLocaleString()}
      </Text>
    </Animated.View>
  );
}

// ============================================================
// ENHANCED SHOP ITEM CARD
// ============================================================
function EnhancedShopItemCard({
  item,
  isOwned,
  isEquipped,
  quantityOwned = 0,
  onPress,
  index = 0,
}: {
  item: ShopItem;
  isOwned: boolean;
  isEquipped: boolean;
  quantityOwned?: number;
  onPress: (item: ShopItem) => void;
  index?: number;
}) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const glowIntensity = useSharedValue(0.3);
  const borderGlow = useSharedValue(0);

  const rarityStyle = RARITY_STYLES[item.rarity];

  // Animated glow for legendary/epic items
  useEffect(() => {
    if (item.rarity === 'legendary' || item.rarity === 'epic') {
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      borderGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [item.rarity]);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.95, { duration: 100 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  }, []);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress(item);
  }, [item, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowIntensity.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderGlow.value,
      [0, 1],
      [`${rarityStyle.primary}40`, rarityStyle.primary]
    ),
  }));

  // Determine which badges to show
  const isNew = item.created_at &&
    (Date.now() - new Date(item.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
  const isLimited = item.is_limited || item.available_until !== null;
  const isOnSale = item.metadata?.on_sale as boolean;
  const discount = item.metadata?.discount as number;
  const isHot = item.metadata?.is_hot as boolean;

  const iconName = item.icon as keyof typeof Ionicons.glyphMap;
  const showShimmer = item.rarity === 'legendary';

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(400).springify()}
      style={[animatedStyle, styles.cardWrapper]}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.enhancedCard,
          (item.rarity === 'legendary' || item.rarity === 'epic') && glowStyle,
          { shadowColor: rarityStyle.glow },
        ]}
      >
        <LinearGradient
          colors={rarityStyle.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradientBorder}
        >
          <Animated.View style={[styles.cardInner, borderStyle]}>
            {/* Shimmer effect for legendary items */}
            {showShimmer && (
              <ShimmerEffect width={CARD_WIDTH} height={220} />
            )}

            {/* Badges Row */}
            <View style={styles.badgeRow}>
              {isOnSale && <SaleBadge discount={discount} />}
              {isNew && !isOnSale && <NewBadge />}
              {isHot && !isNew && !isOnSale && <HotBadge />}
              {isLimited && <LimitedBadge />}
            </View>

            {/* Equipped indicator */}
            {isEquipped && (
              <View style={styles.equippedIndicator}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.SUCCESS} />
                <Text style={styles.equippedText}>EQUIPPED</Text>
              </View>
            )}

            {/* Icon with rarity glow */}
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: `${rarityStyle.primary}15`,
                  borderColor: `${rarityStyle.primary}40`,
                },
              ]}
            >
              <LinearGradient
                colors={[`${rarityStyle.primary}30`, 'transparent']}
                style={styles.iconGlowBg}
              />
              <Ionicons name={iconName} size={36} color={rarityStyle.primary} />
            </View>

            {/* Item name */}
            <Text style={styles.cardItemName} numberOfLines={1}>
              {item.name}
            </Text>

            {/* Description */}
            {item.description && (
              <Text style={styles.cardItemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {/* Rarity badge */}
            <View
              style={[
                styles.rarityPill,
                {
                  backgroundColor: `${rarityStyle.primary}20`,
                  borderColor: `${rarityStyle.primary}60`,
                },
              ]}
            >
              <View style={[styles.rarityDot, { backgroundColor: rarityStyle.primary }]} />
              <Text style={[styles.rarityLabel, { color: rarityStyle.primary }]}>
                {item.rarity.toUpperCase()}
              </Text>
            </View>

            {/* Price or Owned section */}
            <View style={styles.cardFooter}>
              {isOwned ? (
                <View style={styles.ownedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                  <Text style={styles.ownedLabel}>
                    {item.is_consumable && quantityOwned > 1
                      ? `Owned (x${quantityOwned})`
                      : 'Owned'}
                  </Text>
                </View>
              ) : (
                <>
                  <StarPrice price={item.price_stars} size="small" />
                  <LinearGradient
                    colors={[rarityStyle.primary, rarityStyle.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buyButton}
                  >
                    <Text style={styles.buyButtonText}>BUY</Text>
                  </LinearGradient>
                </>
              )}
            </View>

            {/* Quantity badge for consumables */}
            {item.is_consumable && quantityOwned > 0 && (
              <View style={[styles.quantityBadge, { backgroundColor: CATEGORY_COLORS[item.category] }]}>
                <Text style={styles.quantityText}>x{quantityOwned}</Text>
              </View>
            )}
          </Animated.View>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ============================================================
// CATEGORY TABS WITH COLORED INDICATORS
// ============================================================
type CategoryOption = ShopCategory | 'all';

function CategoryTab({
  category,
  isActive,
  onPress
}: {
  category: CategoryOption;
  isActive: boolean;
  onPress: (cat: CategoryOption) => void;
}) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const tabColor = CATEGORY_COLORS[category];

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.92, { duration: 80 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 400 });
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

  const getTabInfo = (): { label: string; icon: keyof typeof Ionicons.glyphMap } => {
    if (category === 'all') {
      return { label: 'All', icon: 'grid' };
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
      style={[animatedStyle]}
    >
      <View
        style={[
          styles.categoryTab,
          isActive && {
            backgroundColor: `${tabColor}20`,
            borderColor: tabColor,
          },
        ]}
      >
        <View style={[styles.categoryIconWrapper, { backgroundColor: `${tabColor}30` }]}>
          <Ionicons name={icon} size={18} color={isActive ? tabColor : COLORS.ICE_WHITE} />
        </View>
        <Text
          style={[
            styles.categoryLabel,
            isActive && { color: tabColor, fontWeight: '700' },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {/* Active indicator dot */}
        {isActive && (
          <View style={[styles.categoryActiveDot, { backgroundColor: tabColor }]} />
        )}
      </View>
    </AnimatedPressable>
  );
}

function CategoryTabsRow({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory: CategoryOption;
  onCategoryChange: (cat: CategoryOption) => void;
}) {
  const categories: CategoryOption[] = [
    'all',
    'avatar_frame',
    'theme',
    'wild_card',
    'power_boost',
    'headline_pack',
  ];

  return (
    <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.categoryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
        decelerationRate="fast"
      >
        {categories.map((cat) => (
          <CategoryTab
            key={cat}
            category={cat}
            isActive={selectedCategory === cat}
            onPress={onCategoryChange}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ============================================================
// FEATURED CAROUSEL ITEM
// ============================================================
function FeaturedCarouselItem({
  item,
  onPress,
  index,
}: {
  item: ShopItem;
  onPress: (item: ShopItem) => void;
  index: number;
}) {
  const scale = useSharedValue(1);
  const glowPulse = useSharedValue(0.4);

  const rarityStyle = RARITY_STYLES[item.rarity];

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1200 }),
        withTiming(0.4, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowPulse.value,
  }));

  const iconName = item.icon as keyof typeof Ionicons.glyphMap;

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 120).duration(500).springify()}
      style={animatedStyle}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(item)}
        style={[styles.featuredCard, glowStyle, { shadowColor: rarityStyle.glow }]}
      >
        <LinearGradient
          colors={[rarityStyle.primary, rarityStyle.secondary, COLORS.DEEP_PURPLE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredGradient}
        >
          {/* Shimmer for legendary */}
          {item.rarity === 'legendary' && (
            <ShimmerEffect width={SCREEN_WIDTH * 0.75} height={120} />
          )}

          {/* Limited badge */}
          {item.is_limited && (
            <View style={styles.featuredLimitedBadge}>
              <Ionicons name="time" size={12} color={COLORS.ICE_WHITE} />
              <Text style={styles.featuredLimitedText}>LIMITED</Text>
            </View>
          )}

          <View style={styles.featuredContent}>
            {/* Icon */}
            <View
              style={[
                styles.featuredIconContainer,
                { backgroundColor: `${rarityStyle.primary}40` },
              ]}
            >
              <Ionicons name={iconName} size={40} color={COLORS.ICE_WHITE} />
            </View>

            {/* Info */}
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.featuredRarityRow}>
                <View style={[styles.featuredRarityDot, { backgroundColor: rarityStyle.primary }]} />
                <Text style={[styles.featuredRarityText, { color: rarityStyle.primary }]}>
                  {item.rarity.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Price */}
            <View style={styles.featuredPriceBox}>
              <Ionicons name="star" size={20} color={COLORS.STAR_GOLD} />
              <Text style={styles.featuredPriceValue}>
                {item.price_stars.toLocaleString()}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================
function LoadingSkeleton() {
  const shimmer = useSharedValue(0.3);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  return (
    <View style={styles.skeletonContainer}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.skeletonCard,
            shimmerStyle,
            { backgroundColor: i % 2 === 0 ? COLORS.DEEP_PURPLE : COLORS.MIDNIGHT_BLUE },
          ]}
        />
      ))}
    </View>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState({ category }: { category: string }) {
  const { t } = useTranslation();
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const categoryColor = category === 'all' ? COLORS.CYAN : CATEGORY_COLORS[category as ShopCategory] || COLORS.PURPLE;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
      <Animated.View style={bounceStyle}>
        <View style={[styles.emptyIconWrapper, { backgroundColor: `${categoryColor}20` }]}>
          <Ionicons name="bag-outline" size={56} color={categoryColor} />
        </View>
      </Animated.View>
      <Text style={styles.emptyTitle}>No Items Available</Text>
      <Text style={styles.emptySubtitle}>Check back later for new items!</Text>
    </Animated.View>
  );
}

// ============================================================
// MAIN SHOP SCREEN
// ============================================================
export default function ShopScreen() {
  const { t } = useTranslation();

  // Stores
  const {
    items,
    featuredItems,
    inventory,
    selectedCategory,
    isLoading,
    fetchShopItems,
    fetchInventory,
    purchaseItem,
    setSelectedCategory,
    hasItem,
    getItemQuantity,
    getEquippedByCategory,
  } = useShopStore();

  const { stars, fetchStars } = useStarsStore();
  const { currentSquad } = useSquadStore();

  // Local state
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const headerOpacity = useSharedValue(0);
  const starPulse = useSharedValue(0.3);
  const titleScale = useSharedValue(0.8);

  // Fetch data on mount
  useEffect(() => {
    if (currentSquad) {
      fetchShopItems();
      fetchInventory();
      fetchStars(currentSquad.id);
    }
  }, [currentSquad]);

  // Header animations
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
    titleScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    starPulse.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  const starGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: starPulse.value,
  }));

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return items;
    }
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  // Separate wild cards for special display
  const wildCardItems = useMemo(() => {
    return filteredItems.filter((item) => item.category === 'wild_card');
  }, [filteredItems]);

  const regularItems = useMemo(() => {
    if (selectedCategory === 'wild_card') {
      return [];
    }
    return filteredItems.filter((item) => item.category !== 'wild_card');
  }, [filteredItems, selectedCategory]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (currentSquad) {
      await Promise.all([
        fetchShopItems(),
        fetchInventory(),
        fetchStars(currentSquad.id),
      ]);
    }
    setRefreshing(false);
  }, [currentSquad]);

  const handleCategoryChange = useCallback((category: CategoryOption) => {
    setSelectedCategory(category);
  }, []);

  const handleItemPress = useCallback((item: ShopItem) => {
    setSelectedItem(item);
    setPurchaseError(null);
  }, []);

  const handlePurchaseConfirm = useCallback(async () => {
    if (!selectedItem || !currentSquad) return;

    const result = await purchaseItem(selectedItem.id, currentSquad.id);

    if (!result.success) {
      throw new Error(result.error_message || 'Purchase failed');
    }

    await fetchStars(currentSquad.id);
  }, [selectedItem, currentSquad, purchaseItem, fetchStars]);

  const handlePurchaseCancel = useCallback(() => {
    setSelectedItem(null);
    setPurchaseError(null);
  }, []);

  const isItemEquipped = useCallback(
    (item: ShopItem) => {
      const equipped = getEquippedByCategory(item.category);
      return equipped?.item_id === item.id;
    },
    [getEquippedByCategory]
  );

  // Render item for FlatList
  const renderItem = useCallback(
    ({ item, index }: { item: ShopItem; index: number }) => (
      <EnhancedShopItemCard
        item={item}
        isOwned={hasItem(item.id)}
        isEquipped={isItemEquipped(item)}
        quantityOwned={getItemQuantity(item.id)}
        onPress={handleItemPress}
        index={index}
      />
    ),
    [hasItem, getItemQuantity, isItemEquipped, handleItemPress]
  );

  // List Header Component
  const ListHeader = useMemo(
    () => (
      <>
        {/* Featured Carousel */}
        {featuredItems.length > 0 && selectedCategory === 'all' && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={styles.featuredSection}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWrapper}>
                <LinearGradient
                  colors={[COLORS.GOLD, COLORS.ORANGE]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionIconGradient}
                >
                  <Ionicons name="sparkles" size={16} color={COLORS.ICE_WHITE} />
                </LinearGradient>
                <Text style={styles.sectionTitle}>FEATURED</Text>
              </View>
              <View style={styles.sectionDivider} />
            </View>

            <FlatList
              horizontal
              data={featuredItems}
              renderItem={({ item, index }) => (
                <FeaturedCarouselItem
                  item={item}
                  onPress={handleItemPress}
                  index={index}
                />
              )}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              snapToInterval={SCREEN_WIDTH * 0.75 + 16}
              decelerationRate="fast"
            />
          </Animated.View>
        )}

        {/* Category Tabs */}
        <CategoryTabsRow
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Wild Card Grid */}
        {selectedCategory === 'wild_card' && wildCardItems.length > 0 && (
          <WildCardGrid
            items={wildCardItems}
            getQuantityOwned={getItemQuantity}
            onItemPress={handleItemPress}
          />
        )}

        {/* Section Header for Regular Items */}
        {regularItems.length > 0 && selectedCategory !== 'wild_card' && (
          <Animated.View
            entering={FadeIn.delay(300).duration(300)}
            style={styles.itemsSectionHeader}
          >
            <View style={styles.itemsSectionTitleRow}>
              <View
                style={[
                  styles.sectionColorBar,
                  { backgroundColor: CATEGORY_COLORS[selectedCategory] }
                ]}
              />
              <Text style={styles.itemsSectionTitle}>
                {selectedCategory === 'all' ? 'ALL ITEMS' : selectedCategory.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={styles.itemsCountBadge}>
              <Text style={styles.itemsCountText}>{regularItems.length}</Text>
            </View>
          </Animated.View>
        )}
      </>
    ),
    [
      featuredItems,
      selectedCategory,
      wildCardItems,
      regularItems,
      handleItemPress,
      handleCategoryChange,
      getItemQuantity,
    ]
  );

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.PURPLE, COLORS.DEEP_PURPLE, COLORS.DARK_NAVY]}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>SHOP</Text>
              <View style={styles.balanceContainer}>
                <Ionicons name="star" size={20} color={COLORS.STAR_GOLD} />
                <Text style={styles.balanceText}>---</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <LoadingSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <LinearGradient
        colors={[COLORS.PURPLE, COLORS.DEEP_PURPLE, COLORS.DARK_NAVY]}
        locations={[0, 0.5, 1]}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <Animated.View style={[styles.headerContent, headerAnimatedStyle]}>
            {/* Title with gradient underline */}
            <Animated.View style={titleAnimatedStyle}>
              <Text style={styles.headerTitle}>SHOP</Text>
              <LinearGradient
                colors={[COLORS.CYAN, COLORS.PURPLE, COLORS.PINK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.titleUnderline}
              />
            </Animated.View>

            {/* Star Balance with glow */}
            <Animated.View style={[styles.balanceContainer, starGlowStyle]}>
              <View style={styles.starIconWrapper}>
                <Ionicons name="star" size={20} color={COLORS.STAR_GOLD} />
              </View>
              <Text style={styles.balanceText}>{stars.toLocaleString()}</Text>
              <Ionicons name="add-circle" size={22} color={COLORS.LIME} style={{ marginLeft: 4 }} />
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      {/* Items Grid */}
      <FlatList
        data={regularItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          selectedCategory !== 'wild_card' && !isLoading ? (
            <EmptyState category={selectedCategory} />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.CYAN}
            colors={[COLORS.CYAN, COLORS.PURPLE, COLORS.PINK]}
            progressBackgroundColor={COLORS.DEEP_PURPLE}
          />
        }
      />

      {/* Purchase Modal */}
      <PurchaseModal
        visible={selectedItem !== null}
        item={selectedItem}
        currentBalance={stars}
        onConfirm={handlePurchaseConfirm}
        onCancel={handlePurchaseCancel}
        errorMessage={purchaseError}
      />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK_NAVY,
  },

  // Header
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.ICE_WHITE,
    letterSpacing: 4,
    textShadowColor: COLORS.CYAN,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleUnderline: {
    height: 3,
    borderRadius: 2,
    marginTop: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    ...Platform.select({
      web: {} as any,
      default: {
        shadowColor: COLORS.STAR_GOLD,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  starIconWrapper: {
    marginRight: 6,
  },
  balanceText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.STAR_GOLD,
    letterSpacing: 1,
  },

  listContent: {
    paddingBottom: 120,
  },
  row: {
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },

  // Featured Section
  featuredSection: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconGradient: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ICE_WHITE,
    letterSpacing: 2,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: `${COLORS.GOLD}30`,
    marginLeft: 12,
  },
  featuredList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  featuredCard: {
    width: SCREEN_WIDTH * 0.75,
    borderRadius: 18,
    marginRight: 16,
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.4)',
      } as any,
      default: {
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  featuredGradient: {
    borderRadius: 18,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  featuredLimitedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ORANGE,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  featuredLimitedText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ICE_WHITE,
    letterSpacing: 1,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featuredIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredInfo: {
    flex: 1,
  },
  featuredName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ICE_WHITE,
    marginBottom: 6,
  },
  featuredRarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredRarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featuredRarityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  featuredPriceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  featuredPriceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.STAR_GOLD,
  },

  // Category Tabs
  categoryContainer: {
    backgroundColor: COLORS.DARK_NAVY,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.PURPLE}30`,
  },
  categoryScrollContent: {
    paddingHorizontal: 12,
    gap: 10,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  categoryIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
    opacity: 0.7,
  },
  categoryActiveDot: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Items Section Header
  itemsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  itemsSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionColorBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  itemsSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ICE_WHITE,
    letterSpacing: 1.5,
  },
  itemsCountBadge: {
    backgroundColor: COLORS.PURPLE,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  itemsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ICE_WHITE,
  },

  // Enhanced Card
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: 6,
    marginBottom: 14,
  },
  enhancedCard: {
    borderRadius: 18,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 14px rgba(0, 0, 0, 0.35)',
      } as any,
      default: {
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 14,
        elevation: 8,
      },
    }),
  },
  cardGradientBorder: {
    borderRadius: 18,
    padding: 2,
  },
  cardInner: {
    backgroundColor: COLORS.DEEP_PURPLE,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    minHeight: 220,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  equippedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    zIndex: 10,
  },
  equippedText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.SUCCESS,
    letterSpacing: 0.5,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 10,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  iconGlowBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ICE_WHITE,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardItemDescription: {
    fontSize: 11,
    color: 'rgba(240, 248, 255, 0.55)',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
  },
  rarityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    marginBottom: 10,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rarityLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  cardFooter: {
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ownedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },
  buyButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ICE_WHITE,
    letterSpacing: 1.5,
  },
  quantityBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 10,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ICE_WHITE,
  },

  // Badges
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.ICE_WHITE,
    letterSpacing: 0.5,
  },
  saleBadge: {
    backgroundColor: COLORS.SALE_RED,
  },
  newBadge: {
    backgroundColor: COLORS.NEW_GREEN,
  },
  hotBadge: {
    backgroundColor: COLORS.HOT_ORANGE,
  },
  limitedBadge: {
    backgroundColor: COLORS.ORANGE,
  },

  // Star Price
  starPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  starPriceText: {
    fontWeight: '800',
    color: COLORS.STAR_GOLD,
  },

  // Skeleton
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: 18,
    margin: 6,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ICE_WHITE,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(240, 248, 255, 0.6)',
    textAlign: 'center',
  },
});
