import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, isSuperAdmin, isLoading, user } = useAuth();

  // Logs apenas em desenvolvimento (sem dados sensíveis)
  if (import.meta.env.DEV) {
    console.log('🛡️ AdminRoute - Verificando acesso...');
    console.log('🛡️ AdminRoute - Autenticado:', isAuthenticated);
    console.log('🛡️ AdminRoute - É Super Admin:', isSuperAdmin);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Verifica autenticação e role de múltiplas formas
  const currentUser = user || authService.getCurrentUser();
  const roleFromUser = currentUser?.role?.toUpperCase()?.trim();
  const roleFromContext = user?.role?.toUpperCase()?.trim();
  const role = roleFromUser || roleFromContext;
  
  const isAdmin = role === 'SUPER_ADMIN' || isSuperAdmin;

  if (import.meta.env.DEV) {
    console.log('🛡️ AdminRoute - Role detectado:', role);
    console.log('🛡️ AdminRoute - Acesso admin:', isAdmin);
  }

  if (!isAuthenticated) {
    if (import.meta.env.DEV) {
      console.log('❌ AdminRoute - Não autenticado, redirecionando para login');
    }
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    if (import.meta.env.DEV) {
      console.log('❌ AdminRoute - Não é admin, redirecionando para dashboard');
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (import.meta.env.DEV) {
    console.log('✅ AdminRoute - Acesso permitido ao painel admin');
  }
  return <>{children}</>;
};

