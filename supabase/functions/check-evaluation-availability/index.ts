import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EventWithParticipants {
  id: string
  date: string
  time: string
  event_participants: {
    user_id: string
    evaluation_status: string
  }[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting evaluation availability check...')

    // Get current time
    const now = new Date()
    console.log('Current time:', now.toISOString())

    // Find events that should have evaluation available (3+ hours after start)
    const { data: events, error: eventsError } = await supabaseClient
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
      .eq('event_participants.evaluation_status', 'pending')

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      throw eventsError
    }

    console.log(`Found ${events?.length || 0} events with pending evaluations`)

    // Process events and update eligible ones
    const updatePromises = []
    let updatedCount = 0

    for (const event of (events as EventWithParticipants[]) || []) {
      try {
        // Combine date and time
        const eventDateTime = new Date(`${event.date}T${event.time}`)
        const evaluationTime = new Date(eventDateTime.getTime() + 3 * 60 * 60 * 1000) // +3 hours
        
        console.log(`Event ${event.id}: ${eventDateTime.toISOString()} -> evaluation at ${evaluationTime.toISOString()}`)
        
        if (now >= evaluationTime) {
          console.log(`Event ${event.id} is eligible for evaluation`)
          
          // Update all participants for this event
          const updatePromise = supabaseClient
            .from('event_participants')
            .update({ evaluation_status: 'evaluation_available' })
            .eq('event_id', event.id)
            .eq('evaluation_status', 'pending')
          
          updatePromises.push(updatePromise)
          updatedCount++
        }
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error)
      }
    }

    // Execute all updates
    if (updatePromises.length > 0) {
      console.log(`Updating ${updatePromises.length} events...`)
      
      const results = await Promise.allSettled(updatePromises)
      
      let successCount = 0
      let errorCount = 0
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.error) {
            console.error(`Error updating event ${index}:`, result.value.error)
            errorCount++
          } else {
            console.log(`Successfully updated event ${index}`)
            successCount++
          }
        } else {
          console.error(`Promise rejected for event ${index}:`, result.reason)
          errorCount++
        }
      })
      
      console.log(`Update complete: ${successCount} successes, ${errorCount} errors`)
    } else {
      console.log('No events needed updating')
    }

    const responseData = {
      success: true,
      message: 'Evaluation availability check completed',
      eventsProcessed: events?.length || 0,
      eventsUpdated: updatedCount,
      timestamp: now.toISOString()
    }

    console.log('Response:', responseData)

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500 
      }
    )
  }
})