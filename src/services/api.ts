// Cliente HTTP base para todas as requisições da API

import { getTokenInfo, validateToken } from '@/lib/token-utils';

const PRODUCTION_API_DEFAULT =
  'https://sistemaerp-3.onrender.com/api/v1';

/**
 * URL base da API. Em produção, ignora VITE_API_URL se apontar para localhost
 * (evita build na Vercel com .env local por engano).
 */
const getApiBaseUrl = (): string => {
  const raw = (import.meta.env.VITE_API_URL ?? '').trim();
  const normalized = raw.replace(/\/+$/, '');

  if (import.meta.env.PROD) {
    if (
      !normalized ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(normalized)
    ) {
      return PRODUCTION_API_DEFAULT;
    }
    return normalized;
  }

  if (normalized) {
    return normalized;
  }
  return PRODUCTION_API_DEFAULT;
};

const API_BASE_URL = getApiBaseUrl();

/** Retentativa só em falha de rede (ex.: cold start no Render); evita POST duplicado em rotas sensíveis */
function shouldRetryAfterConnectionError(
  method: string,
  endpoint: string,
): boolean {
  const m = (method || 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(m)) return true;
  if (m === 'POST' && /\/usuarios\/login$/i.test(endpoint)) return true;
  return false;
}

async function fetchWithOptionalRetry(
  url: string,
  config: RequestInit,
  endpoint: string,
): Promise<Response> {
  try {
    return await fetch(url, config);
  } catch (firstError) {
    const method = (config.method || 'GET').toUpperCase();
    if (
      !import.meta.env.PROD ||
      !shouldRetryAfterConnectionError(method, endpoint)
    ) {
      throw firstError;
    }
    await new Promise((r) => setTimeout(r, 2500));
    return fetch(url, config);
  }
}

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

  /**
   * Verifica e valida o token antes de fazer requisições
   */
  private validateTokenBeforeRequest(): { valid: boolean; error?: string } {
    const token = this.getAuthToken();
    
    if (!token) {
      return { valid: false, error: 'Token não encontrado' };
    }

    const validation = validateToken(token);
    
    if (!validation.valid) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ [API] Token inválido:', validation.errors);
        const tokenInfo = getTokenInfo(token);
        console.log('📋 [API] Informações do token:', tokenInfo);
      }
      
      return { 
        valid: false, 
        error: validation.errors.join(', ') 
      };
    }

    return { valid: true };
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        
        // Em desenvolvimento, logar informações do token
        if (import.meta.env.DEV) {
          const tokenInfo = getTokenInfo(token);
          if (tokenInfo.nearExpiration) {
            console.warn('⚠️ [API] Token próximo do vencimento:', tokenInfo.expiresIn);
          }
        }
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
      // Validar token antes de fazer requisição autenticada
      if (includeAuth) {
        const tokenValidation = this.validateTokenBeforeRequest();
        if (!tokenValidation.valid) {
          // Se o token está inválido/expirado, não fazer a requisição
          // O erro será tratado como 401
          const error = new Error(
            tokenValidation.error || 'Token inválido ou expirado'
          ) as any;
          error.response = { status: 401, data: { message: tokenValidation.error } };
          throw error;
        }
      }

      const response = await fetchWithOptionalRetry(url, config, endpoint);
      
      // Log da resposta em desenvolvimento
      if (import.meta.env.DEV) {
        console.log('📥 [API Response]', {
          url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });
      }

      // Verificar se é erro de conexão (status 0 ou sem status)
      if (response.status === 0 || (!response.status && !response.ok)) {
        throw new Error(
          'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e se a API está rodando.'
        );
      }

      if (!response.ok) {
        let errorData: any;
        let errorText: string | null = null;
        
        try {
          // Tentar ler como JSON primeiro
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            // Se não for JSON, tentar ler como texto
            errorText = await response.text();
            try {
              // Tentar parsear como JSON mesmo que o content-type não seja JSON
              errorData = JSON.parse(errorText);
            } catch {
              // Se não conseguir parsear, usar o texto como mensagem
              errorData = {
                message: errorText || response.statusText || 'Erro na requisição',
              };
            }
          }
        } catch (parseError) {
          // Se falhar ao ler a resposta, usar informações básicas
          errorData = {
            message: errorText || response.statusText || 'Erro na requisição',
            status: response.status,
          };
        }

        // Log detalhado do erro em desenvolvimento
        if (import.meta.env.DEV) {
          console.error('❌ [API Error]', {
            url,
            status: response.status,
            statusText: response.statusText,
            errorData,
            errorText,
            headers: Object.fromEntries(response.headers.entries()),
          });
        }

        // Tratamento específico por código de status HTTP
        let errorMessage = errorData?.message || 
          errorData?.error?.message || 
          errorData?.error ||
          (Array.isArray(errorData?.message) ? errorData.message.join(', ') : null) ||
          `Erro ${response.status}: ${response.statusText}`;

        // Mensagens específicas para erros comuns
        switch (response.status) {
          case 400:
            // Bad Request - pode ser schema_name obrigatório ou outros erros de validação
            if (errorMessage.toLowerCase().includes('schema') || 
                errorMessage.toLowerCase().includes('schema_name')) {
              errorMessage = 'Schema name é obrigatório no token. Faça login novamente.';
            } else if (errorMessage.toLowerCase().includes('cliente não encontrado') ||
                       errorMessage.toLowerCase().includes('cliente nao encontrado')) {
              errorMessage = 'Cliente não encontrado. Verifique se o ID está correto.';
            } else if (
              errorMessage.toLowerCase().includes('validation failed') ||
              errorMessage.toLowerCase().includes('numeric string is expected')
            ) {
              // Erro de validação de parâmetros (ex.: contas-receber/contas-pagar)
              // Ver GUIA_EVITAR_ERRO_VALIDATION_NUMERIC.md
              errorMessage = 'Não foi possível carregar os dados. Tente novamente.';
            }
            break;
          
          case 401:
            // Unauthorized - Token inválido ou expirado
            errorMessage = 'Sessão expirada. Faça login novamente.';
            // Fazer logout
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            
            // Redireciona para login apenas se não estiver já na página de login
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              if (import.meta.env.DEV) {
                console.warn('⚠️ [API] Token inválido ou expirado. Redirecionando para login...');
                const tokenInfo = getTokenInfo(this.getAuthToken() || '');
                console.log('📋 [API] Token info antes do logout:', tokenInfo);
              }
              // Usa setTimeout para evitar problemas de navegação durante o erro
              setTimeout(() => {
                window.location.href = '/login';
              }, 100);
            }
            break;
          
          case 403:
            // Forbidden - Sem permissão (NÃO fazer logout)
            errorMessage = errorMessage || 'Você não tem permissão para realizar esta ação.';
            break;
          
          case 404:
            // Not Found
            if (errorMessage.toLowerCase().includes('cliente')) {
              errorMessage = 'Cliente não encontrado. Verifique se o ID está correto.';
            } else if (errorMessage.toLowerCase().includes('pedido')) {
              errorMessage = 'Pedido não encontrado. Verifique se o ID está correto.';
            } else {
              errorMessage = errorMessage || 'Recurso não encontrado.';
            }
            break;
          
          case 408:
            // Request Timeout
            errorMessage = 'A requisição demorou muito para responder. Tente novamente.';
            break;
          
          case 500:
            // Internal Server Error
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
            break;
          
          case 502:
          case 503:
          case 504:
            // Bad Gateway, Service Unavailable, Gateway Timeout
            errorMessage = 'Servidor temporariamente indisponível. Tente novamente em alguns instantes.';
            break;
        }

        // Log detalhado do erro em desenvolvimento
        if (import.meta.env.DEV) {
          console.error('❌ [API Error]', {
            url,
            status: response.status,
            statusText: response.statusText,
            errorMessage,
            errorData,
            errorText,
            headers: Object.fromEntries(response.headers.entries()),
          });
        }

        // Cria um erro customizado com mais informações
        const error = new Error(errorMessage) as any;
        
        // Adiciona informações adicionais ao erro para tratamento
        error.response = {
          status: response.status,
          data: errorData,
        };
        
        // Adiciona flag para identificar tipo de erro
        error.isConnectionError = false;
        error.isAuthError = response.status === 401 || response.status === 403;
        error.isNotFoundError = response.status === 404;
        error.isServerError = response.status >= 500;

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
            errorName: error.name,
            stack: error.stack,
          });
        }
        
        // Tratamento específico para diferentes tipos de erros de conexão
        const errorMessage = error.message.toLowerCase();
        
        if (
          errorMessage.includes('failed to fetch') ||
          errorMessage.includes('err_connection_refused') ||
          errorMessage.includes('err_connection_closed') ||
          errorMessage.includes('networkerror') ||
          errorMessage.includes('network request failed') ||
          errorMessage.includes('err_network') ||
          errorMessage.includes('load failed')
        ) {
          const connectionError = new Error(
            'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e se a API está rodando.'
          ) as any;
          connectionError.isConnectionError = true;
          connectionError.originalError = error;
          throw connectionError;
        }

        // Se já é um erro tratado (tem response), apenas relançar
        if ((error as any).response) {
          throw error;
        }

        // Erro desconhecido
        throw error;
      }
      throw new Error('Erro desconhecido na requisição');
    }
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * GET que retorna o corpo da resposta como Blob (ex.: PDF).
   * Não envia Content-Type: application/json para não alterar o Accept.
   */
  async getBlob(endpoint: string): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`;
    const tokenValidation = this.validateTokenBeforeRequest();
    if (!tokenValidation.valid) {
      const error = new Error(tokenValidation.error || 'Token inválido ou expirado') as any;
      error.response = { status: 401, data: { message: tokenValidation.error } };
      throw error;
    }
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetchWithOptionalRetry(url, { method: 'GET', headers }, endpoint);
    if (!response.ok) {
      let message = response.statusText || 'Erro ao baixar arquivo';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const j = await response.json();
          message =
            (typeof j?.message === 'string' && j.message) ||
            (Array.isArray(j?.message) ? j.message.join(', ') : null) ||
            message;
        } else {
          const text = await response.text();
          if (text) {
            try {
              const j = JSON.parse(text);
              message =
                (typeof j?.message === 'string' && j.message) ||
                (Array.isArray(j?.message) ? j.message.join(', ') : null) ||
                text;
            } catch {
              message = text;
            }
          }
        }
      } catch {
        /* mantém message */
      }
      const error = new Error(message) as any;
      error.response = { status: response.status, data: { message } };
      throw error;
    }
    return response.blob();
  }

  post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    // Log detalhado em desenvolvimento para pedidos
    if (import.meta.env.DEV && endpoint.includes('/pedidos') && data) {
      console.log('📤 [API Client] POST /pedidos - Dados sendo enviados:', {
        endpoint,
        tipo: data.tipo,
        totalItens: data.itens?.length || 0,
        itens: data.itens,
        dadosCompletos: data,
        bodyString: data ? JSON.stringify(data) : undefined,
      });
    }
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

