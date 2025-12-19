import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DataMorphosisLogo } from '@/components/DataMorphosisLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, Loader2, Brain } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Login page: User authenticated, redirecting...', { 
        role: user.role, 
        email: user.email,
        isAuthenticated,
        hasUser: !!user
      });
      
      const redirectPath = {
        admin: '/admin',
        employee: '/employee',
        customer: '/customer',
      }[user.role as string] || '/customer';
      
      console.log('Redirecting to:', redirectPath);
      setIsSubmitting(false); // Reset submitting state before redirect
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const success = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });
      
      if (success) {
        // Login successful - redirect will happen via useEffect
        // Don't reset isSubmitting here, let redirect happen
        console.log('Login successful, waiting for redirect...');
      } else {
        // Login failed - reset submitting state
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setIsSubmitting(false);
      setErrors({ 
        general: error.message || 'An unexpected error occurred. Please try again.' 
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-charcoal to-obsidian items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl shadow-primary/30 animate-float">
            <Brain className="w-12 h-12 text-background" />
          </div>
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
            Welcome Back
          </h2>
          <p className="text-muted-foreground/80">
            Access your personalized dashboard and continue your journey 
            with Datamorphosis.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/" className="inline-block mb-8">
            <DataMorphosisLogo variant="color" />
          </Link>
          
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Sign In</h1>
            <p className="text-muted-foreground">Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="pl-11"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isSubmitting}
                  aria-required="true"
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="pl-11"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isSubmitting}
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isSubmitting}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="remember"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                disabled={isSubmitting}
              />
              <Label htmlFor="remember" className="text-sm cursor-pointer">
                Remember me for 30 days
              </Label>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {errors.general}
              </div>
            )}

            {/* Submit */}
            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
