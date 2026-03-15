import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useEvaluations() {
  const [loading, setLoading] = useState(false);

  const checkEvaluationAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current time
      const now = new Date();
      
      // Find events that should have evaluation available (3+ hours after start)
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          id,
          date,
          time,
          event_participants!inner(
            user_id,
            evaluation_status
          )
        `)
        .eq('event_participants.user_id', user.id)
        .eq('event_participants.evaluation_status', 'pending');

      if (error) throw error;

      // Update evaluation status for eligible events
      const updatedEventIds: string[] = [];
      
      events?.forEach(event => {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const evaluationTime = new Date(eventDateTime.getTime() + 3 * 60 * 60 * 1000); // +3 hours
        
        if (now >= evaluationTime) {
          updatedEventIds.push(event.id);
        }
      });

      if (updatedEventIds.length > 0) {
        const { error: updateError } = await supabase
          .from('event_participants')
          .update({ evaluation_status: 'evaluation_available' })
          .eq('user_id', user.id)
          .in('event_id', updatedEventIds);

        if (updateError) throw updateError;
      }

    } catch (error) {
      console.error('Erro ao verificar disponibilidade de avaliação:', error);
    }
  };

  const getPlayerReputation = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('praise_tags')
        .eq('reviewed_user_id', userId)
        .eq('review_type', 'player_praise');

      if (error) throw error;

      // Count total praise tags received
      const totalPraises = data?.reduce((acc, review) => {
        return acc + (review.praise_tags?.length || 0);
      }, 0) || 0;

      // Calculate stars based on praise count
      let stars = 1;
      if (totalPraises >= 51) stars = 5;
      else if (totalPraises >= 31) stars = 4;
      else if (totalPraises >= 16) stars = 3;
      else if (totalPraises >= 6) stars = 2;

      return { totalPraises, stars };
    } catch (error) {
      console.error('Erro ao calcular reputação:', error);
      return { totalPraises: 0, stars: 1 };
    }
  };

  useEffect(() => {
    checkEvaluationAvailability();
  }, []);

  return {
    loading,
    checkEvaluationAvailability,
    getPlayerReputation
  };
}