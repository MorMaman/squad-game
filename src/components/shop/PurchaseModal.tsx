/**
 * PurchaseModal Component
 * Purchase confirmation modal with item preview, price display, and transaction states
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
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
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { RTLView } from '../RTLView';
import { ShopItem, RARITY_COLORS } from '../../types/shop';

// Colors
const COLORS = {
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',
  ICE_WHITE: '#F0F8FF',
  STAR_GOLD: '#FFD700',
  SUCCESS_GREEN: '#10B981',
  ERROR_RED: '#EF4444',
  PURPLE: '#9B59FF',
  CYAN: '#00D4FF',
};

type ModalState = 'confirm' | 'loading' | 'success' | 'error';

interface PurchaseModalProps {
  visible: boolean;
  item: ShopItem | null;
  currentBalance: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  errorMessage?: string | null;
}

export function PurchaseModal({
  visible,
  item,
  currentBalance,
  onConfirm,
  onCancel,
  errorMessage,
}: PurchaseModalProps) {
  const { t } = useTranslation();
  const [modalState, setModalState] = React.useState<ModalState>('confirm');
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Animation values
  const iconScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const successScale = useSharedValue(0);
  const confettiY = useSharedValue(-100);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setModalState('confirm');
      setLocalError(null);
      iconScale.value = withSequence(
        withSpring(1.1, { damping: 6, stiffness: 100 }),
        withSpring(1, { damping: 8 })
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      iconScale.value = 0;
      successScale.value = 0;
    }
  }, [visible]);

  // Handle error message from props
  useEffect(() => {
    if (errorMessage) {
      setLocalError(errorMessage);
      setModalState('error');
    }
  }, [errorMessage]);

  const handleConfirm = useCallback(async () => {
    setModalState('loading');

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await onConfirm();
      setModalState('success');

      // Success animation
      successScale.value = withSequence(
        withSpring(1.2, { damping: 4, stiffness: 100 }),
        withSpring(1, { damping: 8 })
      );

      confettiY.value = withTiming(500, {
        duration: 2000,
        easing: Easing.out(Easing.quad),
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Auto close after success
      setTimeout(() => {
        onCancel();
      }, 2000);
    } catch (error) {
      setModalState('error');
      setLocalError((error as Error).message || t('shop.purchaseError', 'Purchase failed'));

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [onConfirm, onCancel, t]);

  const handleCancel = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onCancel();
  }, [onCancel]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  if (!item) return null;

  const rarityColors = RARITY_COLORS[item.rarity];
  const canAfford = currentBalance >= item.price_stars;
  const balanceAfterPurchase = currentBalance - item.price_stars;
  const iconName = item.icon as keyof typeof Ionicons.glyphMap;

  const renderContent = () => {
    switch (modalState) {
      case 'loading':
        return (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.loadingContainer}
          >
            <ActivityIndicator size="large" color={COLORS.CYAN} />
            <Text style={styles.loadingText}>
              {t('shop.processing', 'Processing...')}
            </Text>
          </Animated.View>
        );

      case 'success':
        return (
          <Animated.View
            entering={ZoomIn.duration(300)}
            style={styles.successContainer}
          >
            <Animated.View style={[styles.successIcon, animatedSuccessStyle]}>
              <LinearGradient
                colors={[COLORS.SUCCESS_GREEN, '#059669']}
                style={styles.successGradient}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={64}
                  color={COLORS.ICE_WHITE}
                />
              </LinearGradient>
            </Animated.View>
            <Text style={styles.successTitle}>
              {t('shop.purchaseSuccess', 'Purchase Complete!')}
            </Text>
            <Text style={styles.successSubtitle}>
              {t('shop.itemAddedToInventory', 'Item added to your inventory')}
            </Text>
          </Animated.View>
        );

      case 'error':
        return (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.errorContainer}
          >
            <View style={styles.errorIcon}>
              <Ionicons
                name="close-circle"
                size={64}
                color={COLORS.ERROR_RED}
              />
            </View>
            <Text style={styles.errorTitle}>
              {t('shop.purchaseFailed', 'Purchase Failed')}
            </Text>
            <Text style={styles.errorMessage}>
              {localError || t('shop.tryAgain', 'Please try again')}
            </Text>
            <Pressable style={styles.retryButton} onPress={handleCancel}>
              <Text style={styles.retryButtonText}>
                {t('common.close', 'Close')}
              </Text>
            </Pressable>
          </Animated.View>
        );

      default:
        return (
          <>
            {/* Item Preview */}
            <Animated.View
              entering={SlideInUp.delay(100).duration(300)}
              style={[styles.itemPreview, animatedIconStyle]}
            >
              <Animated.View
                style={[
                  styles.glowBackground,
                  { backgroundColor: rarityColors.primary },
                  animatedGlowStyle,
                ]}
              />
              <LinearGradient
                colors={rarityColors.gradient}
                style={styles.iconContainer}
              >
                <Ionicons
                  name={iconName}
                  size={48}
                  color={COLORS.ICE_WHITE}
                />
              </LinearGradient>
            </Animated.View>

            {/* Item Info */}
            <Animated.View
              entering={SlideInUp.delay(200).duration(300)}
            >
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.itemDescription}>{item.description}</Text>
              )}
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
            </Animated.View>

            {/* Price Section */}
            <Animated.View
              entering={SlideInUp.delay(300).duration(300)}
              style={styles.priceSection}
            >
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {t('shop.price', 'Price')}
                </Text>
                <RTLView row style={styles.priceValue}>
                  <Ionicons name="star" size={20} color={COLORS.STAR_GOLD} />
                  <Text style={styles.priceText}>
                    {item.price_stars.toLocaleString()}
                  </Text>
                </RTLView>
              </View>

              <View style={styles.divider} />

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {t('shop.yourBalance', 'Your Balance')}
                </Text>
                <RTLView row style={styles.priceValue}>
                  <Ionicons name="star" size={20} color={COLORS.STAR_GOLD} />
                  <Text
                    style={[
                      styles.priceText,
                      !canAfford && styles.insufficientBalance,
                    ]}
                  >
                    {currentBalance.toLocaleString()}
                  </Text>
                </RTLView>
              </View>

              {canAfford && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>
                      {t('shop.afterPurchase', 'After Purchase')}
                    </Text>
                    <RTLView row style={styles.priceValue}>
                      <Ionicons name="star" size={20} color={COLORS.STAR_GOLD} />
                      <Text style={styles.priceText}>
                        {balanceAfterPurchase.toLocaleString()}
                      </Text>
                    </RTLView>
                  </View>
                </>
              )}

              {!canAfford && (
                <View style={styles.insufficientWarning}>
                  <Ionicons
                    name="warning"
                    size={16}
                    color={COLORS.ERROR_RED}
                  />
                  <Text style={styles.insufficientText}>
                    {t('shop.insufficientStars', 'Not enough stars')}
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View
              entering={SlideInUp.delay(400).duration(300)}
              style={styles.buttonContainer}
            >
              <Pressable
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>
                  {t('common.cancel', 'Cancel')}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.confirmButton,
                  !canAfford && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!canAfford}
              >
                <LinearGradient
                  colors={
                    canAfford
                      ? [COLORS.PURPLE, '#6366f1']
                      : [COLORS.MIDNIGHT_BLUE, COLORS.MIDNIGHT_BLUE]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmGradient}
                >
                  <Ionicons
                    name="cart"
                    size={18}
                    color={canAfford ? COLORS.ICE_WHITE : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.confirmButtonText,
                      !canAfford && styles.confirmButtonTextDisabled,
                    ]}
                  >
                    {t('shop.confirmPurchase', 'Confirm Purchase')}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleCancel} />

        <Animated.View
          entering={ZoomIn.duration(300)}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={[COLORS.DEEP_PURPLE, COLORS.DARK_NAVY]}
            style={styles.modalContent}
          >
            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={handleCancel}>
              <Ionicons name="close" size={24} color={COLORS.ICE_WHITE} />
            </Pressable>

            {renderContent()}
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.4)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 16,
      },
    }),
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  itemPreview: {
    width: 100,
    height: 100,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    ...Platform.select({
      web: {} as any,
      default: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  itemName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ICE_WHITE,
    textAlign: 'center',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: 'rgba(240, 248, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  rarityBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  priceSection: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: 'rgba(240, 248, 255, 0.7)',
  },
  priceValue: {
    alignItems: 'center',
    gap: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.STAR_GOLD,
  },
  insufficientBalance: {
    color: COLORS.ERROR_RED,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  insufficientWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
  },
  insufficientText: {
    fontSize: 13,
    color: COLORS.ERROR_RED,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
  },
  confirmButton: {
    flex: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
  },
  confirmButtonTextDisabled: {
    color: '#6b7280',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.ICE_WHITE,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successIcon: {
    marginBottom: 16,
  },
  successGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.SUCCESS_GREEN,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: 'rgba(240, 248, 255, 0.7)',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ERROR_RED,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: 'rgba(240, 248, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ICE_WHITE,
  },
});

export default PurchaseModal;
