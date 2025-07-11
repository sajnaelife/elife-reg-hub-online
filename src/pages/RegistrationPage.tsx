import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
interface Category {
  id: string;
  name: string;
  description: string | null;
  warning_message: string | null;
  actual_fee: number;
  offer_fee: number;
  popup_image_url: string | null;
  qr_image_url: string | null;
}
interface Panchayath {
  id: string;
  name: string;
  district: string;
}
interface RegistrationData {
  name: string;
  address: string;
  mobile_number: string;
  panchayath_id: string;
  ward: string;
  agent_pro: string;
  category_id: string;
  fee_paid: number;
  customer_id: string;
  preference: string;
}
const RegistrationPage = () => {
  const {
    categoryId
  } = useParams<{
    categoryId: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedCustomerId, setGeneratedCustomerId] = useState('');
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    mobile_number: '',
    panchayath_id: '',
    ward: '',
    agent_pro: '',
    preference: ''
  });
  const {
    data: category,
    isLoading: categoryLoading
  } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      if (!categoryId) throw new Error('Category ID is required');
      const {
        data,
        error
      } = await supabase.from('categories').select('*').eq('id', categoryId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId
  });
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
      return data as Panchayath[];
    }
  });

  // Show warning dialog when category loads and has a warning message
  useEffect(() => {
    if (category && category.warning_message && !warningAcknowledged) {
      setShowWarningDialog(true);
    }
  }, [category, warningAcknowledged]);
  const handleWarningAccept = () => {
    setShowWarningDialog(false);
    setWarningAcknowledged(true);
  };
  const handleWarningCancel = () => {
    setShowWarningDialog(false);
    navigate('/categories');
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.mobile_number || !formData.ward || !categoryId || !category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const registrationData: RegistrationData = {
        name: formData.name,
        address: formData.address,
        mobile_number: formData.mobile_number,
        panchayath_id: formData.panchayath_id || '',
        ward: formData.ward,
        agent_pro: formData.agent_pro || '',
        category_id: categoryId,
        fee_paid: category.offer_fee,
        customer_id: 'ESEP' + formData.mobile_number + formData.name.charAt(0).toUpperCase(),
        preference: formData.preference
      };
      const {
        data,
        error
      } = await supabase.from('registrations').insert(registrationData).select().single();
      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Mobile Number Already Registered",
            description: "This mobile number is already registered. Please use a different number.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }
      setGeneratedCustomerId(data.customer_id);
      setShowSuccess(true);
      toast({
        title: "Registration Successful!",
        description: `Your Customer ID is: ${data.customer_id}`
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "There was an error processing your registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (categoryLoading) {
    return <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>;
  }
  if (!category) {
    return <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-red-600">
            Category not found. Please go back and select a valid category.
          </div>
        </div>
      </div>;
  }

  // Show warning dialog before showing the registration form
  if (category.warning_message && !warningAcknowledged) {
    return <div className="min-h-screen bg-gray-50">
        <Navbar />
        <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Warning
              </AlertDialogTitle>
              <AlertDialogDescription className="whitespace-pre-wrap text-center">
                {category.warning_message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleWarningCancel} className="text-xs text-red-600">ജോബ് കാർഡ് റജിസ്ട്രേഷൻ</AlertDialogCancel>
              <AlertDialogAction onClick={handleWarningAccept} className="bg-blue-600 hover:bg-blue-700 text-xs text-lime-50">സമ്മതം, ഫ്രീ റജിസ്ട്രേഷൻ</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>;
  }
  if (showSuccess) {
    return <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="text-center max-w-4xl mx-auto">
            <CardContent className="pt-8 bg-teal-100">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Registration Successful!</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                {/* Registration Details */}
                <div className="space-y-4 text-left">
                  <div className="flex justify-between">
                    <span className="font-semibold">Customer ID:</span>
                    <span className="font-mono text-sm text-rose-600">{generatedCustomerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Category:</span>
                    <span>{category.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Fee Paid:</span>
                    <span>₹{category.offer_fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Status:</span>
                    <span>Pending Approval</span>
                  </div>
                </div>

                {/* QR Code */}
                {category.qr_image_url && <div className="flex flex-col items-center">
                    <div className="bg-teal-600 p-4 rounded-lg relative">
                      <img src={category.qr_image_url} alt="QR Code" className="w-48 h-48 object-contain bg-white p-2 rounded" />
                      <Button size="sm" className="absolute top-2 right-2 bg-black text-white hover:bg-gray-800" onClick={() => {
                    const link = document.createElement('a');
                    link.href = category.qr_image_url!;
                    link.download = `qr-code-${generatedCustomerId}.png`;
                    link.click();
                  }}>
                        DOWNLOAD ⬇
                      </Button>
                    </div>
                  </div>}
              </div>

              <p className="text-gray-600 mb-6">Please save your Customer ID for future reference. You can check your application status using your mobile number and Customer ID.</p>
              
              <Button onClick={() => navigate('/status')} className="w-full max-w-md mx-auto bg-gray-800 hover:bg-gray-900">
                Check Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  const [preferenceOptions, setPreferenceOptions] = useState<string[]>([]);
  const isJobCardCategory = category?.name.toLowerCase().includes('job card');

  // Fetch job card preferences when category is job card
  useEffect(() => {
    const fetchJobCardPreferences = async () => {
      if (isJobCardCategory && category) {
        const { data, error } = await supabase
          .from('categories')
          .select('preference')
          .eq('id', category.id)
          .single();
        
        if (error) {
          console.error('Error fetching job card preferences:', error);
        } else if (data?.preference) {
          const preferences = data.preference.split(',').map(p => p.trim()).filter(p => p);
          setPreferenceOptions(preferences);
        }
      }
    };

    fetchJobCardPreferences();
  }, [isJobCardCategory, category]);
  const RegistrationForm = () => <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Full Name * / പൂർണ്ണ നാമം *</Label>
        <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="Enter your full name / നിങ്ങളുടെ പൂർണ്ണ നാമം നൽകുക" required />
      </div>

      <div>
        <Label htmlFor="mobile">Mobile Number * / മൊബൈൽ നമ്പർ *</Label>
        <Input id="mobile" type="tel" value={formData.mobile_number} onChange={e => handleInputChange('mobile_number', e.target.value)} placeholder="Enter 10-digit mobile number / 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക" pattern="[0-9]{10}" required />
      </div>

      <div>
        <Label htmlFor="address">Address * / വിലാസം *</Label>
        <Textarea id="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Enter your complete address / നിങ്ങളുടെ പൂർണ്ണ വിലാസം നൽകുക" required />
      </div>

      <div>
        <Label htmlFor="panchayath">Panchayath / പഞ്ചായത്ത്</Label>
        <Select onValueChange={value => handleInputChange('panchayath_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Panchayath / പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക" />
          </SelectTrigger>
          <SelectContent>
            {panchayaths?.map(panchayath => <SelectItem key={panchayath.id} value={panchayath.id}>
                {panchayath.name} - {panchayath.district}
              </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="ward">Ward * / വാർഡ് *</Label>
        <Input id="ward" value={formData.ward} onChange={e => handleInputChange('ward', e.target.value)} placeholder="Enter ward number/name / വാർഡ് നമ്പർ/പേര് നൽകുക" required />
      </div>

      <div>
        <Label htmlFor="agent">Agent / P.R.O / ഏജന്റ് / പി.ആർ.ഒ</Label>
        <Input id="agent" value={formData.agent_pro} onChange={e => handleInputChange('agent_pro', e.target.value)} placeholder="Enter agent or PRO name (optional) / ഏജന്റ് അല്ലെങ്കിൽ പിആർഒ പേര് (ഓപ്ഷണൽ)" />
      </div>

      {isJobCardCategory && <div>
          <Label htmlFor="preference">Preference / മുൻഗണന</Label>
          <Select value={formData.preference} onValueChange={value => handleInputChange('preference', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select preference / മുൻഗണന തിരഞ്ഞെടുക്കുക" />
            </SelectTrigger>
            <SelectContent>
              {preferenceOptions.map((option, index) => <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>}

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
        {isSubmitting ? <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing...
          </> : 'Submit Registration'}
      </Button>
    </form>;
  return <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registration Form</h1>
          <p className="text-gray-600">Please fill in your details for {category.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Form */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <RegistrationForm />
              </CardContent>
            </Card>
          </div>

          {/* Category Summary */}
          <div className="order-1 lg:order-2">
            <Card className="lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle>Registration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  {category.description && <p className="text-sm text-gray-600 mt-1">{category.description}</p>}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Regular Fee:</span>
                    <span className="line-through text-gray-400">₹{category.actual_fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Offer Price:</span>
                    <span className="font-bold text-green-600">₹{category.offer_fee}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">You Save:</span>
                    <span className="font-bold text-red-600">₹{category.actual_fee - category.offer_fee}</span>
                  </div>
                </div>

                
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};
export default RegistrationPage;