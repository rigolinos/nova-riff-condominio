import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface UserProfile {
  user_id: string;
  full_name: string;
  city: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  profile_photo_url?: string;
  block_number?: string;
  apt_number?: string;
  accessibility_needs?: string[];
  created_at: string;
  updated_at: string;
  user_rating?: number;
  total_reviews_received?: number;
  // Derived data
  events_created?: number;
  events_participated?: number;
  rating?: number;
  praise_tags?: string[];
}

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let targetUserId = userId;
      
      // If no userId provided, get current user
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        targetUserId = user.id;
      }

      // Get basic profile using direct query
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_photo_url, created_at, user_rating, total_reviews_received')
        .eq('user_id', targetUserId)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Perfil não encontrado');

      const baseProfile = profileData;
      
      // Get additional profile data if it's the current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      let fullProfile = baseProfile;
      
      if (currentUser && targetUserId === currentUser.id) {
        // User can see their own full profile
        const { data: fullProfileData, error: fullProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .single();
          
        if (fullProfileError) throw fullProfileError;
        fullProfile = fullProfileData;
      }

      // Get user statistics
      const [eventsCreated, eventsParticipated, userReviews] = await Promise.all([
        // Events created by user
        supabase
          .from('events')
          .select('id')
          .eq('created_by', targetUserId),
        
        // Events participated by user
        supabase
          .from('event_participants')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('status', 'registered'),
          
        // Reviews received by user (for praise tags)
        supabase
          .from('reviews')
          .select('praise_tags, rating')
          .eq('reviewed_user_id', targetUserId)
          .eq('review_type', 'player_review')
      ]);

      // Calculate rating from reviews
      let averageRating = 5; // Default
      let praiseTags: string[] = [];
      
      if (userReviews.data && userReviews.data.length > 0) {
        const ratings = userReviews.data
          .map(review => review.rating)
          .filter(rating => rating !== null);
          
        if (ratings.length > 0) {
          averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        }
        
        // Collect all praise tags
        praiseTags = userReviews.data
          .flatMap(review => review.praise_tags || [])
          .filter(Boolean);
      }

      const completeProfile: UserProfile = {
        user_id: fullProfile.user_id,
        full_name: fullProfile.full_name,
        city: (fullProfile as any).city || 'Não informado',
        phone: (fullProfile as any).phone,
        birth_date: (fullProfile as any).birth_date,
        gender: (fullProfile as any).gender,
        profile_photo_url: fullProfile.profile_photo_url,
        block_number: (fullProfile as any).block_number,
        apt_number: (fullProfile as any).apt_number,
        accessibility_needs: (fullProfile as any).accessibility_needs,
        created_at: (fullProfile as any).created_at || new Date().toISOString(),
        updated_at: (fullProfile as any).updated_at || new Date().toISOString(),
        user_rating: (fullProfile as any).user_rating || 3.0,
        total_reviews_received: (fullProfile as any).total_reviews_received || 0,
        events_created: eventsCreated.data?.length || 0,
        events_participated: eventsParticipated.data?.length || 0,
        rating: Math.round(averageRating * 10) / 10,
        praise_tags: praiseTags
      };

      setProfile(completeProfile);
    } catch (err) {
      // Log generic error without exposing database details
      console.error('Error fetching user profile');
      setError('Erro ao carregar perfil do usuário');
      toast({
        title: "Erro",
        description: 'Erro ao carregar perfil do usuário',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchUserProfile
  };
}