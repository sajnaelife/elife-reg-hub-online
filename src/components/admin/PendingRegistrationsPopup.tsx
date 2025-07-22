import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Clock, User, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Registration {
  id: string;
  name: string;
  mobile_number: string;
  customer_id: string;
  created_at: string;
  status: string;
  categories: { name: string };
  panchayaths?: { name: string; district: string };
}

interface PendingRegistrationsPopupProps {
  adminSession: any;
}

const PendingRegistrationsPopup = ({ adminSession }: PendingRegistrationsPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownToday, setHasShownToday] = useState(false);

  // Helper function to calculate days remaining for pending registrations
  const calculateDaysRemaining = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 15 - diffDays);
  };

  // Fetch pending registrations expiring in less than 5 days
  const { data: expiringRegistrations } = useQuery({
    queryKey: ['expiring-registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
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
    enabled: !!adminSession
  });

  // Check if popup should be shown
  useEffect(() => {
    if (!adminSession || !expiringRegistrations) return;

    // Check if popup was already shown today
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('pendingRegistrationsPopupShown');
    
    if (lastShown === today) {
      setHasShownToday(true);
      return;
    }

    // Show popup if there are expiring registrations and it hasn't been shown today
    if (expiringRegistrations.length > 0 && !hasShownToday) {
      setIsOpen(true);
      localStorage.setItem('pendingRegistrationsPopupShown', today);
      setHasShownToday(true);
    }
  }, [expiringRegistrations, adminSession, hasShownToday]);

  const handleClose = () => {
    setIsOpen(false);
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
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              The following {expiringRegistrations.length} registration(s) are expiring within 5 days and require immediate attention:
            </p>
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
                      <p className="text-muted-foreground">{registration.categories.name}</p>
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

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Remind Me Tomorrow
          </Button>
          <Button onClick={handleClose}>
            Got It
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingRegistrationsPopup;