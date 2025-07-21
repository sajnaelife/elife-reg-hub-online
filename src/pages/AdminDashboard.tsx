import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Users, Grid3X3, MapPin, Bell, Shield, BarChart3, Settings, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import RegistrationsManagement from '@/components/admin/RegistrationsManagement';
import CategoriesManagement from '@/components/admin/CategoriesManagement';
import PanchayathsManagement from '@/components/admin/PanchayathsManagement';
import AnnouncementsManagement from '@/components/admin/AnnouncementsManagement';
import AdminManagement from '@/components/admin/AdminManagement';
import AdminPermissionsManagement from '@/components/admin/AdminPermissionsManagement';
import ReportsManagement from '@/components/admin/ReportsManagement';
import UtilitiesManagement from '@/components/admin/UtilitiesManagement';
import AccountsManagement from '@/components/admin/AccountsManagement';
const AdminDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
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

  // Fetch admin permissions from database
  const {
    data: adminPermissions
  } = useQuery({
    queryKey: ['admin-permissions', adminSession?.id],
    queryFn: async () => {
      if (!adminSession?.id) return [];
      const {
        data,
        error
      } = await supabase.from('admin_permissions').select('module, permission_type').eq('admin_user_id', adminSession.id);
      if (error) {
        console.error('Error fetching admin permissions:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!adminSession?.id
  });
  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    });
    navigate('/admin/login');
  };
  const getPermissionsForModule = (module: string) => {
    if (!adminPermissions) return {
      canRead: false,
      canWrite: false,
      canDelete: false
    };
    const modulePermissions = adminPermissions.filter(p => p.module === module);
    return {
      canRead: modulePermissions.some(p => p.permission_type === 'read'),
      canWrite: modulePermissions.some(p => p.permission_type === 'write'),
      canDelete: modulePermissions.some(p => p.permission_type === 'delete')
    };
  };
  const getRolePermissions = (role: string, adminId: string) => {
    console.log('Getting permissions for role:', role, 'adminId:', adminId);
    console.log('Admin permissions from DB:', adminPermissions);

    // Super admins always have all permissions
    if (role === 'super_admin') {
      const superAdminPerms = {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canManageAdmins: true
      };
      console.log('Super admin permissions:', superAdminPerms);
      return superAdminPerms;
    }

    // For other roles, check database permissions first
    if (adminPermissions && adminPermissions.length > 0) {
      const hasReadPermission = adminPermissions.some(p => p.permission_type === 'read');
      const hasWritePermission = adminPermissions.some(p => p.permission_type === 'write');
      const hasDeletePermission = adminPermissions.some(p => p.permission_type === 'delete');
      const hasAdminManagePermission = adminPermissions.some(p => p.module === 'admin_users' && (p.permission_type === 'write' || p.permission_type === 'read'));
      const dbPerms = {
        canRead: hasReadPermission,
        canWrite: hasWritePermission,
        canDelete: hasDeletePermission,
        canManageAdmins: hasAdminManagePermission
      };
      console.log('Database permissions:', dbPerms);
      return dbPerms;
    }

    // Fallback to default role-based permissions if no database permissions found
    console.log('No database permissions found, using fallback for role:', role);
    switch (role) {
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
  if (isLoading || !adminSession) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>;
  }
  if (!adminSession) {
    return null;
  }
  const permissions = adminSession ? getRolePermissions(adminSession.role, adminSession.id) : {
    canRead: false,
    canWrite: false,
    canDelete: false,
    canManageAdmins: false
  };
  console.log('Admin permissions:', permissions);
  return <div className="min-h-screen bg-gray-50">
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
            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {adminSession.role === 'user_admin' ?
        // User admin only sees registrations
        <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button className="bg-white border-b-2 border-blue-500 text-blue-600 py-4 px-6 text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Registrations
                  </button>
                </nav>
              </div>
            </div> : <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1 w-full mb-6 p-1 bg-muted rounded-lg">
              {getPermissionsForModule('registrations').canRead && <TabsTrigger value="registrations" className="flex flex-col items-center gap-1 p-3 h-auto text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs font-medium">Registrations</span>
                </TabsTrigger>}
              {getPermissionsForModule('categories').canRead && <TabsTrigger value="categories" className="flex flex-col items-center gap-1 p-3 h-auto text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <Grid3X3 className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs font-medium">Categories</span>
                </TabsTrigger>}
              {getPermissionsForModule('panchayaths').canRead && <TabsTrigger value="panchayaths" className="flex flex-col items-center gap-1 p-3 h-auto text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs font-medium">Panchayaths</span>
                </TabsTrigger>}
              {getPermissionsForModule('announcements').canRead && <TabsTrigger value="announcements" className="flex flex-col items-center gap-1 p-3 h-auto text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <Bell className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs font-medium">Announcements</span>
                </TabsTrigger>}
              {getPermissionsForModule('utilities').canRead && <TabsTrigger value="utilities" className="flex flex-col items-center gap-1 p-3 h-auto text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <Settings className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs font-medium">Utilities</span>
                </TabsTrigger>}
              {getPermissionsForModule('accounts').canRead && <TabsTrigger value="accounts" className="flex flex-col items-center gap-1 p-3 h-auto text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <Wallet className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs font-medium">Accounts</span>
                </TabsTrigger>}
              {getPermissionsForModule('reports').canRead && <TabsTrigger value="reports" className="flex flex-col items-center gap-1 p-3 h-auto text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs font-medium">Reports</span>
                </TabsTrigger>}
              {permissions.canManageAdmins && <TabsTrigger value="admins" className="flex flex-col items-center gap-1 p-3 h-auto text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <Shield className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs font-medium">Admin Control</span>
                </TabsTrigger>}
            </TabsList>}

          {adminSession.role === 'user_admin' ?
        // User admin only sees registrations
        <RegistrationsManagement permissions={permissions} /> : <>
              {getPermissionsForModule('registrations').canRead && <TabsContent value="registrations">
                  <RegistrationsManagement permissions={permissions} />
                </TabsContent>}

              {getPermissionsForModule('categories').canRead && <TabsContent value="categories">
                  <CategoriesManagement permissions={permissions} />
                </TabsContent>}

              {getPermissionsForModule('panchayaths').canRead && <TabsContent value="panchayaths">
                  <PanchayathsManagement permissions={permissions} />
                </TabsContent>}

              {getPermissionsForModule('announcements').canRead && <TabsContent value="announcements">
                  <AnnouncementsManagement permissions={permissions} />
                </TabsContent>}

              {getPermissionsForModule('utilities').canRead && <TabsContent value="utilities">
                  <UtilitiesManagement />
                </TabsContent>}

              {getPermissionsForModule('accounts').canRead && <TabsContent value="accounts">
                  <AccountsManagement permissions={permissions} />
                </TabsContent>}

              {getPermissionsForModule('reports').canRead && <TabsContent value="reports">
                  <ReportsManagement permissions={permissions} />
                </TabsContent>}

              {permissions.canManageAdmins && <TabsContent value="admins">
                  <div className="space-y-6">
                    <AdminManagement permissions={permissions} />
                    <AdminPermissionsManagement permissions={permissions} />
                  </div>
                </TabsContent>}
            </>}
        </Tabs>
      </div>
    </div>;
};
export default AdminDashboard;