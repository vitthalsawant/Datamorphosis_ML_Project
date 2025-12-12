import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Brain, 
  User, 
  Users, 
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Activity,
  Eye,
  Bell,
  Mail,
  Smartphone,
  Save,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface DetectionMode {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  sensitivity: number;
}

const DetectionSettings: React.FC = () => {
  const [detectionModes, setDetectionModes] = useState<DetectionMode[]>([
    { id: 'face', name: 'Face Recognition', description: 'Identify known customers and employees', icon: User, enabled: true, sensitivity: 75 },
    { id: 'count', name: 'Person Counting', description: 'Track foot traffic and occupancy', icon: Users, enabled: true, sensitivity: 80 },
    { id: 'suspicious', name: 'Suspicious Behavior', description: 'Detect unusual movements or loitering', icon: AlertTriangle, enabled: true, sensitivity: 60 },
    { id: 'theft', name: 'Theft Alert', description: 'Monitor for potential theft attempts', icon: ShieldAlert, enabled: true, sensitivity: 85 },
    { id: 'crowd', name: 'Crowd Density', description: 'Alert when areas become overcrowded', icon: Activity, enabled: false, sensitivity: 70 },
    { id: 'vip', name: 'VIP Recognition', description: 'Notify staff when VIP customers arrive', icon: UserCheck, enabled: true, sensitivity: 90 },
  ]);

  const [alertSettings, setAlertSettings] = useState({
    email: true,
    sms: false,
    dashboard: true,
    emailAddress: 'security@ranka.com',
    phoneNumber: '+91 9876543210',
  });

  const toggleMode = (id: string) => {
    setDetectionModes(modes => 
      modes.map(mode => 
        mode.id === id ? { ...mode, enabled: !mode.enabled } : mode
      )
    );
  };

  const updateSensitivity = (id: string, value: number[]) => {
    setDetectionModes(modes => 
      modes.map(mode => 
        mode.id === id ? { ...mode, sensitivity: value[0] } : mode
      )
    );
  };

  const handleSave = () => {
    toast.success('Detection settings saved successfully');
  };

  const handleReset = () => {
    // Reset to defaults
    setDetectionModes(modes => 
      modes.map(mode => ({ ...mode, sensitivity: 75 }))
    );
    toast.success('Settings reset to defaults');
  };

  const enabledCount = detectionModes.filter(m => m.enabled).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" />
              AI Detection Settings
            </h1>
            <p className="text-muted-foreground">
              {enabledCount} of {detectionModes.length} detection modes active
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset Defaults
            </Button>
            <Button variant="gold" onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Detection Modes */}
        <div className="grid md:grid-cols-2 gap-4">
          {detectionModes.map((mode, index) => (
            <div 
              key={mode.id}
              className={cn(
                'glass-card rounded-xl p-6 transition-all duration-300 animate-slide-up',
                mode.enabled ? 'ring-1 ring-primary/30' : 'opacity-70'
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2.5 rounded-xl transition-colors',
                    mode.enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    <mode.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{mode.name}</h3>
                    <p className="text-sm text-muted-foreground">{mode.description}</p>
                  </div>
                </div>
                <Switch
                  checked={mode.enabled}
                  onCheckedChange={() => toggleMode(mode.id)}
                />
              </div>

              {mode.enabled && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Sensitivity</Label>
                    <span className="text-sm font-medium text-primary">{mode.sensitivity}%</span>
                  </div>
                  <Slider
                    value={[mode.sensitivity]}
                    onValueChange={(value) => updateSensitivity(mode.id, value)}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Alert Configuration */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Alert Configuration
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Alert Methods */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Notification Methods</h3>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Dashboard Alerts</p>
                    <p className="text-xs text-muted-foreground">Show in notification panel</p>
                  </div>
                </div>
                <Switch
                  checked={alertSettings.dashboard}
                  onCheckedChange={(checked) => setAlertSettings({ ...alertSettings, dashboard: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Send to security team</p>
                  </div>
                </div>
                <Switch
                  checked={alertSettings.email}
                  onCheckedChange={(checked) => setAlertSettings({ ...alertSettings, email: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">SMS Alerts</p>
                    <p className="text-xs text-muted-foreground">Critical alerts only</p>
                  </div>
                </div>
                <Switch
                  checked={alertSettings.sms}
                  onCheckedChange={(checked) => setAlertSettings({ ...alertSettings, sms: checked })}
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact Details</h3>
              
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={alertSettings.emailAddress}
                  onChange={(e) => setAlertSettings({ ...alertSettings, emailAddress: e.target.value })}
                  disabled={!alertSettings.email}
                  className={cn(!alertSettings.email && 'opacity-50')}
                />
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={alertSettings.phoneNumber}
                  onChange={(e) => setAlertSettings({ ...alertSettings, phoneNumber: e.target.value })}
                  disabled={!alertSettings.sms}
                  className={cn(!alertSettings.sms && 'opacity-50')}
                />
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-primary">
                  <strong>Tip:</strong> High sensitivity may increase false positives. 
                  We recommend starting at 70% and adjusting based on your environment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detection Logs Preview */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Recent Detection Events</h2>
            <Button variant="outline" size="sm">View All Logs</Button>
          </div>
          
          <div className="space-y-2">
            {[
              { type: 'Face Recognition', camera: 'Main Entrance', time: '2 min ago', confidence: '94%' },
              { type: 'Person Count: 12', camera: 'Showroom Floor', time: '5 min ago', confidence: '99%' },
              { type: 'VIP Detected', camera: 'Main Entrance', time: '18 min ago', confidence: '87%' },
              { type: 'Suspicious Movement', camera: 'Storage Room', time: '45 min ago', confidence: '72%' },
            ].map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-sm">{event.type}</p>
                    <p className="text-xs text-muted-foreground">{event.camera}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{event.time}</p>
                  <p className="text-xs text-primary">Confidence: {event.confidence}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DetectionSettings;
