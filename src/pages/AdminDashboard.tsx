import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Users, AlertTriangle, Search, MoreVertical, Settings, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  is_approved: boolean;
  company_id: string | null;
}

interface Company {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [activeTab, setActiveTab] = useState<'customers' | 'companies'>('customers');

  useEffect(() => {
    // Fetch both in parallel for better performance
    Promise.all([fetchCustomers(), fetchCompanies()]);
  }, []);

  const fetchCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, contact_email, contact_phone, address, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(1000); // Add limit for performance

      if (error) {
        console.error('Error fetching companies:', error);
        toast.error('Failed to load companies');
        return;
      }

      setCompanies((data || []) as Company[]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load companies');
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      
      // Optimized: Use RPC function which is faster and has proper indexes
      const { data: registrations, error: funcError } = await supabase
        .rpc('get_all_registrations');

      if (funcError) {
        console.warn('Function error, falling back to direct query:', funcError);
        
        // Fallback: Direct query with optimized select
        const { data: customerRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'customer')
          .limit(1000);

        if (roleError) {
          console.error('Error fetching customer roles:', roleError);
          toast.error('Failed to load customers');
          return;
        }

        const customerUserIds = customerRoles?.map(r => r.user_id) || [];

        if (customerUserIds.length === 0) {
          setCustomers([]);
          setIsLoading(false);
          return;
        }

        // Fetch profiles for customer users with optimized select
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, email, phone, created_at, is_approved, company_id')
          .in('user_id', customerUserIds)
          .order('created_at', { ascending: false })
          .limit(1000);

        if (error) {
          console.error('Error fetching profiles:', error);
          toast.error('Failed to load customers');
          return;
        }

        setCustomers((profiles || []) as CustomerProfile[]);
      } else {
        // Use function result - map to CustomerProfile format
        const mappedCustomers = (registrations || []).map((r: any) => ({
          id: r.id,
          full_name: r.full_name,
          email: r.email,
          phone: r.phone,
          created_at: r.created_at,
          is_approved: r.is_approved,
          company_id: r.company_id,
        }));
        setCustomers(mappedCustomers);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.contact_phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCustomers = customers.filter(c => c.is_approved).length;
  const activeCompanies = companies.filter(c => c.is_active).length;


  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">View and manage customers and companies</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'customers'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'companies'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Companies
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                  <Users className="w-5 h-5 text-background" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customers.length}</p>
                  <p className="text-xs text-muted-foreground">Total Customers</p>
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
                  <p className="text-2xl font-bold">{activeCustomers}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
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
                  <p className="text-2xl font-bold">{customers.length - activeCustomers}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{companies.length}</p>
                  <p className="text-xs text-muted-foreground">Companies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'customers' ? 'Search customers...' : 'Search companies...'}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {(isLoading && activeTab === 'customers') || (isLoadingCompanies && activeTab === 'companies') ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeTab === 'customers' ? (
          /* Customers Tab */
          filteredCustomers.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No customers found matching your search.' : 'No registered customers yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                className={`glass-card hover-lift transition-all ${!customer.is_approved ? 'opacity-75' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center text-background font-bold text-lg">
                        {customer.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{customer.full_name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={async () => {
                          const { error } = await supabase
                            .from('profiles')
                            .update({ is_approved: !customer.is_approved })
                            .eq('id', customer.id);
                          
                          if (error) {
                            toast.error('Failed to update approval status');
                          } else {
                            toast.success(`Customer ${customer.is_approved ? 'unapproved' : 'approved'}`);
                            fetchCustomers();
                          }
                        }}>
                          <Settings className="w-4 h-4 mr-2" />
                          {customer.is_approved ? 'Unapprove' : 'Approve'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{customer.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Registered:</span>
                      <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs ${customer.is_approved ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                      {customer.is_approved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )
        ) : (
          /* Companies Tab */
          filteredCompanies.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No companies found matching your search.' : 'No companies registered yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <Card 
                  key={company.id} 
                  className={`glass-card hover-lift transition-all ${!company.is_active ? 'opacity-75' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{company.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{company.contact_email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={async () => {
                            const { error } = await supabase
                              .from('companies')
                              .update({ is_active: !company.is_active })
                              .eq('id', company.id);
                            
                            if (error) {
                              toast.error('Failed to update company status');
                            } else {
                              toast.success(`Company ${company.is_active ? 'deactivated' : 'activated'}`);
                              fetchCompanies();
                            }
                          }}>
                            <Settings className="w-4 h-4 mr-2" />
                            {company.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{company.contact_phone || 'Not provided'}</span>
                      </div>
                      {company.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Address:</span>
                          <span className="truncate">{company.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(company.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs ${company.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                        {company.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
