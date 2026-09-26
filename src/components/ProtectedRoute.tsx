import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCondominiumId } from '@/hooks/useCondominiumId';
import { LoadingScreen } from '@/components/loading-screen';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { hasCondominium, isLoading: condoLoading } = useCondominiumId();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Gate: se logado mas sem condomínio, redirecionar para onboarding
  useEffect(() => {
    if (!loading && !condoLoading && user && !hasCondominium && location.pathname !== '/onboarding') {
      navigate('/onboarding');
    }
  }, [user, loading, condoLoading, hasCondominium, location.pathname, navigate]);

  if (loading || (user && condoLoading)) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  // Permitir acesso ao onboarding mesmo sem condomínio
  if (!hasCondominium && location.pathname !== '/onboarding') {
    return null;
  }

  return <>{children}</>;
};