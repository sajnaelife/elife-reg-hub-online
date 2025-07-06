import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, MapPin, DollarSign } from 'lucide-react';
const ReportsManagement = ({
  permissions
}: {
  permissions: any;
}) => {
  // Fetch registration summary by panchayath
  const {
    data: panchayathSummary,
    isLoading: loadingPanchayath
  } = useQuery({
    queryKey: ['panchayath-summary'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('registrations').select(`
          panchayath_id,
          category_id,
          panchayaths!inner(name, district),
          categories!inner(name)
        `);
      if (error) throw error;

      // Process data to create summary
      const summary = data.reduce((acc, reg) => {
        const panchayathName = reg.panchayaths?.name || 'Unknown';
        const district = reg.panchayaths?.district || 'Unknown';
        const categoryName = reg.categories?.name || 'Unknown';
        const key = `${panchayathName}_${district}`;
        if (!acc[key]) {
          acc[key] = {
            panchayath: panchayathName,
            district: district,
            totalRegistrations: 0,
            categories: {}
          };
        }
        acc[key].totalRegistrations++;
        if (!acc[key].categories[categoryName]) {
          acc[key].categories[categoryName] = 0;
        }
        acc[key].categories[categoryName]++;
        return acc;
      }, {});
      return Object.values(summary);
    }
  });

  // Fetch overall statistics
  const {
    data: stats,
    isLoading: loadingStats
  } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [registrationsCount, categoriesCount, panchayathsCount, activeCategories, feesData] = await Promise.all([supabase.from('registrations').select('*', {
        count: 'exact',
        head: true
      }), supabase.from('categories').select('*', {
        count: 'exact',
        head: true
      }), supabase.from('panchayaths').select('*', {
        count: 'exact',
        head: true
      }), supabase.from('categories').select('*', {
        count: 'exact',
        head: true
      }).eq('is_active', true), supabase.from('registrations').select('fee_paid')]);

      // Calculate total fees collected only from approved registrations
      const approvedFeesData = await supabase
        .from('registrations')
        .select('fee_paid')
        .eq('status', 'approved');
      
      const totalFeesCollected = approvedFeesData.data?.reduce((sum, reg) => {
        return sum + (reg.fee_paid || 0);
      }, 0) || 0;
      return {
        totalRegistrations: registrationsCount.count || 0,
        totalCategories: categoriesCount.count || 0,
        totalPanchayaths: panchayathsCount.count || 0,
        activeCategories: activeCategories.count || 0,
        totalFeesCollected
      };
    }
  });
  if (!permissions.canRead) {
    return <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            You don't have permission to view reports.
          </div>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : stats?.totalRegistrations || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : stats?.totalCategories || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingStats ? '...' : stats?.activeCategories || 0} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Panchayaths</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : stats?.totalPanchayaths || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-400">
            <CardTitle className="text-sm font-medium">Total Fees Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="bg-amber-100">
            <div className="text-2xl font-bold text-green-600">
              ₹{loadingStats ? '...' : (stats?.totalFeesCollected || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue from registrations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
            <p className="text-xs text-muted-foreground">
              Active registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Panchayath Performance Report */}
      <Card>
        <CardHeader>
          <CardTitle>Panchayath Performance Report</CardTitle>
          <p className="text-sm text-gray-600">
            Total registrations and category breakdown for each panchayath
          </p>
        </CardHeader>
        <CardContent>
          {loadingPanchayath ? <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div> : <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Panchayath</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">District</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Total Registrations</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Category Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {panchayathSummary?.map((item: any, index) => <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-medium">
                        {item.panchayath}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {item.district}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                          {item.totalRegistrations}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <div className="space-y-1">
                          {Object.entries(item.categories).map(([category, count]: [string, any]) => <div key={category} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{category}:</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {count}
                              </span>
                            </div>)}
                        </div>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>}

          {!loadingPanchayath && (!panchayathSummary || panchayathSummary.length === 0) && <div className="text-center py-8 text-gray-500">
              No registration data available for reports.
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default ReportsManagement;