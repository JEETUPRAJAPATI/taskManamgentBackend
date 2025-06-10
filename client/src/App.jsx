import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getQueryFn } from '@/lib/queryClient';
import Dashboard from './pages/admin/CompactDashboard';
import Tasks from './pages/admin/Tasks';
import Users from './pages/admin/Users';
import UserManagement from './pages/admin/UserManagement';
import Projects from './pages/admin/Projects';
import FormBuilder from './pages/admin/FormBuilder';
import Integrations from './pages/admin/Integrations';
import Roles from './pages/admin/Roles';
import Reports from './pages/admin/Reports';
import { AdminLayout } from './components/admin/AdminLayout';
import SettingsLayout from './components/settings/SettingsLayout';
import GeneralSettings from './pages/settings/GeneralSettings';
import SettingsPlaceholder from './pages/settings/SettingsPlaceholder';

// Super Admin Components
import SuperAdminLayout from './components/super-admin/SuperAdminLayout';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import CompaniesManagement from './pages/super-admin/CompaniesManagement';
import UsersManagement from './pages/super-admin/UsersManagement';
import SystemLogs from './pages/super-admin/SystemLogs';
import AdminManagement from './pages/super-admin/AdminManagement';

import { Toaster } from './components/ui/toaster';

// Authentication Components
import Register from './pages/auth/Register';
import RegistrationChoice from './pages/auth/RegistrationChoice';
import IndividualRegistration from './pages/auth/IndividualRegistration';
import OrganizationRegistration from './pages/auth/OrganizationRegistration';
import Login from './pages/auth/Login';

import CreatePassword from './pages/auth/CreatePassword';
import ResetPassword from './pages/auth/ResetPassword';
import AcceptInvite from './pages/auth/AcceptInvite';
import VerifyAndSetPassword from './pages/auth/VerifyAndSetPassword';
import RegistrationSuccess from './pages/auth/RegistrationSuccess';
import TestAuth from './pages/TestAuth';


