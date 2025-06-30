
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, TrendingUp, Bell } from 'lucide-react';

const LandingPage = () => {
  const [announcements, setAnnouncements] = useState([]);

  // Fetch active announcements
  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or('expiry_date.is.null,expiry_date.gt.now()')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch categories for display
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Real-time updates for announcements
  useEffect(() => {
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        () => {
          // Refetch announcements on any change
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Self Employment Registration Portal
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Register for various self-employment opportunities and track your application status. 
              Join thousands of entrepreneurs building their future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/categories">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  Start Registration
                </Button>
              </Link>
              <Link to="/status">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  Check Status
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      {announcementsData && announcementsData.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Live Announcements</h2>
          </div>
          <div className="space-y-4">
            {announcementsData.map((announcement) => (
              <Alert key={announcement.id} className="border-blue-200 bg-blue-50">
                <Bell className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">{announcement.title}</h3>
                      <p className="text-blue-800">{announcement.content}</p>
                    </div>
                    {announcement.expiry_date && (
                      <Badge variant="outline" className="text-xs">
                        Expires: {new Date(announcement.expiry_date).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-900">5,000+</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Registered Users</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-900">{categories?.length || 7}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Available Categories</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-900">98%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Approval Rate</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Categories Preview */}
      {categories && categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Available Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.slice(0, 6).map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Actual Fee</p>
                      <p className="text-lg font-bold text-gray-400 line-through">₹{category.actual_fee}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Offer Fee</p>
                      <p className="text-xl font-bold text-green-600">₹{category.offer_fee}</p>
                    </div>
                  </div>
                  <Link to={`/register/${category.id}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Register Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/categories">
              <Button variant="outline" size="lg">
                View All Categories
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
