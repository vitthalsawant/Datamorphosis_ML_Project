import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ClipboardList, 
  Users, 
  Package, 
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  MessageSquare,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Tasks Today', value: '8', completed: 5, icon: ClipboardList, color: 'text-blue-400' },
    { label: 'Customers Served', value: '12', icon: Users, color: 'text-green-400' },
    { label: 'Sales Today', value: '₹4.2L', icon: TrendingUp, color: 'text-primary' },
    { label: 'Shift Ends', value: '6:00 PM', icon: Clock, color: 'text-purple-400' },
  ];

  const tasks = [
    { id: 1, title: 'Assist VIP customer - Mrs. Sharma', priority: 'high', status: 'pending', time: '10:30 AM' },
    { id: 2, title: 'Update inventory - Gold section', priority: 'medium', status: 'completed', time: '11:00 AM' },
    { id: 3, title: 'Process return - Order #2847', priority: 'medium', status: 'completed', time: '11:30 AM' },
    { id: 4, title: 'New arrival display setup', priority: 'low', status: 'pending', time: '2:00 PM' },
    { id: 5, title: 'Customer follow-up calls', priority: 'medium', status: 'pending', time: '4:00 PM' },
  ];

  const upcomingCustomers = [
    { name: 'Anita Kapoor', time: '2:30 PM', type: 'Appointment', purpose: 'Bridal consultation' },
    { name: 'Vikram Singh', time: '3:00 PM', type: 'Walk-in VIP', purpose: 'Diamond purchase' },
    { name: 'Meera Patel', time: '4:30 PM', type: 'Appointment', purpose: 'Ring resizing' },
  ];

  const quickInventory = [
    { category: 'Gold Necklaces', stock: 45, status: 'good' },
    { category: 'Diamond Rings', stock: 12, status: 'low' },
    { category: 'Silver Earrings', stock: 89, status: 'good' },
    { category: 'Platinum Bands', stock: 8, status: 'critical' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Good afternoon, {user?.fullName.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground">
              You have 3 pending tasks and 2 upcoming appointments today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </Button>
            <Button variant="gold" className="gap-2">
              <Target className="w-4 h-4" />
              Start Task
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="stat-card animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={cn("p-2 rounded-lg bg-secondary/80 inline-flex mb-3", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {stat.completed !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(stat.completed / parseInt(stat.value)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.completed}/{stat.value}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Tasks */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Today's Tasks</h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg transition-colors',
                    task.status === 'completed' ? 'bg-secondary/30' : 'bg-secondary/50 hover:bg-secondary'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center',
                    task.status === 'completed' ? 'bg-green-500' : 'border-2 border-muted-foreground'
                  )}>
                    {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-background" />}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      'font-medium',
                      task.status === 'completed' && 'line-through text-muted-foreground'
                    )}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{task.time}</p>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    task.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                    task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-blue-500/20 text-blue-400'
                  )}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Customers */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold">Upcoming</h2>
            </div>
            <div className="space-y-4">
              {upcomingCustomers.map((customer, index) => (
                <div key={index} className="p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{customer.name}</p>
                    <span className="text-xs text-primary">{customer.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{customer.purpose}</p>
                  <span className={cn(
                    'inline-block mt-2 text-xs px-2 py-0.5 rounded-full',
                    customer.type === 'Walk-in VIP' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                  )}>
                    {customer.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Inventory Check */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Inventory Quick Check
            </h2>
            <Button variant="outline" size="sm">Full Inventory</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickInventory.map((item) => (
              <div key={item.category} className="p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className={cn(
                    'w-4 h-4',
                    item.status === 'good' ? 'text-green-400' :
                    item.status === 'low' ? 'text-amber-400' : 'text-destructive'
                  )} />
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    item.status === 'good' ? 'bg-green-500/20 text-green-400' :
                    item.status === 'low' ? 'bg-amber-500/20 text-amber-400' : 'bg-destructive/20 text-destructive'
                  )}>
                    {item.status}
                  </span>
                </div>
                <p className="text-2xl font-bold">{item.stock}</p>
                <p className="text-xs text-muted-foreground">{item.category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
