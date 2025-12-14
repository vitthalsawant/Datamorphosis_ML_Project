import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  UserCheck, 
  UserX, 
  Search, 
  Loader2, 
  Building2, 
  Mail, 
  Phone, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PendingRegistration {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_id: string | null;
  company_name: string | null;
  created_at: string;
}

const AdminRequests: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      
      // Get profiles that are not approved and are customers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone,
          company_id,
          created_at
        `)
        .eq('is_approved', false);

      if (profilesError) throw profilesError;

      // Filter to only customers by checking user_roles
      const pendingWithCompanies = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Check if user is a customer
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          if (roleData?.role !== 'customer') return null;

          // Get company name if exists
          let companyName = null;
          if (profile.company_id) {
            const { data: company } = await supabase
              .from('companies')
              .select('name')
              .eq('id', profile.company_id)
              .maybeSingle();
            companyName = company?.name || null;
          }

          return {
            ...profile,
            company_name: companyName,
          };
        })
      );

      setPendingRequests(pendingWithCompanies.filter(Boolean) as PendingRegistration[]);
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleApprove = async (profile: PendingRegistration) => {
    try {
      setProcessingId(profile.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success(`${profile.full_name} has been approved`);
      fetchPendingRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve user');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (profile: PendingRegistration) => {
    if (!confirm(`Are you sure you want to reject ${profile.full_name}'s registration? This will delete their account.`)) {
      return;
    }

    try {
      setProcessingId(profile.id);
      
      // Delete the profile (this will cascade to user_roles due to foreign key)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Delete company if it was created during registration
      if (profile.company_id) {
        await supabase
          .from('companies')
          .delete()
          .eq('id', profile.company_id);
      }

      toast.success(`${profile.full_name}'s registration has been rejected`);
      fetchPendingRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject user');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = pendingRequests.filter(request =>
    request.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (request.company_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold">Registration Requests</h1>
          <p className="text-muted-foreground">Review and approve new company registrations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No pending requests</h3>
            <p className="text-muted-foreground">
              All registration requests have been processed.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center text-background font-bold text-lg shrink-0">
                        {request.full_name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{request.full_name}</h3>
                        {request.company_name && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            {request.company_name}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {request.email}
                        </div>
                        {request.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {request.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Registered {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleReject(request)}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Reject
                      </Button>
                      <Button
                        variant="gold"
                        className="gap-2"
                        onClick={() => handleApprove(request)}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminRequests;
