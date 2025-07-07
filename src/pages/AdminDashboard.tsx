
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Users, Grid3X3, MapPin, Bell, Shield, BarChart3 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RegistrationsManagement from '@/components/admin/RegistrationsManagement';
import CategoriesManagement from '@/components/admin/CategoriesManagement';
import PanchayathsManagement from '@/components/admin/PanchayathsManagement';
import AnnouncementsManagement from '@/components/admin/AnnouncementsManagement';
import AdminManagement from '@/components/admin/AdminManagement';
import ReportsManagement from '@/components/admin/ReportsManagement';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminSession, setAdminSession] = useState(null);
  const [activeTab, setActiveTab] = useState('registrations');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminSession = () => {
      const session = localStorage.getItem('adminSession');
      if (!session) {
        navigate('/admin/login');
        return;
      }

      try {
        const sessionData = JSON.parse(session);
        // Check if session exists and has required fields
        if (sessionData && sessionData.username && sessionData.role) {
          setAdminSession(sessionData);
        } else {
          localStorage.removeItem('adminSession');
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('Invalid session data:', error);
        localStorage.removeItem('adminSession');
        navigate('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminSession();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/admin/login');
  };

  const getRolePermissions = (role: string) => {
    console.log('Getting permissions for role:', role);
    switch (role) {
      case 'super_admin':
        return {
          canRead: true,
          canWrite: true,
          canDelete: true,
          canManageAdmins: true
        };
      case 'local_admin':
        return {
          canRead: true,
          canWrite: true,
          canDelete: false,
          canManageAdmins: false
        };
      case 'user_admin':
        return {
          canRead: true,
          canWrite: false,
          canDelete: false,
          canManageAdmins: false
        };
      default:
        return {
          canRead: false,
          canWrite: false,
          canDelete: false,
          canManageAdmins: false
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!adminSession) {
    return null;
  }

  const permissions = getRolePermissions(adminSession.role);
  console.log('Admin permissions:', permissions);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, <span className="font-semibold">{adminSession.username}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {adminSession.role.replace('_', ' ').toUpperCase()}
                </span>
              </p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full mb-6 ${permissions.canManageAdmins ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
            <TabsTrigger value="registrations" className="flex items-center gap-1 text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Registrations</span>
              <span className="sm:hidden">Reg</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1 text-xs md:text-sm">
              <Grid3X3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Categories</span>
              <span className="sm:hidden">Cat</span>
            </TabsTrigger>
            <TabsTrigger value="panchayaths" className="flex items-center gap-1 text-xs md:text-sm">
              <MapPin className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Panchayaths</span>
              <span className="sm:hidden">Pan</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-1 text-xs md:text-sm">
              <Bell className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Announcements</span>
              <span className="sm:hidden">Ann</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1 text-xs md:text-sm">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Reports</span>
              <span className="sm:hidden">Rep</span>
            </TabsTrigger>
            {permissions.canManageAdmins && (
              <TabsTrigger value="admins" className="flex items-center gap-1 text-xs md:text-sm">
                <Shield className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Admin Control</span>
                <span className="sm:hidden">Adm</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="registrations">
            <RegistrationsManagement permissions={permissions} />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesManagement permissions={permissions} />
          </TabsContent>

          <TabsContent value="panchayaths">
            <PanchayathsManagement permissions={permissions} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsManagement permissions={permissions} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsManagement permissions={permissions} />
          </TabsContent>

          {permissions.canManageAdmins && (
            <TabsContent value="admins">
              <AdminManagement permissions={permissions} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
