import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/loading-screen';

interface PublicRouteProps {
  children: ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Allow access regardless of auth status
  // Individual components will handle auth-required actions
  return <>{children}</>;
};