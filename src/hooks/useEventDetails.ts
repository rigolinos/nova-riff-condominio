import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useJoinEventMutation, useLeaveEventMutation } from '@/hooks/useEventsQuery';
import { useAuth } from '@/hooks/useAuth';

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
  
  const { user } = useAuth();
  const joinMutation = useJoinEventMutation();
  const leaveMutation = useLeaveEventMutation();

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
        creator_rating: creatorProfile?.[0]?.user_rating || 5 // Usa a nota real do banco, ou 5 se não houver avaliação ainda
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
    if (!user) return { success: false, error: 'User not logged in' };
    try {
      await joinMutation.mutateAsync({ eventId, userId: user.id });
      await fetchEventDetails();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [eventId, joinMutation, user, fetchEventDetails]);

  const leaveEvent = useCallback(async () => {
    if (!user) return { success: false, error: 'User not logged in' };
    try {
      await leaveMutation.mutateAsync({ eventId, userId: user.id });
      await fetchEventDetails();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [eventId, leaveMutation, user, fetchEventDetails]);

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