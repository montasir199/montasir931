
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../app/integrations/supabase/client';

type User = {
  id: string;
  email?: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const sess = data.session;
      if (sess?.user) setUser({ id: sess.user.id, email: sess.user.email || undefined });
      else setUser(null);
    } catch (e) {
      console.log('Auth load error', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser({ id: session.user.id, email: session.user.email || undefined });
      else setUser(null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('Login', error.message || 'Failed');
        return;
      }
      if (data.session) {
        Alert.alert('Login', 'Logged in successfully');
      } else {
        Alert.alert('Login', 'Please check your email to confirm.');
      }
    } catch (e: any) {
      console.log('SignIn error', e);
      Alert.alert('Login', e.message || 'Failed');
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
        },
      } as any);
      if (error) {
        Alert.alert('Signup', error.message || 'Failed');
        return;
      }
      if (data.user) {
        Alert.alert('Signup', 'Registration successful. Please verify your email before logging in.');
      }
    } catch (e: any) {
      console.log('SignUp error', e);
      Alert.alert('Signup', e.message || 'Failed');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Logout', error.message || 'Failed');
        return;
      }
      Alert.alert('Logout', 'Logged out');
    } catch (e: any) {
      console.log('SignOut error', e);
      Alert.alert('Logout', e.message || 'Failed');
    }
  };

  const refreshSession = async () => {
    await load();
  };

  const value = useMemo<AuthContextType>(() => ({ user, loading, signIn, signUp, signOut, refreshSession }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
