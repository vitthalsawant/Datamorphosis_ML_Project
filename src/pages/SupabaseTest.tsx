import React from 'react';
import { SupabaseConnectionTest } from '@/components/SupabaseConnectionTest';
import { LoginDebugger } from '@/components/LoginDebugger';
import { DataMorphosisLogo } from '@/components/DataMorphosisLogo';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SupabaseTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-block mb-8">
          <DataMorphosisLogo variant="color" />
        </Link>
        
        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connection">Connection Test</TabsTrigger>
            <TabsTrigger value="login">Login Debugger</TabsTrigger>
          </TabsList>
          <TabsContent value="connection">
            <SupabaseConnectionTest />
          </TabsContent>
          <TabsContent value="login">
            <LoginDebugger />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SupabaseTest;
