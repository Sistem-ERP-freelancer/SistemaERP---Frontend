import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import { useRedirectAfterLogin } from "@/hooks/useRedirectAfterLogin";
import { TopERPLogo } from "@/components/TopERPLogo";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  // Hook para redirecionamento automático
  useRedirectAfterLogin();

  // Mostra loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl primary-gradient flex items-center justify-center">
            <Zap className="w-7 h-7 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({
        email: email.trim(),
        senha: password,
      });
      
      // Aguarda um momento para garantir que o contexto foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verifica o role de múltiplas formas (sem expor token)
      const userFromResponse = response?.user || response?.usuario;
      const userFromStorage = authService.getCurrentUser();
      const roleFromResponse = userFromResponse?.role?.toUpperCase()?.trim();
      const roleFromStorage = userFromStorage?.role?.toUpperCase()?.trim();
      
      const finalRole = roleFromResponse || roleFromStorage;
      
      // Log seguro apenas em desenvolvimento
      if (import.meta.env.DEV) {
        console.log('🔍 Role detectado:', finalRole);
        console.log('🔍 É SUPER_ADMIN?', finalRole === 'SUPER_ADMIN');
      }
      
      // Força o redirecionamento usando window.location para garantir
      if (finalRole === 'SUPER_ADMIN') {
        if (import.meta.env.DEV) {
          console.log('🚀 Redirecionando para /admin');
        }
        // Usa replace para não voltar para login
        setTimeout(() => {
          window.location.href = '/admin';
        }, 100);
      } else {
        if (import.meta.env.DEV) {
          console.log('🚀 Redirecionando para /dashboard');
        }
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      }
    } catch (error) {
      // O erro já foi tratado no contexto de autenticação
      console.error("Erro no login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-cyan/30 rounded-full" />
          <div className="absolute top-20 left-20 w-60 h-60 border-2 border-azure/20 rounded-full" />
          <div className="absolute bottom-20 right-10 w-48 h-48 border-2 border-cyan/30 rounded-full" />
          <div className="absolute bottom-40 right-20 w-32 h-32 bg-cyan/10 rounded-full blur-xl" />
          <div className="absolute top-1/2 left-1/4 w-20 h-20 border border-cyan/40 rounded-full animate-float" />
          <div className="absolute top-1/3 right-1/4 w-16 h-16 border border-azure/40 rounded-full animate-float-delayed" />
          
          {/* Zigzag decorations */}
          <svg className="absolute bottom-20 left-10 w-24 h-12 text-cyan/30" viewBox="0 0 100 50">
            <path d="M0 25 L20 0 L40 25 L60 0 L80 25 L100 0" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          
          {/* Dots pattern */}
          <div className="absolute top-1/4 right-10 grid grid-cols-4 gap-2">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-cyan/30 rounded-full" />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <TopERPLogo variant="landing" showText={false} />
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground mb-4 leading-tight">
              Olá,<br />
              <span className="text-cyan">bem-vindo!</span>
            </h1>

            <p className="text-primary-foreground/70 text-lg max-w-md">
              Acesse sua conta para gerenciar seu negócio de forma inteligente e eficiente.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-card">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <TopERPLogo variant="landing" showText={false} />
          </div>

          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            Acessar conta
          </h2>
          <p className="text-muted-foreground mb-8">
            Digite suas credenciais para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-8">
            © 2025 TopERP. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
