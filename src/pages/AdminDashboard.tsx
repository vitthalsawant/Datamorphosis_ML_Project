import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, Users, Camera, AlertTriangle, Search, MoreVertical, Eye, Settings, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

// Mock data for companies
const MOCK_COMPANIES = [
  {
    id: '1',
    name: 'Ranka Jewellers',
    logo_url: null,
    contact_email: 'admin@ranka.com',
    contact_phone: '+91 9876543210',
    address: 'Pune, Maharashtra',
    is_active: true,
    cameras_count: 12,
    alerts_today: 3,
    users_count: 8,
  },
  {
    id: '2',
    name: 'Tanishq Store',
    logo_url: null,
    contact_email: 'security@tanishq.com',
    contact_phone: '+91 9876543211',
    address: 'Mumbai, Maharashtra',
    is_active: true,
    cameras_count: 24,
    alerts_today: 7,
    users_count: 15,
  },
  {
    id: '3',
    name: 'Kalyan Jewellers',
    logo_url: null,
    contact_email: 'admin@kalyan.com',
    contact_phone: '+91 9876543212',
    address: 'Chennai, Tamil Nadu',
    is_active: true,
    cameras_count: 18,
    alerts_today: 2,
    users_count: 12,
  },
  {
    id: '4',
    name: 'Malabar Gold',
    logo_url: null,
    contact_email: 'security@malabar.com',
    contact_phone: '+91 9876543213',
    address: 'Kochi, Kerala',
    is_active: false,
    cameras_count: 8,
    alerts_today: 0,
    users_count: 5,
  },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
  });

  const filteredCompanies = MOCK_COMPANIES.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.contact_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCameras = MOCK_COMPANIES.reduce((sum, c) => sum + c.cameras_count, 0);
  const totalAlerts = MOCK_COMPANIES.reduce((sum, c) => sum + c.alerts_today, 0);
  const activeCompanies = MOCK_COMPANIES.filter(c => c.is_active).length;

  const handleAddCompany = () => {
    console.log('Adding company:', newCompany);
    setIsAddDialogOpen(false);
    setNewCompany({ name: '', contact_email: '', contact_phone: '', address: '' });
  };

  const handleViewCompany = (companyId: string) => {
    navigate(`/admin/company/${companyId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Customer Companies</h1>
            <p className="text-muted-foreground">Manage your client companies and their security systems</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Enter company name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Contact Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    placeholder="admin@company.com"
                    value={newCompany.contact_email}
                    onChange={(e) => setNewCompany({ ...newCompany, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Contact Phone</Label>
                  <Input
                    id="company-phone"
                    placeholder="+91 9876543210"
                    value={newCompany.contact_phone}
                    onChange={(e) => setNewCompany({ ...newCompany, contact_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Address</Label>
                  <Input
                    id="company-address"
                    placeholder="City, State"
                    value={newCompany.address}
                    onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  />
                </div>
                <Button variant="gold" className="w-full" onClick={handleAddCompany}>
                  Add Company
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-background" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCompanies}</p>
                  <p className="text-xs text-muted-foreground">Active Companies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCameras}</p>
                  <p className="text-xs text-muted-foreground">Total Cameras</p>
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
                  <p className="text-2xl font-bold">{totalAlerts}</p>
                  <p className="text-xs text-muted-foreground">Alerts Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{MOCK_COMPANIES.reduce((sum, c) => sum + c.users_count, 0)}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Company Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Card 
              key={company.id} 
              className={`glass-card hover-lift cursor-pointer transition-all ${!company.is_active ? 'opacity-60' : ''}`}
              onClick={() => handleViewCompany(company.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center text-background font-bold text-lg">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{company.address}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewCompany(company.id); }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <p className="text-lg font-bold">{company.cameras_count}</p>
                    <p className="text-xs text-muted-foreground">Cameras</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <p className="text-lg font-bold">{company.alerts_today}</p>
                    <p className="text-xs text-muted-foreground">Alerts</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <p className="text-lg font-bold">{company.users_count}</p>
                    <p className="text-xs text-muted-foreground">Users</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{company.contact_email}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${company.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {company.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
