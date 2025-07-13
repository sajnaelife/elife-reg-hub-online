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
import { Search, CheckCircle, Clock, XCircle, Edit2, Save, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const StatusCheckPage = () => {
  const [searchData, setSearchData] = useState({
    mobile_number: ''
  });
  const [shouldSearch, setShouldSearch] = useState(false);
  const [isEditingConfirmation, setIsEditingConfirmation] = useState(false);
  const [isEditingButton, setIsEditingButton] = useState(false);
  const [editableConfirmationText, setEditableConfirmationText] = useState(
    "'ഒരു വീട്ടിൽ ഒരു സംരംഭക എന്ന ശീർഷകത്തിൽ' സ്ത്രീകളുടെ കൂട്ടായ്മയായ  ഇ - ലൈഫ് സൊസൈറ്റി നടപ്പാക്കുന്ന ' സംരംഭക.കോം ' എന്ന പദ്ധതിയുടെ ഭാഗമാകാൻ ഇപ്പൊൾ ആഗ്രഹമില്ല, ഭാവിയിൽ പദ്ധതിയുടെ ഭാഗമാകണം എന്നുണ്ടെങ്കിൽ അടുത്തുള്ള ഇ - ലൈഫ് ഏജൻ്റിനെ അറിയിക്കാം"
  );
  const [editableButtonText, setEditableButtonText] = useState("Confirm Free Registration");

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleSaveConfirmationText = () => {
    setIsEditingConfirmation(false);
    toast({
      title: "Confirmation text updated",
      description: "The confirmation message has been updated successfully."
    });
  };

  const handleSaveButtonText = () => {
    setIsEditingButton(false);
    toast({
      title: "Button text updated",
      description: "The button text has been updated successfully."
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return <Clock className="h-8 w-8 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-4xl px-8 py-4 text-center font-bold">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-4xl px-8 py-4 text-center font-bold">Rejected</Badge>;
      default:
        return <Badge className="text-yellow-800 border-yellow-200 bg-amber-400 rounded-xl text-4xl px-8 py-4 text-center font-bold">Pending</Badge>;
    }
  };

  // Check if this is a Pennyekart Free Registration with pending status
  const isPennyekartFreeRegistration = registration?.categories?.name?.includes('Pennyekart Free Registration');
  const isPendingStatus = registration?.status === 'pending';
  const showConfirmationButton = isPennyekartFreeRegistration && isPendingStatus;

  console.log('Registration data:', registration);
  console.log('Category name:', registration?.categories?.name);
  console.log('Status:', registration?.status);
  console.log('Is Pennyekart Free Registration:', isPennyekartFreeRegistration);
  console.log('Is Pending Status:', isPendingStatus);
  console.log('Show confirmation button:', showConfirmationButton);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Check Application Status</h1>
          <p className="text-lg text-gray-600">
            Enter your mobile number to check your registration status
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Your Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={searchData.mobile_number}
                  onChange={(e) => setSearchData(prev => ({
                    ...prev,
                    mobile_number: e.target.value
                  }))}
                  placeholder="Enter your mobile number"
                  required
                />
              </div>
              <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                Check Status
              </Button>
            </form>
          </CardContent>
        </Card>

        {shouldSearch && (
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Searching for your application...</p>
                </div>
              ) : registration ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(registration.status)}
                      <h2 className="text-2xl font-bold text-gray-900">Application Found</h2>
                    </div>
                    <div className="flex justify-center">
                      {getStatusBadge(registration.status)}
                    </div>
                  </div>

                  {/* Confirmation button for Pennyekart Free Registration - placed prominently at the top */}
                  {showConfirmationButton && (
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-blue-900 text-xl">Free Registration Confirmation</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingConfirmation(!isEditingConfirmation)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {isEditingConfirmation ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      {isEditingConfirmation ? (
                        <div className="space-y-4">
                          <Textarea
                            value={editableConfirmationText}
                            onChange={(e) => setEditableConfirmationText(e.target.value)}
                            className="min-h-[100px] text-blue-700"
                            placeholder="Enter confirmation message..."
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveConfirmationText}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              onClick={() => setIsEditingConfirmation(false)}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-blue-700 mb-4 text-lg">{editableConfirmationText}</p>
                          
                          {/* Editable Button Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-blue-600">Button Text:</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditingButton(!isEditingButton)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {isEditingButton ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                              </Button>
                            </div>
                            
                            {isEditingButton ? (
                              <div className="space-y-2">
                                <Input
                                  value={editableButtonText}
                                  onChange={(e) => setEditableButtonText(e.target.value)}
                                  className="text-blue-700"
                                  placeholder="Enter button text..."
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleSaveButtonText}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                  </Button>
                                  <Button
                                    onClick={() => setIsEditingButton(false)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold">
                                    {editableButtonText}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Free Registration</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      I confirmed as free registration. By clicking confirm, your registration will be automatically approved.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleConfirmFreeRegistration}
                                      disabled={approveRegistrationMutation.isPending}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      {approveRegistrationMutation.isPending ? 'Confirming...' : 'Confirm'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 bg-green-200 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Name:</span>
                          <p className="font-medium">{registration.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Customer ID:</span>
                          <p className="font-medium">{registration.customer_id}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Mobile Number:</span>
                          <p className="font-medium">{registration.mobile_number}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Address:</span>
                          <p className="font-medium">{registration.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 bg-green-300 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Category:</span>
                          <p className="text-zinc-950 text-xl font-bold text-center">{registration.categories?.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Fee Paid:</span>
                          <p className="font-medium">₹{registration.fee_paid}</p>
                        </div>
                        {registration.panchayaths && (
                          <div>
                            <span className="text-sm text-gray-500">Panchayath:</span>
                            <p className="font-medium">
                              {registration.panchayaths.name}, {registration.panchayaths.district}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-sm text-gray-500">Ward:</span>
                          <p className="font-medium">{registration.ward}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Applied On:</span>
                          <p className="font-medium">
                            {new Date(registration.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        {registration.approved_date && (
                          <div>
                            <span className="text-sm text-gray-500">Approved On:</span>
                            <p className="font-medium">
                              {new Date(registration.approved_date).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Status Information</h4>
                    <p className="text-gray-700">
                      {registration.status === 'approved' && "Congratulations! Your application has been approved and is now active."}
                      {registration.status === 'rejected' && "Unfortunately, your application has been rejected. Please contact support for more information."}
                      {registration.status === 'pending' && "Your application is currently under review. You will be notified once a decision is made."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Application Found</h3>
                  <p className="text-gray-600">
                    No registration found with the provided mobile number. 
                    Please check your mobile number and try again.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StatusCheckPage;
