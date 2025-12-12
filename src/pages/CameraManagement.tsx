import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Camera, 
  Plus, 
  Settings, 
  Power, 
  Wifi,
  WifiOff,
  MapPin,
  Eye,
  RefreshCw,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CameraData {
  id: string;
  name: string;
  location: string;
  ipAddress: string;
  status: 'online' | 'offline';
  detectionEnabled: boolean;
  lastSeen: string;
}

const CameraManagement: React.FC = () => {
  const [cameras, setCameras] = useState<CameraData[]>([
    { id: '1', name: 'Main Entrance', location: 'Ground Floor', ipAddress: '192.168.1.101', status: 'online', detectionEnabled: true, lastSeen: 'Now' },
    { id: '2', name: 'Showroom Floor', location: 'Ground Floor', ipAddress: '192.168.1.102', status: 'online', detectionEnabled: true, lastSeen: 'Now' },
    { id: '3', name: 'VIP Lounge', location: 'First Floor', ipAddress: '192.168.1.103', status: 'online', detectionEnabled: false, lastSeen: 'Now' },
    { id: '4', name: 'Storage Room', location: 'Basement', ipAddress: '192.168.1.104', status: 'offline', detectionEnabled: true, lastSeen: '3 hours ago' },
    { id: '5', name: 'Back Exit', location: 'Ground Floor', ipAddress: '192.168.1.105', status: 'online', detectionEnabled: true, lastSeen: 'Now' },
    { id: '6', name: 'Jewelry Display A', location: 'Ground Floor', ipAddress: '192.168.1.106', status: 'online', detectionEnabled: true, lastSeen: 'Now' },
    { id: '7', name: 'Jewelry Display B', location: 'Ground Floor', ipAddress: '192.168.1.107', status: 'online', detectionEnabled: true, lastSeen: 'Now' },
    { id: '8', name: 'Cash Counter', location: 'Ground Floor', ipAddress: '192.168.1.108', status: 'online', detectionEnabled: true, lastSeen: 'Now' },
  ]);

  const [newCamera, setNewCamera] = useState({
    name: '',
    location: '',
    ipAddress: '',
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid-4' | 'grid-9' | 'list'>('grid-4');

  const handleAddCamera = () => {
    if (!newCamera.name || !newCamera.ipAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    const camera: CameraData = {
      id: String(Date.now()),
      ...newCamera,
      status: 'offline',
      detectionEnabled: true,
      lastSeen: 'Never',
    };

    setCameras([...cameras, camera]);
    setNewCamera({ name: '', location: '', ipAddress: '' });
    setIsDialogOpen(false);
    toast.success('Camera added successfully');
  };

  const toggleCameraStatus = (id: string) => {
    setCameras(cameras.map(cam => 
      cam.id === id ? { ...cam, status: cam.status === 'online' ? 'offline' : 'online' } : cam
    ));
  };

  const deleteCamera = (id: string) => {
    setCameras(cameras.filter(cam => cam.id !== id));
    toast.success('Camera removed');
  };

  const onlineCount = cameras.filter(c => c.status === 'online').length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Camera className="w-8 h-8 text-primary" />
              Camera Management
            </h1>
            <p className="text-muted-foreground">
              {onlineCount} of {cameras.length} cameras online
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
              <button
                onClick={() => setViewMode('grid-4')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  viewMode === 'grid-4' ? 'bg-background shadow' : 'hover:bg-background/50'
                )}
              >
                2x2
              </button>
              <button
                onClick={() => setViewMode('grid-9')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  viewMode === 'grid-9' ? 'bg-background shadow' : 'hover:bg-background/50'
                )}
              >
                3x3
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  viewMode === 'list' ? 'bg-background shadow' : 'hover:bg-background/50'
                )}
              >
                List
              </button>
            </div>

            {/* Add Camera Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Camera
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Camera</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Camera Name *</Label>
                    <Input
                      placeholder="e.g., Main Entrance"
                      value={newCamera.name}
                      onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="e.g., Ground Floor"
                      value={newCamera.location}
                      onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IP Address / Stream URL *</Label>
                    <Input
                      placeholder="e.g., 192.168.1.100"
                      value={newCamera.ipAddress}
                      onChange={(e) => setNewCamera({ ...newCamera, ipAddress: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button variant="gold" onClick={handleAddCamera} className="flex-1">
                      Add Camera
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Camera Grid/List */}
        {viewMode === 'list' ? (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-medium">Camera</th>
                  <th className="text-left p-4 font-medium">Location</th>
                  <th className="text-left p-4 font-medium">IP Address</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Detection</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cameras.map((camera) => (
                  <tr key={camera.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                    <td className="p-4 font-medium">{camera.name}</td>
                    <td className="p-4 text-muted-foreground">{camera.location}</td>
                    <td className="p-4 font-mono text-sm">{camera.ipAddress}</td>
                    <td className="p-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                        camera.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'
                      )}>
                        {camera.status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {camera.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'text-xs',
                        camera.detectionEnabled ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {camera.detectionEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleCameraStatus(camera.id)}>
                            <Power className="w-4 h-4 mr-2" />
                            {camera.status === 'online' ? 'Disable' : 'Enable'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteCamera(camera.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={cn(
            'grid gap-4',
            viewMode === 'grid-4' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          )}>
            {cameras.map((camera, index) => (
              <div 
                key={camera.id} 
                className="glass-card rounded-xl overflow-hidden animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Camera Feed */}
                <div className="aspect-video bg-muted relative">
                  {camera.status === 'online' ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/80 flex items-center justify-center">
                        <Eye className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium bg-background/80 backdrop-blur px-2 py-0.5 rounded">Live</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-destructive/10 flex flex-col items-center justify-center">
                      <WifiOff className="w-12 h-12 text-destructive/50 mb-2" />
                      <span className="text-sm text-destructive">Camera Offline</span>
                    </div>
                  )}
                </div>

                {/* Camera Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{camera.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {camera.location}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleCameraStatus(camera.id)}>
                          <Power className="w-4 h-4 mr-2" />
                          {camera.status === 'online' ? 'Disable' : 'Enable'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Test Connection
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteCamera(camera.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono">{camera.ipAddress}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full',
                      camera.detectionEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {camera.detectionEnabled ? 'AI Active' : 'AI Off'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CameraManagement;
