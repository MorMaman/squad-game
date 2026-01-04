/**
 * ShopItemCard Component
 * Individual shop item display card with rarity glow, price, and purchase/owned states
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
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { RTLView } from '../RTLView';
import { ShopItem, ItemRarity, RARITY_COLORS } from '../../types/shop';

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

interface ShopItemCardProps {
  item: ShopItem;
  isOwned: boolean;
  isEquipped: boolean;
  quantityOwned?: number;
  onPress: (item: ShopItem) => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ShopItemCard({
  item,
  isOwned,
  isEquipped,
  quantityOwned = 0,
  onPress,
  index = 0,
}: ShopItemCardProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  const rarityColors = RARITY_COLORS[item.rarity];

  // Animated glow for legendary items
  React.useEffect(() => {
    if (item.rarity === 'legendary') {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [item.rarity]);

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

  // Check if item is limited time
  const isLimitedTime = item.is_limited || item.available_until !== null;

  // Get the icon name, handling Ionicons
  const iconName = item.icon as keyof typeof Ionicons.glyphMap;

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      style={[animatedStyle]}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.container,
          item.rarity === 'legendary' && glowStyle,
          { shadowColor: rarityColors.primary },
        ]}
      >
        {/* Rarity Border Gradient */}
        <LinearGradient
          colors={[...rarityColors.gradient, COLORS.DEEP_PURPLE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={styles.innerContainer}>
            {/* Limited Time Badge */}
            {isLimitedTime && (
              <View style={styles.limitedBadge}>
                <Ionicons name="time" size={10} color={COLORS.ICE_WHITE} />
                <Text style={styles.limitedText}>
                  {t('shop.limitedTime', 'LIMITED')}
                </Text>
              </View>
            )}

            {/* Equipped Indicator */}
            {isEquipped && (
              <View style={styles.equippedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={COLORS.SUCCESS_GREEN} />
                <Text style={styles.equippedText}>
                  {t('shop.equipped', 'EQUIPPED')}
                </Text>
              </View>
            )}

            {/* Icon Container with Rarity Glow */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${rarityColors.primary}20` },
              ]}
            >
              <LinearGradient
                colors={rarityColors.gradient}
                style={styles.iconGlow}
              />
              <Ionicons name={iconName} size={32} color={rarityColors.primary} />
            </View>

            {/* Item Info */}
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {/* Rarity Badge */}
            <View
              style={[
                styles.rarityBadge,
                { backgroundColor: `${rarityColors.primary}30` },
              ]}
            >
              <Text style={[styles.rarityText, { color: rarityColors.primary }]}>
                {item.rarity.toUpperCase()}
              </Text>
            </View>

            {/* Price / Owned Section */}
            <View style={styles.priceSection}>
              {isOwned ? (
                <RTLView row style={styles.ownedContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={COLORS.SUCCESS_GREEN}
                  />
                  <Text style={styles.ownedText}>
                    {item.is_consumable && quantityOwned > 1
                      ? `${t('shop.owned', 'Owned')} (x${quantityOwned})`
                      : t('shop.owned', 'Owned')}
                  </Text>
                </RTLView>
              ) : (
                <RTLView row style={styles.priceContainer}>
                  <Ionicons name="star" size={16} color={COLORS.STAR_GOLD} />
                  <Text style={styles.priceText}>
                    {item.price_stars.toLocaleString()}
                  </Text>
                </RTLView>
              )}
            </View>

            {/* Purchase Button */}
            {!isOwned && (
              <LinearGradient
                colors={[COLORS.PURPLE, '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.purchaseButton}
              >
                <Text style={styles.purchaseButtonText}>
                  {t('shop.purchase', 'Purchase')}
                </Text>
              </LinearGradient>
            )}

            {/* Quantity Badge for consumables */}
            {item.is_consumable && quantityOwned > 0 && (
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>x{quantityOwned}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
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
    minHeight: 180,
  },
  limitedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    zIndex: 10,
  },
  limitedText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.ICE_WHITE,
    letterSpacing: 0.5,
  },
  equippedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    zIndex: 10,
  },
  equippedText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.SUCCESS_GREEN,
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  iconGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ICE_WHITE,
    textAlign: 'center',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 11,
    color: 'rgba(240, 248, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  priceSection: {
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.STAR_GOLD,
  },
  ownedContainer: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ownedText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.SUCCESS_GREEN,
  },
  purchaseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
  },
  quantityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.PURPLE,
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
});

export default ShopItemCard;
