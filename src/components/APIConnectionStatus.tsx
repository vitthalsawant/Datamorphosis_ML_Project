import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface APIConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
  onRefresh: () => void;
}

const APIConnectionStatus: React.FC<APIConnectionStatusProps> = ({
  isConnected,
  error,
  onRefresh
}) => {
  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Wifi className="w-4 h-4" />
        <span>Python API Connected</span>
      </div>
    );
  }

  return (
    <Card className="border-destructive/50 bg-destructive/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Python API Disconnected</p>
              <p className="text-sm text-muted-foreground">
                {error || 'Start your Python server on localhost:5000'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default APIConnectionStatus;
