
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Image } from 'lucide-react';

interface CategoryData {
  name: string;
  actual_fee: string;
  offer_fee: string;
  popup_image_url: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  actual_fee: number;
  offer_fee: number;
  popup_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CategoriesManagement = ({ permissions }: { permissions: any }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryData>({
    name: '',
    actual_fee: '',
    offer_fee: '',
    popup_image_url: '',
    is_active: true
  });

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    }
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Create/Update category mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (categoryData: CategoryData) => {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            ...categoryData,
            actual_fee: parseFloat(categoryData.actual_fee),
            offer_fee: parseFloat(categoryData.offer_fee),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{
            ...categoryData,
            actual_fee: parseFloat(categoryData.actual_fee),
            offer_fee: parseFloat(categoryData.offer_fee)
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        actual_fee: '',
        offer_fee: '',
        popup_image_url: '',
        is_active: true
      });
      toast({
        title: editingCategory ? "Category Updated" : "Category Created",
        description: `Category has been ${editingCategory ? 'updated' : 'created'} successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Operation Failed",
        description: "Failed to save category. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({
        title: "Category Deleted",
        description: "Category has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete category. It may be in use by registrations.",
        variant: "destructive"
      });
    }
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      actual_fee: category.actual_fee.toString(),
      offer_fee: category.offer_fee.toString(),
      popup_image_url: category.popup_image_url || '',
      is_active: category.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (permissions.canDelete) {
      if (window.confirm('Are you sure you want to delete this category?')) {
        deleteCategoryMutation.mutate(id);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (permissions.canWrite) {
      saveCategoryMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      actual_fee: '',
      offer_fee: '',
      popup_image_url: '',
      is_active: true
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Categories Management</CardTitle>
          {permissions.canWrite && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="actual_fee">Actual Fee (₹)</Label>
                      <Input
                        id="actual_fee"
                        type="number"
                        step="0.01"
                        value={formData.actual_fee}
                        onChange={(e) => setFormData(prev => ({ ...prev, actual_fee: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="offer_fee">Offer Fee (₹)</Label>
                      <Input
                        id="offer_fee"
                        type="number"
                        step="0.01"
                        value={formData.offer_fee}
                        onChange={(e) => setFormData(prev => ({ ...prev, offer_fee: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="popup_image_url">Popup Image URL</Label>
                    <Input
                      id="popup_image_url"
                      type="url"
                      value={formData.popup_image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, popup_image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingCategory ? 'Update' : 'Create'} Category
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Actual Fee</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Offer Fee</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Discount</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Image</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories?.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-medium">
                    {category.name}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">₹{category.actual_fee}</td>
                  <td className="border border-gray-200 px-4 py-2">₹{category.offer_fee}</td>
                  <td className="border border-gray-200 px-4 py-2">
                    {Math.round(((category.actual_fee - category.offer_fee) / category.actual_fee) * 100)}%
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      category.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {category.popup_image_url ? (
                      <Image className="h-4 w-4 text-blue-600" />
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    <div className="flex gap-2">
                      {permissions.canWrite && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {permissions.canDelete && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isLoading && (!categories || categories.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No categories found. Create your first category to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoriesManagement;
