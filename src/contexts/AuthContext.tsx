import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState, LoginCredentials, RegisterData } from '@/types/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin credentials
const ADMIN_EMAIL = 'admin@datamorphosis.in';
const ADMIN_PASSWORD = 'password123';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Helper function to fetch user profile and role (optimized - parallel queries, minimal logging)
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      // Optimized: Fetch profile and role in parallel for better performance
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, user_id, email, full_name, phone, created_at')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle()
      ]);

      const { data: profile, error: profileError } = profileResult;
      const { data: roleData, error: roleError } = roleResult;

      if (profileError) {
        // If profile doesn't exist, return null (silent fail for performance)
        if (profileError.code === 'PGRST116') {
          return null;
        }
        // Only log actual errors, not expected cases
        if (profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }
        return null;
      }

      if (!profile) {
        return null;
      }

      const role = (roleData?.role as UserRole) || 'customer';

      return {
        id: userId,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone || '',
        role,
        createdAt: new Date(profile.created_at),
      };
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Check session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for admin session first
        const storedAdmin = localStorage.getItem('datamorphosis_admin_user') || 
                           sessionStorage.getItem('datamorphosis_admin_user');
        
        if (storedAdmin) {
          try {
            const adminUser = JSON.parse(storedAdmin);
            console.log('Found stored admin user:', adminUser);
            setAuthState({
              user: adminUser,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch (e) {
            console.error('Error parsing stored admin user:', e);
            // Clear invalid data
            localStorage.removeItem('datamorphosis_admin_user');
            sessionStorage.removeItem('datamorphosis_admin_user');
          }
        }

        // Check Supabase session (only if no admin session)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        if (session?.user) {
          console.log('Found Supabase session, fetching profile...');
          const user = await fetchUserProfile(session.user.id);
          if (user) {
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        }

        setAuthState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('datamorphosis_admin_user');
        sessionStorage.removeItem('datamorphosis_admin_user');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      } else if (event === 'SIGNED_IN' && session?.user) {
        const user = await fetchUserProfile(session.user.id);
        if (user) {
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const email = credentials.email.trim().toLowerCase();
      const password = credentials.password;

      console.log('Login attempt started:', { email, rememberMe: credentials.rememberMe });

      // Check admin login
      const isAdminEmail = email === ADMIN_EMAIL.toLowerCase();
      const isAdminPassword = password === ADMIN_PASSWORD;
      
      console.log('Admin check:', { isAdminEmail, isAdminPassword, adminEmail: ADMIN_EMAIL });

      if (isAdminEmail && isAdminPassword) {
        console.log('Admin login detected');
        const adminUser: User = {
          id: 'admin-demo',
          fullName: 'Admin User',
          email: ADMIN_EMAIL,
          phone: '+91 9876543210',
          role: 'admin',
          createdAt: new Date('2024-01-01'),
        };

        // Sign out from Supabase first to clear any existing session
        console.log('Signing out from Supabase...');
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.warn('Error signing out from Supabase:', err);
        }

        // Clear any existing admin sessions
        localStorage.removeItem('datamorphosis_admin_user');
        sessionStorage.removeItem('datamorphosis_admin_user');

        // Store admin user
        if (credentials.rememberMe) {
          localStorage.setItem('datamorphosis_admin_user', JSON.stringify(adminUser));
          console.log('Admin user stored in localStorage');
        } else {
          sessionStorage.setItem('datamorphosis_admin_user', JSON.stringify(adminUser));
          console.log('Admin user stored in sessionStorage');
        }

        // Set auth state synchronously
        console.log('Setting admin user state...');
        setAuthState({
          user: adminUser,
          isAuthenticated: true,
          isLoading: false,
        });

        console.log('Admin login successful - state updated');
        
        // Show success message
        toast.success(`Welcome back, ${adminUser.fullName}!`);
        
        // Return true immediately - redirect will happen via useEffect in Login component
        return true;
      }

      // Regular user login - optimized for speed
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false }));

        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('invalid_credentials') ||
            error.message.includes('Invalid login')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed') || 
                   error.message.includes('email_not_confirmed')) {
          toast.error('Please verify your email before logging in. Check your inbox for the confirmation link.');
        } else if (error.message.includes('Too many requests')) {
          toast.error('Too many login attempts. Please wait a moment and try again.');
        } else {
          toast.error(error.message || 'Login failed. Please try again.');
        }
        return false;
      }

      if (!data.user) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        toast.error('Login failed. Please try again.');
        return false;
      }

      // Fetch user profile immediately (parallel queries already optimized)
      const user = await fetchUserProfile(data.user.id);

      if (!user) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        toast.error('Profile not found. Please register again or contact support.');
        return false;
      }

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success(`Welcome back, ${user.fullName}!`);
      return true;
    } catch (error: any) {
      console.error('Login exception:', error);
      console.error('Error stack:', error.stack);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast.error(error.message || 'Login failed. Please try again.');
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Validate role
      if (data.role !== 'customer') {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        toast.error('Only customer registration is allowed');
        return false;
      }

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
          },
        },
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          toast.error('Email already registered. Please sign in instead.');
        } else {
          toast.error(authError.message || 'Registration failed');
        }
        return false;
      }

      if (!authData.user) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        toast.error('Failed to create user account');
        return false;
      }

      // Step 2: Create company (user registers as company) - Use function directly for speed
      // Function bypasses RLS and returns full company record
      const { data: companyRecords, error: functionError } = await supabase
        .rpc('create_company_for_registration', {
          _name: data.fullName,
          _contact_email: data.email.trim(),
          _contact_phone: data.phone,
        });

      let companyData: any = null;
      let companyError: any = null;

      if (functionError) {
        // Fallback: Try direct insert if function fails
        const { data: directInsertData, error: directInsertError } = await supabase
          .from('companies')
          .insert({
            name: data.fullName,
            contact_email: data.email.trim(),
            contact_phone: data.phone,
            is_active: true,
          })
          .select()
          .single();

        if (directInsertError) {
          companyError = directInsertError;
        } else {
          companyData = directInsertData;
        }
      } else {
        // Function returns table with company record(s)
        if (companyRecords && companyRecords.length > 0) {
          companyData = companyRecords[0];
        } else {
          companyError = { message: 'Function returned no data' };
        }
      }

      if (companyError || !companyData) {
        console.error('Company creation error:', companyError || 'No company data');
        console.error('Error details:', {
          code: companyError?.code,
          message: companyError?.message,
          details: companyError?.details,
          hint: companyError?.hint
        });
        // Try to clean up auth user (may fail if no admin access)
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.warn('User cleanup error:', cleanupError);
        }
        setAuthState(prev => ({ ...prev, isLoading: false }));
        
        if (companyError?.message?.includes('row-level security') || companyError?.code === '42501') {
          toast.error('Registration error: Permission denied. Please contact support.');
        } else {
          toast.error(`Failed to create company: ${companyError?.message || 'Unknown error'}`);
        }
        return false;
      }

      // Step 3 & 4: Create/update profile and role in parallel (trigger may have created them)
      // This is much faster than sequential operations
      const [profileResult, roleResult] = await Promise.all([
        supabase.rpc('create_profile_for_registration', {
          _user_id: authData.user.id,
          _email: data.email.trim(),
          _full_name: data.fullName,
          _phone: data.phone,
          _company_id: companyData.id,
        }).then(result => {
          // If function fails, try direct update (non-blocking)
          if (result.error) {
            return supabase
              .from('profiles')
              .update({
                full_name: data.fullName,
                phone: data.phone,
                company_id: companyData.id,
              })
              .eq('user_id', authData.user.id);
          }
          return result;
        }),
        supabase.rpc('create_user_role_for_registration', {
          _user_id: authData.user.id,
          _role: 'customer',
        }).then(result => {
          // If function fails, try direct insert (non-blocking, ignore duplicates)
          if (result.error) {
            return supabase
              .from('user_roles')
              .insert({
                user_id: authData.user.id,
                role: 'customer',
              })
              .then(r => {
                // Ignore duplicate errors
                if (r.error && r.error.code !== '23505') {
                  return r;
                }
                return { data: null, error: null };
              });
          }
          return result;
        })
      ]);

      // Log errors but don't block registration (trigger may have already created these)
      if (profileResult.error) {
        console.warn('Profile update warning (non-critical):', profileResult.error);
      }
      if (roleResult.error) {
        console.warn('Role creation warning (non-critical):', roleResult.error);
      }

      // Step 5: Sign in automatically
      console.log('Signing in user after registration');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

      if (signInError) {
        console.error('Auto sign-in error:', signInError);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        
        if (signInError.message.includes('Email not confirmed')) {
          toast.success('Registration successful! Please check your email to confirm your account.');
        } else {
          toast.success('Registration successful! Please sign in.');
        }
        return true; // Registration succeeded even if auto sign-in failed
      }

      // Step 6: Fetch user profile immediately (no delay needed - trigger creates it instantly)
      // Fetch in parallel with setting up state for faster response
      const user = await fetchUserProfile(authData.user.id);

      if (user) {
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        toast.success('Registration successful! Welcome to Datamorphosis.');
        return true;
      }

      // If profile not immediately available, try once more (trigger might be processing)
      // But don't wait - return success immediately for better UX
      const retryUser = await fetchUserProfile(authData.user.id);
      if (retryUser) {
        setAuthState({
          user: retryUser,
          isAuthenticated: true,
          isLoading: false,
        });
        toast.success('Registration successful! Welcome to Datamorphosis.');
        return true;
      }

      // Profile will be available soon via trigger - return success immediately
      // User can refresh or profile will be available on next page load
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast.success('Registration successful! Redirecting...');
      // Still return true - registration succeeded
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast.error(error.message || 'Registration failed. Please try again.');
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('datamorphosis_admin_user');
    sessionStorage.removeItem('datamorphosis_admin_user');
    
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
