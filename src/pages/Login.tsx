import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulação de login - integrar com backend real depois
    setTimeout(() => {
      setIsLoading(false);
      if (email && password) {
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else {
        toast.error("Preencha todos os campos");
      }
    }, 1000);
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
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-card/20 backdrop-blur-sm flex items-center justify-center">
                <Zap className="w-7 h-7 text-cyan" />
              </div>
              <span className="text-2xl font-bold text-primary-foreground">GestãoPro</span>
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
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">GestãoPro</span>
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
            © 2024 GestãoPro. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
