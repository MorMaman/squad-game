import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
  SlideInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Avatar } from './Avatar';
import { RivalryBadge } from './RivalryBadge';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

interface SquadMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface RivalryDeclarationModalProps {
  visible: boolean;
  onClose: () => void;
  onDeclare: (rival1Id: string, rival2Id: string) => void;
  squadMembers: SquadMember[];
  currentUserId: string;
  isLoading?: boolean;
}

// Rivalry colors - competitive red/orange scheme
const rivalryColors = {
  primary: '#EF4444', // Red
  secondary: '#F97316', // Orange
  gradient: ['#EF4444', '#DC2626'] as const,
  backgroundGradient: ['#111827', '#1f2937', '#111827'] as const,
  glow: 'rgba(239, 68, 68, 0.5)',
  crownColor: '#FACC15', // Gold for crown
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function SelectionSlot({
  label,
  member,
  onClear,
  isSelected,
  index,
}: {
  label: string;
  member: SquadMember | null;
  onClear: () => void;
  isSelected: boolean;
  index: number;
}) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isSelected) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 6, stiffness: 100 }),
        withSpring(1, { damping: 8 })
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 600 }),
          withTiming(0.4, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      scale.value = 1;
      glowOpacity.value = 0;
    }
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      style={[styles.slotContainer, animatedStyle]}
      entering={SlideInUp.delay(200 + index * 100).duration(400).springify()}
    >
      <Text style={styles.slotLabel}>{label}</Text>

      <View style={[styles.slotContent, isSelected && styles.slotContentSelected]}>
        {isSelected && (
          <Animated.View
            style={[styles.slotGlow, animatedGlowStyle]}
          />
        )}

        {member ? (
          <TouchableOpacity onPress={onClear} activeOpacity={0.7}>
            <View style={styles.selectedMember}>
              <View style={styles.selectedAvatarWrapper}>
                <Avatar
                  uri={member.avatarUrl}
                  name={member.name}
                  size="large"
                  style={styles.selectedAvatar}
                />
                <View style={styles.clearBadge}>
                  <Ionicons name="close" size={12} color={colors.textPrimary} />
                </View>
              </View>
              <Text style={styles.selectedName} numberOfLines={1}>
                {member.name}
              </Text>
              <RivalryBadge size="small" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySlot}>
            <Ionicons name="person-add-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptySlotText}>Select a rival</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function MemberListItem({
  member,
  isSelected,
  onSelect,
  disabled,
  index,
}: {
  member: SquadMember;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeIn.delay(300 + index * 50).duration(200)}
    >
      <TouchableOpacity
        style={[
          styles.memberItem,
          isSelected && styles.memberItemSelected,
          disabled && styles.memberItemDisabled,
        ]}
        onPress={onSelect}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Avatar uri={member.avatarUrl} name={member.name} size="medium" />
        <Text style={[styles.memberName, disabled && styles.memberNameDisabled]}>
          {member.name}
        </Text>
        {isSelected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={16} color={colors.textPrimary} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function RivalryDeclarationModal({
  visible,
  onClose,
  onDeclare,
  squadMembers,
  currentUserId,
  isLoading = false,
}: RivalryDeclarationModalProps) {
  const [selectedRival1, setSelectedRival1] = useState<SquadMember | null>(null);
  const [selectedRival2, setSelectedRival2] = useState<SquadMember | null>(null);

  // Animation values
  const crownRotation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Filter out current user
  const availableMembers = squadMembers.filter((m) => m.id !== currentUserId);

  // Reset selections when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedRival1(null);
      setSelectedRival2(null);
    } else {
      // Crown animation
      crownRotation.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(5, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const handleSelectMember = useCallback((member: SquadMember) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (selectedRival1?.id === member.id) {
      setSelectedRival1(null);
    } else if (selectedRival2?.id === member.id) {
      setSelectedRival2(null);
    } else if (!selectedRival1) {
      setSelectedRival1(member);
    } else if (!selectedRival2) {
      setSelectedRival2(member);
    }
  }, [selectedRival1, selectedRival2]);

  const handleDeclare = useCallback(() => {
    if (selectedRival1 && selectedRival2) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      onDeclare(selectedRival1.id, selectedRival2.id);
    }
  }, [selectedRival1, selectedRival2, onDeclare]);

  const canDeclare = selectedRival1 && selectedRival2 && !isLoading;

  const animatedCrownStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${crownRotation.value}deg` }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Platform-specific glow for button
  const buttonGlowStyle = canDeclare
    ? Platform.select({
        web: {
          boxShadow: `0 0 20px ${rivalryColors.glow}`,
        } as any,
        default: {
          shadowColor: rivalryColors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 15,
          elevation: 8,
        },
      })
    : {};

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <Animated.View
        style={styles.overlay}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={styles.modalContainer}
            entering={SlideInUp.duration(400).springify()}
          >
            <LinearGradient
              colors={rivalryColors.backgroundGradient}
              style={styles.gradientBackground}
            />

            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Animated.View style={animatedCrownStyle}>
                <Ionicons name="trophy" size={32} color={rivalryColors.crownColor} />
              </Animated.View>
              <Text style={styles.title}>DECLARE A RIVALRY</Text>
              <Text style={styles.subtitle}>
                Select two squad members to compete head-to-head
              </Text>
            </View>

            {/* Selection slots */}
            <View style={styles.slotsRow}>
              <SelectionSlot
                label="RIVAL 1"
                member={selectedRival1}
                onClear={() => setSelectedRival1(null)}
                isSelected={!!selectedRival1}
                index={0}
              />

              <View style={styles.vsCircle}>
                <Ionicons name="flash" size={20} color={rivalryColors.primary} />
              </View>

              <SelectionSlot
                label="RIVAL 2"
                member={selectedRival2}
                onClear={() => setSelectedRival2(null)}
                isSelected={!!selectedRival2}
                index={1}
              />
            </View>

            {/* Member list */}
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>SQUAD MEMBERS</Text>
              <FlatList
                data={availableMembers}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <MemberListItem
                    member={item}
                    isSelected={selectedRival1?.id === item.id || selectedRival2?.id === item.id}
                    onSelect={() => handleSelectMember(item)}
                    disabled={
                      !!(selectedRival1 && selectedRival2) &&
                      selectedRival1.id !== item.id &&
                      selectedRival2.id !== item.id
                    }
                    index={index}
                  />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            </View>

            {/* Declare button */}
            <Animated.View
              style={[styles.buttonContainer, animatedButtonStyle]}
              entering={FadeIn.delay(400).duration(300)}
            >
              <TouchableOpacity
                style={[
                  styles.declareButton,
                  !canDeclare && styles.declareButtonDisabled,
                  canDeclare && buttonGlowStyle,
                ]}
                onPress={handleDeclare}
                disabled={!canDeclare}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                  >
                    <Ionicons name="sync" size={24} color={colors.textPrimary} />
                  </Animated.View>
                ) : (
                  <>
                    <LinearGradient
                      colors={canDeclare ? rivalryColors.gradient : ['#4B5563', '#374151']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                    <View style={styles.buttonContent}>
                      <Ionicons
                        name="flash"
                        size={20}
                        color={canDeclare ? colors.textPrimary : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.declareButtonText,
                          !canDeclare && styles.declareButtonTextDisabled,
                        ]}
                      >
                        DECLARE RIVALRY
                      </Text>
                      <Ionicons
                        name="flash"
                        size={20}
                        color={canDeclare ? colors.textPrimary : colors.textMuted}
                      />
                    </View>
                  </>
                )}
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
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.9,
    overflow: 'hidden',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.xs,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightExtrabold,
    color: rivalryColors.primary,
    letterSpacing: 2,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  slotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  slotContainer: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 140,
  },
  slotLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: rivalryColors.secondary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  slotContent: {
    width: '100%',
    aspectRatio: 0.8,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotContentSelected: {
    borderColor: rivalryColors.primary,
    borderStyle: 'solid',
  },
  slotGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: rivalryColors.primary,
    opacity: 0.1,
  },
  selectedMember: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  selectedAvatarWrapper: {
    position: 'relative',
  },
  selectedAvatar: {
    borderWidth: 3,
    borderColor: rivalryColors.primary,
  },
  clearBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: rivalryColors.primary,
    borderRadius: 999,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedName: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    maxWidth: 100,
    textAlign: 'center',
  },
  emptySlot: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptySlotText: {
    fontSize: typography.sizeXs,
    color: colors.textMuted,
  },
  vsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    minHeight: 200,
  },
  listTitle: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  memberItemSelected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: rivalryColors.primary,
  },
  memberItemDisabled: {
    opacity: 0.4,
  },
  memberName: {
    flex: 1,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    color: colors.textPrimary,
  },
  memberNameDisabled: {
    color: colors.textMuted,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: rivalryColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  declareButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    height: 56,
  },
  declareButtonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  declareButtonText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  declareButtonTextDisabled: {
    color: colors.textMuted,
  },
});
