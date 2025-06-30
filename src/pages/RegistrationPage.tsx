
import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';

const RegistrationPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedCustomerId, setGeneratedCustomerId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    mobile_number: '',
    panchayath_id: '',
    ward: '',
    agent_pro: ''
  });

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: panchayaths } = useQuery({
    queryKey: ['panchayaths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panchayaths')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.mobile_number || !formData.ward) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('registrations')
        .insert([{
          name: formData.name,
          address: formData.address,
          mobile_number: formData.mobile_number,
          panchayath_id: formData.panchayath_id || null,
          ward: formData.ward,
          agent_pro: formData.agent_pro || null,
          category_id: categoryId,
          fee_paid: category?.offer_fee
        }])
        .select()
        .single();

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
        description: `Your Customer ID is: ${data.customer_id}`,
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
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-red-600">
            Category not found. Please go back and select a valid category.
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="text-center">
            <CardContent className="pt-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
              <div className="space-y-4 text-left bg-gray-50 p-6 rounded-lg">
                <div>
                  <strong>Customer ID:</strong> {generatedCustomerId}
                </div>
                <div>
                  <strong>Category:</strong> {category.name}
                </div>
                <div>
                  <strong>Fee Paid:</strong> ₹{category.offer_fee}
                </div>
                <div>
                  <strong>Status:</strong> Pending Approval
                </div>
              </div>
              <p className="text-gray-600 mt-4 mb-6">
                Please save your Customer ID for future reference. You can check your application status using your mobile number and Customer ID.
              </p>
              <div className="space-y-3">
                <Button onClick={() => navigate('/status')} className="w-full">
                  Check Status
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registration Form</h1>
          <p className="text-gray-600">Please fill in your details for {category.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile_number}
                      onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      pattern="[0-9]{10}"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your complete address"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="panchayath">Panchayath</Label>
                    <Select onValueChange={(value) => handleInputChange('panchayath_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Panchayath" />
                      </SelectTrigger>
                      <SelectContent>
                        {panchayaths?.map((panchayath) => (
                          <SelectItem key={panchayath.id} value={panchayath.id}>
                            {panchayath.name} - {panchayath.district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ward">Ward *</Label>
                    <Input
                      id="ward"
                      value={formData.ward}
                      onChange={(e) => handleInputChange('ward', e.target.value)}
                      placeholder="Enter ward number/name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="agent">Agent / P.R.O</Label>
                    <Input
                      id="agent"
                      value={formData.agent_pro}
                      onChange={(e) => handleInputChange('agent_pro', e.target.value)}
                      placeholder="Enter agent or PRO name (optional)"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Submit Registration'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Category Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Registration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
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

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• You'll receive a unique Customer ID</li>
                    <li>• Your application will be reviewed</li>
                    <li>• You'll be notified of approval status</li>
                    <li>• Track status anytime with your ID</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
