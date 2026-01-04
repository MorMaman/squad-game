/**
 * WildCardGrid Component
 * Grid display for wild cards category with specialized styling
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
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
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { RTLView } from '../RTLView';
import { ShopItem, RARITY_COLORS } from '../../types/shop';
import { WildCardType, WILD_CARD_INFO } from '../../types/wildCards';

// Colors
const COLORS = {
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',
  ICE_WHITE: '#F0F8FF',
  STAR_GOLD: '#FFD700',
  SUCCESS_GREEN: '#10B981',
  PURPLE: '#9B59FF',
};

interface WildCardItemProps {
  item: ShopItem;
  quantityOwned: number;
  onPress: (item: ShopItem) => void;
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function WildCardItem({ item, quantityOwned, onPress, index }: WildCardItemProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Extract wild card type from item metadata or ID
  const getWildCardType = (): WildCardType | null => {
    // Check metadata first
    if (item.metadata?.wild_card_type) {
      return item.metadata.wild_card_type as WildCardType;
    }
    // Try to extract from item ID or name
    const wildCardTypes: WildCardType[] = [
      'skip_card',
      'double_xp',
      'steal_crown',
      'revenge_card',
      'time_extend',
      'peek_answers',
    ];
    for (const type of wildCardTypes) {
      if (item.id.includes(type) || item.name_key.includes(type)) {
        return type;
      }
    }
    return null;
  };

  const wildCardType = getWildCardType();
  const wildCardInfo = wildCardType ? WILD_CARD_INFO[wildCardType] : null;
  const cardColor = wildCardInfo?.color || COLORS.PURPLE;
  const cardGradient = wildCardInfo?.gradient || [COLORS.PURPLE, '#6366f1'];
  const cardIcon = (wildCardInfo?.icon || item.icon) as keyof typeof Ionicons.glyphMap;

  // Animated glow effect
  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.96, { duration: 100 });
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
    shadowOpacity: glowOpacity.value,
  }));

  const rarityColors = RARITY_COLORS[item.rarity];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(300)}
      style={[animatedStyle, { flex: 1, margin: 6 }]}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.cardContainer,
          glowStyle,
          { shadowColor: cardColor },
        ]}
      >
        {/* Card Border with Wild Card Color */}
        <LinearGradient
          colors={[cardColor, `${cardColor}60`, cardColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={styles.innerContainer}>
            {/* Quantity Badge */}
            {quantityOwned > 0 && (
              <View style={[styles.quantityBadge, { backgroundColor: cardColor }]}>
                <Text style={styles.quantityText}>x{quantityOwned}</Text>
              </View>
            )}

            {/* Card Icon with Gradient Background */}
            <LinearGradient
              colors={cardGradient}
              style={styles.iconContainer}
            >
              <Ionicons name={cardIcon} size={28} color={COLORS.ICE_WHITE} />
            </LinearGradient>

            {/* Card Name */}
            <Text style={[styles.cardName, { color: cardColor }]} numberOfLines={1}>
              {item.name}
            </Text>

            {/* Card Description */}
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description || wildCardInfo?.descKey}
            </Text>

            {/* Rarity Indicator */}
            <View
              style={[
                styles.rarityDot,
                { backgroundColor: rarityColors.primary },
              ]}
            />

            {/* Price */}
            <RTLView row style={styles.priceContainer}>
              <Ionicons name="star" size={14} color={COLORS.STAR_GOLD} />
              <Text style={styles.priceText}>
                {item.price_stars.toLocaleString()}
              </Text>
            </RTLView>

            {/* Wild Card Type Label */}
            {wildCardInfo && (
              <View style={[styles.typeBadge, { backgroundColor: `${cardColor}20` }]}>
                <Text style={[styles.typeText, { color: cardColor }]}>
                  {wildCardInfo.requiresTarget
                    ? t('shop.wildCards.targeted', 'Targeted')
                    : t('shop.wildCards.instant', 'Instant')}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Decorative Corner Accents */}
        <View style={[styles.cornerAccent, styles.cornerTopLeft, { borderColor: cardColor }]} />
        <View style={[styles.cornerAccent, styles.cornerTopRight, { borderColor: cardColor }]} />
        <View style={[styles.cornerAccent, styles.cornerBottomLeft, { borderColor: cardColor }]} />
        <View style={[styles.cornerAccent, styles.cornerBottomRight, { borderColor: cardColor }]} />
      </AnimatedPressable>
    </Animated.View>
  );
}

interface WildCardGridProps {
  items: ShopItem[];
  getQuantityOwned: (itemId: string) => number;
  onItemPress: (item: ShopItem) => void;
}

export function WildCardGrid({
  items,
  getQuantityOwned,
  onItemPress,
}: WildCardGridProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="card-outline" size={48} color={COLORS.PURPLE} />
        <Text style={styles.emptyTitle}>
          {t('shop.noWildCards', 'No Wild Cards Available')}
        </Text>
        <Text style={styles.emptySubtitle}>
          {t('shop.checkBackLater', 'Check back later for new cards')}
        </Text>
      </View>
    );
  }

  // Split items into rows of 2
  const rows: ShopItem[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#A855F7', '#9333EA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sectionIcon}
        >
          <Ionicons name="card" size={18} color={COLORS.ICE_WHITE} />
        </LinearGradient>
        <Text style={styles.sectionTitle}>
          {t('shop.categories.wildCards', 'Wild Cards')}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {t('shop.wildCardsSubtitle', 'Gain special advantages')}
        </Text>
      </View>

      {/* Grid */}
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((item, itemIndex) => (
            <WildCardItem
              key={item.id}
              item={item}
              quantityOwned={getQuantityOwned(item.id)}
              onPress={onItemPress}
              index={rowIndex * 2 + itemIndex}
            />
          ))}
          {/* Add empty spacer if row has only 1 item */}
          {row.length === 1 && <View style={{ flex: 1, margin: 6 }} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ICE_WHITE,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: 'rgba(240, 248, 255, 0.6)',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cardContainer: {
    borderRadius: 16,
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
      } as any,
      default: {
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 2,
  },
  innerContainer: {
    backgroundColor: COLORS.DEEP_PURPLE,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    minHeight: 160,
  },
  quantityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 10,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ICE_WHITE,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 10,
    color: 'rgba(240, 248, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  priceContainer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.STAR_GOLD,
  },
  typeBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cornerAccent: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cornerTopLeft: {
    top: 4,
    left: 4,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 6,
  },
  cornerTopRight: {
    top: 4,
    right: 4,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 6,
  },
  cornerBottomLeft: {
    bottom: 4,
    left: 4,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 6,
  },
  cornerBottomRight: {
    bottom: 4,
    right: 4,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ICE_WHITE,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(240, 248, 255, 0.6)',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default WildCardGrid;
