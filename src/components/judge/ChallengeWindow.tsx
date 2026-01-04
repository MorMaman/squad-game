/**
 * ChallengeWindow.tsx
 * Active challenge display with progress bar, countdown, and voting
 * Shows challenge status, votes for/against, and time remaining
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../Avatar';
import { ChallengeVoteButtons } from './ChallengeVoteButton';
import { GAME_COLORS } from '../../theme/gameColors';

// Battle Game UI Colors
const COLORS = {
  LIME: '#A3E635',
  CYAN: '#00D4FF',
  PURPLE: '#9B59FF',
  RED: '#EF4444',
  ORANGE: '#F97316',
  GOLD: '#FFD700',
  DARK_BG: '#0A0E27',
  CARD_BG: '#16213E',
  CARD_BG_LIGHT: '#1A1A2E',
};

export interface ChallengeData {
  /** Unique challenge ID */
  id: string;
  /** Event ID this challenge is for */
  eventId: string;
  /** User who initiated the challenge */
  challengerId: string;
  challengerName: string;
  challengerAvatar?: string | null;
  /** Target of the challenge (judge decision or power) */
  targetType: 'judge_decision' | 'power_use' | 'vote_result';
  targetDescription?: string;
  /** Vote counts */
  votesFor: number;
  votesAgainst: number;
  /** Total eligible voters */
  totalVoters: number;
  /** Threshold percentage for overturn (e.g., 50) */
  threshold: number;
  /** Challenge deadline timestamp */
  deadline: Date | number;
  /** Challenge status */
  status: 'active' | 'passed' | 'failed' | 'expired';
  /** User's current vote */
  userVote?: 'for' | 'against' | null;
  /** Whether user is the challenger (can't vote on own challenge) */
  isChallenger?: boolean;
  /** Whether user is the target (can't vote when targeted) */
  isTarget?: boolean;
}

export interface ChallengeWindowProps {
  /** Challenge data object */
  challenge: ChallengeData;
  /** Callback when user votes for the challenge */
  onVoteFor?: () => void;
  /** Callback when user votes against the challenge */
  onVoteAgainst?: () => void;
  /** Callback when time runs out */
  onExpire?: () => void;
  /** Loading state for voting */
  loading?: boolean;
  /** Compact mode for list views */
  compact?: boolean;
}

/**
 * Custom hook for challenge deadline countdown
 * Different from the game countdown hook - this counts down to a deadline timestamp
 */
