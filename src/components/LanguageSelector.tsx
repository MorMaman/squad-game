/**
 * LanguageSelector Component
 * A beautiful toggle/dropdown to switch between English and Hebrew
 * Matches the game's dark theme with gradients and animations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
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
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../store/languageStore';
import { SupportedLanguage, supportedLanguages } from '../lib/i18n';

// Game color palette
const COLORS = {
  DARK_NAVY: '#0A0E27',
  DEEP_PURPLE: '#1A1A2E',
  MIDNIGHT_BLUE: '#16213E',
  ELECTRIC_PURPLE: '#9B59FF',
  ELECTRIC_CYAN: '#00D4FF',
  GAME_ORANGE: '#FF6B00',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A78BFA',
  TEXT_MUTED: '#6B7280',
  BORDER: '#374151',
};

// Language configuration with flags
const LANGUAGE_CONFIG: Record<SupportedLanguage, { flag: string; name: string; nativeName: string }> = {
  en: {
    flag: '\uD83C\uDDFA\uD83C\uDDF8',
    name: 'English',
    nativeName: 'English',
  },
  he: {
    flag: '\uD83C\uDDEE\uD83C\uDDF1',
    name: 'Hebrew',
    nativeName: '\u05E2\u05D1\u05E8\u05D9\u05EA',
  },
};

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function LanguageSelector({ variant = 'full' }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const { language, isRTL, setLanguage } = useLanguageStore();
  const [showModal, setShowModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<SupportedLanguage | null>(null);

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleLanguageSelect = async (selectedLanguage: SupportedLanguage) => {
    if (selectedLanguage === language) {
      setShowModal(false);
      return;
    }

    // Check if RTL change requires restart
    const newIsRTL = selectedLanguage === 'he';
    const currentIsRTL = isRTL;

    if (newIsRTL !== currentIsRTL && Platform.OS !== 'web') {
      setPendingLanguage(selectedLanguage);
      // Show restart prompt
      Alert.alert(
        t('settings.language'),
        selectedLanguage === 'he'
          ? 'Changing to Hebrew requires app restart for RTL layout.\n\nשינוי לעברית דורש הפעלה מחדש של האפליקציה לתצוגת RTL.'
          : 'Changing to English requires app restart for LTR layout.',
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
            onPress: () => {
              setPendingLanguage(null);
              setShowModal(false);
            },
          },
          {
            text: t('common.confirm'),
            style: 'default',
            onPress: async () => {
              await setLanguage(selectedLanguage);
              setPendingLanguage(null);
              setShowModal(false);
            },
          },
        ]
      );
    } else {
      await setLanguage(selectedLanguage);
      setShowModal(false);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const currentConfig = LANGUAGE_CONFIG[language];

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View style={[styles.compactSelector, buttonStyle]}>
          <Text style={styles.compactFlag}>{currentConfig.flag}</Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.TEXT_MUTED} />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View style={[styles.selector, buttonStyle]}>
          <View style={styles.selectorLeft}>
            <View style={styles.flagContainer}>
              <Text style={styles.flag}>{currentConfig.flag}</Text>
            </View>
            <View style={styles.languageInfo}>
              <Text style={styles.languageName}>{currentConfig.nativeName}</Text>
              <Text style={styles.languageSubtext}>
                {language === 'he' ? 'Hebrew' : 'English'}
              </Text>
            </View>
          </View>
          <View style={styles.selectorRight}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_MUTED} />
          </View>
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Animated.View
            entering={SlideInDown.springify().damping(15)}
            exiting={SlideOutDown.springify().damping(15)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <LinearGradient
                colors={[COLORS.DEEP_PURPLE, COLORS.DARK_NAVY]}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('settings.language')}</Text>
                  <Text style={styles.modalTitleHebrew}>/ \u05E9\u05E4\u05D4</Text>
                </View>

                <View style={styles.languageOptions}>
                  {(Object.keys(LANGUAGE_CONFIG) as SupportedLanguage[]).map((lang) => {
                    const config = LANGUAGE_CONFIG[lang];
                    const isSelected = language === lang;
                    const isPending = pendingLanguage === lang;

                    return (
                      <LanguageOption
                        key={lang}
                        flag={config.flag}
                        name={config.name}
                        nativeName={config.nativeName}
                        isSelected={isSelected}
                        isPending={isPending}
                        onPress={() => handleLanguageSelect(lang)}
                      />
                    );
                  })}
                </View>

                <View style={styles.modalFooter}>
                  <Text style={styles.footerNote}>
                    {language === 'he'
                      ? '\u05E9\u05D9\u05E0\u05D5\u05D9 \u05E9\u05E4\u05D4 \u05D9\u05D7\u05D9\u05DC \u05DC\u05D0\u05D7\u05E8 \u05D4\u05E4\u05E2\u05DC\u05D4 \u05DE\u05D7\u05D3\u05E9'
                      : 'Language change will apply after restart'}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

interface LanguageOptionProps {
  flag: string;
  name: string;
  nativeName: string;
  isSelected: boolean;
  isPending: boolean;
  onPress: () => void;
}

function LanguageOption({ flag, name, nativeName, isSelected, isPending, onPress }: LanguageOptionProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const optionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.languageOption,
          isSelected && styles.languageOptionSelected,
          optionStyle,
        ]}
      >
        {isSelected && (
          <LinearGradient
            colors={[COLORS.ELECTRIC_PURPLE, COLORS.ELECTRIC_CYAN]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.selectedGradient}
          />
        )}
        <View style={styles.optionContent}>
          <View style={styles.optionLeft}>
            <View style={[styles.optionFlagContainer, isSelected && styles.optionFlagContainerSelected]}>
              <Text style={styles.optionFlag}>{flag}</Text>
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionNativeName, isSelected && styles.optionTextSelected]}>
                {nativeName}
              </Text>
              <Text style={[styles.optionName, isSelected && styles.optionSubtextSelected]}>
                {name}
              </Text>
            </View>
          </View>
          <View style={styles.optionRight}>
            {isPending ? (
              <View style={styles.pendingIndicator}>
                <Ionicons name="time" size={20} color={COLORS.GAME_ORANGE} />
              </View>
            ) : isSelected ? (
              <View style={styles.checkContainer}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.ELECTRIC_CYAN} />
              </View>
            ) : (
              <View style={styles.emptyCheck} />
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact variant
  compactSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  compactFlag: {
    fontSize: 18,
  },

  // Full variant
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.DEEP_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    fontSize: 24,
  },
  languageInfo: {
    gap: 2,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  languageSubtext: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  selectorRight: {
    opacity: 0.7,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  modalTitleHebrew: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },

  // Language options
  languageOptions: {
    gap: 12,
  },
  languageOption: {
    position: 'relative',
    borderRadius: 16,
    backgroundColor: COLORS.MIDNIGHT_BLUE,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  languageOptionSelected: {
    borderColor: COLORS.ELECTRIC_PURPLE,
  },
  selectedGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionFlagContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.DEEP_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionFlagContainerSelected: {
    backgroundColor: 'rgba(155, 89, 255, 0.2)',
  },
  optionFlag: {
    fontSize: 28,
  },
  optionTextContainer: {
    gap: 2,
  },
  optionNativeName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  optionName: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
  },
  optionTextSelected: {
    color: COLORS.TEXT_PRIMARY,
  },
  optionSubtextSelected: {
    color: COLORS.TEXT_SECONDARY,
  },
  optionRight: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  pendingIndicator: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  modalFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
  },
});

export default LanguageSelector;
