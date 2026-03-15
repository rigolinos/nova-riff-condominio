import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validateEmail, validatePassword } from '@/lib/security';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Inicializando...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuth: Auth state changed:', { event, user: session?.user?.email });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session with error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('useAuth: Existing session check:', { user: session?.user?.email, error });
      
      if (error) {
        console.error('useAuth: Error getting session:', error);
        // Clear potentially corrupted auth data
        localStorage.removeItem('sb-tzvuzruustalqqbkanat-auth-token');
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('useAuth: Session check failed:', error);
      // Clear corrupted auth data on any error
      localStorage.removeItem('sb-tzvuzruustalqqbkanat-auth-token');
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    return () => {
      console.log('useAuth: Cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    // **SECURITY: Validate inputs before sending to Supabase**
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return { error: { message: `Email inválido: ${emailValidation.errors.join(', ')}` } };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return { error: { message: `Senha fraca: ${passwordValidation.errors.join(', ')}` } };
    }

    if (!fullName || fullName.trim().length < 2) {
      return { error: { message: 'Nome completo é obrigatório' } };
    }

    const redirectUrl = `${window.location.origin}/login?confirmed=true`;
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFullName = fullName.trim().replace(/[<>]/g, ''); // Basic sanitization
    
    const { error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: sanitizedFullName
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // **SECURITY: Basic validation before sending to Supabase**
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return { error: { message: `Email inválido: ${emailValidation.errors.join(', ')}` } };
    }

    if (!password || password.length < 1) {
      return { error: { message: 'Senha é obrigatória' } };
    }

    const sanitizedEmail = email.trim().toLowerCase();
    
    console.log('useAuth signIn called with:', { email: sanitizedEmail });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password
    });
    
    console.log('Supabase auth response:', { data, error });
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };
}