/**
 * PowerHistoryLog.tsx
 * History tab content showing power activations per event
 * Displays who activated powers, who was affected, and outcomes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { POWER_DEFINITIONS, POWER_CATEGORIES, PowerHistoryEntry } from '../../types/powers';
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

// Mock data for demonstration
const MOCK_HISTORY: PowerHistoryEntry[] = [
  {
    id: '1',
    power_type: 'chaos_card',
    event_id: 'event_001',
    event_name: 'Memory Match Challenge',
    activated_by: {
      id: 'user_1',
      display_name: 'Alex',
    },
    affected_users: [
      { id: 'user_2', display_name: 'Jordan' },
      { id: 'user_3', display_name: 'Sam' },
      { id: 'user_4', display_name: 'Taylor' },
    ],
    activated_at: new Date(Date.now() - 3600000).toISOString(),
    expired_at: new Date(Date.now() - 1800000).toISOString(),
    duration_minutes: 30,
    outcome: 'Reversed scores - lowest became highest!',
  },
  {
    id: '2',
    power_type: 'target_lock',
    event_id: 'event_002',
    event_name: 'Quick Math Blitz',
    activated_by: {
      id: 'user_2',
      display_name: 'Jordan',
    },
    affected_users: [{ id: 'user_1', display_name: 'Alex' }],
    activated_at: new Date(Date.now() - 86400000).toISOString(),
    expired_at: new Date(Date.now() - 82800000).toISOString(),
    duration_minutes: 60,
    outcome: 'Jordan beat Alex! +50 XP stolen',
  },
  {
    id: '3',
    power_type: 'double_chance',
    event_id: 'event_003',
    event_name: 'Color Match Frenzy',
    activated_by: {
      id: 'user_3',
      display_name: 'Sam',
    },
    affected_users: [],
    activated_at: new Date(Date.now() - 172800000).toISOString(),
    expired_at: new Date(Date.now() - 169200000).toISOString(),
    duration_minutes: 60,
    outcome: 'Second attempt scored higher!',
  },
  {
    id: '4',
    power_type: 'streak_shield',
    event_id: 'event_004',
    event_name: 'Simon Says Showdown',
    activated_by: {
      id: 'user_4',
      display_name: 'Taylor',
    },
    affected_users: [],
    activated_at: new Date(Date.now() - 259200000).toISOString(),
    expired_at: new Date(Date.now() - 259200000).toISOString(),
    duration_minutes: 0,
    outcome: '7-day streak protected!',
  },
];

interface PowerHistoryLogProps {
  history?: PowerHistoryEntry[];
  onEventPress?: (eventId: string) => void;
  isRTL?: boolean;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

interface HistoryCardProps {
  entry: PowerHistoryEntry;
  onEventPress?: (eventId: string) => void;
  isRTL?: boolean;
}

function HistoryCard({ entry, onEventPress, isRTL = false }: HistoryCardProps) {
  const powerDef = POWER_DEFINITIONS[entry.power_type];
  const categoryInfo = POWER_CATEGORIES[powerDef.category];

  const glowStyle = Platform.select({
    web: {
      boxShadow: `0 0 10px ${categoryInfo.color}30`,
    } as any,
    default: {
      shadowColor: categoryInfo.color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.historyCard, glowStyle]}
      activeOpacity={0.8}
      onPress={() => onEventPress?.(entry.event_id)}
    >
      {/* Header with power icon and time */}
      <View style={[styles.cardHeader, isRTL && styles.cardHeaderRTL]}>
        <View style={[styles.powerIcon, { backgroundColor: categoryInfo.color + '20' }, isRTL && styles.powerIconRTL]}>
          <MaterialCommunityIcons
            name={powerDef.icon as any}
            size={24}
            color={categoryInfo.color}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.powerName, { color: categoryInfo.color }, isRTL && styles.textRTL]}>
            {powerDef.name}
          </Text>
          <Text style={[styles.eventName, isRTL && styles.textRTL]}>{entry.event_name}</Text>
        </View>
        <View style={[styles.timeContainer, isRTL && styles.timeContainerRTL]}>
          <MaterialCommunityIcons name="clock-outline" size={12} color="#6B7280" />
          <Text style={styles.timeText}>{formatTimeAgo(entry.activated_at)}</Text>
        </View>
      </View>

      {/* Activation info */}
      <View style={[styles.activationRow, isRTL && styles.activationRowRTL]}>
        <View style={[styles.userBadge, isRTL && styles.userBadgeRTL]}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {entry.activated_by.display_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{entry.activated_by.display_name}</Text>
        </View>
        <MaterialCommunityIcons name={isRTL ? "arrow-left" : "arrow-right"} size={16} color="#6B7280" />
        {entry.affected_users.length > 0 ? (
          <View style={[styles.affectedUsers, isRTL && styles.affectedUsersRTL]}>
            {entry.affected_users.slice(0, 3).map((user, index) => (
              <View
                key={user.id}
                style={[
                  styles.affectedAvatar,
                  { marginLeft: index > 0 && !isRTL ? -8 : 0, marginRight: index > 0 && isRTL ? -8 : 0, zIndex: 3 - index },
                ]}
              >
                <Text style={styles.avatarText}>
                  {user.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
            {entry.affected_users.length > 3 && (
              <Text style={styles.moreUsers}>
                +{entry.affected_users.length - 3}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.selfEffect}>Self</Text>
        )}
      </View>

      {/* Outcome */}
      {entry.outcome && (
        <View style={styles.outcomeContainer}>
          <LinearGradient
            colors={[categoryInfo.color + '20', 'transparent']}
            start={{ x: isRTL ? 1 : 0, y: 0 }}
            end={{ x: isRTL ? 0 : 1, y: 0 }}
            style={[styles.outcomeGradient, isRTL && styles.outcomeGradientRTL]}
          >
            <MaterialCommunityIcons name="check-circle" size={14} color={categoryInfo.color} />
            <Text style={[styles.outcomeText, isRTL && styles.textRTL]}>{entry.outcome}</Text>
          </LinearGradient>
        </View>
      )}

      {/* Duration badge */}
      <View style={[styles.durationBadge, isRTL && styles.durationBadgeRTL]}>
        <MaterialCommunityIcons name="timer-outline" size={12} color="#6B7280" />
        <Text style={styles.durationText}>
          {entry.duration_minutes > 0 ? `${entry.duration_minutes}min` : 'Instant'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function PowerHistoryLog({ history = MOCK_HISTORY, onEventPress, isRTL = false }: PowerHistoryLogProps) {
  const [filter, setFilter] = useState<'all' | 'by_me' | 'affected_me'>('all');

  const isEmpty = history.length === 0;

  // Filter labels with RTL-aware text
  const filterLabels = {
    all: isRTL ? 'הכל' : 'All',
    by_me: isRTL ? 'על ידי' : 'By Me',
    affected_me: isRTL ? 'השפיעו עליי' : 'Affected Me',
  };

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={[styles.filterRow, isRTL && styles.filterRowRTL]}>
        {(isRTL ? (['affected_me', 'by_me', 'all'] as const) : (['all', 'by_me', 'affected_me'] as const)).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {filterLabels[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History list */}
      {isEmpty ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="history" size={64} color="#4A5568" />
          <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>
            {isRTL ? 'אין היסטוריית כוחות עדיין' : 'No Power History Yet'}
          </Text>
          <Text style={[styles.emptySubtitle, isRTL && styles.textRTL]}>
            {isRTL ? 'הפעלות כוחות יופיעו כאן כשאתה והסקווד שלך תשתמשו בהם' : 'Power activations will appear here as you and your squad use them'}
          </Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {history.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} onEventPress={onEventPress} isRTL={isRTL} />
          ))}

          {/* Link to full archive */}
          <TouchableOpacity style={[styles.archiveLink, isRTL && styles.archiveLinkRTL]}>
            <MaterialCommunityIcons name="archive" size={20} color={THEME.accent.cyan} />
            <Text style={styles.archiveLinkText}>
              {isRTL ? 'צפה בארכיון המלא' : 'View Full Event Archive'}
            </Text>
            <MaterialCommunityIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={THEME.accent.cyan} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: THEME.background.medium,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  filterTabActive: {
    backgroundColor: THEME.background.card,
  },
  filterText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: '#6B7280',
  },
  filterTextActive: {
    color: colors.textPrimary,
  },
  historyList: {
    gap: spacing.md,
  },
  historyCard: {
    backgroundColor: THEME.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  powerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  powerName: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
  },
  eventName: {
    fontSize: typography.sizeXs,
    color: colors.textMuted,
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: typography.sizeXs,
    color: '#6B7280',
  },
  activationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: spacing.sm,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.accent.cyan + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: THEME.accent.cyan,
  },
  userName: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.textPrimary,
  },
  affectedUsers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  affectedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B00' + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.background.card,
  },
  moreUsers: {
    fontSize: typography.sizeXs,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  selfEffect: {
    fontSize: typography.sizeSm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  outcomeContainer: {
    marginTop: spacing.sm,
  },
  outcomeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  outcomeText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    flex: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    gap: 4,
  },
  durationText: {
    fontSize: typography.sizeXs,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizeSm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  archiveLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  archiveLinkText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: THEME.accent.cyan,
  },
  // RTL styles for Hebrew
  filterRowRTL: {
    flexDirection: 'row-reverse',
  },
  cardHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  powerIconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  timeContainerRTL: {
    flexDirection: 'row-reverse',
  },
  activationRowRTL: {
    flexDirection: 'row-reverse',
  },
  userBadgeRTL: {
    flexDirection: 'row-reverse',
  },
  affectedUsersRTL: {
    flexDirection: 'row-reverse',
  },
  outcomeGradientRTL: {
    flexDirection: 'row-reverse',
  },
  durationBadgeRTL: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-end',
  },
  archiveLinkRTL: {
    flexDirection: 'row-reverse',
  },
  textRTL: {
    textAlign: 'right',
  },
});

export default PowerHistoryLog;
