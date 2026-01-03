import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Squad, SquadMember } from '../types';

// Color palette matching the app's design system
const COLORS = {
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',
  ELECTRIC_PURPLE: '#9B59FF',
  ELECTRIC_CYAN: '#00D4FF',
  NEON_GREEN: '#00FF87',
  GAME_ORANGE: '#FF6B00',
  GOLD: '#FFD700',
  CORAL: '#FF4757',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A78BFA',
  TEXT_MUTED: '#6B7280',
  SUCCESS_GREEN: '#10B981',
  WARNING_AMBER: '#F59E0B',
};

interface SquadStatusBannerProps {
  currentSquad: Squad | null;
  members: SquadMember[];
  onJoinSquad: () => void;
  onSwitchSquad?: () => void;
  onInviteFriends?: () => void;
  hasMultipleSquads?: boolean;
}

// Animated pulse for no-squad warning
function PulsingWarning() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.warningPulse, pulseStyle]}>
      <Ionicons name="alert-circle" size={24} color={COLORS.WARNING_AMBER} />
    </Animated.View>
  );
}

// Squad badge component showing the squad identity prominently
function SquadBadge({
  squad,
  memberCount,
  onPress,
}: {
  squad: Squad;
  memberCount: number;
  onPress?: () => void;
}) {
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Animated.View entering={FadeInDown.duration(500).springify()}>
      <TouchableOpacity
        style={styles.squadBadgeContainer}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Glow effect */}
        <Animated.View style={[styles.squadBadgeGlow, glowStyle]} />

        <LinearGradient
          colors={[COLORS.ELECTRIC_PURPLE, COLORS.DEEP_PURPLE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.squadBadgeGradient}
        >
          {/* Squad icon */}
          <View style={styles.squadIconContainer}>
            <Ionicons name="people" size={20} color={COLORS.TEXT_PRIMARY} />
          </View>

          {/* Squad info */}
          <View style={styles.squadBadgeInfo}>
            <View style={styles.squadBadgeHeader}>
              <Text style={styles.squadBadgeLabel}>YOUR SQUAD</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>ACTIVE</Text>
              </View>
            </View>
            <Text style={styles.squadBadgeName} numberOfLines={1}>
              {squad.name}
            </Text>
            <Text style={styles.squadBadgeMembers}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>

          {/* Chevron */}
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.TEXT_SECONDARY}
          />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// No squad warning banner with prominent CTA
function NoSquadBanner({ onJoinSquad }: { onJoinSquad: () => void }) {
  const bounceValue = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Bounce animation for button
    bounceValue.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.4, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceValue.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onJoinSquad();
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(600).springify()}
      style={styles.noSquadContainer}
    >
      <LinearGradient
        colors={[COLORS.CORAL + '30', COLORS.GAME_ORANGE + '20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.noSquadGradient}
      >
        {/* Warning icon */}
        <View style={styles.noSquadIconSection}>
          <PulsingWarning />
        </View>

        {/* Message */}
        <View style={styles.noSquadContent}>
          <Text style={styles.noSquadTitle}>You are not in a Squad!</Text>
          <Text style={styles.noSquadDescription}>
            Join or create a squad to compete with friends in daily challenges
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
          <Animated.View style={buttonStyle}>
            <View style={styles.noSquadButtonContainer}>
              <Animated.View style={[styles.noSquadButtonGlow, glowStyle]} />
              <LinearGradient
                colors={[COLORS.GAME_ORANGE, COLORS.CORAL]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.noSquadButton}
              >
                <Ionicons name="people-circle" size={20} color="#fff" />
                <Text style={styles.noSquadButtonText}>Find Your Squad</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Decorative border */}
      <View style={styles.noSquadBorder} />
    </Animated.View>
  );
}

// Minimal squad indicator for compact spaces (like headers)
export function SquadIndicatorCompact({
  squad,
  memberCount,
  onPress,
}: {
  squad: Squad | null;
  memberCount: number;
  onPress?: () => void;
}) {
  if (!squad) {
    return (
      <TouchableOpacity style={styles.compactNoSquad} onPress={onPress}>
        <Ionicons name="alert-circle" size={16} color={COLORS.WARNING_AMBER} />
        <Text style={styles.compactNoSquadText}>No Squad</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.compactSquad} onPress={onPress}>
      <Ionicons name="people" size={14} color={COLORS.ELECTRIC_PURPLE} />
      <Text style={styles.compactSquadName} numberOfLines={1}>
        {squad.name}
      </Text>
      <Text style={styles.compactMemberCount}>{memberCount}</Text>
    </TouchableOpacity>
  );
}

// Main component export
export function SquadStatusBanner({
  currentSquad,
  members,
  onJoinSquad,
  onSwitchSquad,
  onInviteFriends,
  hasMultipleSquads,
}: SquadStatusBannerProps) {
  if (!currentSquad) {
    return <NoSquadBanner onJoinSquad={onJoinSquad} />;
  }

  return (
    <SquadBadge
      squad={currentSquad}
      memberCount={members.length}
      onPress={hasMultipleSquads ? onSwitchSquad : onInviteFriends}
    />
  );
}

const styles = StyleSheet.create({
  // Squad Badge styles
  squadBadgeContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'visible',
  },
  squadBadgeGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: COLORS.ELECTRIC_PURPLE,
    borderRadius: 20,
  },
  squadBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.ELECTRIC_PURPLE + '40',
    gap: 12,
  },
  squadIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.ELECTRIC_PURPLE + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squadBadgeInfo: {
    flex: 1,
    gap: 2,
  },
  squadBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  squadBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.TEXT_SECONDARY,
    letterSpacing: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.SUCCESS_GREEN + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.SUCCESS_GREEN,
  },
  liveText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.SUCCESS_GREEN,
    letterSpacing: 0.5,
  },
  squadBadgeName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  squadBadgeMembers: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },

  // No Squad Banner styles
  noSquadContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  noSquadGradient: {
    padding: 20,
    gap: 16,
  },
  noSquadBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: COLORS.CORAL + '50',
    borderRadius: 16,
    borderStyle: 'dashed',
    pointerEvents: 'none',
  },
  noSquadIconSection: {
    alignItems: 'center',
  },
  warningPulse: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.WARNING_AMBER + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSquadContent: {
    alignItems: 'center',
  },
  noSquadTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 4,
  },
  noSquadDescription: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },
  noSquadButtonContainer: {
    position: 'relative',
  },
  noSquadButtonGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    backgroundColor: COLORS.GAME_ORANGE,
    borderRadius: 18,
  },
  noSquadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  noSquadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Compact indicator styles
  compactNoSquad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.WARNING_AMBER + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  compactNoSquadText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.WARNING_AMBER,
  },
  compactSquad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.ELECTRIC_PURPLE + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: 150,
  },
  compactSquadName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ELECTRIC_PURPLE,
    flex: 1,
  },
  compactMemberCount: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.TEXT_MUTED,
    backgroundColor: COLORS.DEEP_PURPLE,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
});
