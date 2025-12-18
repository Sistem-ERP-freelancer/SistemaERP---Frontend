import { apiClient } from './api';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    nome?: string;
  };
  usuario?: {
    id: string;
    email: string;
    role: string;
    nome?: string;
  };
}

export interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/usuarios/login',
      credentials,
      { public: true }
    );

    // A API pode retornar 'user' ou 'usuario', normaliza para 'user'
    const userData = response.user || response.usuario;

    // Salva o token no localStorage
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
    }

    // Retorna resposta normalizada
    return {
      ...response,
      user: userData,
    };
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/usuarios/logout', undefined, { public: false });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Remove todos os tokens e dados do usuário (segurança)
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();

