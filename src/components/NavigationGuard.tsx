import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from '@/contexts/SupabaseContext';
import { LoadingState } from './LoadingState';
import { ErrorDisplay } from './ErrorDisplay';

interface NavigationGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const NavigationGuard: React.FC<NavigationGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (requireAuth && !session) {
          router.replace(redirectTo);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        setError('Failed to verify authentication status');
        setLoading(false);
      }
    };

    checkAuth();
  }, [requireAuth, redirectTo, router]);

  if (loading) {
    return <LoadingState fullScreen message="Checking authentication..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return <>{children}</>;
};