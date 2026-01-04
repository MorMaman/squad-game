/**
 * PowerCard.tsx
 * Individual power entry component for the rulebook
 * Expandable card showing power details, conditions, and rules
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { PowerDefinition, PowerCategory, PowerType } from '../../types/powers';
import { POWER_CATEGORIES } from '../../types/powers';
import { GAME_COLORS } from '../../theme/gameColors';
import { colors, spacing, borderRadius, typography } from '../../theme/colors';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Theme colors matching battle game UI
const THEME = {
  background: {
    dark: '#0A0E27',
    medium: '#1A1A2E',
    card: '#16213E',
  },
  accent: {
    lime: '#A3E635',
    cyan: '#00D4FF',
  },
};

// Rarity colors
const RARITY_COLORS: Record<PowerDefinition['rarity'], { primary: string; glow: string }> = {
  common: { primary: '#6B7280', glow: 'rgba(107, 114, 128, 0.3)' },
  rare: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)' },
  epic: { primary: '#9B59FF', glow: 'rgba(155, 89, 255, 0.3)' },
  legendary: { primary: '#FFD700', glow: 'rgba(255, 215, 0, 0.3)' },
};

interface PowerCardProps {
  power: PowerDefinition;
  isUnlocked?: boolean;
  onPress?: () => void;
  isRTL?: boolean;
}

// Power type to translation key mapping
const POWER_TRANSLATION_KEYS: Record<PowerType, string> = {
  double_chance: 'doubleChance',
  target_lock: 'targetLock',
  chaos_card: 'chaosCard',
  streak_shield: 'streakShield',
};

export function PowerCard({ power, isUnlocked = true, onPress, isRTL = false }: PowerCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useSharedValue(0);

  const categoryInfo = POWER_CATEGORIES[power.category];
  const rarityColors = RARITY_COLORS[power.rarity];
  const translationKey = POWER_TRANSLATION_KEYS[power.id as PowerType];

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    rotation.value = withSpring(isExpanded ? 0 : 1);
    setIsExpanded(!isExpanded);
    onPress?.();
  };

  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
    };
  });

  const glowStyle = Platform.select({
    web: {
      boxShadow: isUnlocked ? `0 0 20px ${rarityColors.glow}` : 'none',
    } as any,
    default: isUnlocked ? {
      shadowColor: rarityColors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    } : {},
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.container, glowStyle, !isUnlocked && styles.locked]}
    >
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color + '20' }, isRTL && styles.iconContainerRTL]}>
          <MaterialCommunityIcons
            name={power.icon as any}
            size={28}
            color={isUnlocked ? categoryInfo.color : '#4A5568'}
          />
        </View>

        {/* Title and short description */}
        <View style={styles.titleContainer}>
          <View style={[styles.titleRow, isRTL && styles.titleRowRTL]}>
            <Text style={[styles.title, !isUnlocked && styles.lockedText, isRTL && styles.textRTL]}>
              {translationKey ? t(`powers.${translationKey}.name`, power.name) : power.name}
            </Text>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColors.primary + '30' }]}>
              <Text style={[styles.rarityText, { color: rarityColors.primary }]}>
                {t(`rewards.rarity.${power.rarity}`, power.rarity).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.shortDescription, !isUnlocked && styles.lockedText, isRTL && styles.textRTL]}>
            {translationKey ? t(`powers.${translationKey}.short`, power.shortDescription) : power.shortDescription}
          </Text>
        </View>

        {/* Expand chevron */}
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color={isUnlocked ? THEME.accent.cyan : '#4A5568'}
          />
        </Animated.View>
      </View>

      {/* Category badge */}
      <View style={[styles.categoryRow, isRTL && styles.categoryRowRTL]}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }, isRTL && styles.categoryBadgeRTL]}>
          <MaterialCommunityIcons
            name={categoryInfo.icon as any}
            size={14}
            color={categoryInfo.color}
          />
          <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
            {t(`rulebook.categories.${power.category}`, categoryInfo.name)}
          </Text>
        </View>
        {!isUnlocked && (
          <View style={[styles.lockedBadge, isRTL && styles.lockedBadgeRTL]}>
            <MaterialCommunityIcons name="lock" size={12} color="#EF4444" />
            <Text style={styles.lockedBadgeText}>{t('rulebook.locked', 'Locked')}</Text>
          </View>
        )}
      </View>

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Full description */}
          <View style={styles.section}>
            <Text style={[styles.fullDescription, isRTL && styles.textRTL]}>
              {translationKey ? t(`powers.${translationKey}.full`, power.fullDescription) : power.fullDescription}
            </Text>
          </View>

          {/* Activation conditions */}
          <View style={styles.section}>
            <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
              <MaterialCommunityIcons name="lightning-bolt" size={16} color={THEME.accent.lime} />
              <Text style={styles.sectionTitle}>{t('rulebook.activationConditions', 'Activation Conditions')}</Text>
            </View>
            {power.activationConditions.map((condition, index) => {
              const translatedConditions = translationKey
                ? t(`powers.${translationKey}.activationConditions`, { returnObjects: true }) as string[] | string
                : null;
              const translatedCondition = Array.isArray(translatedConditions) && translatedConditions[index]
                ? translatedConditions[index]
                : condition;
              return (
                <View key={index} style={[styles.bulletPoint, isRTL && styles.bulletPointRTL]}>
                  <Text style={styles.bullet}>-</Text>
                  <Text style={[styles.bulletText, isRTL && styles.textRTL]}>{translatedCondition}</Text>
                </View>
              );
            })}
          </View>

          {/* Duration and limits */}
          <View style={[styles.infoGrid, isRTL && styles.infoGridRTL]}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={THEME.accent.cyan} />
              <Text style={styles.infoLabel}>{t('rulebook.duration', 'Duration')}</Text>
              <Text style={styles.infoValue}>
                {translationKey ? t(`powers.${translationKey}.duration`, power.duration) : power.duration}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#F59E0B" />
              <Text style={styles.infoLabel}>{t('rulebook.limits', 'Limits')}</Text>
              <Text style={styles.infoValue}>
                {translationKey ? t(`powers.${translationKey}.limits`, power.limits) : power.limits}
              </Text>
            </View>
          </View>

          {/* How to cancel */}
          <View style={styles.section}>
            <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
              <MaterialCommunityIcons name="cancel" size={16} color="#EF4444" />
              <Text style={styles.sectionTitle}>{t('rulebook.cancel', 'How to Cancel')}</Text>
            </View>
            <Text style={[styles.sectionContent, isRTL && styles.textRTL]}>
              {translationKey ? t(`powers.${translationKey}.howToCancel`, power.howToCancel) : power.howToCancel}
            </Text>
          </View>

          {/* Expiration rules */}
          <View style={styles.section}>
            <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
              <MaterialCommunityIcons name="timer-sand" size={16} color="#F59E0B" />
              <Text style={styles.sectionTitle}>{t('rulebook.expiration', 'Expiration')}</Text>
            </View>
            <Text style={[styles.sectionContent, isRTL && styles.textRTL]}>
              {translationKey ? t(`powers.${translationKey}.expirationRules`, power.expirationRules) : power.expirationRules}
            </Text>
          </View>

          {/* Unlock condition */}
          <View style={styles.unlockSection}>
            <LinearGradient
              colors={isUnlocked ? [THEME.accent.lime + '20', THEME.accent.cyan + '20'] : ['#374151', '#1F2937']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.unlockGradient, isRTL && styles.unlockGradientRTL]}
            >
              <MaterialCommunityIcons
                name={isUnlocked ? 'lock-open-variant' : 'lock'}
                size={18}
                color={isUnlocked ? THEME.accent.lime : '#6B7280'}
              />
              <View style={styles.unlockTextContainer}>
                <Text style={[styles.unlockLabel, isUnlocked && styles.unlockedLabel, isRTL && styles.textRTL]}>
                  {isUnlocked ? t('rulebook.unlocked', 'Unlocked') : t('rulebook.howToUnlock', 'How to Unlock')}
                </Text>
                <Text style={[styles.unlockCondition, isRTL && styles.textRTL]}>
                  {translationKey ? t(`powers.${translationKey}.unlockCondition`, power.unlockCondition) : power.unlockCondition}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  locked: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  title: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  rarityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    letterSpacing: 0.5,
  },
  shortDescription: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
  },
  lockedText: {
    color: '#6B7280',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  categoryText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    gap: 4,
  },
  lockedBadgeText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: '#EF4444',
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  fullDescription: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginTop: 4,
  },
  bullet: {
    fontSize: typography.sizeSm,
    color: THEME.accent.lime,
    marginRight: spacing.xs,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoItem: {
    flex: 1,
    backgroundColor: THEME.background.medium,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.sizeXs,
    color: colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: typography.sizeXs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  unlockSection: {
    marginTop: spacing.sm,
  },
  unlockGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  unlockTextContainer: {
    flex: 1,
  },
  unlockLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unlockedLabel: {
    color: THEME.accent.lime,
  },
  unlockCondition: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // RTL styles for Hebrew
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  iconContainerRTL: {
    marginRight: 0,
    marginLeft: spacing.md,
  },
  titleRowRTL: {
    flexDirection: 'row-reverse',
  },
  categoryRowRTL: {
    flexDirection: 'row-reverse',
  },
  categoryBadgeRTL: {
    flexDirection: 'row-reverse',
  },
  lockedBadgeRTL: {
    flexDirection: 'row-reverse',
  },
  sectionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  bulletPointRTL: {
    flexDirection: 'row-reverse',
  },
  infoGridRTL: {
    flexDirection: 'row-reverse',
  },
  unlockGradientRTL: {
    flexDirection: 'row-reverse',
  },
  textRTL: {
    textAlign: 'right',
  },
});

export default PowerCard;
