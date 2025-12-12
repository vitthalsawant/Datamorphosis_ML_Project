import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShoppingBag, 
  Heart, 
  Gift, 
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Diamond,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Orders', value: '12', icon: ShoppingBag, color: 'text-primary' },
    { label: 'Wishlist Items', value: '8', icon: Heart, color: 'text-pink-400' },
    { label: 'Reward Points', value: '2,450', icon: Gift, color: 'text-amber-400' },
    { label: 'Appointments', value: '2', icon: Calendar, color: 'text-blue-400' },
  ];

  const recentOrders = [
    { id: 'ORD-2024-001', item: 'Gold Necklace Set', status: 'Delivered', date: 'Dec 5, 2024', amount: '₹45,000' },
    { id: 'ORD-2024-002', item: 'Diamond Ring', status: 'In Transit', date: 'Dec 8, 2024', amount: '₹1,25,000' },
    { id: 'ORD-2024-003', item: 'Pearl Earrings', status: 'Processing', date: 'Dec 10, 2024', amount: '₹18,500' },
  ];

  const exclusiveCollections = [
    { name: 'Bridal Collection', items: 45, image: '💎' },
    { name: 'Festive Gold', items: 32, image: '✨' },
    { name: 'Diamond Classics', items: 28, image: '💍' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm text-primary font-medium">Premium Member</span>
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Welcome back, {user?.fullName.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Explore our exclusive collections and enjoy personalized recommendations 
              crafted just for you.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <Button variant="gold" className="gap-2">
                <Diamond className="w-4 h-4" />
                Browse Collections
              </Button>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                Book Appointment
              </Button>
            </div>
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
              <div className={`p-2 rounded-lg bg-secondary inline-flex mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Recent Orders</h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div>
                    <p className="font-medium">{order.item}</p>
                    <p className="text-xs text-muted-foreground">{order.id} • {order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{order.amount}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                      order.status === 'In Transit' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold">Loyalty Rewards</h2>
            </div>
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto rounded-full gold-gradient flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                <Gift className="w-10 h-10 text-background" />
              </div>
              <p className="text-4xl font-bold gold-text mb-1">2,450</p>
              <p className="text-sm text-muted-foreground mb-4">Reward Points</p>
              <div className="flex items-center justify-center gap-1 text-xs text-green-400 mb-4">
                <TrendingUp className="w-3 h-3" />
                <span>+350 points this month</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Redeem Points
              </Button>
            </div>
          </div>
        </div>

        {/* Exclusive Collections */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="font-display text-lg font-bold mb-4">Exclusive Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exclusiveCollections.map((collection) => (
              <div 
                key={collection.name}
                className="p-6 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 hover:from-primary/10 hover:to-secondary cursor-pointer transition-all duration-300 hover-lift"
              >
                <span className="text-4xl mb-4 block">{collection.image}</span>
                <h3 className="font-display font-bold">{collection.name}</h3>
                <p className="text-sm text-muted-foreground">{collection.items} items</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Appointment */}
        <div className="glass-card rounded-xl p-6 border-l-4 border-primary">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20 text-primary">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Upcoming Appointment</h3>
              <p className="text-sm text-muted-foreground">
                Private viewing session - Bridal Collection
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">Dec 15, 2024</p>
              <p className="text-sm text-muted-foreground">3:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
