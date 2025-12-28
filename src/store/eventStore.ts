import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { DailyEvent, EventSubmission, TodayEventState } from '../types';

interface EventState {
  todayEvent: TodayEventState;
  submissions: EventSubmission[];
  isLoading: boolean;

  // Actions
  fetchTodayEvent: (squadId: string) => Promise<void>;
  fetchSubmissions: (eventId: string) => Promise<void>;
  submitEvent: (eventId: string, payload: Record<string, unknown>, mediaPath?: string) => Promise<{ error: Error | null }>;
  subscribeToEvent: (eventId: string) => () => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  todayEvent: {
    event: null,
    status: 'loading',
  },
  submissions: [],
  isLoading: false,

  fetchTodayEvent: async (squadId: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Fetch today's event
      const { data: event, error } = await supabase
        .from('daily_events')
        .select('*')
        .eq('squad_id', squadId)
        .eq('date', today)
        .single();

      if (error || !event) {
        set({
          todayEvent: {
            event: null,
            status: 'loading',
          },
        });
        return;
      }

      // Check if user has submitted
      const { data: mySubmission } = await supabase
        .from('event_submissions')
        .select('*')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single();

      // Get submission count
      const { count } = await supabase
        .from('event_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id);

      const now = new Date();
      const opensAt = new Date(event.opens_at);
      const closesAt = new Date(event.closes_at);

      let status: TodayEventState['status'];
      if (mySubmission) {
        status = 'submitted';
      } else if (now < opensAt) {
        status = 'not_opened';
      } else if (now >= opensAt && now < closesAt && event.status === 'open') {
        status = 'open';
      } else {
        status = 'closed';
      }

      set({
        todayEvent: {
          event: event as DailyEvent,
          status,
          timeUntilOpen: status === 'not_opened' ? opensAt.getTime() - now.getTime() : undefined,
          timeUntilClose: status === 'open' ? closesAt.getTime() - now.getTime() : undefined,
          submissionCount: count ?? 0,
          mySubmission: mySubmission as EventSubmission | undefined,
        },
      });
    } catch (error) {
      console.error('Error fetching today event:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSubmissions: async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_submissions')
        .select(`
          *,
          profile:profiles (*)
        `)
        .eq('event_id', eventId)
        .order('score', { ascending: true });

      if (!error && data) {
        set({ submissions: data as EventSubmission[] });
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  },

  submitEvent: async (eventId: string, payload: Record<string, unknown>, mediaPath?: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Not authenticated') };

      const event = get().todayEvent.event;
      if (!event) return { error: new Error('No event found') };

      // Calculate score for PRESSURE_TAP
      let score: number | null = null;
      if (event.event_type === 'PRESSURE_TAP' && payload.error_ms !== undefined) {
        score = payload.error_ms as number;
      }

      const { error } = await supabase.from('event_submissions').insert({
        event_id: eventId,
        user_id: user.id,
        type: event.event_type,
        payload,
        media_path: mediaPath || null,
        submitted_at: new Date().toISOString(),
        score,
      });

      if (!error) {
        // Refresh the event state
        await get().fetchTodayEvent(event.squad_id);

        // Update user stats
        await updateUserStats(user.id, event.squad_id, event);
      }

      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToEvent: (eventId: string) => {
    const channel = supabase
      .channel(`event:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_submissions',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          get().fetchSubmissions(eventId);
          const event = get().todayEvent.event;
          if (event) {
            get().fetchTodayEvent(event.squad_id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'daily_events',
          filter: `id=eq.${eventId}`,
        },
        () => {
          const event = get().todayEvent.event;
          if (event) {
            get().fetchTodayEvent(event.squad_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

// Helper to update user stats after submission
async function updateUserStats(userId: string, squadId: string, event: DailyEvent) {
  const now = new Date();
  const opensAt = new Date(event.opens_at);
  const timeDiff = now.getTime() - opensAt.getTime();

  // Fast submission bonus (within 30 seconds = +10, decays to 0 at 5 minutes)
  let fastBonus = 0;
  if (event.event_type === 'LIVE_SELFIE') {
    const maxTime = 5 * 60 * 1000; // 5 minutes
    fastBonus = Math.max(0, Math.round(10 * (1 - timeDiff / maxTime)));
  }

  // Base participation points
  const basePoints = 10;
  const totalPoints = basePoints + fastBonus;

  // Update stats
  await supabase.rpc('update_user_stats_on_submission', {
    p_user_id: userId,
    p_squad_id: squadId,
    p_points: totalPoints,
  });
}
