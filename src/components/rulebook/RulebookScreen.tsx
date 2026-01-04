/**
 * RulebookScreen.tsx
 * Main layout for the Squad Rulebook screen
 * Contains tabs for Powers, Rules, and History
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
  I18nManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PowersList } from './PowersList';
import { RulesSection } from './RulesSection';
import { PowerHistoryLog } from './PowerHistoryLog';
import { colors, spacing, borderRadius, typography } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

type TabType = 'powers' | 'rules' | 'history';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'powers', label: 'Powers', icon: 'lightning-bolt' },
  { id: 'rules', label: 'Rules', icon: 'book-open-page-variant' },
  { id: 'history', label: 'History', icon: 'history' },
];

interface RulebookScreenProps {
  onBack?: () => void;
  unlockedPowers?: string[];
}

export function RulebookScreen({ onBack, unlockedPowers = [] }: RulebookScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState<TabType>('powers');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // RTL detection for Hebrew
  const isRTL = i18n.language === 'he';

  // Translated tab labels
  const tabLabels: Record<TabType, string> = {
    powers: t('rulebook.tabs.powers', 'Powers'),
    rules: t('rulebook.tabs.rules', 'Rules'),
    history: t('rulebook.tabs.history', 'History'),
  };

  const tabIndicatorPosition = useSharedValue(0);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleTabPress = (tab: TabType, index: number) => {
    tabIndicatorPosition.value = withSpring(index);
    setActiveTab(tab);
  };

  const tabIndicatorStyle = useAnimatedStyle(() => {
    const tabWidth = (SCREEN_WIDTH - spacing.md * 2) / TABS.length;
    // For RTL, calculate position from the right side
    const position = isRTL
      ? (TABS.length - 1 - tabIndicatorPosition.value) * tabWidth
      : tabIndicatorPosition.value * tabWidth;
    return {
      transform: [{ translateX: position }],
      width: tabWidth,
    };
  });

  const handleEventPress = (eventId: string) => {
    // Navigate to event details/archive
    console.log('Navigate to event:', eventId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'powers':
        return <PowersList unlockedPowers={unlockedPowers} searchQuery={searchQuery} isRTL={isRTL} />;
      case 'rules':
        return <RulesSection isRTL={isRTL} />;
      case 'history':
        return <PowerHistoryLog onEventPress={handleEventPress} isRTL={isRTL} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialCommunityIcons name={isRTL ? "arrow-right" : "arrow-left"} size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.headerTitleContainer, isRTL && styles.headerTitleContainerRTL]}>
          <MaterialCommunityIcons name="book-open-variant" size={24} color={THEME.accent.lime} />
          <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t('rulebook.header', 'Squad Rulebook')}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Disclaimer banner */}
      <View style={styles.disclaimerContainer}>
        <LinearGradient
          colors={[THEME.accent.lime + '15', THEME.accent.cyan + '15']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.disclaimerGradient, isRTL && styles.disclaimerGradientRTL]}
        >
          <MaterialCommunityIcons name="heart-outline" size={18} color={THEME.accent.lime} />
          <Text style={[styles.disclaimerText, isRTL && styles.textRTL]}>
            {t('rulebook.disclaimer', 'This is a game between friends. Play fair, have fun!')}
          </Text>
        </LinearGradient>
      </View>

      {/* Search bar - only show on Powers tab */}
      {activeTab === 'powers' && (
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchInputContainer,
              isSearchFocused && styles.searchInputContainerFocused,
              isRTL && styles.searchInputContainerRTL,
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={isSearchFocused ? THEME.accent.cyan : '#6B7280'}
            />
            <TextInput
              style={[styles.searchInput, isRTL && styles.searchInputRTL]}
              placeholder={t('rulebook.searchPowers', 'Search powers...')}
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              textAlign={isRTL ? 'right' : 'left'}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabContainer}>
        <View style={[styles.tabBar, isRTL && styles.tabBarRTL]}>
          <Animated.View style={[styles.tabIndicator, tabIndicatorStyle]}>
            <LinearGradient
              colors={[THEME.accent.lime, THEME.accent.cyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabIndicatorGradient}
            />
          </Animated.View>
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isRTL && styles.tabRTL]}
              onPress={() => handleTabPress(tab.id, index)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.id ? colors.textPrimary : '#6B7280'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tabLabels[tab.id]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: THEME.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  disclaimerContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  disclaimerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.2)',
  },
  disclaimerText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 0,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInputContainerFocused: {
    borderColor: THEME.accent.cyan,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  tabContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.background.medium,
    borderRadius: borderRadius.lg,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  tabIndicatorGradient: {
    flex: 1,
    opacity: 0.2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    zIndex: 1,
  },
  tabText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: '#6B7280',
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  // RTL styles for Hebrew
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerTitleContainerRTL: {
    flexDirection: 'row-reverse',
  },
  textRTL: {
    textAlign: 'right',
  },
  disclaimerGradientRTL: {
    flexDirection: 'row-reverse',
  },
  searchInputContainerRTL: {
    flexDirection: 'row-reverse',
  },
  searchInputRTL: {
    textAlign: 'right',
  },
  tabBarRTL: {
    flexDirection: 'row-reverse',
  },
  tabIndicatorRTL: {
    left: undefined,
    right: 4,
  },
  tabRTL: {
    flexDirection: 'row-reverse',
  },
});

export default RulebookScreen;
