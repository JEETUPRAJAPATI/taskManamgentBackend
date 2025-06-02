import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import Dashboard from './pages/admin/Dashboard';
import Tasks from './pages/admin/Tasks';
import Users from './pages/admin/Users';
import Projects from './pages/admin/Projects';
import FormBuilder from './pages/admin/FormBuilder';
import Integrations from './pages/admin/Integrations';
import { AdminLayout } from './components/admin/AdminLayout';
import { Toaster } from './components/ui/toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/users" component={Users} />
          <Route path="/projects" component={Projects} />
          <Route path="/forms" component={FormBuilder} />
          <Route path="/integrations" component={Integrations} />
          <Route>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                <p className="text-gray-600">The page you're looking for doesn't exist.</p>
              </div>
            </div>
          </Route>
        </Switch>
      </AdminLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;