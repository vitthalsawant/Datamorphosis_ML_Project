import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase, testSupabaseConnection } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Loader2, Database, AlertCircle } from 'lucide-react';

interface ConnectionStatus {
  status: 'checking' | 'success' | 'error' | 'idle';
  message: string;
  details?: any;
}

export const SupabaseConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'idle',
    message: 'Click "Test Connection" to verify Supabase connection'
  });
  const [envCheck, setEnvCheck] = useState<{
    url: boolean;
    key: boolean;
  }>({
    url: !!import.meta.env.VITE_SUPABASE_URL,
    key: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  });

  const testConnection = async () => {
    setConnectionStatus({ status: 'checking', message: 'Testing connection...' });

    try {
      const result = await testSupabaseConnection();
      
      if (result.success) {
        setConnectionStatus({
          status: 'success',
          message: '✅ Connection successful! Supabase is properly configured.',
          details: result.details
        });
      } else {
        setConnectionStatus({
          status: 'error',
          message: `❌ Connection failed: ${result.error}`,
          details: result.details
        });
      }
    } catch (error: any) {
      setConnectionStatus({
        status: 'error',
        message: `❌ Error: ${error.message || 'Unknown error'}`,
        details: error
      });
    }
  };

  const testAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setConnectionStatus({
          status: 'error',
          message: `Auth check failed: ${error.message}`,
          details: error
        });
      } else {
        setConnectionStatus({
          status: 'success',
          message: `Auth check passed. Session: ${session ? 'Active' : 'No session'}`,
          details: { hasSession: !!session }
        });
      }
    } catch (error: any) {
      setConnectionStatus({
        status: 'error',
        message: `Auth error: ${error.message}`,
        details: error
      });
    }
  };

  const testDatabaseQuery = async () => {
    try {
      // Try to query a table that should exist
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        setConnectionStatus({
          status: 'error',
          message: `Database query failed: ${error.message}`,
          details: error
        });
      } else {
        setConnectionStatus({
          status: 'success',
          message: '✅ Database query successful! Tables are accessible.',
          details: { data }
        });
      }
    } catch (error: any) {
      setConnectionStatus({
        status: 'error',
        message: `Database error: ${error.message}`,
        details: error
      });
    }
  };

  useEffect(() => {
    // Check environment variables on mount
    setEnvCheck({
      url: !!import.meta.env.VITE_SUPABASE_URL,
      key: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    });
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Supabase Connection Test
        </CardTitle>
        <CardDescription>
          Verify your Supabase database connection and configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Variables Check */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Environment Variables</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              {envCheck.url ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span>VITE_SUPABASE_URL: {envCheck.url ? '✅ Set' : '❌ Missing'}</span>
            </div>
            <div className="flex items-center gap-2">
              {envCheck.key ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span>VITE_SUPABASE_PUBLISHABLE_KEY: {envCheck.key ? '✅ Set' : '❌ Missing'}</span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <Alert
          variant={
            connectionStatus.status === 'success'
              ? 'default'
              : connectionStatus.status === 'error'
              ? 'destructive'
              : 'default'
          }
        >
          {connectionStatus.status === 'checking' && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {connectionStatus.status === 'success' && (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {connectionStatus.status === 'error' && (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {connectionStatus.status === 'checking'
              ? 'Testing...'
              : connectionStatus.status === 'success'
              ? 'Success'
              : connectionStatus.status === 'error'
              ? 'Error'
              : 'Ready'}
          </AlertTitle>
          <AlertDescription>{connectionStatus.message}</AlertDescription>
          {connectionStatus.details && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer">View details</summary>
              <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                {JSON.stringify(connectionStatus.details, null, 2)}
              </pre>
            </details>
          )}
        </Alert>

        {/* Test Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={testConnection} disabled={connectionStatus.status === 'checking'}>
            {connectionStatus.status === 'checking' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button onClick={testAuth} variant="outline" disabled={connectionStatus.status === 'checking'}>
            Test Auth
          </Button>
          <Button onClick={testDatabaseQuery} variant="outline" disabled={connectionStatus.status === 'checking'}>
            Test Database Query
          </Button>
        </div>

        {/* Instructions */}
        {(!envCheck.url || !envCheck.key) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription>
              Please add the following variables to your <code>.env</code> file:
              <pre className="mt-2 p-2 bg-muted rounded text-xs">
                {`VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key`}
              </pre>
              You can find these values in your Supabase project settings.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
