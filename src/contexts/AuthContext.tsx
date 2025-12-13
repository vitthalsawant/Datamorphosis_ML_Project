import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState, LoginCredentials, RegisterData } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [session, setSession] = useState<Session | null>(null);

  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .single();

      if (roleError) {
        console.error('Error fetching role:', roleError);
        return null;
      }

      // Check if user is approved (customers need approval)
      if (roleData.role === 'customer' && !profile.is_approved) {
        return null; // Will trigger pending approval message
      }

      return {
        id: supabaseUser.id,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone || '',
        role: roleData.role as UserRole,
        createdAt: new Date(profile.created_at),
        companyId: profile.company_id || undefined,
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer the profile fetch to avoid deadlock
          setTimeout(async () => {
            const user = await fetchUserProfile(session.user);
            if (user) {
              setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // User not approved or profile fetch failed
              setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          }, 0);
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user).then(user => {
          if (user) {
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        toast.error(error.message);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      if (data.user) {
        // Check if user is approved
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_approved')
          .eq('user_id', data.user.id)
          .single();

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (roleData?.role === 'customer' && !profile?.is_approved) {
          await supabase.auth.signOut();
          toast.error('Your account is pending approval. Please wait for admin approval.');
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return false;
        }

        const user = await fetchUserProfile(data.user);
        if (user) {
          toast.success(`Welcome back, ${user.fullName}!`);
          return true;
        }
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
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

      if (error) {
        toast.error(error.message);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      if (authData.user) {
        if (data.role === 'customer') {
          toast.success('Registration successful! Please wait for admin approval before logging in.');
          await supabase.auth.signOut();
        } else {
          toast.success('Registration successful! Welcome to Datamorphosis.');
        }
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return true;
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success('You have been logged out');
  };

  const updateUser = (updates: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...updates };
      setAuthState(prev => ({ ...prev, user: updatedUser }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        updateUser,
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
