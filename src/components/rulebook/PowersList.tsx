/**
 * PowersList.tsx
 * List of all powers with category filtering
 * Shows all available powers organized by category
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { PowerCard } from './PowerCard';
import {
  POWER_DEFINITIONS,
  POWER_CATEGORIES,
  PowerCategory,
  PowerDefinition,
} from '../../types/powers';
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

type FilterType = 'all' | PowerCategory;

interface PowersListProps {
  unlockedPowers?: string[];
  searchQuery?: string;
  isRTL?: boolean;
}

export function PowersList({ unlockedPowers = [], searchQuery = '', isRTL = false }: PowersListProps) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const allPowers = Object.values(POWER_DEFINITIONS);
  const categories: FilterType[] = ['all', 'attack', 'defense', 'social', 'special'];

  // Translation keys for categories
  const getCategoryName = (category: PowerCategory | 'all') => {
    if (category === 'all') return t('rulebook.categories.all', 'All');
    return t(`rulebook.categories.${category}`, POWER_CATEGORIES[category].name);
  };

  const getCategoryDescription = (category: PowerCategory) => {
    return t(`rulebook.categories.${category}Desc`, POWER_CATEGORIES[category].description);
  };

  // Filter powers based on search and category
  const filteredPowers = useMemo(() => {
    return allPowers.filter((power) => {
      // Category filter
      if (activeFilter !== 'all' && power.category !== activeFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          power.name.toLowerCase().includes(query) ||
          power.shortDescription.toLowerCase().includes(query) ||
          power.fullDescription.toLowerCase().includes(query) ||
          power.category.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allPowers, activeFilter, searchQuery]);

  // Group powers by category for display
  const groupedPowers = useMemo(() => {
    if (activeFilter !== 'all') {
      return { [activeFilter]: filteredPowers };
    }

    const grouped: Partial<Record<PowerCategory, PowerDefinition[]>> = {};
    filteredPowers.forEach((power) => {
      if (!grouped[power.category]) {
        grouped[power.category] = [];
      }
      grouped[power.category]!.push(power);
    });
    return grouped;
  }, [filteredPowers, activeFilter]);

  const renderCategoryHeader = (category: PowerCategory) => {
    const categoryInfo = POWER_CATEGORIES[category];
    return (
      <View style={[styles.categoryHeader, isRTL && styles.categoryHeaderRTL]}>
        <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }, isRTL && styles.categoryIconRTL]}>
          <MaterialCommunityIcons
            name={categoryInfo.icon as any}
            size={20}
            color={categoryInfo.color}
          />
        </View>
        <View style={styles.categoryHeaderText}>
          <Text style={[styles.categoryTitle, { color: categoryInfo.color }, isRTL && styles.textRTL]}>
            {getCategoryName(category)}
          </Text>
          <Text style={[styles.categoryDescription, isRTL && styles.textRTL]}>{getCategoryDescription(category)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterContainer, isRTL && styles.filterContainerRTL]}
        contentContainerStyle={[styles.filterContent, isRTL && styles.filterContentRTL]}
      >
        {(isRTL ? [...categories].reverse() : categories).map((filter) => {
          const isActive = activeFilter === filter;
          const categoryInfo = filter !== 'all' ? POWER_CATEGORIES[filter] : null;
          const count = filter === 'all'
            ? allPowers.length
            : allPowers.filter(p => p.category === filter).length;

          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.filterTab,
                  isActive && styles.filterTabActive,
                  isActive && categoryInfo && { borderColor: categoryInfo.color },
                  isRTL && styles.filterTabRTL,
                ]}
              >
                {categoryInfo && (
                  <MaterialCommunityIcons
                    name={categoryInfo.icon as any}
                    size={16}
                    color={isActive ? categoryInfo.color : '#6B7280'}
                  />
                )}
                <Text
                  style={[
                    styles.filterTabText,
                    isActive && styles.filterTabTextActive,
                    isActive && categoryInfo && { color: categoryInfo.color },
                  ]}
                >
                  {getCategoryName(filter)}
                </Text>
                <View
                  style={[
                    styles.filterCount,
                    isActive && categoryInfo && { backgroundColor: categoryInfo.color + '30' },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      isActive && categoryInfo && { color: categoryInfo.color },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Powers list */}
      <View style={styles.listContainer}>
        {filteredPowers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify" size={48} color="#4A5568" />
            <Text style={[styles.emptyStateText, isRTL && styles.textRTL]}>{t('rulebook.noPowersFound', 'No powers found')}</Text>
            <Text style={[styles.emptyStateSubtext, isRTL && styles.textRTL]}>
              {t('rulebook.tryAdjusting', 'Try adjusting your search or filter')}
            </Text>
          </View>
        ) : activeFilter === 'all' ? (
          // Grouped view
          Object.entries(groupedPowers).map(([category, powers]) => (
            <View key={category} style={styles.categorySection}>
              {renderCategoryHeader(category as PowerCategory)}
              {powers?.map((power) => (
                <PowerCard
                  key={power.id}
                  power={power}
                  isUnlocked={unlockedPowers.includes(power.id)}
                  isRTL={isRTL}
                />
              ))}
            </View>
          ))
        ) : (
          // Flat view for filtered category
          filteredPowers.map((power) => (
            <PowerCard
              key={power.id}
              power={power}
              isUnlocked={unlockedPowers.includes(power.id)}
              isRTL={isRTL}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: spacing.xs,
  },
  filterTabActive: {
    backgroundColor: THEME.background.medium,
    borderColor: THEME.accent.cyan,
  },
  filterTabText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: THEME.accent.cyan,
  },
  filterCount: {
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: '#6B7280',
  },
  listContainer: {
    paddingHorizontal: spacing.md,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  categoryHeaderText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryDescription: {
    fontSize: typography.sizeXs,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyStateText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    fontSize: typography.sizeSm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  // RTL styles for Hebrew
  filterContainerRTL: {
    transform: [{ scaleX: -1 }],
  },
  filterContentRTL: {
    transform: [{ scaleX: -1 }],
  },
  filterTabRTL: {
    flexDirection: 'row-reverse',
  },
  categoryHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  categoryIconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  textRTL: {
    textAlign: 'right',
  },
});

export default PowersList;
