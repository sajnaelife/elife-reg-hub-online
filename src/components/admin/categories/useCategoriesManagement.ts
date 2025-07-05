import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Category, CategoryData } from './types';

export const useCategoriesManagement = (permissions: any) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryData>({
    name: '',
    description: '',
    actual_fee: '',
    offer_fee: '',
    popup_image_url: '',
    qr_image_url: '',
    is_active: true
  });

  // Fetch categories
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      console.log('Fetching categories...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      console.log('Fetched categories:', data);
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
          console.log('Real-time update received for categories');
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
      console.log('Saving category:', categoryData, 'editing:', editingCategory?.id);
      
      const dataToSave = {
        name: categoryData.name,
        description: categoryData.description || null,
        actual_fee: parseFloat(categoryData.actual_fee),
        offer_fee: parseFloat(categoryData.offer_fee),
        popup_image_url: categoryData.popup_image_url || null,
        qr_image_url: categoryData.qr_image_url || null,
        is_active: categoryData.is_active
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id);
        
        if (error) {
          console.error('Error updating category:', error);
          throw error;
        }
        console.log('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([dataToSave]);
        
        if (error) {
          console.error('Error creating category:', error);
          throw error;
        }
        console.log('Category created successfully');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      toast({
        title: editingCategory ? "Category Updated" : "Category Created",
        description: `Category has been ${editingCategory ? 'updated' : 'created'} successfully.`,
      });
    },
    onError: (error) => {
      console.error('Save category failed:', error);
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
      console.log('Deleting category:', id);
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }
      console.log('Category deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({
        title: "Category Deleted",
        description: "Category has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Delete category failed:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete category. It may be in use by registrations.",
        variant: "destructive"
      });
    }
  });

  const handleEdit = (category: Category) => {
    console.log('Editing category:', category);
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      actual_fee: category.actual_fee.toString(),
      offer_fee: category.offer_fee.toString(),
      popup_image_url: category.popup_image_url || '',
      qr_image_url: category.qr_image_url || '',
      is_active: category.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    console.log('Handle delete called:', id, 'canDelete:', permissions.canDelete);
    if (permissions.canDelete) {
      if (window.confirm('Are you sure you want to delete this category?')) {
        deleteCategoryMutation.mutate(id);
      }
    } else {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete categories.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Handle submit called:', formData, 'canWrite:', permissions.canWrite);
    if (permissions.canWrite) {
      if (!formData.name || !formData.actual_fee || !formData.offer_fee) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }
      saveCategoryMutation.mutate(formData);
    } else {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to modify categories.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      actual_fee: '',
      offer_fee: '',
      popup_image_url: '',
      qr_image_url: '',
      is_active: true
    });
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return {
    categories,
    isLoading,
    error,
    isDialogOpen,
    setIsDialogOpen,
    editingCategory,
    formData,
    setFormData,
    handleEdit,
    handleDelete,
    handleSubmit,
    openAddDialog
  };
};