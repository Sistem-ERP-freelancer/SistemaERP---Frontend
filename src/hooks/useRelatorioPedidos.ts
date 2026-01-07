import { useState } from 'react';
import { toast } from 'sonner';
import { pedidosService } from '@/services/pedidos.service';

interface UseRelatorioPedidosReturn {
  downloadRelatorio: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook customizado para download do relatório de pedidos em PDF
 */
export function useRelatorioPedidos(): UseRelatorioPedidosReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadRelatorio = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await pedidosService.downloadRelatorioPDF();
      toast.success('Relatório baixado com sucesso!');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao gerar relatório';
      setError(errorMessage);
      
      // Tratamento específico de erros HTTP
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        // O apiClient já trata o 401 e redireciona para login
      } else if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
        toast.error('Você não tem permissão para acessar este relatório');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Erro ao baixar relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    downloadRelatorio,
    loading,
    error,
  };
}


















