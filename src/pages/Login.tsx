import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RankaLogo } from '@/components/RankaLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, Loader2, Diamond } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
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
    
    const success = await login({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe,
    });
    
    if (success) {
      // Redirect based on role (handled by the login function's toast and context update)
      const storedUser = localStorage.getItem('ranka_user') || sessionStorage.getItem('ranka_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const redirectPath = {
          admin: '/admin',
          employee: '/employee',
          customer: '/customer',
        }[user.role as string];
        navigate(redirectPath || '/');
      }
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-charcoal to-obsidian items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl shadow-primary/30 animate-float">
            <Diamond className="w-12 h-12 text-background" />
          </div>
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
            Welcome Back
          </h2>
          <p className="text-muted-foreground/80">
            Access your personalized dashboard and continue your journey 
            with Ranka Jewellers.
          </p>
          
          {/* Demo Credentials */}
          <div className="mt-12 p-6 rounded-xl bg-background/5 border border-border/20 text-left">
            <h3 className="text-sm font-medium text-primary mb-3">Demo Credentials</h3>
            <div className="space-y-2 text-sm text-muted-foreground/70">
              <p><span className="text-primary-foreground">Admin:</span> admin@ranka.com</p>
              <p><span className="text-primary-foreground">Employee:</span> employee@ranka.com</p>
              <p><span className="text-primary-foreground">Customer:</span> customer@ranka.com</p>
              <p className="mt-2 text-xs">Password: password123</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/" className="inline-block mb-8">
            <RankaLogo variant="gold" />
          </Link>
          
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Sign In</h1>
            <p className="text-muted-foreground">Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-11"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-11"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
              />
              <Label htmlFor="remember" className="text-sm cursor-pointer">
                Remember me for 30 days
              </Label>
            </div>

            {/* Submit */}
            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
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

          {/* Mobile Demo Credentials */}
          <div className="lg:hidden mt-8 p-4 rounded-xl bg-secondary/50 border border-border">
            <h3 className="text-sm font-medium text-primary mb-2">Demo Credentials</h3>
            <p className="text-xs text-muted-foreground">
              Admin: admin@ranka.com | Employee: employee@ranka.com | Customer: customer@ranka.com
            </p>
            <p className="text-xs text-muted-foreground mt-1">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
