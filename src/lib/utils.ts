import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Extrai numero_parcela a partir da string p.numero (ex: "1/10", "10/10", "2026/10").
 * O backend espera numero_parcela 1..N. O formato "2026/10" (ano/parcela) deve retornar 10.
 */
export function parseNumeroParcela(
  numeroStr: string,
  totalParcelas: number,
  fallbackIdx: number
): number {
  const s = String(numeroStr || '');
  const slashMatch = s.match(/^(\d+)\/(\d+)$/);
  if (slashMatch) {
    const a = parseInt(slashMatch[1], 10);
    const b = parseInt(slashMatch[2], 10);
    // "2026/10" -> a=2026 (ano), b=10 (parcela) -> usar b
    if (a >= 1000 && a <= 2100 && b >= 1 && b <= totalParcelas) {
      return b;
    }
    // "1/10" ou "10/10" -> usar primeiro número
    return a;
  }
  const simple = s.match(/(\d+)/);
  return simple ? parseInt(simple[1], 10) : fallbackIdx;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formata status do pedido para exibição
 * Conforme GUIA_MIGRACAO_FRONTEND_PRATICO.md
 */
export function formatarStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDENTE': 'Em aberto',
    'APROVADO': 'Em aberto',
    'EM_PROCESSAMENTO': 'Em aberto',
    'CONCLUIDO': 'Concluído',
    'CANCELADO': 'Cancelado'
  };
  
  return statusMap[status] || status;
}

/**
 * Formata forma de pagamento para exibição
 * Conforme GUIA_MIGRACAO_FRONTEND_PRATICO.md
 */
export function formatarFormaPagamento(forma: string): string {
  const formasMap: Record<string, string> = {
    'DINHEIRO': 'Dinheiro',
    'PIX': 'PIX',
    'CARTAO_CREDITO': 'Cartão de Crédito',
    'CARTAO_DEBITO': 'Cartão de Débito',
    'BOLETO': 'Boleto',
    'TRANSFERENCIA': 'Transferência',
    'CHEQUE': 'Cheque'
  };
  
  return formasMap[forma] || forma;
}

/**
 * Normaliza valores monetários recebidos do backend
 * Converte valores que podem estar em centavos para reais
 * 
 * @param value - Valor a ser normalizado (pode ser number, string, null, undefined)
 * @param converterCentavos - Se true, tenta converter valores em centavos para reais
 * @returns Valor normalizado em reais (number)
 */
export function normalizeCurrency(
  value: number | string | null | undefined,
  converterCentavos: boolean = true
): number {
  // Tratar valores nulos ou vazios
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  // Converter para número
  let numero: number;
  
  if (typeof value === 'number') {
    numero = value;
  } else if (typeof value === 'string') {
    // Remover formatação (pontos, vírgulas, espaços, etc.)
    const cleaned = value.replace(/[^\d.,-]/g, '');
    // Converter vírgula para ponto (formato brasileiro)
    const normalized = cleaned.replace(',', '.');
    numero = parseFloat(normalized);
    
    if (isNaN(numero)) {
      return 0;
    }
  } else {
    return 0;
  }

  // Se deve converter centavos e o valor parece estar em centavos
  // IMPORTANTE: A conversão só deve acontecer se tivermos certeza de que é centavos
  // Critérios mais restritivos para evitar conversão incorreta de valores já em reais:
  // 1. Deve ser um inteiro >= 1000 (valores muito pequenos podem ser reais)
  // 2. Não deve ter decimais (Number.isInteger)
  // 3. Ao dividir por 100, deve resultar em um valor razoável entre 1 e 999999
  // 4. O valor original deve ser muito maior que valores típicos em reais (>= 1000)
  // Isso evita converter incorretamente valores como 303 (reais) para centavos
  if (converterCentavos && numero >= 1000 && numero < 100000000 && Number.isInteger(numero)) {
    // Verificar se dividir por 100 resulta em valor razoável
    // Valores muito pequenos em reais (menos de 10 reais) não devem ser convertidos
    const valorEmReais = numero / 100;
    if (valorEmReais >= 1 && valorEmReais < 1000000) {
      numero = valorEmReais;
      if (import.meta.env.DEV) {
        console.log(`[normalizeCurrency] Valor convertido de centavos para reais: ${value} -> ${numero.toFixed(2)}`);
      }
    }
  }

  // Garantir 2 casas decimais
  return parseFloat(numero.toFixed(2));
}

/**
 * Normaliza valores de quantidade (pode ter decimais)
 * Não converte centavos, apenas normaliza o formato
 * 
 * @param value - Valor a ser normalizado (pode ser number, string, null, undefined)
 * @returns Valor normalizado (number)
 */
export function normalizeQuantity(
  value: number | string | null | undefined
): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  let numero: number;
  
  if (typeof value === 'number') {
    // Se já é um número, garantir que não seja NaN ou Infinity
    if (isNaN(value) || !isFinite(value)) {
      return 0;
    }
    numero = value;
  } else if (typeof value === 'string') {
    // Remover espaços e caracteres especiais, exceto dígitos, ponto, vírgula e sinal negativo
    const cleaned = value.trim().replace(/[^\d.,-]/g, '');
    
    // Se a string estiver vazia após limpeza, retornar 0
    if (!cleaned || cleaned === '' || cleaned === '-') {
      return 0;
    }
    
    // Converter vírgula para ponto (formato brasileiro)
    const normalized = cleaned.replace(',', '.');
    numero = parseFloat(normalized);
    
    if (isNaN(numero) || !isFinite(numero)) {
      return 0;
    }
  } else {
    return 0;
  }

  // Garantir que o número não seja negativo (quantidade não pode ser negativa)
  return Math.max(0, numero);
}

/**
 * Normaliza o status de uma parcela para garantir que seja válido
 * Conforme guia: status PENDENTE não existe mais, deve ser normalizado para ABERTA
 * 
 * @param status - Status da parcela (pode ser string, null ou undefined)
 * @returns Status válido: 'ABERTA' | 'PARCIALMENTE_PAGA' | 'PAGA' | 'EM_COMPENSACAO'
 */
export function normalizarStatusParcela(
  status: string | null | undefined
): 'ABERTA' | 'PARCIALMENTE_PAGA' | 'PAGA' | 'EM_COMPENSACAO' {
  if (!status) return 'ABERTA';
  
  const statusUpper = status.toUpperCase().trim();
  
  // Status válidos
  const statusValidos = ['ABERTA', 'PARCIALMENTE_PAGA', 'PAGA', 'EM_COMPENSACAO'];
  
  // Se for válido, retornar
  if (statusValidos.includes(statusUpper)) {
    return statusUpper as 'ABERTA' | 'PARCIALMENTE_PAGA' | 'PAGA' | 'EM_COMPENSACAO';
  }
  
  // Se for PENDENTE ou inválido, normalizar para ABERTA
  if (statusUpper === 'PENDENTE' || !statusValidos.includes(statusUpper)) {
    if (import.meta.env.DEV) {
      console.warn(`[normalizarStatusParcela] Status inválido detectado: "${status}". Normalizando para ABERTA.`);
    }
    return 'ABERTA';
  }
  
  return 'ABERTA';
}