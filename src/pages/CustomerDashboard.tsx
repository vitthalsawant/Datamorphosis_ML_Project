import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, AlertTriangle, Shield, Play, Bell, Activity, Clock, Settings, Users, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { usePythonAPI } from '@/hooks/usePythonAPI';
import APIConnectionStatus from '@/components/APIConnectionStatus';

// Mock data fallback
const MOCK_CAMERAS = [
  { id: '1', name: 'Main Entrance', location: 'Ground Floor', status: 'online', detection_modes: ['face_recognition', 'person_counting'] },
  { id: '2', name: 'Showroom A', location: 'Ground Floor', status: 'online', detection_modes: ['theft_alert', 'suspicious_behavior'] },
  { id: '3', name: 'Vault Area', location: 'Basement', status: 'online', detection_modes: ['face_recognition', 'theft_alert'] },
  { id: '4', name: 'Back Office', location: 'First Floor', status: 'offline', detection_modes: ['person_counting'] },
  { id: '5', name: 'Parking Lot', location: 'Basement', status: 'online', detection_modes: ['vip_recognition', 'crowd_density'] },
  { id: '6', name: 'Emergency Exit', location: 'Ground Floor', status: 'maintenance', detection_modes: ['suspicious_behavior'] },
];

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { analytics, detections, isConnected, error, refreshAll } = usePythonAPI(5000);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'face_recognition': 'Face Recognition',
      'person_counting': 'Person Counting',
      'suspicious_behavior': 'Suspicious Behavior',
      'theft_alert': 'Theft Alert',
      'crowd_density': 'Crowd Density',
      'vip_recognition': 'VIP Recognition',
    };
    return labels[type] || type;
  };

  const getAlertIcon = (type: string) => {
    if (type === 'suspicious_behavior' || type === 'theft_alert') {
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    }
    return <Bell className="w-5 h-5 text-cyan-500" />;
  };

  const onlineCameras = MOCK_CAMERAS.filter(c => c.status === 'online').length;
  const offlineCameras = MOCK_CAMERAS.filter(c => c.status === 'offline').length;

  // Use API data if connected, otherwise use defaults
  const totalVisitors = analytics?.total_visitors ?? 0;
  const maleCount = analytics?.male_count ?? 0;
  const femaleCount = analytics?.female_count ?? 0;
  const recentDetections = detections.length > 0 ? detections.slice(-4).reverse() : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Security Dashboard</h1>
            <p className="text-muted-foreground">Monitor your cameras and security alerts in real-time</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/customer/cameras')}>
              <Settings className="w-4 h-4 mr-2" />
              Camera Settings
            </Button>
            <Button variant="gold" onClick={() => navigate('/customer/detection')}>
              <Shield className="w-4 h-4 mr-2" />
              Detection Settings
            </Button>
          </div>
        </div>

        {/* API Connection Status */}
        <APIConnectionStatus 
          isConnected={isConnected} 
          error={error} 
          onRefresh={refreshAll} 
        />

        {/* Analytics from Python API */}
        {isConnected && analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalVisitors}</p>
                    <p className="text-xs text-muted-foreground">Total Visitors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{maleCount}</p>
                    <p className="text-xs text-muted-foreground">Male Visitors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-pink-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{femaleCount}</p>
                    <p className="text-xs text-muted-foreground">Female Visitors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">Live</p>
                    <p className="text-xs text-muted-foreground">API Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{onlineCameras}</p>
                  <p className="text-xs text-muted-foreground">Online Cameras</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{offlineCameras}</p>
                  <p className="text-xs text-muted-foreground">Offline Cameras</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{detections.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Detections Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                  <Activity className="w-5 h-5 text-background" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">Active</p>
                  <p className="text-xs text-muted-foreground">System Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Camera Grid */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Live Camera Feeds
            </CardTitle>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_CAMERAS.map((camera) => (
                <div key={camera.id} className="relative rounded-lg overflow-hidden border border-border hover-lift cursor-pointer">
                  <div className="aspect-video bg-charcoal flex items-center justify-center relative">
                    {camera.status === 'online' ? (
                      <>
                        <div className="text-center">
                          <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Live Feed</p>
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-red-500/80 text-white text-xs">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          REC
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {camera.status === 'offline' ? 'Camera Offline' : 'Under Maintenance'}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-background">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{camera.name}</h4>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)}`} />
                        <span className="text-xs text-muted-foreground capitalize">{camera.status}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{camera.location}</p>
                    <div className="flex flex-wrap gap-1">
                      {camera.detection_modes.slice(0, 2).map((mode) => (
                        <Badge key={mode} variant="secondary" className="text-xs">
                          {getAlertTypeLabel(mode).split(' ')[0]}
                        </Badge>
                      ))}
                      {camera.detection_modes.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{camera.detection_modes.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Detections from API */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Detections
              {isConnected && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Live from Python API
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentDetections.length > 0 ? (
              <div className="space-y-3">
                {recentDetections.map((detection) => (
                  <div key={detection.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${detection.type.includes('suspicious') || detection.type.includes('theft') ? 'bg-orange-500/20' : 'bg-cyan-500/20'} flex items-center justify-center`}>
                        {getAlertIcon(detection.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getAlertTypeLabel(detection.type)}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{detection.camera}</span>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{new Date(detection.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(detection.confidence * 100)}%
                      </Badge>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No detections yet</p>
                <p className="text-sm">Detections from your Python algorithm will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
