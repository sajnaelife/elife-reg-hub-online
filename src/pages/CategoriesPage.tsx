
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const CategoriesPage = () => {
  const { data: categories, isLoading, error } = useQuery({
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-red-600">
            Error loading categories. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Self-Employment Categories
          </h1>
          <p className="text-lg text-gray-600">
            Choose from our available self-employment registration categories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories?.map((category) => (
            <Card key={category.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">
                  {category.name}
                </CardTitle>
                {category.name.includes('Special') && (
                  <Badge className="w-fit bg-purple-100 text-purple-800 border-purple-200">
                    Special Category
                  </Badge>
                )}
                {category.offer_fee === 0 && (
                  <Badge className="w-fit bg-green-100 text-green-800 border-green-200">
                    Free Registration
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-500 mb-1">Regular Fee</p>
                    <p className="text-2xl font-bold text-gray-400 line-through">
                      ₹{category.actual_fee}
                    </p>
                  </div>
                  
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-500 mb-1">Offer Price</p>
                    <p className="text-3xl font-bold text-green-600">
                      ₹{category.offer_fee}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">You Save:</span>
                    <span className="font-bold text-red-600">
                      ₹{category.actual_fee - category.offer_fee}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-bold text-red-600">
                      {Math.round(((category.actual_fee - category.offer_fee) / category.actual_fee) * 100)}% OFF
                    </span>
                  </div>
                </div>

                <Link to={`/register/${category.id}`} className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold">
                    Register Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!categories || categories.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No categories available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
