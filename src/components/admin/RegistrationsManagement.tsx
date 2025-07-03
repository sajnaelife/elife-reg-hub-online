import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, CheckCircle, XCircle, Edit } from 'lucide-react';
import * as XLSX from 'xlsx';
type ApplicationStatus = 'pending' | 'approved' | 'rejected';
interface Registration {
  id: string;
  customer_id: string;
  name: string;
  mobile_number: string;
  address: string;
  ward: string;
  agent_pro: string | null;
  status: ApplicationStatus;
  fee_paid: number;
  created_at: string;
  updated_at: string;
  category_id: string;
  panchayath_id: string | null;
  categories: {
    name: string;
  } | null;
  panchayaths: {
    name: string;
    district: string;
  } | null;
}
interface Category {
  id: string;
  name: string;
}
interface UpdateStatusParams {
  id: string;
  status: ApplicationStatus;
}
const RegistrationsManagement = ({
  permissions
}: {
  permissions: any;
}) => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [panchayathFilter, setPanchayathFilter] = useState<string>('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  console.log('RegistrationsManagement permissions:', permissions);

  // Fetch registrations with real-time updates
  const {
    data: registrations,
    isLoading,
    error
  } = useQuery({
    queryKey: ['admin-registrations', searchTerm, statusFilter, categoryFilter, panchayathFilter],
    queryFn: async () => {
      console.log('Fetching registrations...');
      let query = supabase.from('registrations').select(`
          *,
          categories (name),
          panchayaths (name, district)
        `).order('created_at', {
        ascending: false
      });
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,mobile_number.ilike.%${searchTerm}%,customer_id.ilike.%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as ApplicationStatus);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }
      if (panchayathFilter !== 'all') {
        query = query.eq('panchayath_id', panchayathFilter);
      }
      const {
        data,
        error
      } = await query;
      if (error) {
        console.error('Error fetching registrations:', error);
        throw error;
      }
      console.log('Fetched registrations:', data);
      return data as Registration[];
    }
  });

  // Fetch categories for filter
  const {
    data: categories
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('categories').select('*');
      if (error) throw error;
      return data as Category[];
    }
  });

  // Fetch panchayaths for filter
  const {
    data: panchayaths
  } = useQuery({
    queryKey: ['panchayaths'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('panchayaths').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase.channel('registrations-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'registrations'
    }, () => {
      console.log('Real-time update received for registrations');
      queryClient.invalidateQueries({
        queryKey: ['admin-registrations']
      });
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status
    }: UpdateStatusParams) => {
      console.log('Updating status for registration:', id, 'to:', status);
      const {
        error
      } = await supabase.from('registrations').update({
        status,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) {
        console.error('Error updating status:', error);
        throw error;
      }
      console.log('Status updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-registrations']
      });
      toast({
        title: "Status Updated",
        description: "Registration status has been updated successfully."
      });
    },
    onError: error => {
      console.error('Status update failed:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update registration status.",
        variant: "destructive"
      });
    }
  });

  // Delete registration mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting registration:', id);
      const {
        error
      } = await supabase.from('registrations').delete().eq('id', id);
      if (error) {
        console.error('Error deleting registration:', error);
        throw error;
      }
      console.log('Registration deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-registrations']
      });
      toast({
        title: "Registration Deleted",
        description: "Registration has been deleted successfully."
      });
    },
    onError: error => {
      console.error('Delete failed:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete registration.",
        variant: "destructive"
      });
    }
  });
  const handleStatusUpdate = (id: string, status: ApplicationStatus) => {
    console.log('Handle status update called:', id, status, 'canWrite:', permissions.canWrite);
    if (permissions.canWrite) {
      updateStatusMutation.mutate({
        id,
        status
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to update registrations.",
        variant: "destructive"
      });
    }
  };
  const handleDelete = (id: string) => {
    console.log('Handle delete called:', id, 'canDelete:', permissions.canDelete);
    if (permissions.canDelete) {
      if (window.confirm('Are you sure you want to delete this registration?')) {
        deleteMutation.mutate(id);
      }
    } else {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete registrations.",
        variant: "destructive"
      });
    }
  };
  const handleEdit = (registration: Registration) => {
    setEditingRegistration(registration);
    setIsEditDialogOpen(true);
  };
  const handleBulkApprove = () => {
    if (selectedRows.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select registrations to approve.",
        variant: "destructive"
      });
      return;
    }
    selectedRows.forEach(id => {
      updateStatusMutation.mutate({
        id,
        status: 'approved'
      });
    });
    setSelectedRows([]);
  };
  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
  };
  const toggleAllSelection = () => {
    if (selectedRows.length === registrations?.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(registrations?.map(r => r.id) || []);
    }
  };
  const exportToExcel = () => {
    if (!registrations) return;
    const exportData = registrations.map(reg => ({
      'Customer ID': reg.customer_id,
      'Name': reg.name,
      'Mobile Number': reg.mobile_number,
      'Address': reg.address,
      'Category': reg.categories?.name,
      'Panchayath': reg.panchayaths?.name,
      'District': reg.panchayaths?.district,
      'Ward': reg.ward,
      'Agent/PRO': reg.agent_pro || '',
      'Status': reg.status,
      'Fee Paid': reg.fee_paid,
      'Applied Date': new Date(reg.created_at).toLocaleDateString('en-IN'),
      'Updated Date': new Date(reg.updated_at).toLocaleDateString('en-IN')
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
    XLSX.writeFile(workbook, `registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({
      title: "Export Successful",
      description: "Registrations have been exported to Excel."
    });
  };
  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="text-yellow-800 bg-orange-500">Pending</Badge>;
    }
  };
  if (error) {
    return <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading registrations: {error.message}
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Registrations Management</CardTitle>
          <div className="flex gap-2">
            {selectedRows.length > 0 && <Button onClick={handleBulkApprove} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4" />
                Bulk Approve ({selectedRows.length})
              </Button>}
            <Button onClick={exportToExcel} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name, mobile, or customer ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map(category => <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={panchayathFilter} onValueChange={setPanchayathFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by panchayath" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Panchayaths</SelectItem>
              {panchayaths?.map(panchayath => <SelectItem key={panchayath.id} value={panchayath.id}>
                  {panchayath.name}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Registrations Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left">
                  <input type="checkbox" checked={selectedRows.length === registrations?.length && registrations?.length > 0} onChange={toggleAllSelection} className="mr-2" />
                  Select
                </th>
                <th className="border border-gray-200 px-4 py-2 text-left">Customer ID</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Mobile</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Category</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Fee</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations?.map(registration => <tr key={registration.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2">
                    <input type="checkbox" checked={selectedRows.includes(registration.id)} onChange={() => toggleRowSelection(registration.id)} />
                  </td>
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                    {registration.customer_id}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">{registration.name}</td>
                  <td className="border border-gray-200 px-4 py-2">{registration.mobile_number}</td>
                  <td className="border border-gray-200 px-4 py-2 bg-slate-50">
                    {registration.categories?.name}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {getStatusBadge(registration.status)}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">₹{registration.fee_paid}</td>
                  <td className="border border-gray-200 px-4 py-2">
                    {new Date(registration.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    <div className="flex gap-2">
                      {permissions.canWrite && <Button size="sm" variant="outline" onClick={() => handleEdit(registration)}>
                          <Edit className="h-3 w-3" />
                        </Button>}
                      {permissions.canWrite && registration.status === 'pending' && <>
                          <Button size="sm" onClick={() => handleStatusUpdate(registration.id, 'approved')} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(registration.id, 'rejected')}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>}
                      {permissions.canDelete && <Button size="sm" variant="outline" onClick={() => handleDelete(registration.id)}>
                          Delete
                        </Button>}
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {isLoading && <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>}

        {!isLoading && (!registrations || registrations.length === 0) && <div className="text-center py-8 text-gray-500">
            No registrations found matching your criteria.
          </div>}
      </CardContent>
    </Card>;
};
export default RegistrationsManagement;