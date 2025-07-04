import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Registration {
  id: string;
  customer_id: string;
  name: string;
  mobile_number: string;
  address: string;
  ward: string;
  agent_pro: string | null;
  status: 'pending' | 'approved' | 'rejected';
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

interface RegistrationEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  registration: Registration | null;
  onUpdate: () => void;
}

const RegistrationEditDialog: React.FC<RegistrationEditDialogProps> = ({
  isOpen,
  onClose,
  registration,
  onUpdate
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    mobile_number: '',
    ward: '',
    agent_pro: '',
    fee_paid: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (registration) {
      setFormData({
        name: registration.name,
        address: registration.address,
        mobile_number: registration.mobile_number,
        ward: registration.ward,
        agent_pro: registration.agent_pro || '',
        fee_paid: registration.fee_paid.toString()
      });
    }
  }, [registration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          name: formData.name,
          address: formData.address,
          mobile_number: formData.mobile_number,
          ward: formData.ward,
          agent_pro: formData.agent_pro || null,
          fee_paid: parseFloat(formData.fee_paid),
          updated_at: new Date().toISOString()
        })
        .eq('id', registration.id);

      if (error) throw error;

      toast({
        title: "Registration Updated",
        description: "Registration details have been updated successfully."
      });
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating registration:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update registration details.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!registration) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Registration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="mobile_number">Mobile Number</Label>
            <Input
              id="mobile_number"
              value={formData.mobile_number}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile_number: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="ward">Ward</Label>
            <Input
              id="ward"
              value={formData.ward}
              onChange={(e) => setFormData(prev => ({ ...prev, ward: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="agent_pro">Agent / P.R.O</Label>
            <Input
              id="agent_pro"
              value={formData.agent_pro}
              onChange={(e) => setFormData(prev => ({ ...prev, agent_pro: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="fee_paid">Fee Paid</Label>
            <Input
              id="fee_paid"
              type="number"
              step="0.01"
              value={formData.fee_paid}
              onChange={(e) => setFormData(prev => ({ ...prev, fee_paid: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Updating...' : 'Update Registration'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationEditDialog;