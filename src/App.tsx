import { AdminRoute } from "@/components/AdminRoute";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SettingsRoute } from "@/components/SettingsRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminPanel from "./pages/AdminPanel";
import Clientes from "./pages/Clientes";
import ContasAPagarPedidoDetalhes from "./pages/contas-a-pagar/ContasAPagarPedidoDetalhes";
import ContasAPagarPedidoPagamentos from "./pages/contas-a-pagar/ContasAPagarPedidoPagamentos";
import ContasAReceberClienteDetalhes from "./pages/contas-a-receber/ContasAReceberClienteDetalhes";
import ContasAReceberPedidoDetalhes from "./pages/contas-a-receber/ContasAReceberPedidoDetalhes";
import ContasAReceberPedidoPagamentos from "./pages/contas-a-receber/ContasAReceberPedidoPagamentos";
import ContasAPagar from "./pages/ContasAPagar";
import ContasAReceber from "./pages/ContasAReceber";
import Dashboard from "./pages/Dashboard";
import Estoque from "./pages/Estoque";
import Financeiro from "./pages/Financeiro";
import Fornecedores from "./pages/Fornecedores";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Pedidos from "./pages/Pedidos";
import Produtos from "./pages/Produtos";
import Settings from "./pages/Settings";
import Transportadoras from "./pages/Transportadoras";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error: any) => {
        // Log detalhado em desenvolvimento
        if (import.meta.env.DEV) {
          console.error('❌ [React Query Error]', error);
          console.error('❌ [Error Details]', {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
          });
        }
        
        // Não mostra toast para erros de autenticação (já tratados globalmente)
        if (error?.response?.status !== 401 && error?.response?.status !== 403) {
          const errorMessage = 
            error?.response?.data?.message || 
            error?.message || 
            'Erro ao carregar dados da API';
          
          // Usa sonner para notificações mais visíveis
          if (typeof window !== 'undefined') {
            import('sonner').then(({ toast }) => {
              toast.error(typeof errorMessage === 'string' ? errorMessage : 'Erro ao carregar dados');
            });
          }
        }
      },
    },
    mutations: {
      onError: (error: any) => {
        // Log detalhado em desenvolvimento
        if (import.meta.env.DEV) {
          console.error('❌ [React Query Mutation Error]', error);
        }
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pedidos" 
              element={
                <ProtectedRoute>
                  <Pedidos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/financeiro" 
              element={
                <ProtectedRoute>
                  <Financeiro />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contas-a-pagar" 
              element={
                <ProtectedRoute>
                  <ContasAPagar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contas-a-receber" 
              element={
                <ProtectedRoute>
                  <ContasAReceber />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/contas-a-receber/clientes/:clienteId" 
              element={
                <ProtectedRoute>
                  <ContasAReceberClienteDetalhes />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/financeiro/contas-receber/:pedidoId" 
              element={
                <ProtectedRoute>
                  <ContasAReceberPedidoDetalhes />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/financeiro/contas-receber/:pedidoId/pagamentos" 
              element={
                <ProtectedRoute>
                  <ContasAReceberPedidoPagamentos />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/financeiro/contas-pagar/:pedidoId" 
              element={
                <ProtectedRoute>
                  <ContasAPagarPedidoDetalhes />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/financeiro/contas-pagar/:pedidoId/pagamentos" 
              element={
                <ProtectedRoute>
                  <ContasAPagarPedidoPagamentos />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/fornecedores" 
              element={
                <ProtectedRoute>
                  <Fornecedores />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clientes" 
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/produtos" 
              element={
                <ProtectedRoute>
                  <Produtos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/estoque" 
              element={
                <ProtectedRoute>
                  <Estoque />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/transportadoras" 
              element={
                <ProtectedRoute>
                  <Transportadoras />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <SettingsRoute>
                  <Settings />
                </SettingsRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
