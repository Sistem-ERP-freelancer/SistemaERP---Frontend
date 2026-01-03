import { Building2, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transportadora } from '@/types/carrier';
import { cn } from '@/lib/utils';

interface CarrierStatsProps {
  /** Lista completa de transportadoras para cálculo */
  carriers: Transportadora[];
  
  /** Classes CSS adicionais */
  className?: string;
}

export function CarrierStats({ carriers, className }: CarrierStatsProps) {
  const total = carriers.length;
  const ativas = carriers.filter((c) => c.ativo).length;
  const inativas = total - ativas;
  const taxaAtivacao = total > 0 ? Math.round((ativas / total) * 100) : 0;

  const stats = [
    {
      label: 'Total',
      value: total,
      icon: Building2,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Ativas',
      value: ativas,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Inativas',
      value: inativas,
      icon: XCircle,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    },
    {
      label: 'Taxa de Ativação',
      value: `${taxaAtivacao}%`,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6', className)}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                <Icon className={cn('w-4 h-4', stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


