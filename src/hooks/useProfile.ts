import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { validateFullName, validatePhone, sanitizeText } from '@/lib/security';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  city: string;
  birth_date: string;
  block_number?: string;
  apt_number?: string;
  gender?: string;
  profile_photo_url?: string;
  accessibility_needs?: string[];
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      // Log generic error without exposing database details
      console.error('Error fetching profile');
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return { success: false };

    // **SECURITY: Validate and sanitize profile updates**
    const sanitizedUpdates: Partial<Profile> = { ...updates };

    // Validate full name if provided
    if (updates.full_name !== undefined) {
      const nameValidation = validateFullName(updates.full_name);
      if (!nameValidation.isValid) {
        toast({
          title: "Erro de validação",
          description: `Nome: ${nameValidation.errors.join(', ')}`,
          variant: "destructive",
        });
        return { success: false };
      }
      sanitizedUpdates.full_name = sanitizeText(updates.full_name);
    }

    // Validate phone if provided
    if (updates.phone !== undefined) {
      const phoneValidation = validatePhone(updates.phone);
      if (!phoneValidation.isValid) {
        toast({
          title: "Erro de validação",
          description: `Telefone: ${phoneValidation.errors.join(', ')}`,
          variant: "destructive",
        });
        return { success: false };
      }
      sanitizedUpdates.phone = updates.phone.replace(/\D/g, ''); // Keep only digits
    }

    // Sanitize city if provided
    if (updates.city !== undefined) {
      sanitizedUpdates.city = sanitizeText(updates.city);
    }
    
    // Sanitize block and apt if provided
    if (updates.block_number !== undefined) {
      sanitizedUpdates.block_number = sanitizeText(updates.block_number);
    }
    if (updates.apt_number !== undefined) {
      sanitizedUpdates.apt_number = sanitizeText(updates.apt_number);
    }

    // Validate accessibility_needs array if provided
    if (updates.accessibility_needs !== undefined) {
      sanitizedUpdates.accessibility_needs = updates.accessibility_needs
        ?.map(item => sanitizeText(item))
        .filter(item => item.length > 0)
        .slice(0, 10); // Limit to 10 items max
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(sanitizedUpdates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...sanitizedUpdates } : null);
      
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });

      return { success: true };
    } catch (error) {
      // Log generic error without exposing database details
      console.error('Error updating profile');
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile
  };
}