import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AppRole;
  companyId?: string;
  isApproved: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    role: AppRole;
    password: string;
    companyName?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Get role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) throw roleError;

      if (profile && roleData) {
        setUser({
          id: userId,
          fullName: profile.full_name,
          email: profile.email,
          phone: profile.phone || '',
          role: roleData.role,
          companyId: profile.company_id || undefined,
          isApproved: profile.is_approved,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
        toast.success('Welcome back!');
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (data: {
    fullName: string;
    email: string;
    phone: string;
    role: AppRole;
    password: string;
    companyName?: string;
  }): Promise<boolean> => {
    try {
      setIsLoading(true);

      const redirectUrl = `${window.location.origin}/`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName,
            phone: data.phone,
            role: data.role,
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        setIsLoading(false);
        return false;
      }

      if (authData.user && data.role === 'customer' && data.companyName) {
        // Create company for customer registration
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: data.companyName,
            contact_email: data.email,
            contact_phone: data.phone,
          })
          .select()
          .single();

        if (companyError) {
          console.error('Error creating company:', companyError);
        } else if (company) {
          // Update profile with company_id
          await supabase
            .from('profiles')
            .update({ company_id: company.id })
            .eq('user_id', authData.user.id);
        }
      }

      if (data.role === 'customer') {
        toast.success('Registration successful! Please wait for admin approval.');
      } else {
        toast.success('Registration successful!');
      }
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    toast.success('You have been logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
