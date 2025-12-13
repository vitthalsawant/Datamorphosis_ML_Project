export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
  companyId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}
