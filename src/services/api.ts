// Cliente HTTP base para todas as requisições da API

// Detecta automaticamente a URL da API baseado no ambiente
const getApiBaseUrl = () => {
  // Se houver uma variável de ambiente definida, usa ela (prioridade máxima)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Por padrão, usa a URL do Render (API online)
  // Se precisar usar localhost em desenvolvimento, defina VITE_API_URL no .env
  return 'https://sistemaerp-3.onrender.com/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// Log da URL da API em desenvolvimento
if (import.meta.env.DEV) {
  console.log('🔧 [API Config]', {
    baseURL: API_BASE_URL,
    envURL: import.meta.env.VITE_API_URL,
    usingEnv: !!import.meta.env.VITE_API_URL,
  });
}


class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { public?: boolean } = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { public: isPublic, ...requestOptions } = options;
    const includeAuth = !isPublic;

    const config: RequestInit = {
      ...requestOptions,
      headers: {
        ...this.getHeaders(includeAuth),
        ...requestOptions.headers,
      },
    };

    // Log detalhado em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('🌐 [API Request]', {
        method: options.method || 'GET',
        url,
        hasAuth: includeAuth,
        hasToken: !!this.getAuthToken(),
        baseURL: this.baseURL,
      });
    }

    try {
      const response = await fetch(url, config);
      
      // Log da resposta em desenvolvimento
      if (import.meta.env.DEV) {
        console.log('📥 [API Response]', {
          url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });
      }

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: response.statusText || 'Erro na requisição',
          };
        }

        // Log detalhado do erro em desenvolvimento
        if (import.meta.env.DEV) {
          console.error('❌ [API Error]', {
            url,
            status: response.status,
            statusText: response.statusText,
            errorData,
          });
        }

        // Tratamento de erros de autenticação (401/403)
        // IMPORTANTE: 401 = não autenticado (token inválido/expirado) - fazer logout
        // IMPORTANTE: 403 = não autorizado (sem permissão) - NÃO fazer logout, apenas mostrar erro
        if (response.status === 401) {
          // 401 = Token inválido ou expirado - fazer logout
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          // Redireciona para login apenas se não estiver já na página de login
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            if (import.meta.env.DEV) {
              console.warn('⚠️ [API] Token inválido ou expirado. Redirecionando para login...');
            }
            // Usa setTimeout para evitar problemas de navegação durante o erro
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
        }
        // 403 = Sem permissão - NÃO fazer logout, apenas lançar erro para ser tratado
        // O componente pode tratar o erro 403 de forma específica

        // Cria um erro customizado com mais informações
        const error = new Error(
          errorData?.message || 
          errorData?.error?.message || 
          errorData?.error ||
          (Array.isArray(errorData?.message) ? errorData.message.join(', ') : null) ||
          `Erro ${response.status}: ${response.statusText}`
        ) as any;
        
        // Adiciona informações adicionais ao erro para tratamento
        error.response = {
          status: response.status,
          data: errorData,
        };

        throw error;
      }

      // Se a resposta for 204 No Content, retorna null
      if (response.status === 204) {
        return null as T;
      }

      const data = await response.json();
      
      // Log da resposta bem-sucedida em desenvolvimento
      if (import.meta.env.DEV) {
        console.log('✅ [API Success]', {
          url,
          dataType: typeof data,
          isArray: Array.isArray(data),
          keys: typeof data === 'object' && data !== null ? Object.keys(data) : null,
        });
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error) {
        // Log detalhado de erros de conexão
        if (import.meta.env.DEV) {
          console.error('💥 [API Connection Error]', {
            url,
            message: error.message,
            error,
          });
        }
        
        // Melhora mensagens de erro de conexão
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet e se a API está rodando.');
        }
        throw error;
      }
      throw new Error('Erro desconhecido na requisição');
    }
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