function useChallengeCountdown(targetTime: number, onExpire?: () => void) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, targetTime - Date.now()));
  const [isExpired, setIsExpired] = useState(timeLeft <= 0);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, targetTime - Date.now());
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsExpired(true);
        onExpire?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onExpire]);

  const formatTime = useCallback(() => {
    const totalSeconds = Math.floor(timeLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  return {
    timeLeft,
    isExpired,
    formatted: formatTime(),
  };
}

export function ChallengeWindow({
  challenge,
  onVoteFor,
  onVoteAgainst,
  onExpire,
  loading = false,
  compact = false,
}: ChallengeWindowProps) {
  const {
    id,
    challengerId,
    challengerName,
    challengerAvatar,
    targetType,
    targetDescription,
    votesFor,
    votesAgainst,
    totalVoters,
    threshold,
    deadline,
    status,
    userVote,
    isChallenger,
    isTarget,
  } = challenge;

  // Animation values
  const progressWidth = useSharedValue(0);
  const glowPulse = useSharedValue(0);
  const urgentPulse = useSharedValue(0);
  const containerScale = useSharedValue(compact ? 1 : 0.95);

  // Calculate progress
  const totalVotes = votesFor + votesAgainst;
  const forPercentage = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 50;
  const thresholdReached = forPercentage >= threshold;

  // Countdown hook
  const deadlineTime = typeof deadline === 'number' ? deadline : deadline.getTime();
  const { timeLeft, isExpired, formatted } = useChallengeCountdown(deadlineTime, onExpire);

  // Check if time is urgent (< 5 minutes)
  const isUrgent = timeLeft < 5 * 60 * 1000 && timeLeft > 0;

  useEffect(() => {
    // Entrance animation
    containerScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // Progress bar animation
    progressWidth.value = withSpring(forPercentage, {
      damping: 15,
      stiffness: 100,
    });

    // Continuous glow
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [forPercentage]);

  useEffect(() => {
    // Urgent pulse when time is low
    if (isUrgent) {
      urgentPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      urgentPulse.value = withTiming(0);
    }
  }, [isUrgent]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const color = thresholdReached ? COLORS.LIME : COLORS.CYAN;
    const shadowRadius = interpolate(glowPulse.value, [0, 1], [5, 15]);
    const shadowOpacity = interpolate(glowPulse.value, [0, 1], [0.3, 0.6]);

    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius,
      elevation: Math.round(shadowRadius / 2),
    };
  });

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const timerStyle = useAnimatedStyle(() => {
    const scale = interpolate(urgentPulse.value, [0, 1], [1, 1.1]);
    const opacity = interpolate(urgentPulse.value, [0, 1], [1, 0.8]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Determine if user can vote
  const canVote = status === 'active' && !isChallenger && !isTarget && userVote === null;

  // Get target type label
  const getTargetLabel = () => {
    switch (targetType) {
      case 'judge_decision':
        return 'Judge Decision';
      case 'power_use':
        return 'Power Use';
      case 'vote_result':
        return 'Vote Result';
      default:
        return 'Decision';
    }
  };

  // Get status badge config
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { color: COLORS.CYAN, label: 'ACTIVE', icon: 'timer' as const };
      case 'passed':
        return { color: COLORS.LIME, label: 'PASSED', icon: 'checkmark-circle' as const };
      case 'failed':
        return { color: COLORS.RED, label: 'FAILED', icon: 'close-circle' as const };
      case 'expired':
        return { color: COLORS.ORANGE, label: 'EXPIRED', icon: 'time' as const };
      default:
        return { color: COLORS.CYAN, label: 'UNKNOWN', icon: 'help-circle' as const };
    }
  };

  const statusConfig = getStatusConfig();

  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, containerStyle, glowStyle]}>
        <View style={styles.compactHeader}>
          <MaterialCommunityIcons
            name="gavel"
            size={16}
            color={COLORS.PURPLE}
          />
          <Text style={styles.compactTitle}>Challenge</Text>
          <View style={[styles.statusBadgeSmall, { backgroundColor: statusConfig.color }]}>
            <Text style={styles.statusBadgeTextSmall}>{statusConfig.label}</Text>
          </View>
        </View>

        {/* Compact progress bar */}
        <View style={styles.compactProgressContainer}>
          <View style={styles.compactProgressBg}>
            <Animated.View
              style={[
                styles.compactProgressFill,
                { backgroundColor: COLORS.LIME },
                progressBarStyle,
              ]}
            />
          </View>
          <Text style={styles.compactProgressText}>
            {votesFor}/{totalVotes} ({Math.round(forPercentage)}%)
          </Text>
        </View>

        {/* Compact timer */}
        {status === 'active' && (
          <Animated.Text style={[styles.compactTimer, timerStyle, isUrgent && styles.urgentTimer]}>
            {formatted}
          </Animated.Text>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, containerStyle, glowStyle]}>
      <LinearGradient
        colors={[COLORS.CARD_BG, COLORS.CARD_BG_LIGHT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons
              name="gavel"
              size={24}
              color={COLORS.PURPLE}
            />
            <Text style={styles.headerTitle}>Challenge Active</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Challenger Info */}
        <View style={styles.challengerSection}>
          <View style={styles.challengerInfo}>
            <Avatar
              uri={challengerAvatar}
              name={challengerName}
              size="small"
              style={styles.challengerAvatar}
            />
            <View style={styles.challengerText}>
              <Text style={styles.challengerName}>{challengerName}</Text>
              <Text style={styles.challengerLabel}>Challenger</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={20} color={COLORS.PURPLE} />
          <View style={styles.targetInfo}>
            <Text style={styles.targetLabel}>{getTargetLabel()}</Text>
            {targetDescription && (
              <Text style={styles.targetDescription} numberOfLines={2}>
                {targetDescription}
              </Text>
            )}
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Challenge Progress</Text>
            <Text style={styles.thresholdText}>
              Threshold: {threshold}%
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: thresholdReached ? COLORS.LIME : COLORS.CYAN },
                  progressBarStyle,
                ]}
              />
              {/* Threshold marker */}
              <View
                style={[
                  styles.thresholdMarker,
                  { left: `${threshold}%` },
                ]}
              />
            </View>

            {/* Vote counts below bar */}
            <View style={styles.progressLabels}>
              <View style={styles.progressLabelLeft}>
                <Ionicons name="thumbs-up" size={14} color={COLORS.LIME} />
                <Text style={styles.progressLabelText}>{votesFor} Support</Text>
              </View>
              <Text style={styles.progressPercentage}>
                {Math.round(forPercentage)}%
              </Text>
              <View style={styles.progressLabelRight}>
                <Text style={styles.progressLabelText}>{votesAgainst} Reject</Text>
                <Ionicons name="thumbs-down" size={14} color={COLORS.RED} />
              </View>
            </View>
          </View>
        </View>

        {/* Timer */}
        {status === 'active' && (
          <Animated.View style={[styles.timerSection, timerStyle]}>
            <Ionicons
              name="timer-outline"
              size={20}
              color={isUrgent ? COLORS.ORANGE : COLORS.CYAN}
            />
            <Text
              style={[
                styles.timerText,
                isUrgent && styles.timerTextUrgent,
              ]}
            >
              {formatted}
            </Text>
            <Text style={styles.timerLabel}>remaining</Text>
          </Animated.View>
        )}

        {/* Vote Buttons */}
        {status === 'active' && (
          <View style={styles.voteSection}>
            {canVote ? (
              <>
                <Text style={styles.votePrompt}>Cast your vote:</Text>
                <ChallengeVoteButtons
                  forCount={votesFor}
                  againstCount={votesAgainst}
                  userVote={userVote}
                  disabled={!canVote}
                  loading={loading}
                  onVoteFor={onVoteFor}
                  onVoteAgainst={onVoteAgainst}
                  size="medium"
                />
              </>
            ) : (
              <View style={styles.votedMessage}>
                <Ionicons
                  name={userVote === 'for' ? 'thumbs-up' : userVote === 'against' ? 'thumbs-down' : 'information-circle'}
                  size={20}
                  color={userVote === 'for' ? COLORS.LIME : userVote === 'against' ? COLORS.RED : COLORS.CYAN}
                />
                <Text style={styles.votedText}>
                  {isChallenger
                    ? "You initiated this challenge"
                    : isTarget
                    ? "You are the target of this challenge"
                    : userVote
                    ? `You voted to ${userVote === 'for' ? 'support' : 'reject'}`
                    : "Awaiting vote results"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Result message for completed challenges */}
        {status !== 'active' && (
          <View style={styles.resultSection}>
            <Ionicons
              name={status === 'passed' ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={status === 'passed' ? COLORS.LIME : COLORS.RED}
            />
            <Text style={[styles.resultText, { color: status === 'passed' ? COLORS.LIME : COLORS.RED }]}>
              {status === 'passed'
                ? 'Challenge Successful - Decision Overturned'
                : status === 'failed'
                ? 'Challenge Failed - Decision Stands'
                : 'Challenge Expired'}
            </Text>
          </View>
        )}

        {/* Voter count */}
        <Text style={styles.voterCount}>
          {totalVotes} of {totalVoters} squad members voted
        </Text>

        {/* Web glow fallback */}
        {Platform.OS === 'web' && (
          <View
            style={[
              styles.webGlow,
              { backgroundColor: thresholdReached ? COLORS.LIME : COLORS.CYAN },
            ]}
          />
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 255, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  challengerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  challengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  challengerAvatar: {
    borderWidth: 2,
    borderColor: COLORS.PURPLE,
  },
  challengerText: {
    gap: 2,
  },
  challengerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  challengerLabel: {
    fontSize: 11,
    color: COLORS.PURPLE,
    fontWeight: '600',
  },
  targetInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.CYAN,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  thresholdText: {
    fontSize: 12,
    color: COLORS.ORANGE,
    fontWeight: '600',
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  thresholdMarker: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 3,
    backgroundColor: COLORS.ORANGE,
    borderRadius: 1.5,
    marginLeft: -1.5,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressLabelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressLabelText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.CYAN,
    fontVariant: ['tabular-nums'],
  },
  timerTextUrgent: {
    color: COLORS.ORANGE,
  },
  timerLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  voteSection: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  votePrompt: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  votedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  votedText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  resultSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 16,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  voterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  webGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.15,
    top: '50%',
    left: '50%',
    marginLeft: -100,
    marginTop: -100,
    zIndex: -1,
    ...(Platform.OS === 'web' && ({
      filter: 'blur(50px)',
    } as any)),
  },
  // Compact styles
  compactContainer: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 255, 0.2)',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  statusBadgeTextSmall: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.DARK_BG,
    letterSpacing: 0.5,
  },
  compactProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  compactProgressText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 70,
    textAlign: 'right',
  },
  compactTimer: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.CYAN,
    textAlign: 'center',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  urgentTimer: {
    color: COLORS.ORANGE,
  },
});

export default ChallengeWindow;
