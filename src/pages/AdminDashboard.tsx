
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

  // Fetch admin permissions from database
  const { data: adminPermissions } = useQuery({
    queryKey: ['admin-permissions', adminSession?.id],
    queryFn: async () => {
      if (!adminSession?.id) return [];
      
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('module, permission_type')
        .eq('admin_user_id', adminSession.id);
      
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
      description: "You have been successfully logged out.",
    });
    navigate('/admin/login');
  };

  const getPermissionsForModule = (module: string) => {
    if (!adminPermissions) return { canRead: false, canWrite: false, canDelete: false };
    
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

  const hasAccessToModule = (module: string) => {
    if (adminSession?.role === 'super_admin') return true;
    return getPermissionsForModule(module).canRead;
  };

  if (isLoading || !adminSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm md:text-base text-gray-600">
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
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {adminSession.role === 'user_admin' ? (
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
            </div>
          ) : (
            <div className="mb-6">
              <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="-mb-px flex min-w-max">
                  {hasAccessToModule('registrations') && (
                    <button
                      onClick={() => setActiveTab('registrations')}
                      className={`py-4 px-3 md:px-6 text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'registrations' 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Users className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Registrations</span>
                      <span className="sm:hidden">Reg</span>
                    </button>
                  )}
                  {hasAccessToModule('categories') && (
                    <button
                      onClick={() => setActiveTab('categories')}
                      className={`py-4 px-3 md:px-6 text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'categories' 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Grid3X3 className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Categories</span>
                      <span className="sm:hidden">Cat</span>
                    </button>
                  )}
                  {hasAccessToModule('panchayaths') && (
                    <button
                      onClick={() => setActiveTab('panchayaths')}
                      className={`py-4 px-3 md:px-6 text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'panchayaths' 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Panchayaths</span>
                      <span className="sm:hidden">Pan</span>
                    </button>
                  )}
                  {hasAccessToModule('announcements') && (
                    <button
                      onClick={() => setActiveTab('announcements')}
                      className={`py-4 px-3 md:px-6 text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'announcements' 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Bell className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Announcements</span>
                      <span className="sm:hidden">Ann</span>
                    </button>
                  )}
                  {hasAccessToModule('utilities') && (
                    <button
                      onClick={() => setActiveTab('utilities')}
                      className={`py-4 px-3 md:px-6 text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'utilities' 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Settings className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Utilities</span>
                      <span className="sm:hidden">Util</span>
                    </button>
                  )}
                  {hasAccessToModule('accounts') && (
                    <button
                      onClick={() => setActiveTab('accounts')}
                      className={`py-4 px-3 md:px-6 text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'accounts' 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Wallet className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Accounts</span>
                      <span className="sm:hidden">Acc</span>
                    </button>
                  )}
                  {hasAccessToModule('reports') && (
                    <button
                      onClick={() => setActiveTab('reports')}
                      className={`py-4 px-3 md:px-6 text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'reports' 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Reports</span>
                      <span className="sm:hidden">Rep</span>
                    </button>
                  )}
                  {permissions.canManageAdmins && (
                    <button
                      onClick={() => setActiveTab('admins')}
                      className={`py-4 px-3 md:px-6 text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2 border-b-2 whitespace-nowrap ${
                        activeTab === 'admins' 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Shield className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Admin Control</span>
                      <span className="sm:hidden">Adm</span>
                    </button>
                  )}
                </nav>
              </div>
            </div>
          )}

          {adminSession.role === 'user_admin' ? (
            // User admin only sees registrations
            <RegistrationsManagement permissions={permissions} />
          ) : (
            <>
              {hasAccessToModule('registrations') && activeTab === 'registrations' && (
                <RegistrationsManagement permissions={permissions} />
              )}

              {hasAccessToModule('categories') && activeTab === 'categories' && (
                <CategoriesManagement permissions={permissions} />
              )}

              {hasAccessToModule('panchayaths') && activeTab === 'panchayaths' && (
                <PanchayathsManagement permissions={permissions} />
              )}

              {hasAccessToModule('announcements') && activeTab === 'announcements' && (
                <AnnouncementsManagement permissions={permissions} />
              )}

              {hasAccessToModule('utilities') && activeTab === 'utilities' && (
                <UtilitiesManagement />
              )}

              {hasAccessToModule('accounts') && activeTab === 'accounts' && (
                <AccountsManagement permissions={permissions} />
              )}

              {hasAccessToModule('reports') && activeTab === 'reports' && (
                <ReportsManagement permissions={permissions} />
              )}

              {permissions.canManageAdmins && activeTab === 'admins' && (
                <div className="space-y-6">
                  <AdminManagement permissions={permissions} />
                  <AdminPermissionsManagement permissions={permissions} />
                </div>
              )}
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
