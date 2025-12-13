import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, AlertTriangle, Users, Shield, Play, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data - in real app, fetch based on companyId
const MOCK_COMPANY = {
  id: '1',
  name: 'Ranka Jewellers',
  cameras: [
    { id: '1', name: 'Main Entrance', location: 'Ground Floor', status: 'online', detection_modes: ['face_recognition', 'person_counting'] },
    { id: '2', name: 'Showroom A', location: 'Ground Floor', status: 'online', detection_modes: ['theft_alert', 'suspicious_behavior'] },
    { id: '3', name: 'Vault Area', location: 'Basement', status: 'online', detection_modes: ['face_recognition', 'theft_alert'] },
    { id: '4', name: 'Back Office', location: 'First Floor', status: 'offline', detection_modes: ['person_counting'] },
    { id: '5', name: 'Parking Lot', location: 'Basement', status: 'online', detection_modes: ['vip_recognition', 'crowd_density'] },
    { id: '6', name: 'Emergency Exit', location: 'Ground Floor', status: 'maintenance', detection_modes: ['suspicious_behavior'] },
  ],
  recent_alerts: [
    { id: '1', type: 'suspicious_behavior', camera: 'Showroom A', time: '2 min ago', confidence: 87 },
    { id: '2', type: 'crowd_density', camera: 'Main Entrance', time: '15 min ago', confidence: 92 },
    { id: '3', type: 'vip_recognition', camera: 'Parking Lot', time: '1 hour ago', confidence: 95 },
  ],
};

const CompanyDashboard: React.FC = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold">{MOCK_COMPANY.name}</h1>
            <p className="text-muted-foreground">Security Dashboard • Company ID: {companyId}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{MOCK_COMPANY.cameras.filter(c => c.status === 'online').length}</p>
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
                  <p className="text-2xl font-bold">{MOCK_COMPANY.cameras.filter(c => c.status === 'offline').length}</p>
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
                  <p className="text-2xl font-bold">{MOCK_COMPANY.recent_alerts.length}</p>
                  <p className="text-xs text-muted-foreground">Recent Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                  <Shield className="w-5 h-5 text-background" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Active</p>
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
              Camera Feeds
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/company/${companyId}/cameras`)}>
              <Settings className="w-4 h-4 mr-2" />
              Manage Cameras
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_COMPANY.cameras.map((camera) => (
                <div key={camera.id} className="relative rounded-lg overflow-hidden border border-border">
                  {/* Camera Feed Placeholder */}
                  <div className="aspect-video bg-charcoal flex items-center justify-center">
                    {camera.status === 'online' ? (
                      <div className="text-center">
                        <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Live Feed</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {camera.status === 'offline' ? 'Camera Offline' : 'Under Maintenance'}
                      </p>
                    )}
                  </div>
                  {/* Camera Info */}
                  <div className="p-3 bg-background">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{camera.name}</h4>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)}`} />
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

        {/* Recent Alerts */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_COMPANY.recent_alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{getAlertTypeLabel(alert.type)}</p>
                      <p className="text-xs text-muted-foreground">{alert.camera} • {alert.time}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.confidence}% confidence
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CompanyDashboard;
