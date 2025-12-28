import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/Avatar';
import { Card } from '../../src/components/Card';
import { supabase, getSignedMediaUrl } from '../../src/lib/supabase';
import { EventSubmission, DailyEvent } from '../../src/types';

export default function ResultsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [event, setEvent] = useState<DailyEvent | null>(null);
  const [submissions, setSubmissions] = useState<EventSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  const fetchResults = async () => {
    if (!eventId) return;

    setIsLoading(true);
    try {
      // Fetch event
      const { data: eventData } = await supabase
        .from('daily_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventData) {
        setEvent(eventData as DailyEvent);
      }

      // Fetch submissions
      const { data: submissionsData } = await supabase
        .from('event_submissions')
        .select(`
          *,
          profile:profiles (*)
        `)
        .eq('event_id', eventId)
        .order('rank', { ascending: true, nullsFirst: false })
        .order('submitted_at', { ascending: true });

      if (submissionsData) {
        setSubmissions(submissionsData as EventSubmission[]);

        // Fetch signed URLs for media
        const urls: Record<string, string> = {};
        for (const sub of submissionsData) {
          if (sub.media_path) {
            const url = await getSignedMediaUrl(sub.media_path);
            if (url) {
              urls[sub.id] = url;
            }
          }
        }
        setMediaUrls(urls);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [eventId]);

  const renderPressureTapResults = () => {
    return submissions.map((sub, index) => {
      const payload = sub.payload as { error_ms?: number };
      const rank = index + 1;
      const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

      return (
        <Card key={sub.id} style={styles.resultCard}>
          <View style={styles.resultRank}>
            {rank <= 3 ? (
              <Ionicons name="medal" size={24} color={medalColors[rank - 1]} />
            ) : (
              <Text style={styles.rankNumber}>{rank}</Text>
            )}
          </View>
          <Avatar
            uri={sub.profile?.avatar_url}
            name={sub.profile?.display_name}
            size="medium"
          />
          <View style={styles.resultInfo}>
            <Text style={styles.resultName}>{sub.profile?.display_name}</Text>
            <Text style={styles.resultScore}>
              {payload.error_ms !== undefined ? `${payload.error_ms}ms error` : '-'}
            </Text>
          </View>
          <View style={styles.resultPoints}>
            <Text style={styles.pointsValue}>
              +{rank === 1 ? 20 : rank === 2 ? 15 : rank === 3 ? 10 : 5}
            </Text>
          </View>
        </Card>
      );
    });
  };

  const renderPollResults = () => {
    // Count votes for each option
    const voteCounts: Record<string, number> = {};
    const options = event?.poll_options || [];

    options.forEach((opt) => {
      voteCounts[opt] = 0;
    });

    submissions.forEach((sub) => {
      const payload = sub.payload as { selected_answer?: string };
      if (payload.selected_answer) {
        voteCounts[payload.selected_answer] = (voteCounts[payload.selected_answer] || 0) + 1;
      }
    });

    const totalVotes = submissions.length;
    const sortedOptions = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);

    return (
      <View style={styles.pollResults}>
        <Text style={styles.pollQuestion}>{event?.poll_question}</Text>
        {sortedOptions.map(([option, count], index) => {
          const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          const isWinner = index === 0 && count > 0;

          return (
            <View key={option} style={styles.pollOption}>
              <View style={styles.pollOptionHeader}>
                <Text style={[styles.pollOptionText, isWinner && styles.pollWinner]}>
                  {option}
                </Text>
                <Text style={styles.pollVotes}>
                  {count} {count === 1 ? 'vote' : 'votes'}
                </Text>
              </View>
              <View style={styles.pollBar}>
                <View
                  style={[
                    styles.pollBarFill,
                    { width: `${percentage}%` },
                    isWinner && styles.pollBarWinner,
                  ]}
                />
              </View>
              <Text style={styles.pollPercentage}>{percentage.toFixed(0)}%</Text>
            </View>
          );
        })}

        <Text style={styles.participantsTitle}>Participants</Text>
        {submissions.map((sub) => (
          <View key={sub.id} style={styles.participant}>
            <Avatar
              uri={sub.profile?.avatar_url}
              name={sub.profile?.display_name}
              size="small"
            />
            <Text style={styles.participantName}>{sub.profile?.display_name}</Text>
            <Text style={styles.participantPoints}>+10</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSelfieResults = () => {
    return (
      <View style={styles.selfieGrid}>
        {submissions.map((sub) => {
          const payload = sub.payload as { micro_poll_answer?: string };
          const mediaUrl = mediaUrls[sub.id];

          return (
            <Card key={sub.id} style={styles.selfieCard}>
              {mediaUrl ? (
                <Image source={{ uri: mediaUrl }} style={styles.selfieImage} resizeMode="cover" />
              ) : (
                <View style={styles.selfiePlaceholder}>
                  <Ionicons name="image-outline" size={32} color="#6b7280" />
                </View>
              )}
              <View style={styles.selfieInfo}>
                <Avatar
                  uri={sub.profile?.avatar_url}
                  name={sub.profile?.display_name}
                  size="small"
                />
                <View style={styles.selfieText}>
                  <Text style={styles.selfieName}>{sub.profile?.display_name}</Text>
                  {payload.micro_poll_answer && (
                    <Text style={styles.selfieAnswer}>{payload.micro_poll_answer}</Text>
                  )}
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    );
  };

  const renderContent = () => {
    if (!event) return null;

    switch (event.event_type) {
      case 'PRESSURE_TAP':
        return renderPressureTapResults();
      case 'POLL':
        return renderPollResults();
      case 'LIVE_SELFIE':
        return renderSelfieResults();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchResults}
            tintColor="#6366f1"
          />
        }
      >
        {event && (
          <View style={styles.header}>
            <Text style={styles.eventType}>
              {event.event_type.replace('_', ' ')}
            </Text>
            <Text style={styles.date}>
              {new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.participantCount}>
              {submissions.length} {submissions.length === 1 ? 'participant' : 'participants'}
            </Text>
          </View>
        )}

        {renderContent()}

        {submissions.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyText}>No submissions yet</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  date: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  participantCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  resultRank: {
    width: 32,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultScore: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  resultPoints: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  pollResults: {
    gap: 16,
  },
  pollQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  pollOption: {
    gap: 8,
  },
  pollOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pollOptionText: {
    fontSize: 16,
    color: '#fff',
  },
  pollWinner: {
    fontWeight: '600',
    color: '#10b981',
  },
  pollVotes: {
    fontSize: 14,
    color: '#6b7280',
  },
  pollBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  pollBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  pollBarWinner: {
    backgroundColor: '#10b981',
  },
  pollPercentage: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  participantsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 24,
    marginBottom: 8,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  participantName: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  participantPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  selfieGrid: {
    gap: 16,
  },
  selfieCard: {
    padding: 0,
    overflow: 'hidden',
  },
  selfieImage: {
    width: '100%',
    height: 300,
  },
  selfiePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  selfieText: {
    flex: 1,
  },
  selfieName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  selfieAnswer: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
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
