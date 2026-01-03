/**
 * TargetLockModal.tsx
 * Full-screen modal for selecting a target player when using the target_lock power
 * Features red/orange theme, crosshair animations, and haptic feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import { GAME_COLORS, GAME_SPRINGS } from '../theme/gameColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Target Lock Theme Colors
const TARGET_COLORS = {
  primary: '#EF4444', // Red-500
  secondary: '#F97316', // Orange-500
  accent: '#DC2626', // Red-600
  glow: 'rgba(239, 68, 68, 0.5)',
  gradient: ['#EF4444', '#F97316'] as readonly [string, string],
  selectedBorder: '#EF4444',
  selectedGlow: 'rgba(239, 68, 68, 0.6)',
};

interface SquadMember {
  id: string;
  display_name: string;
  avatar_url?: string;
  avatar_icon?: string;
}

interface TargetLockModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed without selection */
  onClose: () => void;
  /** Callback when a target is selected */
  onSelectTarget: (userId: string) => void;
  /** List of squad members to choose from */
  squadMembers: SquadMember[];
  /** Current user's ID (to exclude from list) */
  currentUserId: string;
  /** Whether a selection is being processed */
  isLoading?: boolean;
}

// Animated crosshair component for the header
function AnimatedCrosshair() {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Slow rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Pulsing scale
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: pulse.value },
    ],
  }));

  return (
    <Animated.View style={[styles.crosshairContainer, animatedStyle]}>
      <LinearGradient
        colors={TARGET_COLORS.gradient}
        style={styles.crosshairGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="locate" size={48} color={colors.textPrimary} />
      </LinearGradient>
    </Animated.View>
  );
}

// Player selection item component
interface PlayerItemProps {
  member: SquadMember;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function PlayerItem({ member, isSelected, onSelect, index }: PlayerItemProps) {
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.02, GAME_SPRINGS.bouncy);
      borderOpacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSpring(1, GAME_SPRINGS.gentle);
      borderOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSelect();
  };

  // Generate initials for fallback avatar
  const initials = member.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Animated.View
      style={animatedStyle}
      entering={SlideInUp.delay(100 + index * 50).duration(300)}
    >
      <TouchableOpacity
        style={[
          styles.playerItem,
          isSelected && styles.playerItemSelected,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Selection glow border */}
        <Animated.View
          style={[
            styles.selectionBorder,
            animatedBorderStyle,
          ]}
        />

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {member.avatar_url ? (
            <Image
              source={{ uri: member.avatar_url }}
              style={styles.avatar}
            />
          ) : member.avatar_icon ? (
            <View style={styles.avatarPlaceholder}>
              <Ionicons
                name={member.avatar_icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={colors.textPrimary}
              />
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          {/* Selected indicator */}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="locate" size={16} color={colors.textPrimary} />
            </View>
          )}
        </View>

        {/* Name */}
        <Text
          style={[
            styles.playerName,
            isSelected && styles.playerNameSelected,
          ]}
          numberOfLines={1}
        >
          {member.display_name}
        </Text>

        {/* Crosshair indicator for selected */}
        {isSelected && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.targetIndicator}
          >
            <Ionicons name="locate" size={20} color={TARGET_COLORS.primary} />
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function TargetLockModal({
  visible,
  onClose,
  onSelectTarget,
  squadMembers,
  currentUserId,
  isLoading = false,
}: TargetLockModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Filter out current user
  const availableMembers = squadMembers.filter(
    (member) => member.id !== currentUserId
  );

  // Reset selection when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedUserId(null);
    }
  }, [visible]);

  // Haptic feedback on open
  useEffect(() => {
    if (visible && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [visible]);

  const handleSelectMember = useCallback((memberId: string) => {
    setSelectedUserId(memberId);
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedUserId) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onSelectTarget(selectedUserId);
    }
  }, [selectedUserId, onSelectTarget]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={styles.overlay}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <Animated.View
            style={styles.container}
            entering={SlideInUp.duration(400).springify().damping(15)}
            exiting={SlideOutDown.duration(300)}
          >
            {/* Header */}
            <View style={styles.header}>
              <AnimatedCrosshair />

              <Animated.Text
                style={styles.title}
                entering={FadeIn.delay(200).duration(300)}
              >
                SELECT YOUR TARGET
              </Animated.Text>

              <Animated.Text
                style={styles.subtitle}
                entering={FadeIn.delay(300).duration(300)}
              >
                Choose one player to mark as your target for 24 hours
              </Animated.Text>
            </View>

            {/* Player List */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {availableMembers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="people-outline"
                    size={48}
                    color={colors.textMuted}
                  />
                  <Text style={styles.emptyText}>
                    No squad members available to target
                  </Text>
                </View>
              ) : (
                availableMembers.map((member, index) => (
                  <PlayerItem
                    key={member.id}
                    member={member}
                    isSelected={selectedUserId === member.id}
                    onSelect={() => handleSelectMember(member.id)}
                    index={index}
                  />
                ))
              )}
            </ScrollView>

            {/* Footer Buttons */}
            <Animated.View
              style={styles.footer}
              entering={SlideInUp.delay(400).duration(300)}
            >
              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!selectedUserId || isLoading) && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!selectedUserId || isLoading}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    selectedUserId && !isLoading
                      ? TARGET_COLORS.gradient
                      : ['#4B5563', '#374151']
                  }
                  style={styles.confirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.textPrimary} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="locate"
                        size={20}
                        color={colors.textPrimary}
                      />
                      <Text style={styles.confirmButtonText}>LOCK TARGET</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.95)', // #111827 with opacity
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1f2937', // Dark card background
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    minHeight: '50%',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)', // Subtle red border
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.2)',
  },
  crosshairContainer: {
    marginBottom: spacing.md,
  },
  crosshairGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      web: {
        boxShadow: `0 0 30px ${TARGET_COLORS.glow}`,
      } as any,
      default: {
        shadowColor: TARGET_COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  title: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightExtrabold,
    color: TARGET_COLORS.primary,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  playerItemSelected: {
    borderColor: TARGET_COLORS.primary,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  selectionBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: TARGET_COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: `0 0 15px ${TARGET_COLORS.selectedGlow}`,
      } as any,
      default: {
        shadowColor: TARGET_COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
    }),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: TARGET_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  playerName: {
    flex: 1,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
  playerNameSelected: {
    color: TARGET_COLORS.primary,
  },
  targetIndicator: {
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizeMd,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#111827',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
  },
  confirmButton: {
    flex: 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  confirmButtonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
});

export default TargetLockModal;
