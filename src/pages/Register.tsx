import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DataMorphosisLogo } from '@/components/DataMorphosisLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, User, Mail, Phone, Loader2, Shield } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, user, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = {
        admin: '/admin',
        employee: '/employee',
        customer: '/customer',
      }[user.role as string] || '/customer';
      
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
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
      const success = await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: 'customer',
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.acceptTerms,
      });
      
      if (!success) {
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setIsSubmitting(false);
      setErrors({ 
        general: error.message || 'Registration failed. Please try again.' 
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
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/" className="inline-block mb-8">
            <DataMorphosisLogo variant="color" />
          </Link>
          
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">Join the Datamorphosis platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="pl-11"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  disabled={isSubmitting}
                  aria-required="true"
                />
              </div>
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>

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

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Contact Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 9876543210"
                  className="pl-11"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isSubmitting}
                  aria-required="true"
                />
              </div>
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  disabled={isSubmitting}
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isSubmitting}
                  aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                  title={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                disabled={isSubmitting}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                I agree to the <span className="text-primary underline">Terms & Conditions</span> and <span className="text-primary underline">Privacy Policy</span>
              </Label>
            </div>
            {errors.acceptTerms && <p className="text-sm text-destructive">{errors.acceptTerms}</p>}

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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-charcoal to-obsidian items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl shadow-primary/30">
            <Shield className="w-12 h-12 text-background" />
          </div>
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
            Secure & Trusted
          </h2>
          <p className="text-muted-foreground/80">
            Your data is protected with enterprise-grade security. 
            Join leading enterprises using the Datamorphosis platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
