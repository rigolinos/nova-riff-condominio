import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventWithParticipants {
  id: string;
  title: string;
  date: string;
  time: string;
  event_participants: Array<{
    user_id: string;
    evaluation_status: string;
  }>;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting evaluation reminder check...');

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    // Fetch events that happened 2h, 4h, or 6h ago and have pending evaluations
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        date,
        time,
        event_participants!inner(
          user_id,
          evaluation_status
        )
      `)
      .eq('status', 'active')
      .eq('event_participants.evaluation_status', 'evaluation_available');

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    console.log(`Found ${events?.length || 0} events with pending evaluations`);

    const notificationResults = await Promise.allSettled(
      (events || []).map(async (event: EventWithParticipants) => {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const timeSinceEvent = now.getTime() - eventDateTime.getTime();
        const hoursSinceEvent = timeSinceEvent / (60 * 60 * 1000);

        // Check if we should send notification at 2h, 4h, or 6h mark
        // Allow 5-minute window for each notification time
        const shouldSend2h = hoursSinceEvent >= 2 && hoursSinceEvent < 2.1;
        const shouldSend4h = hoursSinceEvent >= 4 && hoursSinceEvent < 4.1;
        const shouldSend6h = hoursSinceEvent >= 6 && hoursSinceEvent < 6.1;

        if (!shouldSend2h && !shouldSend4h && !shouldSend6h) {
          return { skipped: true, eventId: event.id };
        }

        let notificationMessage = '';
        let urgency = '';

        if (shouldSend2h) {
          notificationMessage = `Não esqueça de avaliar o evento "${event.title}"! Sua opinião é importante para a comunidade.`;
          urgency = 'first_reminder';
        } else if (shouldSend4h) {
          notificationMessage = `Lembre-se de avaliar "${event.title}" e os participantes. Ajude a melhorar nossa comunidade!`;
          urgency = 'second_reminder';
        } else if (shouldSend6h) {
          notificationMessage = `⏰ Última chance! Avalie "${event.title}" antes que expire. Leva apenas alguns minutos!`;
          urgency = 'final_reminder';
        }

        // Create notifications for all participants with pending evaluations
        const notifications = event.event_participants.map(participant => ({
          user_id: participant.user_id,
          title: shouldSend6h ? '⏰ Última chance de avaliar!' : '🌟 Avalie o evento!',
          message: notificationMessage,
          type: 'evaluation_reminder',
          data: {
            event_id: event.id,
            event_title: event.title,
            urgency: urgency,
            hours_since_event: Math.floor(hoursSinceEvent)
          },
          read: false
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error(`Error creating notifications for event ${event.id}:`, notifError);
          throw notifError;
        }

        console.log(`Sent ${notifications.length} ${urgency} notifications for event ${event.id}`);
        
        return { 
          success: true, 
          eventId: event.id, 
          notificationCount: notifications.length,
          urgency 
        };
      })
    );

    const successful = notificationResults.filter(r => r.status === 'fulfilled').length;
    const failed = notificationResults.filter(r => r.status === 'rejected').length;

    console.log(`Evaluation reminder check completed. Successful: ${successful}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: events?.length || 0,
        successful,
        failed,
        timestamp: now.toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    );
  }
});