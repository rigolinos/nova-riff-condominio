import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SearchResult {
  id: string;
  type: 'event' | 'profile';
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  location?: string;
  date?: string;
  time?: string;
  participants?: number;
  maxParticipants?: number;
  skillLevel?: string;
  // Profile specific
  name?: string;
  city?: string;
  rating?: number;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAll = useCallback(async (query: string, filter: 'all' | 'events' | 'profiles' = 'all') => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const results: SearchResult[] = [];

      // Search events using normalized search (accent-insensitive)
      if (filter === 'all' || filter === 'events') {
        const { data: events, error: eventsError } = await supabase
          .rpc('search_events_normalized', { search_query: query });

        if (eventsError) throw eventsError;

        if (events) {
          const eventResults = events.map(event => ({
            id: event.id,
            type: 'event' as const,
            title: event.title,
            subtitle: event.location,
            description: event.description,
            image: event.image_url,
            location: event.location,
            date: event.date,
            time: event.time_field,
            participants: event.participant_count || 0,
            maxParticipants: event.max_participants,
            skillLevel: event.skill_level
          }));
          results.push(...eventResults);
        }
      }

      // Search profiles using normalized search (accent-insensitive)
      if (filter === 'all' || filter === 'profiles') {
        const { data: profiles, error: profilesError } = await supabase
          .rpc('search_profiles_normalized', { search_query: query });

        if (profilesError) throw profilesError;

        if (profiles) {
          const profileResults = profiles.map(profile => ({
            id: profile.user_id,
            type: 'profile' as const,
            title: profile.full_name,
            subtitle: profile.city,
            name: profile.full_name,
            city: profile.city,
            image: profile.profile_photo_url,
            rating: 5 // Mock rating - will implement with reviews later
          }));
          results.push(...profileResults);
        }
      }

      setResults(results);
    } catch (err) {
      // Log generic error without exposing database details
      console.error('Search error');
      setError('Erro ao realizar busca');
      toast({
        title: "Erro",
        description: 'Erro ao realizar busca. Tente novamente.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchAll,
    clearResults
  };
}