import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Camera, 
  AlertTriangle, 
  TrendingUp,
  Package,
  DollarSign,
  Eye,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Total Customers', value: '1,284', change: '+12%', icon: Users, color: 'text-blue-400' },
    { label: 'Active Cameras', value: '8/10', change: 'Online', icon: Camera, color: 'text-green-400' },
    { label: 'Alerts Today', value: '12', change: '+3', icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'Revenue (MTD)', value: '₹45.2L', change: '+18%', icon: TrendingUp, color: 'text-primary' },
  ];

  const recentAlerts = [
    { type: 'Suspicious Activity', camera: 'Main Entrance', time: '2 min ago', severity: 'high' },
    { type: 'Person Count: 15+', camera: 'Showroom Floor', time: '15 min ago', severity: 'medium' },
    { type: 'VIP Detected', camera: 'VIP Lounge', time: '1 hour ago', severity: 'low' },
    { type: 'Motion After Hours', camera: 'Storage Room', time: '3 hours ago', severity: 'high' },
  ];

  const cameraFeeds = [
    { name: 'Main Entrance', status: 'online', location: 'Ground Floor' },
    { name: 'Showroom Floor', status: 'online', location: 'Ground Floor' },
    { name: 'VIP Lounge', status: 'online', location: 'First Floor' },
    { name: 'Storage Room', status: 'offline', location: 'Basement' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Welcome back, Admin</h1>
            <p className="text-muted-foreground">Here's what's happening across your stores today.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground">System Status: All Operational</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="stat-card animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-2 rounded-lg bg-primary/10", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-green-400">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Camera Preview */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Live Camera Feeds</h2>
              <a href="/admin/cameras" className="text-sm text-primary hover:underline">View All</a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {cameraFeeds.map((camera) => (
                <div key={camera.name} className="camera-feed">
                  {camera.status === 'online' ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                      <Eye className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center">
                      <span className="text-xs text-destructive">Offline</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-3">
                    <p className="text-sm font-medium">{camera.name}</p>
                    <p className="text-xs text-muted-foreground">{camera.location}</p>
                  </div>
                  {camera.status === 'online' && (
                    <div className="absolute top-2 right-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      Live
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Recent Alerts</h2>
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {recentAlerts.map((alert, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    alert.severity === 'high' ? 'bg-destructive' :
                    alert.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alert.type}</p>
                    <p className="text-xs text-muted-foreground">{alert.camera}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-xl font-bold">2,456</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-xl font-bold">₹12.8L</p>
            <p className="text-xs text-muted-foreground">Today's Sales</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-xl font-bold">23</p>
            <p className="text-xs text-muted-foreground">Active Employees</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-amber-400" />
            <p className="text-xl font-bold">+24%</p>
            <p className="text-xs text-muted-foreground">Growth Rate</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
