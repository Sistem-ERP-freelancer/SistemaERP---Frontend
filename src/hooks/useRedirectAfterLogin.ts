import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';

export const useRedirectAfterLogin = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      const currentUser = user || authService.getCurrentUser();
      const role = currentUser?.role?.toUpperCase()?.trim();
      
      if (import.meta.env.DEV) {
        console.log('🔄 useRedirectAfterLogin - Role:', role);
      }
      
      if (role === 'SUPER_ADMIN') {
        if (import.meta.env.DEV) {
          console.log('🔄 Redirecionando para /admin');
        }
        navigate('/admin', { replace: true });
      } else if (isAuthenticated) {
        if (import.meta.env.DEV) {
          console.log('🔄 Redirecionando para /dashboard');
        }
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, isLoading, navigate]);
};

