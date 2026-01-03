/**
 * HeadlineInputModal.tsx
 * Modal for crown holder to set their headline
 * Features golden theme, character counter, and template suggestions
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme/colors';

// Crown color constants
const CROWN_COLORS = {
  gold: '#FFD700',
  goldDark: '#FFA500',
  goldLight: '#FFEC8B',
  gradientStart: '#FFD700',
  gradientMid: '#FFA500',
  gradientEnd: '#FF8C00',
  glow: 'rgba(255, 215, 0, 0.4)',
  background: 'rgba(255, 215, 0, 0.1)',
} as const;

// Suggested headline templates
const HEADLINE_TEMPLATES = [
  { emoji: '', text: 'Bow down!' },
  { emoji: '', text: 'The champ is here!' },
  { emoji: '', text: 'Easy win' },
  { emoji: '', text: "Who's next?" },
  { emoji: '', text: 'Fear me!' },
  { emoji: '', text: 'Unstoppable!' },
] as const;

const MAX_HEADLINE_LENGTH = 50;

export interface HeadlineInputModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed/cancelled */
  onClose: () => void;
  /** Callback when headline is submitted */
  onSubmit: (headline: string) => void;
  /** Whether submission is in progress */
  isLoading?: boolean;
}

/**
 * HeadlineInputModal - Modal for crown holder to set their squad headline
 * Displays for 24 hours to everyone in the squad
 */
export function HeadlineInputModal({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}: HeadlineInputModalProps) {
  const [headline, setHeadline] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const crownScale = useSharedValue(1);
  const glowPulse = useSharedValue(0);
  const inputGlow = useSharedValue(0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setHeadline('');
      setIsFocused(false);
    }
  }, [visible]);

  // Initialize animations
  useEffect(() => {
    if (!visible) return;

    // Crown pulse animation
    crownScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [visible]);

  // Handle input focus animation
  useEffect(() => {
    inputGlow.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  // Handle headline change with max length
  const handleHeadlineChange = useCallback((text: string) => {
    if (text.length <= MAX_HEADLINE_LENGTH) {
      setHeadline(text);
    }
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: typeof HEADLINE_TEMPLATES[number]) => {
    const newHeadline = `${template.emoji} ${template.text}`.trim();
    if (newHeadline.length <= MAX_HEADLINE_LENGTH) {
      setHeadline(newHeadline);
    }
  }, []);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (headline.trim().length > 0 && !isLoading) {
      onSubmit(headline.trim());
    }
  }, [headline, isLoading, onSubmit]);

  // Animated styles
  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowPulse.value, [0.5, 1], [0.3, 0.7]);
    return { opacity };
  });

  const inputContainerStyle = useAnimatedStyle(() => {
    const borderColor = inputGlow.value === 1 ? CROWN_COLORS.gold : colors.border;
    const shadowOpacity = interpolate(inputGlow.value, [0, 1], [0, 0.5]);
    return {
      borderColor,
      shadowOpacity,
    };
  });

  // Character count styling
  const remainingChars = MAX_HEADLINE_LENGTH - headline.length;
  const isNearLimit = remainingChars <= 10;
  const isAtLimit = remainingChars === 0;

  const canSubmit = headline.trim().length > 0 && !isLoading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Backdrop */}
        <Animated.View
          style={styles.backdrop}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <Pressable style={styles.backdropPress} onPress={onClose} />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={styles.modalContainer}
          entering={SlideInDown.duration(400).springify()}
          exiting={SlideOutDown.duration(300)}
        >
          {/* Golden gradient header */}
          <LinearGradient
            colors={[CROWN_COLORS.gradientStart, CROWN_COLORS.gradientMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Animated.View style={glowStyle}>
              <View style={styles.glowBackground} />
            </Animated.View>

            {/* Crown Icon */}
            <Animated.View style={[styles.crownContainer, crownStyle]}>
              <View style={styles.crownCircle}>
                <Ionicons name="ribbon" size={32} color={CROWN_COLORS.gold} />
              </View>
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>SET YOUR HEADLINE</Text>
            <Text style={styles.subtitle}>
              Everyone in your squad will see this for 24 hours
            </Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {/* Input Field */}
            <Animated.View
              style={[
                styles.inputContainer,
                inputContainerStyle,
                Platform.select({
                  web: {
                    boxShadow: isFocused ? `0 0 15px ${CROWN_COLORS.glow}` : 'none',
                  } as any,
                  default: {
                    shadowColor: CROWN_COLORS.gold,
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: 10,
                  },
                }),
              ]}
            >
              <TextInput
                style={styles.input}
                value={headline}
                onChangeText={handleHeadlineChange}
                placeholder="Your victory headline..."
                placeholderTextColor={colors.textMuted}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                multiline
                maxLength={MAX_HEADLINE_LENGTH}
                autoFocus
              />
            </Animated.View>

            {/* Character Counter */}
            <View style={styles.counterContainer}>
              <Text
                style={[
                  styles.counter,
                  isNearLimit && styles.counterWarning,
                  isAtLimit && styles.counterLimit,
                ]}
              >
                {headline.length}/{MAX_HEADLINE_LENGTH}
              </Text>
            </View>

            {/* Template Suggestions */}
            <View style={styles.templatesSection}>
              <Text style={styles.templatesLabel}>Quick picks:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templatesScroll}
              >
                {HEADLINE_TEMPLATES.map((template, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.templateButton}
                    onPress={() => handleTemplateSelect(template)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.templateText}>
                      {template.emoji} {template.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !canSubmit && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!canSubmit}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={canSubmit
                    ? [CROWN_COLORS.gradientStart, CROWN_COLORS.gradientEnd]
                    : [colors.textMuted, colors.textMuted]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="ribbon" size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>POST HEADLINE</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdropPress: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  header: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  crownContainer: {
    marginBottom: spacing.md,
  },
  crownCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  title: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightExtrabold,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizeSm,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  inputContainer: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  input: {
    fontSize: typography.sizeLg,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  counterContainer: {
    alignItems: 'flex-end',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  counter: {
    fontSize: typography.sizeXs,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  counterWarning: {
    color: CROWN_COLORS.goldDark,
  },
  counterLimit: {
    color: colors.error,
  },
  templatesSection: {
    marginBottom: spacing.lg,
  },
  templatesLabel: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  templatesScroll: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  templateButton: {
    backgroundColor: CROWN_COLORS.background,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: CROWN_COLORS.goldDark,
  },
  templateText: {
    fontSize: typography.sizeSm,
    color: CROWN_COLORS.gold,
    fontWeight: typography.weightMedium,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  submitButtonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

export { HEADLINE_TEMPLATES, MAX_HEADLINE_LENGTH };
export default HeadlineInputModal;
