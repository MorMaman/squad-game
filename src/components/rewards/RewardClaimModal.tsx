/**
 * RewardClaimModal.tsx
 * Modal that appears when claiming a reward
 * Features chest opening animation, reward reveal, and confetti
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { colors, typography, spacing, borderRadius, gradients } from '../../theme/colors';
import {
  RewardType,
  SlotRarity,
  SLOT_RARITY_CONFIG,
  getRewardIcon,
} from '../../types/rewardSlots';
import { formatStars } from '../../types/stars';
import { Confetti } from '../effects/Confetti';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface RewardClaimModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Reward type */
  rewardType: RewardType | null;
  /** Reward amount (for stars/xp) */
  rewardAmount: number | null;
  /** Reward card type (for wild cards) */
  rewardCardType?: string | null;
  /** Reward rarity */
  rarity: SlotRarity;
  /** Callback when modal is closed */
  onClose: () => void;
}

type AnimationPhase = 'idle' | 'opening' | 'revealing' | 'complete';

export function RewardClaimModal({
  visible,
  rewardType,
  rewardAmount,
  rewardCardType,
  rarity,
  onClose,
}: RewardClaimModalProps) {
  const { t } = useTranslation();
  const rarityConfig = SLOT_RARITY_CONFIG[rarity];
  const isRareOrBetter = rarity !== 'common';

  // Animation state
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const chestScale = useSharedValue(0);
  const chestRotation = useSharedValue(0);
  const chestShake = useSharedValue(0);
  const lidRotation = useSharedValue(0);
  const rewardScale = useSharedValue(0);
  const rewardOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const lightRayRotation = useSharedValue(0);

  // Start animation sequence
  const startAnimation = useCallback(() => {
    // Reset
    setPhase('idle');
    setShowConfetti(false);
    backdropOpacity.value = 0;
    chestScale.value = 0;
    chestRotation.value = 0;
    chestShake.value = 0;
    lidRotation.value = 0;
    rewardScale.value = 0;
    rewardOpacity.value = 0;
    glowScale.value = 0;
    glowOpacity.value = 0;
    buttonOpacity.value = 0;

    // Phase 1: Backdrop and chest appear
    backdropOpacity.value = withTiming(1, { duration: 300 });
    chestScale.value = withSequence(
      withSpring(1.1, { damping: 4, stiffness: 200 }),
      withSpring(1, { damping: 6 })
    );

    // Phase 2: Chest shake (opening)
    setTimeout(() => {
      setPhase('opening');
      chestShake.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(-2, { duration: 50 }),
        withTiming(2, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }, 800);

    // Phase 3: Lid opens and reward reveals
    setTimeout(() => {
      setPhase('revealing');
      lidRotation.value = withTiming(-110, { duration: 400, easing: Easing.out(Easing.back(1.5)) });

      // Light rays
      lightRayRotation.value = withTiming(360, { duration: 3000, easing: Easing.linear });

      // Glow
      glowScale.value = withSequence(
        withTiming(0.5, { duration: 100 }),
        withSpring(1.5, { damping: 4, stiffness: 100 })
      );
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(0.4, { duration: 1000 })
      );

      // Reward
      rewardOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
      rewardScale.value = withDelay(200, withSequence(
        withSpring(1.3, { damping: 3, stiffness: 300 }),
        withSpring(1, { damping: 6 })
      ));

      // Confetti for rare+
      if (isRareOrBetter) {
        setTimeout(() => setShowConfetti(true), 300);
      }
    }, 1300);

    // Phase 4: Complete - show button
    setTimeout(() => {
      setPhase('complete');
      buttonOpacity.value = withTiming(1, { duration: 300 });
    }, 2000);
  }, [isRareOrBetter]);

  // Start animation when modal becomes visible
  useEffect(() => {
    if (visible) {
      startAnimation();
    }
  }, [visible, startAnimation]);

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const chestAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: chestScale.value },
      { rotate: `${chestShake.value}deg` },
    ],
  }));

  const lidAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${lidRotation.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const lightRaysAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lightRayRotation.value}deg` }],
    opacity: interpolate(glowOpacity.value, [0, 0.4, 0.8], [0, 0.3, 0.6]),
  }));

  const rewardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardScale.value }],
    opacity: rewardOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: interpolate(buttonOpacity.value, [0, 1], [20, 0]) }],
  }));

  // Get reward display content
  const getRewardContent = () => {
    if (!rewardType) return null;

    const iconName = getRewardIcon(rewardType) as keyof typeof Ionicons.glyphMap;
    let displayText = '';
    let iconColor = rarityConfig.color;

    switch (rewardType) {
      case 'stars':
        displayText = `+${formatStars(rewardAmount || 0)}`;
        iconColor = '#FFD700';
        break;
      case 'xp':
        displayText = `+${rewardAmount || 0} XP`;
        iconColor = colors.primary;
        break;
      case 'wild_card':
        displayText = rewardCardType || t('rewards.wildCard', 'Wild Card');
        iconColor = colors.secondary;
        break;
      case 'item':
        displayText = t('rewards.item', 'Special Item');
        iconColor = colors.accent;
        break;
    }

    return { iconName, displayText, iconColor };
  };

  const rewardContent = getRewardContent();

  const handleClose = () => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 200);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
        {/* Confetti */}
        <Confetti
          active={showConfetti}
          intensity={rarity === 'legendary' ? 'large' : rarity === 'epic' ? 'medium' : 'small'}
          duration={3000}
        />

        <View style={styles.content}>
          {/* Light rays */}
          <Animated.View style={[styles.lightRaysContainer, lightRaysAnimatedStyle]}>
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.lightRay,
                  {
                    backgroundColor: rarityConfig.color,
                    transform: [{ rotate: `${i * 30}deg` }],
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Glow background */}
          <Animated.View style={[styles.glowBackground, glowAnimatedStyle]}>
            <LinearGradient
              colors={[rarityConfig.glowColor, 'transparent']}
              style={styles.glowGradient}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 0.5, y: 0 }}
            />
          </Animated.View>

          {/* Rarity title */}
          <Text style={[styles.rarityTitle, { color: rarityConfig.color }]}>
            {t(rarityConfig.nameKey, rarity).toUpperCase()}
          </Text>

          {/* Chest */}
          <Animated.View style={[styles.chestContainer, chestAnimatedStyle]}>
            {/* Chest body */}
            <View style={[styles.chestBody, { borderColor: rarityConfig.color }]}>
              <LinearGradient
                colors={rarityConfig.gradient}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />

              {/* Chest lock */}
              <View style={styles.chestLock}>
                <Ionicons name="lock-closed" size={20} color="#000000" />
              </View>
            </View>

            {/* Chest lid */}
            <Animated.View style={[styles.chestLid, lidAnimatedStyle]}>
              <LinearGradient
                colors={[rarityConfig.gradient[0], rarityConfig.color]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
              />
            </Animated.View>
          </Animated.View>

          {/* Reward */}
          {rewardContent && (
            <Animated.View style={[styles.rewardContainer, rewardAnimatedStyle]}>
              <View style={[styles.rewardIcon, { backgroundColor: rewardContent.iconColor + '30' }]}>
                <Ionicons
                  name={rewardContent.iconName}
                  size={48}
                  color={rewardContent.iconColor}
                />
              </View>
              <Text style={[styles.rewardText, { color: rewardContent.iconColor }]}>
                {rewardContent.displayText}
              </Text>
            </Animated.View>
          )}

          {/* Continue button */}
          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={rarityConfig.gradient}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {t('rewards.continue', 'Continue')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightRaysContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightRay: {
    position: 'absolute',
    width: 4,
    height: 150,
    opacity: 0.3,
    transformOrigin: 'center bottom',
  },
  glowBackground: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
    borderRadius: 150,
  },
  rarityTitle: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightExtrabold,
    letterSpacing: 4,
    marginBottom: spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  chestContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  chestBody: {
    width: 100,
    height: 70,
    borderRadius: borderRadius.md,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestLock: {
    position: 'absolute',
    bottom: 10,
    width: 30,
    height: 30,
    backgroundColor: '#FFD700',
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestLid: {
    width: 110,
    height: 35,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    position: 'absolute',
    top: -30,
    transformOrigin: 'bottom center',
    overflow: 'hidden',
  },
  rewardContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  rewardIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  rewardText: {
    fontSize: typography.size3xl,
    fontWeight: typography.weightExtrabold,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonContainer: {
    marginTop: spacing.xxl,
  },
  continueButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  buttonGradient: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    letterSpacing: 1,
  },
});

export default RewardClaimModal;
