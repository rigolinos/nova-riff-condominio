import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const useAuthAction = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (action: () => void, message?: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: message || "Você precisa estar logado para realizar esta ação.",
        variant: "destructive",
      });
      navigate('/login');
      return false;
    }
    action();
    return true;
  };

  return { requireAuth, isAuthenticated: !!user };
};