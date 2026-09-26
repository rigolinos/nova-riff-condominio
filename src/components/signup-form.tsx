import * as React from "react";
import { useState } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Eye, EyeOff, Linkedin, Facebook } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { validateEmail, validatePassword, isRateLimited } from "@/lib/security";

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
  helperText?: string;
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
  name,
  helperText
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
        className="flex h-[60px] w-full rounded-3xl border-2 border-[rgba(119,136,143,1)] bg-transparent px-6 text-base text-[rgba(238,243,243,1)] placeholder:text-[rgba(238,243,243,0.7)] focus-visible:outline-none focus-visible:border-[rgba(241,216,110,1)] disabled:cursor-not-allowed disabled:opacity-50"
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-4 top-[30px] transform -translate-y-1/2 text-[rgba(238,243,243,0.7)] hover:text-[rgba(238,243,243,1)] flex items-center justify-center"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
      {helperText && (
        <p className="mt-2 text-xs text-[rgba(238,243,243,0.6)] text-left px-2">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const SignupForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    acceptedTerms: false,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return (
      formData.email.trim().length > 0 &&
      formData.fullName.trim().length > 0 &&
      formData.password.length >= 6 &&
      formData.confirmPassword.length >= 6 &&
      formData.password === formData.confirmPassword &&
      formData.acceptedTerms
    );
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // **SECURITY: Validate email format**
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      toast.error(`Erro de validação: ${emailValidation.errors.join(', ')}`);
      return;
    }

    // **SECURITY: Validate password strength**
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      toast.error(`Senha fraca: ${passwordValidation.errors.join(', ')}`);
      return;
    }

    // **SECURITY: Check password confirmation**
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    // **SECURITY: Rate limiting for signup attempts**
    if (isRateLimited(`signup_${formData.email.toLowerCase()}`, 3, 3600000)) {
      toast.error("Muitas tentativas de cadastro. Tente novamente em 1 hora.");
      return;
    }

    setIsLoading(true);
    try {
      const sanitizedEmail = formData.email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
          data: {
            full_name: formData.fullName.trim(),
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered') || 
            error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.status === 422) {
          toast.error("Este email já está cadastrado. Por favor, faça login ou use outro email.");
          setIsLoading(false);
          return;
        } else {
          toast.error(`Erro no cadastro: ${error.message}`);
          setIsLoading(false);
          return;
        }
      }

      toast.success("✅ Conta criada com sucesso!");
      
      // Redirecionar para onboarding (vincular condomínio)
      navigate("/onboarding");
      
    } catch (error) {
      console.error('Erro no signup:', error);
      toast.error("Erro ao criar usuário. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`
        }
      });
      if (error) {
        toast.error("Erro ao fazer cadastro com Google: " + error.message);
      }
    } catch (error) {
      toast.error("Erro ao fazer cadastro com Google");
    }
  };

  return (
    <main className="bg-[rgba(3,29,36,1)] flex max-w-[480px] w-full flex-col overflow-hidden items-center text-sm text-[rgba(238,243,243,1)] font-bold text-center leading-[1.4] mx-auto pt-[120px] pb-[65px] px-[33px] min-h-screen">
      <header className="flex flex-col items-center text-center">
        <h1 className="text-[32px] font-bold leading-[40px] mb-2">
          Boas-vindas à Riff!
        </h1>
        <p className="text-lg font-normal opacity-80">
          Como você gostaria de se cadastrar?
        </p>
      </header>

      <form onSubmit={handleSignup} className="flex flex-col items-center w-full mt-8 space-y-[24px]">
        <CustomInput
          type="text"
          name="fullName"
          placeholder="Nome Completo:"
          value={formData.fullName}
          onChange={(value) => handleInputChange("fullName", value)}
          required
          autoComplete="name"
        />

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
          name="new-password"
          placeholder="Senha:"
          value={formData.password}
          onChange={(value) => handleInputChange("password", value)}
          required
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          autoComplete="new-password"
          helperText="Mínimo de 6 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais"
        />

        <CustomInput
          type="password"
          name="confirm-password"
          placeholder="Confirmar Senha:"
          value={formData.confirmPassword}
          onChange={(value) => handleInputChange("confirmPassword", value)}
          required
          showPasswordToggle
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          autoComplete="new-password"
          helperText="As senhas devem ser idênticas"
        />

        <div className="w-full max-w-[600px] flex items-start gap-3 mt-4 text-left">
          <input 
            type="checkbox" 
            id="terms" 
            className="mt-1 w-5 h-5 rounded border-gray-400 bg-transparent"
            checked={formData.acceptedTerms}
            onChange={(e) => handleInputChange("acceptedTerms", e.target.checked as any)}
          />
          <label htmlFor="terms" className="text-sm font-normal text-white/80 leading-snug">
            Li e concordo com os <Link to="/termos" className="underline hover:text-white">Termos de Uso</Link> e a <Link to="/privacidade" className="underline hover:text-white">Política de Privacidade</Link>.
          </label>
        </div>

        <div className="mt-8 w-full max-w-[600px]">
          <PrimaryButton
            type="submit"
            disabled={isLoading || !isFormValid()}
            className={`w-full max-w-full ${!isFormValid() && !isLoading ? "opacity-50 cursor-not-allowed bg-gray-500 hover:bg-gray-500" : ""}`}
          >
            {isLoading ? "Carregando..." : "Aceitar e cadastrar"}
          </PrimaryButton>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/login"
            className="text-[rgba(238,243,243,1)] opacity-80 hover:opacity-100 transition-opacity text-base font-normal"
          >
            Já tem uma conta? Faça login
          </Link>
        </div>

        <div className="flex items-center justify-center mt-8 mb-8 w-full max-w-[400px]">
          <div className="flex-grow border-t border-[rgba(238,243,243,1)] opacity-30"></div>
          <span className="px-4 text-[rgba(238,243,243,1)] opacity-60 text-base font-normal">ou</span>
          <div className="flex-grow border-t border-[rgba(238,243,243,1)] opacity-30"></div>
        </div>

        <div className="flex justify-center space-x-8">
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center text-[rgba(238,243,243,1)] hover:opacity-80 transition-opacity"
            aria-label="Entrar com LinkedIn"
          >
            <Linkedin size={36} />
          </button>
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center text-[rgba(238,243,243,1)] hover:opacity-80 transition-opacity"
            aria-label="Entrar com Facebook"
          >
            <Facebook size={36} />
          </button>
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center text-[rgba(238,243,243,1)] hover:opacity-80 transition-opacity"
            aria-label="Entrar com Google"
            onClick={handleGoogleLogin}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
        </div>
      </form>
    </main>
  );
};