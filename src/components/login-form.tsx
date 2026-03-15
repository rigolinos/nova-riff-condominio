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
    <main className="bg-[rgba(3,29,36,1)] flex max-w-[480px] w-full flex-col overflow-hidden items-center text-sm text-[rgba(238,243,243,1)] font-bold text-center leading-[1.4] mx-auto px-[33px] min-h-screen">
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <header className="flex flex-col items-center mb-auto">
          <Logo className="!w-[180px]" />
          <h1 className="text-xl font-light leading-[27px] mt-8">
            Tecnologia a favor do esporte
          </h1>
        </header>

        <section className="flex flex-col items-center gap-[21px] w-full mb-auto" aria-label="Opções de autenticação">
          <PrimaryButton
            onClick={handleCreateAccount}
            disabled={isLoadingCreate || isLoadingLogin}
            aria-label="Criar uma nova conta"
          >
            {isLoadingCreate ? "Carregando..." : "Criar uma conta"}
          </PrimaryButton>

          <SecondaryButton
            onClick={handleLogin}
            disabled={isLoadingCreate || isLoadingLogin}
            aria-label="Iniciar sessão com conta existente"
          >
            {isLoadingLogin ? "Carregando..." : "Iniciar sessão"}
          </SecondaryButton>
        </section>
      </div>
    </main>
  );
};
