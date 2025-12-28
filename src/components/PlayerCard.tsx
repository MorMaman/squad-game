import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { XPBar } from './XPBar';
import { StreakBadge } from './StreakBadge';
import { colors, typography, spacing, borderRadius, levelConfig, gradients } from '../theme/colors';

export interface Badge {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  earnedAt?: string;
}

interface PlayerCardProps {
  avatar?: string | null;
  username: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalPoints: number;
  badges: Badge[];
  streakDays: number;
  rank?: number;
  rankChange?: 'up' | 'down' | 'same' | 'new';
  compact?: boolean;
  animated?: boolean;
}

export function PlayerCard({
  avatar,
  username,
  level,
  xp,
  xpToNextLevel,
  totalPoints,
  badges,
  streakDays,
  rank,
  rankChange,
  compact = false,
  animated = true,
}: PlayerCardProps) {
  const levelTitle = levelConfig.getTitle(level);
  const displayBadges = badges.slice(0, 4);
  const remainingBadges = badges.length - 4;

  // Animation values
  const cardScale = useSharedValue(0.95);
  const avatarScale = useSharedValue(0.8);

  useEffect(() => {
    if (animated) {
      cardScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      avatarScale.value = withDelay(100, withSpring(1, { damping: 10, stiffness: 80 }));
    } else {
      cardScale.value = 1;
      avatarScale.value = 1;
    }
  }, [animated]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const animatedAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  // Platform-specific glow effect
  const glowStyle = Platform.select({
    web: {
      boxShadow: `0 0 30px ${colors.glowPurple}`,
    } as any,
    default: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
  });

  // Get rank icon and color
  const getRankDecoration = () => {
    if (!rank) return null;
    if (rank === 1) return { icon: 'trophy' as const, color: colors.rankGold };
    if (rank === 2) return { icon: 'medal' as const, color: colors.rankSilver };
    if (rank === 3) return { icon: 'medal' as const, color: colors.rankBronze };
    return null;
  };

  const rankDecoration = getRankDecoration();

  if (compact) {
    return (
      <Animated.View
        style={[styles.compactContainer, animatedCardStyle]}
        entering={animated ? FadeIn.duration(300) : undefined}
      >
        {/* Avatar with level badge */}
        <Animated.View style={animatedAvatarStyle}>
          <View style={styles.avatarContainer}>
            <Avatar uri={avatar} name={username} size="medium" style={styles.avatar} />
            <View style={styles.levelBadgeSmall}>
              <Text style={styles.levelBadgeTextSmall}>{level}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Info */}
        <View style={styles.compactInfo}>
          <Text style={styles.compactUsername}>@{username}</Text>
          <Text style={styles.compactLevel}>{levelTitle}</Text>
        </View>

        {/* Streak */}
        <StreakBadge days={streakDays} size="small" showLabel={false} />

        {/* Points */}
        <View style={styles.compactPoints}>
          <Ionicons name="star" size={14} color={colors.energy} />
          <Text style={styles.compactPointsText}>{totalPoints.toLocaleString()}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.container, glowStyle, animatedCardStyle]}
      entering={animated ? FadeIn.duration(400) : undefined}
    >
      {/* Header with gradient background */}
      <View style={styles.header}>
        {/* Rank badge if applicable */}
        {rank && (
          <Animated.View
            style={styles.rankBadge}
            entering={animated ? FadeInUp.delay(200).duration(300) : undefined}
          >
            {rankDecoration ? (
              <Ionicons name={rankDecoration.icon} size={20} color={rankDecoration.color} />
            ) : (
              <Text style={styles.rankNumber}>#{rank}</Text>
            )}
            {rankChange && rankChange !== 'same' && (
              <View style={styles.rankChange}>
                {rankChange === 'up' && (
                  <Ionicons name="arrow-up" size={12} color={colors.success} />
                )}
                {rankChange === 'down' && (
                  <Ionicons name="arrow-down" size={12} color={colors.error} />
                )}
                {rankChange === 'new' && (
                  <Text style={styles.newBadge}>NEW</Text>
                )}
              </View>
            )}
          </Animated.View>
        )}

        {/* Large Avatar */}
        <Animated.View style={[styles.avatarContainerLarge, animatedAvatarStyle]}>
          <View style={styles.avatarBorderGradient}>
            <Avatar uri={avatar} name={username} size="xlarge" style={styles.avatarLarge} />
          </View>
          <View style={styles.levelBadgeLarge}>
            <Ionicons name="star" size={14} color={colors.energy} />
            <Text style={styles.levelBadgeTextLarge}>{level}</Text>
          </View>
        </Animated.View>

        {/* Username and Title */}
        <Animated.View
          entering={animated ? FadeInUp.delay(150).duration(300) : undefined}
        >
          <Text style={styles.username}>@{username}</Text>
          <Text style={styles.levelTitle}>{levelTitle}</Text>
        </Animated.View>
      </View>

      {/* XP Progress */}
      <Animated.View
        style={styles.xpSection}
        entering={animated ? FadeInUp.delay(250).duration(300) : undefined}
      >
        <XPBar
          currentXP={xp}
          maxXP={xpToNextLevel}
          level={level}
          showLevelBadge={false}
          size="medium"
        />
      </Animated.View>

      {/* Stats Row */}
      <Animated.View
        style={styles.statsRow}
        entering={animated ? FadeInUp.delay(350).duration(300) : undefined}
      >
        {/* Total Points */}
        <View style={styles.statItem}>
          <Ionicons name="star" size={20} color={colors.energy} />
          <Text style={styles.statValue}>{totalPoints.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>

        {/* Streak */}
        <View style={styles.statItem}>
          <StreakBadge days={streakDays} size="small" showLabel={false} animated={animated} />
          <Text style={styles.statValue}>{streakDays}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        {/* Rank */}
        <View style={styles.statItem}>
          {rankDecoration ? (
            <Ionicons name={rankDecoration.icon} size={20} color={rankDecoration.color} />
          ) : (
            <Ionicons name="podium" size={20} color={colors.accent} />
          )}
          <Text style={styles.statValue}>#{rank || '-'}</Text>
          <Text style={styles.statLabel}>Squad Rank</Text>
        </View>
      </Animated.View>

      {/* Badges Section */}
      {badges.length > 0 && (
        <Animated.View
          style={styles.badgesSection}
          entering={animated ? FadeInUp.delay(450).duration(300) : undefined}
        >
          <Text style={styles.badgesTitle}>BADGES</Text>
          <View style={styles.badgesRow}>
            {displayBadges.map((badge, index) => (
              <Animated.View
                key={badge.id}
                style={styles.badgeItem}
                entering={animated ? FadeIn.delay(500 + index * 100).duration(200) : undefined}
              >
                <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                  <Ionicons name={badge.icon} size={20} color={badge.color} />
                </View>
                <Text style={styles.badgeName} numberOfLines={1}>
                  {badge.name}
                </Text>
              </Animated.View>
            ))}
            {remainingBadges > 0 && (
              <View style={styles.moreBadges}>
                <Text style={styles.moreBadgesText}>+{remainingBadges}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.backgroundElevated,
  },
  rankBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  rankNumber: {
    color: colors.textPrimary,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
  },
  rankChange: {
    marginLeft: 2,
  },
  newBadge: {
    fontSize: typography.sizeXs,
    color: colors.energy,
    fontWeight: typography.weightBold,
  },
  avatarContainerLarge: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarBorderGradient: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  avatarLarge: {
    borderWidth: 0,
  },
  levelBadgeLarge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.backgroundCard,
    gap: 2,
  },
  levelBadgeTextLarge: {
    color: colors.textPrimary,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
  },
  username: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  levelTitle: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    fontWeight: typography.weightMedium,
  },
  xpSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.sizeXs,
    color: colors.textSecondary,
    fontWeight: typography.weightMedium,
  },
  badgesSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  badgesTitle: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeItem: {
    alignItems: 'center',
    width: 64,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badgeName: {
    fontSize: typography.sizeXs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  moreBadges: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  moreBadgesText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    fontWeight: typography.weightBold,
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  levelBadgeSmall: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundCard,
  },
  levelBadgeTextSmall: {
    fontSize: 10,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  compactInfo: {
    flex: 1,
  },
  compactUsername: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  compactLevel: {
    fontSize: typography.sizeXs,
    color: colors.textSecondary,
  },
  compactPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactPointsText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
});
