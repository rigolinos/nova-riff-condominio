import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEventStore } from '@/store/eventStore';

export interface EventDetails {
  id: string;
  title: string;
  description?: string;
  location: string;
  location_reference?: string;
  date: string;
  time: string;
  max_participants?: number;
  participant_count: number;
  created_by: string;
  sport_id?: string;
  status: 'active' | 'cancelled' | 'completed' | 'paused';
  image_url?: string;
  skill_level?: string;
  gender?: string;
  age_group?: string;
  created_at: string;
  updated_at: string;
  // Participation info
  is_participant?: boolean;
  user_participation_status?: string;
  user_evaluation_status?: string;
  // Creator info
  creator_name?: string;
  creator_rating?: number;
}

export interface EventParticipant {
  id: string;
  user_id: string;
  status: string;
  joined_at: string;
  user_profile?: {
    full_name: string;
    profile_photo_url?: string;
  };
}

export function useEventDetails(eventId: string) {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use global store for join/leave actions to maintain consistency
  const globalJoinEvent = useEventStore(state => state.joinEvent);
  const globalLeaveEvent = useEventStore(state => state.leaveEvent);
  const refreshSingleEvent = useEventStore(state => state.refreshSingleEvent);

  const fetchEventDetails = useCallback(async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch event details with creator info and user participation
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          event_participants!left (
            user_id,
            status,
            evaluation_status
          )
        `)
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error('Evento não encontrado');

      // Get creator profile using the public function
      const { data: creatorProfile } = await supabase
        .rpc('get_public_profile', { target_user_id: eventData.created_by });

      const userParticipation = eventData.event_participants?.find(
        (participant: any) => participant.user_id === user?.id
      );

      const eventDetails: EventDetails = {
        ...eventData,
        status: eventData.status as 'active' | 'cancelled' | 'completed' | 'paused',
        is_participant: !!userParticipation,
        user_participation_status: userParticipation?.status,
        user_evaluation_status: userParticipation?.evaluation_status,
        creator_name: creatorProfile?.[0]?.full_name || 'Usuário',
        creator_rating: 5 // Mock rating - will implement with reviews later
      };

      setEvent(eventDetails);
      
      // Fetch participants with profiles
      await fetchParticipants(eventId);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar evento';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchParticipants = useCallback(async (eventId: string) => {
    try {
      const { data: participantsData, error } = await supabase
        .from('event_participants')
        .select(`
          id,
          user_id,
          status,
          joined_at
        `)
        .eq('event_id', eventId)
        .eq('status', 'registered')
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Get profiles for each participant using the public function
      const participantsWithProfiles = await Promise.all(
        (participantsData || []).map(async (participant) => {
          const { data: profile } = await supabase
            .rpc('get_public_profile', { target_user_id: participant.user_id });
          
          return {
            ...participant,
            user_profile: profile?.[0] || { full_name: 'Usuário' }
          };
        })
      );

      setParticipants(participantsWithProfiles);
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  }, []);

  const joinEvent = useCallback(async () => {
    const result = await globalJoinEvent(eventId);
    if (result.success) {
      // Refresh local event details and global store
      await Promise.all([
        fetchEventDetails(),
        refreshSingleEvent(eventId)
      ]);
    }
    return result;
  }, [eventId, globalJoinEvent, refreshSingleEvent]);

  const leaveEvent = useCallback(async () => {
    const result = await globalLeaveEvent(eventId);
    if (result.success) {
      // Refresh local event details and global store
      await Promise.all([
        fetchEventDetails(),
        refreshSingleEvent(eventId)
      ]);
    }
    return result;
  }, [eventId, globalLeaveEvent, refreshSingleEvent]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  return {
    event,
    participants,
    loading,
    error,
    fetchEventDetails,
    joinEvent,
    leaveEvent
  };
}