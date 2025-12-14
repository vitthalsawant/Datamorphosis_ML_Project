import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState, LoginCredentials, RegisterData } from '@/types/auth';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: User[] = [
  {
    id: '1',
    fullName: 'Admin User',
    email: 'admin@datamorphosis.in',
    phone: '+91 9876543210',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    fullName: 'Ranka Jewellers',
    email: 'customer@datamorphosis.in',
    phone: '+91 9876543211',
    role: 'customer',
    createdAt: new Date('2024-02-15'),
  },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('datamorphosis_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = MOCK_USERS.find(u => u.email === credentials.email);
    
    if (user && credentials.password === 'password123') {
      const updatedUser = { ...user, lastLogin: new Date() };
      
      if (credentials.rememberMe) {
        localStorage.setItem('datamorphosis_user', JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem('datamorphosis_user', JSON.stringify(updatedUser));
      }
      
      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false,
      });
      
      toast.success(`Welcome back, ${user.fullName}!`);
      return true;
    }
    
    setAuthState(prev => ({ ...prev, isLoading: false }));
    toast.error('Invalid email or password');
    return false;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if user already exists
    const existingUser = MOCK_USERS.find(u => u.email === data.email);
    if (existingUser) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast.error('An account with this email already exists');
      return false;
    }
    
    const newUser: User = {
      id: String(Date.now()),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      createdAt: new Date(),
    };
    
    MOCK_USERS.push(newUser);
    localStorage.setItem('datamorphosis_user', JSON.stringify(newUser));
    
    setAuthState({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
    });
    
    toast.success('Registration successful! Welcome to Datamorphosis.');
    return true;
  };

  const logout = () => {
    localStorage.removeItem('datamorphosis_user');
    sessionStorage.removeItem('datamorphosis_user');
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
      localStorage.setItem('datamorphosis_user', JSON.stringify(updatedUser));
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
