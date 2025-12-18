import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginRequest, LoginResponse } from '@/services/auth.service';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica se há um usuário salvo no localStorage
    const savedUser = authService.getCurrentUser();
    if (savedUser && authService.isAuthenticated()) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);
      
      // Verifica se há dados do usuário (pode vir como 'user' ou 'usuario')
      const userFromResponse = response.user || response.usuario;
      
      if (!userFromResponse) {
        throw new Error('Dados do usuário não encontrados na resposta');
      }
      
      // Garante que o user tenha todos os campos necessários
      const userData: User = {
        id: userFromResponse.id,
        email: userFromResponse.email,
        role: userFromResponse.role || '',
        nome: userFromResponse.nome || userFromResponse.email.split('@')[0],
        ativo: true,
      };
      
      // Log seguro (sem token)
      if (import.meta.env.DEV) {
        console.log('✅ Login realizado com sucesso');
        console.log('👤 Usuário:', userData.email);
        console.log('🔑 Role:', userData.role);
      }
      
      setUser(userData);
      toast.success('Login realizado com sucesso!');
      return response; // Retorna a resposta para uso no componente
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpa o estado local
      setUser(null);
    }
  };

  const isSuperAdmin = user?.role?.toUpperCase() === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isSuperAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

