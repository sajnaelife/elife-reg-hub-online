import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Clock, User, Phone, FileDown, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { exportToExcel, exportToPDF } from '@/components/admin/registrations/exportUtils';
import { Registration } from '@/components/admin/registrations/types';
import { toast } from 'sonner';

interface PendingRegistrationsPopupProps {
  adminSession: any;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  expiringRegistrations?: Registration[];
}

const PendingRegistrationsPopup = ({ 
  adminSession, 
  isOpen: controlledIsOpen, 
  onOpenChange: controlledOnOpenChange,
  expiringRegistrations: propExpiringRegistrations 
}: PendingRegistrationsPopupProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled or internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledOnOpenChange || setInternalIsOpen;

  // Helper function to calculate days remaining for pending registrations
  const calculateDaysRemaining = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 15 - diffDays);
  };

  // Fetch pending registrations expiring in less than 5 days (only if not provided as prop)
  const { data: fetchedExpiringRegistrations } = useQuery({
    queryKey: ['expiring-registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          customer_id,
          name,
          mobile_number,
          address,
          ward,
          agent_pro,
          status,
          fee_paid,
          created_at,
          updated_at,
          approved_date,
          approved_by,
          category_id,
          panchayath_id,
          preference,
          categories (name),
          panchayaths (name, district)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching expiring registrations:', error);
        return [];
      }

      // Filter registrations expiring in less than 5 days
      const expiring = (data as Registration[]).filter(reg => {
        const daysRemaining = calculateDaysRemaining(reg.created_at);
        return daysRemaining <= 5 && daysRemaining > 0;
      });

      return expiring;
    },
    enabled: !!adminSession && !propExpiringRegistrations
  });

  const expiringRegistrations = propExpiringRegistrations || fetchedExpiringRegistrations;

  // Auto-show popup only if not controlled and there are expiring registrations
  useEffect(() => {
    if (!adminSession || !expiringRegistrations || controlledIsOpen !== undefined) return;

    // Show popup if there are expiring registrations and it's not controlled
    if (expiringRegistrations.length > 0) {
      setIsOpen(true);
    }
  }, [expiringRegistrations, adminSession, controlledIsOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleExportExcel = () => {
    if (!expiringRegistrations || expiringRegistrations.length === 0) {
      toast.error('No pending registrations to export');
      return;
    }
    
    try {
      exportToExcel(expiringRegistrations);
      toast.success('Pending registrations exported to Excel successfully');
    } catch (error) {
      console.error('Export to Excel failed:', error);
      toast.error('Failed to export to Excel');
    }
  };

  const handleExportPDF = () => {
    if (!expiringRegistrations || expiringRegistrations.length === 0) {
      toast.error('No pending registrations to export');
      return;
    }
    
    try {
      exportToPDF(expiringRegistrations);
      toast.success('Pending registrations exported to PDF successfully');
    } catch (error) {
      console.error('Export to PDF failed:', error);
      toast.error('Failed to export to PDF');
    }
  };

  const getDaysRemainingColor = (days: number) => {
    if (days <= 1) return 'bg-red-100 text-red-800 border-red-200';
    if (days <= 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  if (!expiringRegistrations || expiringRegistrations.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-red-600 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Registrations Alert
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          <div className="mb-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              The following {expiringRegistrations.length} registration(s) are expiring within 5 days and require immediate attention:
            </p>
            
            {/* Admin Permissions Information */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Admin Permissions Management</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Assign Admin Permissions:</strong> Control access to different modules</p>
                <p><strong>Module Permissions:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• <strong>Registrations:</strong> Read, Write, Delete permissions</li>
                  <li>• <strong>Categories:</strong> Read, Write, Delete permissions</li>
                  <li>• <strong>Accounts:</strong> Read, Write, Delete permissions</li>
                  <li>• <strong>Reports:</strong> Read, Write permissions</li>
                  <li>• <strong>Admin Users:</strong> Read, Write permissions</li>
                </ul>
                <p className="mt-2 text-blue-600"><strong>Note:</strong> Super admins have all permissions by default</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {expiringRegistrations.map((registration) => {
              const daysRemaining = calculateDaysRemaining(registration.created_at);
              
              return (
                <div
                  key={registration.id}
                  className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{registration.name}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {registration.mobile_number}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={getDaysRemainingColor(daysRemaining)}
                    >
                      {daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Customer ID:</span>
                      <p className="text-muted-foreground">{registration.customer_id}</p>
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>
                      <p className="text-muted-foreground">{registration.categories?.name || 'N/A'}</p>
                    </div>
                    {registration.panchayaths && (
                      <div className="col-span-2">
                        <span className="font-medium">Location:</span>
                        <p className="text-muted-foreground">
                          {registration.panchayaths.name}, {registration.panchayaths.district}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Created: {new Date(registration.created_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="flex items-center gap-1"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="flex items-center gap-1"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Remind Me Tomorrow
            </Button>
            <Button onClick={handleClose}>
              Got It
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingRegistrationsPopup;