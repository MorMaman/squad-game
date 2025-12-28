import { useEffect } from 'react';
import { useEventStore } from '../store/eventStore';
import { useSquadStore } from '../store/squadStore';

export function useRealtimeEvent() {
  const { todayEvent, subscribeToEvent, fetchTodayEvent } = useEventStore();
  const { currentSquad } = useSquadStore();

  useEffect(() => {
    if (!todayEvent.event) return;

    const unsubscribe = subscribeToEvent(todayEvent.event.id);
    return unsubscribe;
  }, [todayEvent.event?.id, subscribeToEvent]);

  // Auto-refresh periodically when event is not yet open
  useEffect(() => {
    if (!currentSquad || todayEvent.status !== 'not_opened') return;

    const interval = setInterval(() => {
      fetchTodayEvent(currentSquad.id);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [currentSquad, todayEvent.status, fetchTodayEvent]);

  // Countdown timer for open events
  useEffect(() => {
    if (!currentSquad || todayEvent.status !== 'open') return;

    const interval = setInterval(() => {
      fetchTodayEvent(currentSquad.id);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [currentSquad, todayEvent.status, fetchTodayEvent]);

  return todayEvent;
}
