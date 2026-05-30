import * as React from "react";
import { useState, useEffect } from "react";
import { Logo } from "@/components/ui/logo";
import { Divider } from "@/components/ui/divider";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const LoginForm: React.FC = () => {
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleCreateAccount = async () => {
    setIsLoadingCreate(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Redirecionando para criação de conta...");
      navigate("/signup");
    } catch (error) {
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoadingCreate(false);
    }
  };

  const handleLogin = async () => {
    setIsLoadingLogin(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Redirecionando para login...");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoadingLogin(false);
    }
  };

  return (
    <main className="bg-gradient-to-br from-[#031d24] via-[#0a3641] to-[#031d24] flex max-w-[480px] w-full flex-col overflow-hidden items-center text-sm text-[rgba(238,243,243,1)] font-bold text-center leading-[1.4] mx-auto min-h-screen relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[40%] bg-[rgba(241,216,110,0.15)] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[40%] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex flex-col items-center justify-center min-h-[90vh] w-full px-8 z-10">
        <header className="flex flex-col items-center mb-12">
          <div className="bg-white/5 p-6 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl animate-fade-in-up">
            <Logo className="!w-[180px] drop-shadow-lg" />
            <h1 className="text-lg font-medium leading-[27px] mt-6 text-white/80 tracking-wide">
              Tecnologia a favor do esporte
            </h1>
          </div>
        </header>

        <section 
          className="flex flex-col items-center gap-[18px] w-full p-8 rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.2)] animate-fade-in-up" 
          aria-label="Opções de autenticação"
          style={{ animationDelay: '150ms' }}
        >
          <PrimaryButton
            onClick={handleCreateAccount}
            disabled={isLoadingCreate || isLoadingLogin}
            aria-label="Criar uma nova conta"
            className="w-full text-[15px] py-6 shadow-[0_0_20px_rgba(241,216,110,0.3)] hover:shadow-[0_0_25px_rgba(241,216,110,0.5)] transition-all duration-300 hover:-translate-y-1"
          >
            {isLoadingCreate ? "Carregando..." : "Criar uma conta"}
          </PrimaryButton>

          <SecondaryButton
            onClick={handleLogin}
            disabled={isLoadingCreate || isLoadingLogin}
            aria-label="Iniciar sessão com conta existente"
            className="w-full text-[15px] py-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            {isLoadingLogin ? "Carregando..." : "Iniciar sessão"}
          </SecondaryButton>
        </section>
      </div>
    </main>
  );
};
