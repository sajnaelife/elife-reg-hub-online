import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const StatusCheckPage = () => {
  const [searchData, setSearchData] = useState({
    mobile_number: ''
  });
  const [shouldSearch, setShouldSearch] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Editable text states
  const [confirmationText, setConfirmationText] = useState("'ഒരു വീട്ടിൽ ഒരു സംരംഭക എന്ന ശീർഷകത്തിൽ' സ്ത്രീകളുടെ കൂട്ടായ്മയായ  ഇ - ലൈഫ് സൊസൈറ്റി നടപ്പാക്കുന്ന ' സംരംഭക.കോം ' എന്ന പദ്ധതിയുടെ ഭാഗമാകാൻ ഇപ്പൊൾ ആഗ്രഹമില്ല, ഭാവിയിൽ പദ്ധതിയുടെ ഭാഗമാകണം എന്നുണ്ടെങ്കിൽ അടുത്തുള്ള ഇ - ലൈഫ് ഏജൻ്റിനെ അറിയിക്കാം");
  const [buttonText, setButtonText] = useState("Confirm Free Registration");
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: registration,
    isLoading,
    error
  } = useQuery({
    queryKey: ['registration-status', searchData.mobile_number],
    queryFn: async () => {
      if (!searchData.mobile_number) {
        return null;
      }
      const {
        data,
        error
      } = await supabase.from('registrations').select(`
          *,
          categories (name, actual_fee, offer_fee),
          panchayaths (name, district)
        `).eq('mobile_number', searchData.mobile_number).single();
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No matching record found
        }
        throw error;
      }
      return data;
    },
    enabled: shouldSearch && !!searchData.mobile_number
  });

  const approveRegistrationMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const {
        error
      } = await supabase.from('registrations').update({
        status: 'approved',
        approved_date: new Date().toISOString()
      }).eq('id', registrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Registration Approved",
        description: "Your free registration has been confirmed and approved!"
      });
      // Refetch the registration data to show updated status
      queryClient.invalidateQueries({
        queryKey: ['registration-status', searchData.mobile_number]
      });
    },
    onError: error => {
      toast({
        title: "Error",
        description: "Failed to approve registration. Please try again.",
        variant: "destructive"
      });
      console.error('Error approving registration:', error);
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchData.mobile_number) {
      setShouldSearch(true);
    }
  };

  const handleConfirmFreeRegistration = () => {
    if (registration?.id) {
      approveRegistrationMutation.mutate(registration.id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-lg px-4 py-2">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-lg px-4 py-2">Rejected</Badge>;
      default:
        return <Badge className="text-yellow-800 border-yellow-200 bg-amber-400 rounded-xl text-lg px-4 py-2">Pending</Badge>;
    }
  };

  // Check if this is a Pennyekart Free Registration with pending status
  const isPennyekartFreeRegistration = registration?.categories?.name?.includes('Pennyekart Free Registration');
  const isPendingStatus = registration?.status === 'pending';
  const showConfirmationButton = isPennyekartFreeRegistration && isPendingStatus;

  return <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Check Application Status</h1>
          <p className="text-base sm:text-lg text-gray-600 px-2">
            Enter your mobile number to check your registration status
          </p>
        </div>

        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              Search Your Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="mobile" className="text-sm sm:text-base">Mobile Number</Label>
                <Input 
                  id="mobile" 
                  type="tel" 
                  value={searchData.mobile_number} 
                  onChange={e => setSearchData(prev => ({
                    ...prev,
                    mobile_number: e.target.value
                  }))} 
                  placeholder="Enter your mobile number" 
                  required 
                  className="text-base sm:text-lg py-2 sm:py-3"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-base sm:text-lg py-2 sm:py-3">
                Check Status
              </Button>
            </form>
          </CardContent>
        </Card>

        {shouldSearch && <Card>
            <CardContent className="pt-4 sm:pt-6">
              {isLoading ? <div className="text-center py-6 sm:py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600 text-sm sm:text-base">Searching for your application...</p>
                </div> : registration ? <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(registration.status)}
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Application Found</h2>
                    </div>
                    <div className="flex justify-center sm:justify-end">
                      {getStatusBadge(registration.status)}
                    </div>
                  </div>

                  {/* Confirmation button for Pennyekart Free Registration - placed prominently at the top */}
                  {showConfirmationButton && <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <h4 className="font-bold text-blue-900 text-lg sm:text-xl">Free Registration Confirmation</h4>
                        <Button 
                          onClick={() => setIsEditing(!isEditing)}
                          variant="outline"
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          {isEditing ? 'Save Changes' : 'Edit Text'}
                        </Button>
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Confirmation Text:</Label>
                            <Textarea
                              value={confirmationText}
                              onChange={(e) => setConfirmationText(e.target.value)}
                              className="mt-2 text-sm sm:text-base"
                              rows={4}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Button Text:</Label>
                            <Input
                              value={buttonText}
                              onChange={(e) => setButtonText(e.target.value)}
                              className="mt-2 text-sm sm:text-base"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-blue-700 mb-4 text-sm sm:text-lg leading-relaxed">{confirmationText}</p>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-semibold w-full sm:w-auto">
                            {buttonText}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="mx-4 sm:mx-0">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Free Registration</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm sm:text-base">
                              I confirmed as free registration. By clicking confirm, your registration will be automatically approved.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleConfirmFreeRegistration} 
                              disabled={approveRegistrationMutation.isPending} 
                              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                            >
                              {approveRegistrationMutation.isPending ? 'Confirming...' : 'Confirm'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4 bg-green-200 p-3 sm:p-4 rounded-lg">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Personal Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs sm:text-sm text-gray-500">Name:</span>
                          <p className="font-medium text-sm sm:text-base break-words">{registration.name}</p>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm text-gray-500">Customer ID:</span>
                          <p className="font-medium text-sm sm:text-base break-all">{registration.customer_id}</p>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm text-gray-500">Mobile Number:</span>
                          <p className="font-medium text-sm sm:text-base">{registration.mobile_number}</p>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm text-gray-500">Address:</span>
                          <p className="font-medium text-sm sm:text-base leading-relaxed">{registration.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 bg-green-300 p-3 sm:p-4 rounded-lg">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Registration Details</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs sm:text-sm text-gray-500 bg-amber-200 px-2 py-1 rounded block text-center mb-2">
                            Button Text: സമ്മതം, മുന്നോട്ട് പോകാം
                          </span>
                          <p className="text-zinc-950 text-base sm:text-xl font-bold text-center break-words">{registration.categories?.name}</p>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm text-gray-500">Fee Paid:</span>
                          <p className="font-medium text-sm sm:text-base">₹{registration.fee_paid}</p>
                        </div>
                        {registration.panchayaths && <div>
                            <span className="text-xs sm:text-sm text-gray-500">Panchayath:</span>
                            <p className="font-medium text-sm sm:text-base break-words">
                              {registration.panchayaths.name}, {registration.panchayaths.district}
                            </p>
                          </div>}
                        <div>
                          <span className="text-xs sm:text-sm text-gray-500">Ward:</span>
                          <p className="font-medium text-sm sm:text-base">{registration.ward}</p>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm text-gray-500">Applied On:</span>
                          <p className="font-medium text-sm sm:text-base">
                            {new Date(registration.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        {registration.approved_date && <div>
                            <span className="text-xs sm:text-sm text-gray-500">Approved On:</span>
                            <p className="font-medium text-sm sm:text-base">
                              {new Date(registration.approved_date).toLocaleDateString('en-IN')}
                            </p>
                          </div>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Status Information</h4>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                      {registration.status === 'approved' && "Congratulations! Your application has been approved and is now active."}
                      {registration.status === 'rejected' && "Unfortunately, your application has been rejected. Please contact support for more information."}
                      {registration.status === 'pending' && "Your application is currently under review. You will be notified once a decision is made."}
                    </p>
                  </div>
                </div> : <div className="text-center py-6 sm:py-8">
                  <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Application Found</h3>
                  <p className="text-gray-600 text-sm sm:text-base px-4">
                    No registration found with the provided mobile number. 
                    Please check your mobile number and try again.
                  </p>
                </div>}
            </CardContent>
          </Card>}
      </div>
    </div>;
};

export default StatusCheckPage;
