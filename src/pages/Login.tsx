import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataMorphosisLogo } from '@/components/DataMorphosisLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, Loader2, Brain } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, user, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated && user) {
      if (!user.isApproved && user.role === 'customer') {
        // Don't redirect if not approved
        return;
      }
      const redirectPath = user.role === 'admin' ? '/admin' : '/customer';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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
    
    await login({
      email: formData.email,
      password: formData.password,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const { logout } = useAuth();

  // Show pending approval message
  if (isAuthenticated && user && !user.isApproved && user.role === 'customer') {
    const handleSignOut = async () => {
      await logout();
      navigate('/login');
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center animate-fade-in">
          <DataMorphosisLogo variant="color" className="mx-auto mb-8" />
          <div className="p-8 rounded-2xl bg-secondary/30 border border-border">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-4">Pending Approval</h2>
            <p className="text-muted-foreground mb-6">
              Your account is awaiting approval from the Datamorphosis team. 
              You'll receive an email once your account is activated.
            </p>
            <Button variant="outline" onClick={() => navigate('/')} className="mr-2">
              Go Home
            </Button>
            <Button variant="gold" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          
          {/* Admin Demo Credentials */}
          <div className="mt-12 p-6 rounded-xl bg-background/5 border border-border/20 text-left">
            <h3 className="text-sm font-medium text-primary mb-3">Admin Demo</h3>
            <div className="space-y-2 text-sm text-muted-foreground/70">
              <p><span className="text-primary-foreground">Email:</span> admin@datamorphosis.in</p>
              <p className="mt-2 text-xs">Contact admin to get credentials</p>
            </div>
          </div>
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
              Register your company
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
