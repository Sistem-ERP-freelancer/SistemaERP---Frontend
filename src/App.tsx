import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { SettingsRoute } from "@/components/SettingsRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import Pedidos from "./pages/Pedidos";
import Financeiro from "./pages/Financeiro";
import ContasAPagar from "./pages/ContasAPagar";
import ContasAReceber from "./pages/ContasAReceber";
import Fornecedores from "./pages/Fornecedores";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import Transportadoras from "./pages/Transportadoras";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

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
