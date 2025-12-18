/**
 * Componente de estatísticas de clientes
 */

import { ClientesEstatisticas } from "@/services/clientes.service";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle,
  Loader2,
  Users,
  XCircle,
} from "lucide-react";

interface ClienteStatsProps {
  estatisticas: ClientesEstatisticas | undefined;
  isLoading: boolean;
  error?: unknown;
}

export const ClienteStats = ({
  estatisticas,
  isLoading,
  error,
}: ClienteStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-5 border border-border"
          >
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground mb-1">
          {estatisticas?.total || 0}
        </p>
        <p className="text-sm text-muted-foreground">Total</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-green-500 mb-1">
          {estatisticas?.ativos || 0}
        </p>
        <p className="text-sm text-muted-foreground">Ativos</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-muted/10">
            <XCircle className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-2xl font-bold text-muted-foreground mb-1">
          {estatisticas?.inativos || 0}
        </p>
        <p className="text-sm text-muted-foreground">Inativos</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-orange-500 mb-1">
          {estatisticas?.inadimplentes || 0}
        </p>
        <p className="text-sm text-muted-foreground">Inadimplentes</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <Ban className="w-5 h-5 text-red-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-red-500 mb-1">
          {estatisticas?.bloqueados || 0}
        </p>
        <p className="text-sm text-muted-foreground">Bloqueados</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-cyan/10">
            <Calendar className="w-5 h-5 text-cyan" />
          </div>
        </div>
        <p className="text-2xl font-bold text-cyan mb-1">
          {estatisticas?.novosNoMes || 0}
        </p>
        <p className="text-sm text-muted-foreground">Novos (mês)</p>
      </motion.div>
    </div>
  );
};
