import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Sport {
  id: string;
  name: string;
}

interface UserSport {
  id: string;
  sport_id: string;
  sports?: Sport;
}

export const useUserSports = (userId?: string) => {
  const [userSports, setUserSports] = useState<Sport[]>([]);
  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserSports = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_sports')
        .select('id, sport_id, sports(id, name)')
        .eq('user_id', userId);

      if (error) throw error;

      const sports = (data as UserSport[])
        .map(item => item.sports)
        .filter((sport): sport is Sport => sport !== null && sport !== undefined);

      setUserSports(sports);
    } catch (error) {
      console.error('Error fetching user sports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setAllSports(data || []);
    } catch (error) {
      console.error('Error fetching all sports:', error);
    }
  };

  const addSport = async (sportId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_sports')
        .insert({ user_id: userId, sport_id: sportId });

      if (error) throw error;

      toast({
        title: "Esporte adicionado",
        description: "Esporte adicionado aos seus interesses com sucesso!",
      });

      await fetchUserSports();
    } catch (error) {
      console.error('Error adding sport:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o esporte.",
        variant: "destructive",
      });
    }
  };

  const removeSport = async (sportId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_sports')
        .delete()
        .eq('user_id', userId)
        .eq('sport_id', sportId);

      if (error) throw error;

      toast({
        title: "Esporte removido",
        description: "Esporte removido dos seus interesses.",
      });

      await fetchUserSports();
    } catch (error) {
      console.error('Error removing sport:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o esporte.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUserSports();
    fetchAllSports();
  }, [userId]);

  return {
    userSports,
    allSports,
    loading,
    addSport,
    removeSport,
    refreshSports: fetchUserSports
  };
};
