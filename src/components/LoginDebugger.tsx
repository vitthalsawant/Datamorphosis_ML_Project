import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export const LoginDebugger: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testLogin = async () => {
    setIsLoading(true);
    setResults(null);

    const steps: any[] = [];

    try {
      // Step 1: Try to sign in
      steps.push({ step: '1. Sign in with Supabase Auth', status: 'checking' });
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        steps.push({ step: '1. Sign in', status: 'error', message: authError.message });
        setResults({ steps, success: false });
        setIsLoading(false);
        return;
      }

      steps.push({ step: '1. Sign in', status: 'success', message: `User ID: ${authData.user?.id}` });

      if (!authData.user) {
        steps.push({ step: '2. Check user', status: 'error', message: 'No user returned' });
        setResults({ steps, success: false });
        setIsLoading(false);
        return;
      }

      // Step 2: Check profile
      steps.push({ step: '2. Fetch profile', status: 'checking' });
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError) {
        steps.push({ step: '2. Fetch profile', status: 'error', message: profileError.message });
      } else {
        steps.push({ step: '2. Fetch profile', status: 'success', message: `Found: ${profile.full_name}` });
      }

      // Step 3: Check user roles
      steps.push({ step: '3. Fetch user roles', status: 'checking' });
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', authData.user.id);

      if (roleError) {
        steps.push({ step: '3. Fetch user roles', status: 'error', message: roleError.message });
      } else {
        steps.push({ 
          step: '3. Fetch user roles', 
          status: 'success', 
          message: roles && roles.length > 0 ? `Role: ${roles[0].role}` : 'No roles found' 
        });
      }

      // Step 4: Check session
      steps.push({ step: '4. Check session', status: 'checking' });
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        steps.push({ step: '4. Check session', status: 'success', message: 'Session active' });
      } else {
        steps.push({ step: '4. Check session', status: 'error', message: 'No session found' });
      }

      setResults({ steps, success: true, user: authData.user, profile, roles });

    } catch (error: any) {
      steps.push({ step: 'Error', status: 'error', message: error.message });
      setResults({ steps, success: false });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Login Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>
        <Button onClick={testLogin} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Login Flow'
          )}
        </Button>

        {results && (
          <div className="space-y-2 mt-4">
            <h3 className="font-semibold">Results:</h3>
            {results.steps.map((step: any, idx: number) => (
              <Alert
                key={idx}
                variant={step.status === 'success' ? 'default' : step.status === 'error' ? 'destructive' : 'default'}
              >
                {step.status === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {step.status === 'error' && <XCircle className="w-4 h-4" />}
                {step.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
                <AlertDescription>
                  <strong>{step.step}:</strong> {step.message || step.status}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
