import { useEffect } from 'react';
import { useEventStore } from '@/store/eventStore';

export { type Event } from '@/store/eventStore';

export function useEvents() {
  const { 
    events, 
    loading, 
    error, 
    fetchEvents, 
    joinEvent, 
    leaveEvent 
  } = useEventStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    joinEvent,
    leaveEvent
  };
}