// Components
import RoleBasedRedirect from './components/RoleBasedRedirect';
import SecureRoute from './components/ProtectedRoute';
import ForbiddenPage from './pages/ForbiddenPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// User Role Check Component
function useUserRole() {
  const token = localStorage.getItem('token');
  
  return useQuery({
    queryKey: ["/api/auth/verify"],
    enabled: !!token, // Only run query if token exists
    queryFn: async ({ queryKey }) => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const res = await fetch(queryKey[0], {
        headers,
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        // Clear invalid token
        localStorage.removeItem('token');
        return null;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Route protection wrapper
function ProtectedRoute({ component: Component, requiredRole, allowedRoles = [], ...props }) {
  const { data: user, isLoading, error } = useUserRole();
  const [, setLocation] = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Only redirect if we have no token at all
    if (!token) {
      setLocation('/login');
      return;
    }
    
    // If we have a token but query failed and we're not loading, redirect
    if (!isLoading && !user && token) {
      localStorage.removeItem('token');
      setLocation('/login');
    }
  }, [user, isLoading, token, setLocation]);

  // Show loading while we have a token and are fetching user data
  if (token && isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render if no token or no user
  if (!token || !user) {
    return null;
  }

  // Check if user has required role or is in allowed roles
  const hasAccess = () => {
    if (requiredRole) {
      return user.role === requiredRole;
    }
    if (allowedRoles.length > 0) {
      return allowedRoles.includes(user.role);
    }
    return true; // No role requirement
  };

  if (!hasAccess()) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this area.</p>
          <div className="mt-4 space-x-2">
            <button 
              onClick={() => setLocation('/login')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Login as Different User
            </button>
            <button 
              onClick={() => {
                if (user.role === 'super_admin') {
                  setLocation('/super-admin');
                } else if (user.role === 'admin' || user.role === 'member') {
                  setLocation('/dashboard');
                } else {
                  setLocation('/login');
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (Component) {
    return <Component {...props} />;
  }
  
  return props.children || null;
}

function App() {
  const [location] = useLocation();
  const isSuperAdminRoute = location.startsWith('/super-admin');
  const isAuthRoute = ['/register', '/login', '/verify', '/registration-success', '/reset-password', '/accept-invitation'].includes(location);

  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Root Route - Role-based redirect */}
        <Route path="/" component={RoleBasedRedirect} />

        {/* Public Authentication Routes - No Layout */}
        <Route path="/register" component={Register} />
        <Route path="/register/choice" component={RegistrationChoice} />
        <Route path="/register/individual" component={IndividualRegistration} />
        <Route path="/register/organization" component={OrganizationRegistration} />
        <Route path="/login" component={Login} />

        <Route path="/verify" component={VerifyAndSetPassword} />
        <Route path="/registration-success" component={RegistrationSuccess} />
        <Route path="/create-password" component={CreatePassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/register/invite/:token" component={AcceptInvite} />
        <Route path="/forbidden" component={ForbiddenPage} />
        <Route path="/test-auth" component={TestAuth} />


        {/* Super Admin Routes */}
        <Route path="/super-admin">
          <SuperAdminLayout>
            <ProtectedRoute component={SuperAdminDashboard} requiredRole="super_admin" />
          </SuperAdminLayout>
        </Route>
        <Route path="/super-admin/companies">
          <SuperAdminLayout>
            <ProtectedRoute component={CompaniesManagement} requiredRole="super_admin" />
          </SuperAdminLayout>
        </Route>
        <Route path="/super-admin/users">
          <SuperAdminLayout>
            <ProtectedRoute component={UsersManagement} requiredRole="super_admin" />
          </SuperAdminLayout>
        </Route>
        <Route path="/super-admin/logs">
          <SuperAdminLayout>
            <ProtectedRoute component={SystemLogs} requiredRole="super_admin" />
          </SuperAdminLayout>
        </Route>
        <Route path="/super-admin/admins">
          <SuperAdminLayout>
            <ProtectedRoute component={AdminManagement} requiredRole="super_admin" />
          </SuperAdminLayout>
        </Route>
        <Route path="/super-admin/analytics">
          <SuperAdminLayout>
            <ProtectedRoute component={SuperAdminDashboard} requiredRole="super_admin" />
          </SuperAdminLayout>
        </Route>
        <Route path="/super-admin/settings">
          <SuperAdminLayout>
            <ProtectedRoute requiredRole="super_admin">
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600 mt-2">System configuration options coming soon.</p>
              </div>
            </ProtectedRoute>
          </SuperAdminLayout>
        </Route>

        {/* Protected Admin Routes */}
        <Route path="/dashboard">
          <AdminLayout>
            <ProtectedRoute component={Dashboard} allowedRoles={["admin", "member"]} />
          </AdminLayout>
        </Route>
        <Route path="/tasks">
          <AdminLayout>
            <ProtectedRoute component={Tasks} />
          </AdminLayout>
        </Route>
        <Route path="/users">
          <AdminLayout>
            <ProtectedRoute component={Users} />
          </AdminLayout>
        </Route>
        <Route path="/user-management">
          <AdminLayout>
            <ProtectedRoute component={UserManagement} allowedRoles={["admin"]} />
          </AdminLayout>
        </Route>
        <Route path="/projects">
          <AdminLayout>
            <ProtectedRoute component={Projects} />
          </AdminLayout>
        </Route>
        <Route path="/forms">
          <AdminLayout>
            <ProtectedRoute component={FormBuilder} />
          </AdminLayout>
        </Route>
        <Route path="/integrations">
          <AdminLayout>
            <ProtectedRoute component={Integrations} />
          </AdminLayout>
        </Route>
        <Route path="/roles">
          <AdminLayout>
            <ProtectedRoute component={Roles} />
          </AdminLayout>
        </Route>
        <Route path="/reports">
          <AdminLayout>
            <ProtectedRoute component={Reports} />
          </AdminLayout>
        </Route>
        {/* Settings Routes */}
        <Route path="/settings">
          <SettingsLayout>
            <ProtectedRoute requiredRole="admin">
              <div className="p-6">
                <script>window.location.href = '/settings/user-management';</script>
                <p>Redirecting to User Management...</p>
              </div>
            </ProtectedRoute>
          </SettingsLayout>
        </Route>
        <Route path="/settings/general">
          <SettingsLayout>
            <ProtectedRoute component={GeneralSettings} requiredRole="admin" />
          </SettingsLayout>
        </Route>
        <Route path="/settings/user-management">
          <SettingsLayout>
            <ProtectedRoute component={UserManagement} requiredRole="admin" />
          </SettingsLayout>
        </Route>
        <Route path="/settings/roles">
          <SettingsLayout>
            <ProtectedRoute component={Roles} requiredRole="admin" />
          </SettingsLayout>
        </Route>
        <Route path="/settings/billing">
          <SettingsLayout>
            <ProtectedRoute requiredRole="admin">
              <SettingsPlaceholder 
                title="Billing & Subscription" 
                description="Manage your subscription and billing information" 
              />
            </ProtectedRoute>
          </SettingsLayout>
        </Route>
        <Route path="/settings/notifications">
          <SettingsLayout>
            <ProtectedRoute requiredRole="admin">
              <SettingsPlaceholder 
                title="Notifications" 
                description="Configure email and system notifications" 
              />
            </ProtectedRoute>
          </SettingsLayout>
        </Route>
        <Route path="/settings/security">
          <SettingsLayout>
            <ProtectedRoute requiredRole="admin">
              <SettingsPlaceholder 
                title="Security Settings" 
                description="Configure password policies and two-factor authentication" 
              />
            </ProtectedRoute>
          </SettingsLayout>
        </Route>
        <Route path="/settings/api-keys">
          <SettingsLayout>
            <ProtectedRoute requiredRole="admin">
              <SettingsPlaceholder 
                title="API Keys" 
                description="Manage API access tokens and integrations" 
              />
            </ProtectedRoute>
          </SettingsLayout>
        </Route>
        <Route path="/settings/integrations">
          <SettingsLayout>
            <ProtectedRoute component={Integrations} requiredRole="admin" />
          </SettingsLayout>
        </Route>

        {/* 404 Not Found */}
        <Route>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
              <p className="text-gray-600">The page you're looking for doesn't exist.</p>
            </div>
          </div>
        </Route>
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;