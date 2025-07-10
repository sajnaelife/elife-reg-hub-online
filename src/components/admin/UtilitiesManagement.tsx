
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

interface Utility {
  id: string;
  name: string;
  url: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UtilitiesManagementProps {
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
}

const UtilitiesManagement = ({ permissions }: UtilitiesManagementProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUtility, setEditingUtility] = useState<Utility | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: utilities = [], isLoading } = useQuery({
    queryKey: ['utilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utilities')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Utility[];
    },
    enabled: permissions.canRead
  });

  const createUtilityMutation = useMutation({
    mutationFn: async (newUtility: Omit<Utility, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('utilities')
        .insert(newUtility)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities'] });
      toast({
        title: "Success",
        description: "Utility created successfully",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create utility",
        variant: "destructive",
      });
      console.error('Error creating utility:', error);
    }
  });

  const updateUtilityMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Utility> & { id: string }) => {
      const { data, error } = await supabase
        .from('utilities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities'] });
      toast({
        title: "Success",
        description: "Utility updated successfully",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update utility",
        variant: "destructive",
      });
      console.error('Error updating utility:', error);
    }
  });

  const deleteUtilityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('utilities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities'] });
      toast({
        title: "Success",
        description: "Utility deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete utility",
        variant: "destructive",
      });
      console.error('Error deleting utility:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and URL are required",
        variant: "destructive",
      });
      return;
    }

    if (editingUtility) {
      updateUtilityMutation.mutate({
        id: editingUtility.id,
        ...formData
      });
    } else {
      createUtilityMutation.mutate(formData);
    }
  };

  const handleEdit = (utility: Utility) => {
    setEditingUtility(utility);
    setFormData({
      name: utility.name,
      url: utility.url,
      description: utility.description || '',
      is_active: utility.is_active
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUtility(null);
    setFormData({
      name: '',
      url: '',
      description: '',
      is_active: true
    });
  };

  const handleToggleActive = (utility: Utility) => {
    updateUtilityMutation.mutate({
      id: utility.id,
      is_active: !utility.is_active
    });
  };

  if (!permissions.canRead) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">You don't have permission to view utilities.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Utilities Management</h2>
          <p className="text-muted-foreground">Manage website links and utilities</p>
        </div>
        {permissions.canWrite && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Utility
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUtility ? 'Edit Utility' : 'Add New Utility'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Government Portal"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the utility"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingUtility ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilities ({utilities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : utilities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No utilities found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utilities.map((utility) => (
                  <TableRow key={utility.id}>
                    <TableCell className="font-medium">{utility.name}</TableCell>
                    <TableCell>
                      <a 
                        href={utility.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {utility.url.length > 40 ? `${utility.url.substring(0, 40)}...` : utility.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>{utility.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={utility.is_active ? "default" : "secondary"}>
                          {utility.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {permissions.canWrite && (
                          <Switch
                            checked={utility.is_active}
                            onCheckedChange={() => handleToggleActive(utility)}
                            size="sm"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {permissions.canWrite && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(utility)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {permissions.canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteUtilityMutation.mutate(utility.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UtilitiesManagement;
