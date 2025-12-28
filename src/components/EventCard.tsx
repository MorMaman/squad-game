import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { CountdownTimer } from './CountdownTimer';
import { TodayEventState, EventType } from '../types';

interface EventCardProps {
  eventState: TodayEventState;
  onParticipate: () => void;
  onViewResults: () => void;
}

const EVENT_ICONS: Record<EventType, string> = {
  LIVE_SELFIE: 'camera',
  PRESSURE_TAP: 'finger-print',
  POLL: 'bar-chart',
};

const EVENT_TITLES: Record<EventType, string> = {
  LIVE_SELFIE: 'Live Selfie',
  PRESSURE_TAP: 'Pressure Tap',
  POLL: 'Daily Poll',
};

const EVENT_DESCRIPTIONS: Record<EventType, string> = {
  LIVE_SELFIE: 'Capture a live selfie with your squad',
  PRESSURE_TAP: 'Test your reflexes - tap at exactly 0.00',
  POLL: 'Vote on today\'s question',
};

export function EventCard({
  eventState,
  onParticipate,
  onViewResults,
}: EventCardProps) {
  const { event, status, timeUntilClose, submissionCount, mySubmission } = eventState;

  if (!event) {
    return (
      <Card style={styles.card}>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyTitle}>No event scheduled</Text>
          <Text style={styles.emptySubtitle}>Check back later for today's event</Text>
        </View>
      </Card>
    );
  }

  const icon = EVENT_ICONS[event.event_type];
  const title = EVENT_TITLES[event.event_type];
  const description = EVENT_DESCRIPTIONS[event.event_type];

  const renderContent = () => {
    switch (status) {
      case 'not_opened':
        return (
          <>
            <View style={styles.statusBadge}>
              <Ionicons name="time-outline" size={16} color="#fbbf24" />
              <Text style={styles.statusText}>Opens soon</Text>
            </View>
            <Text style={styles.countdown}>Event opens at</Text>
            <Text style={styles.openTime}>
              {new Date(event.opens_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </>
        );

      case 'open':
        return (
          <>
            <View style={[styles.statusBadge, styles.statusOpen]}>
              <View style={styles.liveDot} />
              <Text style={[styles.statusText, styles.statusOpenText]}>LIVE</Text>
            </View>
            <Text style={styles.countdown}>Time remaining</Text>
            <CountdownTimer
              targetTime={new Date(event.closes_at)}
              size="medium"
              showMilliseconds
            />
            <Text style={styles.submissionCount}>
              {submissionCount} already submitted
            </Text>
            <TouchableOpacity style={styles.participateButton} onPress={onParticipate}>
              <Text style={styles.participateText}>Participate Now</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        );

      case 'submitted':
        return (
          <>
            <View style={[styles.statusBadge, styles.statusSubmitted]}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={[styles.statusText, styles.statusSubmittedText]}>Submitted</Text>
            </View>
            {timeUntilClose && timeUntilClose > 0 ? (
              <>
                <Text style={styles.countdown}>Event closes in</Text>
                <CountdownTimer
                  targetTime={new Date(event.closes_at)}
                  size="small"
                />
                <Text style={styles.waitingText}>
                  Waiting for others... ({submissionCount} submitted)
                </Text>
              </>
            ) : (
              <TouchableOpacity style={styles.resultsButton} onPress={onViewResults}>
                <Text style={styles.resultsText}>View Results</Text>
                <Ionicons name="trophy" size={20} color="#fbbf24" />
              </TouchableOpacity>
            )}
          </>
        );

      case 'closed':
        return (
          <>
            <View style={[styles.statusBadge, styles.statusClosed]}>
              <Ionicons name="lock-closed" size={16} color="#6b7280" />
              <Text style={styles.statusText}>Closed</Text>
            </View>
            {mySubmission ? (
              <TouchableOpacity style={styles.resultsButton} onPress={onViewResults}>
                <Text style={styles.resultsText}>View Results</Text>
                <Ionicons name="trophy" size={20} color="#fbbf24" />
              </TouchableOpacity>
            ) : (
              <View style={styles.missedContainer}>
                <Ionicons name="sad-outline" size={32} color="#ef4444" />
                <Text style={styles.missedText}>You missed this event</Text>
                <Text style={styles.strikeText}>-15 points, +1 strike</Text>
              </View>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card style={styles.card} variant="elevated">
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={28} color="#6366f1" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      <View style={styles.content}>{renderContent()}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
  },
  content: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  statusOpen: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusSubmitted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusClosed: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
    textTransform: 'uppercase',
  },
  statusOpenText: {
    color: '#ef4444',
  },
  statusSubmittedText: {
    color: '#10b981',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  countdown: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  openTime: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  submissionCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 20,
  },
  participateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  participateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  waitingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 16,
  },
  resultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  missedContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  missedText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 8,
  },
  strikeText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
