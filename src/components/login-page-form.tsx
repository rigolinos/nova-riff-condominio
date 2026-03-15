import * as React from "react";
import { useState, useEffect } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Eye, EyeOff, Linkedin, Facebook } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { validateEmail, isRateLimited, resetRateLimit } from "@/lib/security";

const CustomInput: React.FC<{
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  autoComplete?: string;
  name?: string;
}> = ({ 
  type, 
  placeholder, 
  value, 
  onChange, 
  required = false, 
  showPasswordToggle = false, 
  showPassword = false, 
  onTogglePassword,
  autoComplete = "off",
  name
}) => {
  return (
    <div className="relative w-full max-w-[600px]">
      <input
        type={showPasswordToggle ? (showPassword ? "text" : "password") : type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="flex h-[50px] w-full rounded-3xl border-2 border-[rgba(119,136,143,1)] bg-[rgba(119,136,143,0.3)] px-6 text-base text-white placeholder:text-white placeholder:opacity-70 focus-visible:outline-none focus-visible:border-[rgba(241,216,110,1)] disabled:cursor-not-allowed disabled:opacity-50"
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[rgba(238,243,243,0.7)] hover:text-[rgba(238,243,243,1)]"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
};

export const LoginPageForm: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Check for email confirmation success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('confirmed') === 'true') {
      toast.success("✅ Email confirmado com sucesso! Agora você pode fazer login.");
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return (
      formData.email.trim().length > 0 &&
      formData.password.length >= 6
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // **SECURITY: Validate email format**
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      toast.error(`Erro de validação: ${emailValidation.errors.join(', ')}`);
      return;
    }

    // **SECURITY: Check rate limiting**
    if (isRateLimited(formData.email.toLowerCase(), 5, 900000)) { // 5 attempts per 15 minutes
      toast.error("Muitas tentativas de login. Tente novamente em 15 minutos.");
      return;
    }

    setIsLoading(true);
    try {
      console.log('Tentando fazer login com:', { email: formData.email.trim().toLowerCase() });
      
      const { error } = await signIn(formData.email.trim().toLowerCase(), formData.password);

      console.log('Resultado do login:', { error });

      if (error) {
        console.error('Erro de login:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Email ou senha incorretos. Verifique suas credenciais.");
        } else if (error.message.includes('Email not confirmed')) {
          toast.error("Confirme seu email antes de fazer login. Verifique sua caixa de entrada.");
        } else {
          toast.error("Erro ao fazer login: " + error.message);
        }
      } else {
        // **SECURITY: Reset rate limit on successful login**
        resetRateLimit(formData.email.toLowerCase());
        toast.success("Login realizado com sucesso!");
        console.log('Login bem-sucedido, redirecionando...');
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Erro no catch:', error);
      toast.error("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-[rgba(3,29,36,1)] flex max-w-[480px] w-full flex-col overflow-hidden items-center text-sm text-[rgba(238,243,243,1)] font-bold text-center leading-[1.4] mx-auto pt-[120px] pb-[65px] px-[33px] min-h-screen">
      <header className="flex flex-col items-center text-center">
        <h1 className="text-[32px] font-bold leading-[40px] mb-4">
          Bem-vindo de volta.
        </h1>
        <p className="text-lg font-normal opacity-80 mt-2">
          Entre, e jogue o que quiser.
        </p>
      </header>

      <form onSubmit={handleLogin} className="flex flex-col items-center w-full mt-[60px] space-y-[24px]">
        <CustomInput
          type="email"
          name="email"
          placeholder="E-mail:"
          value={formData.email}
          onChange={(value) => handleInputChange("email", value)}
          required
          autoComplete="email"
        />

        <CustomInput
          type="password"
          name="current-password"
          placeholder="Senha:"
          value={formData.password}
          onChange={(value) => handleInputChange("password", value)}
          required
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          autoComplete="current-password"
        />

        <div className="mt-[40px]">
          <PrimaryButton
            type="submit"
            disabled={isLoading || !isFormValid()}
            className={!isFormValid() && !isLoading ? "opacity-50 cursor-not-allowed bg-gray-500 hover:bg-gray-500" : ""}
          >
            {isLoading ? "Carregando..." : "Entrar"}
          </PrimaryButton>
        </div>

        <div className="flex items-center justify-center mt-[40px] mb-[40px] w-full max-w-[400px]">
          <div className="flex-grow border-t border-[rgba(238,243,243,1)] opacity-30"></div>
          <span className="px-4 text-[rgba(238,243,243,1)] opacity-60 text-lg">ou</span>
          <div className="flex-grow border-t border-[rgba(238,243,243,1)] opacity-30"></div>
        </div>

        <div className="flex justify-center space-x-[60px]">
          <button
            type="button"
            className="w-12 h-12 flex items-center justify-center text-[rgba(238,243,243,1)] hover:opacity-80 transition-opacity"
            aria-label="Entrar com LinkedIn"
          >
            <Linkedin size={48} />
          </button>
          <button
            type="button"
            className="w-12 h-12 flex items-center justify-center text-[rgba(238,243,243,1)] hover:opacity-80 transition-opacity"
            aria-label="Entrar com Facebook"
          >
            <Facebook size={48} />
          </button>
          <button
            type="button"
            className="w-12 h-12 flex items-center justify-center text-[rgba(238,243,243,1)] hover:opacity-80 transition-opacity"
            aria-label="Entrar com Google"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
        </div>

        <div className="text-center mt-[40px]">
          <Link
            to="/signup"
            className="text-[rgba(238,243,243,1)] opacity-80 hover:opacity-100 transition-opacity text-lg"
          >
            Não possui uma conta?
          </Link>
        </div>
      </form>
    </main>
  );
};