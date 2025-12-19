import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DataMorphosisLogo } from '@/components/DataMorphosisLogo';
import { 
  LayoutDashboard, 
  Settings, 
  Bell, 
  ChevronDown,
  Menu,
  X,
  Users,
  Building2,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Customers', path: '/admin' },
    { icon: Building2, label: 'Companies', path: '/admin' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-sidebar border-r border-sidebar-border',
          sidebarOpen ? 'w-64' : 'w-20',
          'hidden lg:block'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-4">
            {sidebarOpen ? (
              <DataMorphosisLogo variant="color" />
            ) : (
              <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                <span className="font-display text-lg font-bold text-background">D</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {sidebarOpen && <span className="font-medium">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', sidebarOpen ? '-rotate-90' : 'rotate-90')} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn('flex-1 transition-all duration-300', sidebarOpen ? 'lg:ml-64' : 'lg:ml-20')}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Left Section */}
          <div className="hidden lg:flex items-center gap-4">
            <h1 className="font-display text-xl font-bold">
              Admin Dashboard
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center">
                    <span className="font-display text-sm font-bold text-background">
                      {user?.fullName?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <span className="hidden md:block font-medium">
                    {user?.fullName || 'Admin'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="font-medium">{user?.fullName || 'Admin User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'admin@datamorphosis.in'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border p-4 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <DataMorphosisLogo variant="color" />
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav>
                <ul className="space-y-1">
                  {adminNavItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                          location.pathname === item.path
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent'
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
