import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
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

// Super Admin Components
import SuperAdminLayout from './components/super-admin/SuperAdminLayout';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import CompaniesManagement from './pages/super-admin/CompaniesManagement';
import UsersManagement from './pages/super-admin/UsersManagement';
import SystemLogs from './pages/super-admin/SystemLogs';
import AdminManagement from './pages/super-admin/AdminManagement';

import { Toaster } from './components/ui/toaster';

// Authentication Components
import RegistrationChoice from './pages/auth/RegistrationChoice';
import Login from './pages/auth/Login';
import EmailVerification from './pages/auth/EmailVerification';
import ResetPassword from './pages/auth/ResetPassword';
import AcceptInvitation from './pages/auth/AcceptInvitation';

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
  return useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
}

// Route protection wrapper
function ProtectedRoute({ component: Component, requiredRole, ...props }) {
  const { data: user, isLoading } = useUserRole();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this area.</p>
          <button 
            onClick={() => setLocation(user.role === 'super_admin' ? '/super-admin' : '/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <Component {...props} />;
}

function App() {
  const [location] = useLocation();
  const isSuperAdminRoute = location.startsWith('/super-admin');
  const isAuthRoute = ['/register', '/login', '/verify-email', '/reset-password', '/accept-invitation'].includes(location);

  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Public Authentication Routes - No Layout */}
        <Route path="/register" component={RegistrationChoice} />
        <Route path="/login" component={Login} />
        <Route path="/verify-email" component={EmailVerification} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/accept-invitation" component={AcceptInvitation} />
        
        {/* Super Admin Routes */}
        <Route path="/super-admin" nest>
          <SuperAdminLayout>
            <Switch>
              <Route path="/">
                <ProtectedRoute component={SuperAdminDashboard} requiredRole="super_admin" />
              </Route>
              <Route path="/companies">
                <ProtectedRoute component={CompaniesManagement} requiredRole="super_admin" />
              </Route>
              <Route path="/users">
                <ProtectedRoute component={UsersManagement} requiredRole="super_admin" />
              </Route>
              <Route path="/logs">
                <ProtectedRoute component={SystemLogs} requiredRole="super_admin" />
              </Route>
              <Route path="/admins">
                <ProtectedRoute component={AdminManagement} requiredRole="super_admin" />
              </Route>
              <Route path="/analytics">
                <ProtectedRoute component={SuperAdminDashboard} requiredRole="super_admin" />
              </Route>
              <Route path="/settings">
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                  <p className="text-gray-600 mt-2">System configuration options coming soon.</p>
                </div>
              </Route>
              <Route>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                    <p className="text-gray-600">The super admin page you're looking for doesn't exist.</p>
                  </div>
                </div>
              </Route>
            </Switch>
          </SuperAdminLayout>
        </Route>
        
        {/* Protected Admin Routes */}
        <Route>
          <AdminLayout>
            <Switch>
              <Route path="/">
                <ProtectedRoute component={Dashboard} />
              </Route>
              <Route path="/dashboard">
                <ProtectedRoute component={Dashboard} />
              </Route>
              <Route path="/tasks">
                <ProtectedRoute component={Tasks} />
              </Route>
              <Route path="/users">
                <ProtectedRoute component={Users} />
              </Route>
              <Route path="/user-management">
                <ProtectedRoute component={UserManagement} requiredRole="admin" />
              </Route>
              <Route path="/projects">
                <ProtectedRoute component={Projects} />
              </Route>
              <Route path="/forms">
                <ProtectedRoute component={FormBuilder} />
              </Route>
              <Route path="/integrations">
                <ProtectedRoute component={Integrations} />
              </Route>
              <Route path="/roles">
                <ProtectedRoute component={Roles} />
              </Route>
              <Route path="/reports">
                <ProtectedRoute component={Reports} />
              </Route>
              <Route>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page Not Found</h2>
                    <p className="text-slate-600 dark:text-slate-300">The page you're looking for doesn't exist.</p>
                  </div>
                </div>
              </Route>
            </Switch>
          </AdminLayout>
        </Route>
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;