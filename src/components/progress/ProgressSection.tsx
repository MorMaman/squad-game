/**
 * ProgressSection - Account Progress Container
 * Displays a scrollable list of power-ups and abilities with a header
 *
 * Design: Dark theme section with header, scrollable content
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ViewStyle,
  FlatList,
  ListRenderItem,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PowerUpCard, PowerUpCardProps } from './PowerUpCard';
import { AbilityCard, AbilityCardProps, AbilityStatus } from './AbilityCard';
import { AddCompetitionButton, AddCompetitionButtonProps } from './AddCompetitionButton';

// Section Colors
const SECTION_COLORS = {
  background: '#0A0E27',
  headerGradientStart: '#1A1A2E',
  headerGradientEnd: '#0A0E27',
  lime: '#A3E635',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  divider: '#27272A',
};

export type ProgressItemType = 'powerup' | 'ability';

export interface PowerUpItem extends Omit<PowerUpCardProps, 'onPress'> {
  type: 'powerup';
}

export interface AbilityItem extends Omit<AbilityCardProps, 'onPress' | 'onToggle'> {
  type: 'ability';
}

export type ProgressItem = PowerUpItem | AbilityItem;

export interface ProgressSectionProps {
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** List of power-ups and abilities */
  items: ProgressItem[];
  /** Whether to show the add button */
  showAddButton?: boolean;
  /** Add button configuration */
  addButtonConfig?: Partial<AddCompetitionButtonProps>;
  /** Callback when add button is pressed */
  onAddPress?: () => void;
  /** Callback when a power-up card is pressed */
  onPowerUpPress?: (id: string) => void;
  /** Callback when an ability is toggled */
  onAbilityToggle?: (id: string, equipped: boolean) => void;
  /** Callback when an ability card is pressed */
  onAbilityPress?: (id: string) => void;
  /** Whether the list is refreshing */
  refreshing?: boolean;
  /** Callback when pull-to-refresh is triggered */
  onRefresh?: () => void;
  /** Custom style for the container */
  style?: ViewStyle;
  /** Custom style for the content area */
  contentStyle?: ViewStyle;
  /** Whether to use FlatList for performance (recommended for long lists) */
  useFlatList?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Empty state component */
  emptyComponent?: React.ReactNode;
  /** Header icon */
  headerIcon?: keyof typeof Ionicons.glyphMap;
  /** Custom accent color */
  accentColor?: string;
  /** Whether to animate items on mount */
  animateItems?: boolean;
}

export function ProgressSection({
  title = 'Account Progress',
  subtitle,
  items,
  showAddButton = true,
  addButtonConfig,
  onAddPress,
  onPowerUpPress,
  onAbilityToggle,
  onAbilityPress,
  refreshing = false,
  onRefresh,
  style,
  contentStyle,
  useFlatList = false,
  loading = false,
  emptyComponent,
  headerIcon = 'rocket-outline',
  accentColor = SECTION_COLORS.lime,
  animateItems = true,
}: ProgressSectionProps) {
  const renderPowerUp = useCallback(
    (item: PowerUpItem, index: number) => (
      <Animated.View
        key={item.id}
        entering={animateItems ? FadeInDown.delay(index * 100).springify() : undefined}
        layout={Layout.springify()}
      >
        <PowerUpCard
          {...item}
          onPress={onPowerUpPress ? () => onPowerUpPress(item.id) : undefined}
          style={styles.itemCard}
        />
      </Animated.View>
    ),
    [onPowerUpPress, animateItems]
  );

  const renderAbility = useCallback(
    (item: AbilityItem, index: number) => (
      <Animated.View
        key={item.id}
        entering={animateItems ? FadeInDown.delay(index * 100).springify() : undefined}
        layout={Layout.springify()}
      >
        <AbilityCard
          {...item}
          onToggle={
            onAbilityToggle
              ? (equipped) => onAbilityToggle(item.id, equipped)
              : undefined
          }
          onPress={onAbilityPress ? () => onAbilityPress(item.id) : undefined}
          style={styles.itemCard}
        />
      </Animated.View>
    ),
    [onAbilityToggle, onAbilityPress, animateItems]
  );

  const renderItem = useCallback(
    (item: ProgressItem, index: number) => {
      if (item.type === 'powerup') {
        return renderPowerUp(item, index);
      }
      return renderAbility(item, index);
    },
    [renderPowerUp, renderAbility]
  );

  const renderFlatListItem: ListRenderItem<ProgressItem> = useCallback(
    ({ item, index }) => renderItem(item, index),
    [renderItem]
  );

  const keyExtractor = useCallback((item: ProgressItem) => item.id, []);

  const renderHeader = () => (
    <Animated.View entering={FadeInUp.springify()}>
      <LinearGradient
        colors={[SECTION_COLORS.headerGradientStart, SECTION_COLORS.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: accentColor + '20' }]}>
            <Ionicons name={headerIcon} size={24} color={accentColor} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.headerBadge}>
            <Text style={[styles.headerBadgeText, { color: accentColor }]}>
              {items.length}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderEmpty = () => {
    if (emptyComponent) {
      return emptyComponent;
    }

    return (
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={styles.emptyContainer}
      >
        <Ionicons name="cube-outline" size={48} color={SECTION_COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No Items Yet</Text>
        <Text style={styles.emptySubtitle}>
          Complete challenges to unlock power-ups and abilities
        </Text>
      </Animated.View>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Animated.View
          key={i}
          entering={FadeInDown.delay(i * 100).springify()}
          style={styles.skeletonCard}
        >
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonDescription} />
            <View style={styles.skeletonProgress} />
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderFooter = () => {
    if (!showAddButton || !onAddPress) return null;

    return (
      <Animated.View
        entering={FadeInDown.delay(items.length * 100 + 100).springify()}
        style={styles.addButtonContainer}
      >
        <AddCompetitionButton
          onPress={onAddPress}
          accentColor={accentColor}
          {...addButtonConfig}
        />
      </Animated.View>
    );
  };

  if (useFlatList) {
    return (
      <View style={[styles.container, style]}>
        <FlatList
          data={items}
          renderItem={renderFlatListItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={loading ? renderLoading : renderEmpty}
          contentContainerStyle={[styles.flatListContent, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={accentColor}
                colors={[accentColor]}
              />
            ) : undefined
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accentColor}
              colors={[accentColor]}
            />
          ) : undefined
        }
      >
        {renderHeader()}

        <View style={styles.itemsContainer}>
          {loading ? (
            renderLoading()
          ) : items.length === 0 ? (
            renderEmpty()
          ) : (
            items.map((item, index) => renderItem(item, index))
          )}
        </View>

        {renderFooter()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SECTION_COLORS.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  flatListContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: SECTION_COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: SECTION_COLORS.textSecondary,
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: SECTION_COLORS.lime + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  itemCard: {
    marginBottom: 0,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: SECTION_COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: SECTION_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    gap: 12,
  },
  skeletonCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: SECTION_COLORS.headerGradientStart,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SECTION_COLORS.divider,
  },
  skeletonIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: SECTION_COLORS.divider,
    marginRight: 14,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  skeletonTitle: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    backgroundColor: SECTION_COLORS.divider,
  },
  skeletonDescription: {
    width: '90%',
    height: 12,
    borderRadius: 4,
    backgroundColor: SECTION_COLORS.divider,
  },
  skeletonProgress: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: SECTION_COLORS.divider,
    marginTop: 4,
  },
});

export default ProgressSection;
