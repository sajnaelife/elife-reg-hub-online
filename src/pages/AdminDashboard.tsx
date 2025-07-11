import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Users, Grid3X3, MapPin, Bell, Download, Home, ArrowLeft } from 'lucide-react';
import RegistrationsManagement from '@/components/admin/RegistrationsManagement';
import CategoriesManagement from '@/components/admin/CategoriesManagement';
import PanchayathsManagement from '@/components/admin/PanchayathsManagement';
import AnnouncementsManagement from '@/components/admin/AnnouncementsManagement';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminSession, setAdminSession] = useState(null);
  const [activeTab, setActiveTab] = useState('registrations');

  useEffect(() => {
    const session = localStorage.getItem('adminSession');
    if (!session) {
      navigate('/admin/login');
      return;
    }

    try {
      const sessionData = JSON.parse(session);
      // Update session timestamp to keep it fresh
      const updatedSession = {
        ...sessionData,
        lastActivity: new Date().toISOString()
      };
      localStorage.setItem('adminSession', JSON.stringify(updatedSession));
      setAdminSession(updatedSession);
    } catch (error) {
      console.error('Invalid session data:', error);
      localStorage.removeItem('adminSession');
      navigate('/admin/login');
    }
  }, [navigate]);

  // Keep session alive with periodic updates
  useEffect(() => {
    if (!adminSession) return;

    const keepAlive = setInterval(() => {
      const session = localStorage.getItem('adminSession');
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          const updatedSession = {
            ...sessionData,
            lastActivity: new Date().toISOString()
          };
          localStorage.setItem('adminSession', JSON.stringify(updatedSession));
        } catch (error) {
          console.error('Error updating session:', error);
        }
      }
    }, 5 * 60 * 1000); // Update every 5 minutes

    return () => clearInterval(keepAlive);
  }, [adminSession]);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/admin/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const getRolePermissions = (role: string) => {
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
          canDelete: true,
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

  if (!adminSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const permissions = getRolePermissions(adminSession.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleGoBack}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleGoHome}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">
                  Welcome back, <span className="font-semibold">{adminSession.username}</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {adminSession.role.replace('_', ' ').toUpperCase()}
                  </span>
                </p>
              </div>
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
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Registrations
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="panchayaths" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Panchayaths
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Announcements
            </TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
