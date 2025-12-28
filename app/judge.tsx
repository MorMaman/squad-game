import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../src/components/Avatar';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { useAuthStore } from '../src/store/authStore';
import { useSquadStore } from '../src/store/squadStore';
import { supabase } from '../src/lib/supabase';
import { DailyEvent, EventOutcome, OutcomeChallenge } from '../src/types';

export default function JudgeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentSquad } = useSquadStore();
  const [event, setEvent] = useState<DailyEvent | null>(null);
  const [outcome, setOutcome] = useState<EventOutcome | null>(null);
  const [challenges, setChallenges] = useState<OutcomeChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJudgeData = async () => {
    if (!currentSquad) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's event
      const { data: eventData } = await supabase
        .from('daily_events')
        .select('*')
        .eq('squad_id', currentSquad.id)
        .eq('date', today)
        .single();

      if (eventData) {
        setEvent(eventData as DailyEvent);

        // Fetch outcome if exists
        const { data: outcomeData } = await supabase
          .from('event_outcomes')
          .select('*')
          .eq('event_id', eventData.id)
          .single();

        if (outcomeData) {
          setOutcome(outcomeData as EventOutcome);

          // Fetch challenges
          const { data: challengesData } = await supabase
            .from('outcome_challenges')
            .select('*')
            .eq('event_id', eventData.id);

          if (challengesData) {
            setChallenges(challengesData as OutcomeChallenge[]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching judge data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJudgeData();
  }, [currentSquad]);

  const handleFinalize = async () => {
    if (!event || !user) return;

    Alert.alert(
      'Finalize Outcome',
      'Are you sure you want to finalize the event outcome? This will lock in the results.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const { error } = await supabase.from('event_outcomes').insert({
                event_id: event.id,
                finalized_by: user.id,
                payload: { approved: true },
                finalized_at: new Date().toISOString(),
                overturned: false,
              });

              if (error) throw error;

              // Update event status
              await supabase
                .from('daily_events')
                .update({ status: 'finalized' })
                .eq('id', event.id);

              Alert.alert('Success', 'Event outcome has been finalized!');
              fetchJudgeData();
            } catch (error) {
              Alert.alert('Error', 'Failed to finalize outcome');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleChallenge = async () => {
    if (!event || !user || !outcome) return;

    // Check if already challenged
    const alreadyChallenged = challenges.some((c) => c.user_id === user.id);
    if (alreadyChallenged) {
      Alert.alert('Already Challenged', 'You have already challenged this outcome.');
      return;
    }

    Alert.alert(
      'Challenge Outcome',
      'Are you sure you want to challenge this outcome? If >50% of members challenge, the outcome will be overturned.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Challenge',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const { error } = await supabase.from('outcome_challenges').insert({
                event_id: event.id,
                user_id: user.id,
              });

              if (error) throw error;

              Alert.alert('Challenge Submitted', 'Your challenge has been recorded.');
              fetchJudgeData();
            } catch (error) {
              Alert.alert('Error', 'Failed to submit challenge');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const isJudge = event?.judge_id === user?.id;
  const canChallenge = outcome && !outcome.overturned && !isJudge;
  const challengeDeadline = outcome
    ? new Date(new Date(outcome.finalized_at).getTime() + 60 * 60 * 1000)
    : null;
  const challengeExpired = challengeDeadline && new Date() > challengeDeadline;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchJudgeData}
            tintColor="#6366f1"
          />
        }
      >
        {/* Judge Badge */}
        {isJudge && (
          <Card style={styles.judgeBadge}>
            <Ionicons name="hammer" size={32} color="#fbbf24" />
            <View style={styles.judgeBadgeText}>
              <Text style={styles.judgeBadgeTitle}>You are today's Judge!</Text>
              <Text style={styles.judgeBadgeSubtitle}>
                Finalize the outcome to earn bonus points
              </Text>
            </View>
          </Card>
        )}

        {/* Event Status */}
        {event && (
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>
                {event.event_type.replace('_', ' ')}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  event.status === 'finalized' && styles.statusBadgeFinalized,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    event.status === 'finalized' && styles.statusBadgeTextFinalized,
                  ]}
                >
                  {event.status}
                </Text>
              </View>
            </View>

            {event.status === 'closed' && isJudge && !outcome && (
              <Button
                title="Finalize Outcome"
                onPress={handleFinalize}
                loading={isSubmitting}
                style={styles.finalizeButton}
              />
            )}
          </Card>
        )}

        {/* Outcome & Challenges */}
        {outcome && (
          <Card style={styles.outcomeCard}>
            <Text style={styles.sectionTitle}>Outcome</Text>
            <View style={styles.outcomeStatus}>
              {outcome.overturned ? (
                <>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                  <Text style={styles.overturned}>Overturned by Community</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.approved}>Approved</Text>
                </>
              )}
            </View>

            <View style={styles.challengeInfo}>
              <Text style={styles.challengeCount}>
                {challenges.length} challenge{challenges.length !== 1 ? 's' : ''}
              </Text>
              {!challengeExpired && canChallenge && (
                <Text style={styles.challengeDeadline}>
                  Challenge deadline:{' '}
                  {challengeDeadline?.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>

            {canChallenge && !challengeExpired && (
              <Button
                title="Challenge Outcome"
                onPress={handleChallenge}
                variant="danger"
                loading={isSubmitting}
              />
            )}
          </Card>
        )}

        {/* How It Works */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>How Judge Works</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>1</Text>
              <Text style={styles.infoText}>
                One squad member is randomly selected as Judge each day
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>2</Text>
              <Text style={styles.infoText}>
                The Judge finalizes the event outcome after it closes
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>3</Text>
              <Text style={styles.infoText}>
                Other members can challenge within 1 hour
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoNumber}>4</Text>
              <Text style={styles.infoText}>
                If &gt;50% challenge, outcome is overturned
              </Text>
            </View>
          </View>

          <View style={styles.pointsInfo}>
            <View style={styles.pointsRow}>
              <Ionicons name="checkmark" size={16} color="#10b981" />
              <Text style={styles.pointsText}>Judge approved: +10 points</Text>
            </View>
            <View style={styles.pointsRow}>
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={styles.pointsText}>Judge overturned: -10 points</Text>
            </View>
          </View>
        </Card>

        {!event && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyText}>No event to judge today</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  judgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    marginBottom: 16,
  },
  judgeBadgeText: {
    flex: 1,
  },
  judgeBadgeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fbbf24',
  },
  judgeBadgeSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  statusBadge: {
    backgroundColor: '#374151',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBadgeFinalized: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  statusBadgeTextFinalized: {
    color: '#10b981',
  },
  finalizeButton: {
    marginTop: 16,
  },
  outcomeCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  outcomeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  approved: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  overturned: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  challengeInfo: {
    marginBottom: 16,
  },
  challengeCount: {
    fontSize: 16,
    color: '#fff',
  },
  challengeDeadline: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoList: {
    gap: 16,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  pointsInfo: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
});
