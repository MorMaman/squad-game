/**
 * RulesSection.tsx
 * Displays core game principles and rules
 * Visual display of the game's philosophy
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { CORE_RULES } from '../../types/powers';
import { colors, spacing, borderRadius, typography } from '../../theme/colors';

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

interface RuleCardProps {
  rule: typeof CORE_RULES[0];
  index: number;
  t: (key: string, fallback?: string) => string;
  isRTL?: boolean;
}

function RuleCard({ rule, index, t, isRTL = false }: RuleCardProps) {
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const iconColors: string[] = [
    THEME.accent.lime,
    THEME.accent.cyan,
    '#FFD700',
    '#FF6B00',
    '#FF4757',
  ];

  const iconColor = iconColors[index % iconColors.length];

  const glowStyle = Platform.select({
    web: {
      boxShadow: `0 0 15px ${iconColor}40`,
    } as any,
    default: {
      shadowColor: iconColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
  });

  return (
    <View style={[styles.ruleCard, glowStyle]}>
      <View style={[styles.ruleHeader, isRTL && styles.ruleHeaderRTL]}>
        <Animated.View
          style={[
            styles.ruleIconContainer,
            { backgroundColor: iconColor + '20' },
            animatedIconStyle,
          ]}
        >
          <MaterialCommunityIcons
            name={rule.icon as any}
            size={28}
            color={iconColor}
          />
        </Animated.View>
        <View style={styles.ruleNumber}>
          <Text style={styles.ruleNumberText}>{index + 1}</Text>
        </View>
      </View>

      <Text style={[styles.ruleTitle, { color: iconColor }, isRTL && styles.textRTL]}>
        {t(`rulebook.coreRulesList.${rule.id}`, rule.title)}
      </Text>
      <Text style={[styles.ruleDescription, isRTL && styles.textRTL]}>
        {t(`rulebook.coreRulesList.${rule.id}Desc`, rule.description)}
      </Text>
    </View>
  );
}

interface RulesSectionProps {
  isRTL?: boolean;
}

export function RulesSection({ isRTL = false }: RulesSectionProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Philosophy header */}
      <View style={styles.philosophySection}>
        <LinearGradient
          colors={[THEME.accent.lime + '10', THEME.accent.cyan + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.philosophyGradient}
        >
          <MaterialCommunityIcons
            name="book-open-page-variant"
            size={32}
            color={THEME.accent.lime}
          />
          <Text style={[styles.philosophyTitle, isRTL && styles.textRTL]}>{t('rulebook.gamePhilosophy', 'Game Philosophy')}</Text>
          <Text style={[styles.philosophySubtitle, isRTL && styles.textRTL]}>
            {t('rulebook.philosophySubtitle', 'These are the core principles that make Squad Game fair, fun, and meaningful.')}
          </Text>
        </LinearGradient>
      </View>

      {/* Rules list */}
      <View style={styles.rulesContainer}>
        {CORE_RULES.map((rule, index) => (
          <RuleCard key={rule.id} rule={rule} index={index} t={t} isRTL={isRTL} />
        ))}
      </View>

      {/* Additional info section */}
      <View style={styles.additionalInfo}>
        <View style={[styles.infoCard, isRTL && styles.infoCardRTL]}>
          <MaterialCommunityIcons name="scale-balance" size={24} color={THEME.accent.cyan} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, isRTL && styles.textRTL]}>{t('rulebook.fairPlayGuarantee', 'Fair Play Guarantee')}</Text>
            <Text style={[styles.infoText, isRTL && styles.textRTL]}>
              {t('rulebook.fairPlayDesc', 'All powers are designed to be balanced. No single power can dominate the game. Strategy and participation always win over luck.')}
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, isRTL && styles.infoCardRTL]}>
          <MaterialCommunityIcons name="update" size={24} color="#FFD700" />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, isRTL && styles.textRTL]}>{t('rulebook.livingRules', 'Living Rules')}</Text>
            <Text style={[styles.infoText, isRTL && styles.textRTL]}>
              {t('rulebook.livingRulesDesc', 'This rulebook evolves with your squad. New powers may be added and balance adjustments made based on how squads play.')}
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, isRTL && styles.infoCardRTL]}>
          <MaterialCommunityIcons name="account-group" size={24} color="#FF6B00" />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, isRTL && styles.textRTL]}>{t('rulebook.squadDemocracy', 'Squad Democracy')}</Text>
            <Text style={[styles.infoText, isRTL && styles.textRTL]}>
              {t('rulebook.squadDemocracyDesc', 'Major game-changing powers require squad approval. No one player can unilaterally alter the experience for everyone.')}
            </Text>
          </View>
        </View>
      </View>

      {/* Quote section */}
      <View style={styles.quoteSection}>
        <View style={styles.quoteMark}>
          <Text style={styles.quoteMarkText}>"</Text>
        </View>
        <Text style={[styles.quoteText, isRTL && styles.textRTL]}>
          {t('rulebook.quote', 'The best games are the ones where everyone wants to come back tomorrow.')}
        </Text>
        <Text style={[styles.quoteAuthor, isRTL && styles.textRTL]}>{t('rulebook.quoteAuthor', '- Squad Game Philosophy')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  philosophySection: {
    marginBottom: spacing.lg,
  },
  philosophyGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.2)',
  },
  philosophyTitle: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  philosophySubtitle: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  rulesContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  ruleCard: {
    backgroundColor: THEME.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  ruleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumber: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumberText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.textMuted,
  },
  ruleTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    marginBottom: spacing.xs,
  },
  ruleDescription: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  additionalInfo: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: THEME.background.medium,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  quoteSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  quoteMark: {
    marginBottom: -spacing.md,
  },
  quoteMarkText: {
    fontSize: 48,
    fontWeight: typography.weightBold,
    color: THEME.accent.lime,
    opacity: 0.5,
  },
  quoteText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 26,
  },
  quoteAuthor: {
    fontSize: typography.sizeSm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  // RTL styles for Hebrew
  ruleHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  infoCardRTL: {
    flexDirection: 'row-reverse',
  },
  textRTL: {
    textAlign: 'right',
  },
});

export default RulesSection;
