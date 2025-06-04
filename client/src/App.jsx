import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import Dashboard from './pages/admin/Dashboard';
import Tasks from './pages/admin/Tasks';
import Users from './pages/admin/Users';
import Projects from './pages/admin/Projects';
import FormBuilder from './pages/admin/FormBuilder';
import Integrations from './pages/admin/Integrations';
import Collaboration from './pages/admin/Collaboration';
import Companies from './pages/admin/Companies';
import SubscriptionPlans from './pages/admin/SubscriptionPlans';
import Transactions from './pages/admin/Transactions';
import Roles from './pages/admin/Roles';
import Reports from './pages/admin/Reports';
import { AdminLayout } from './components/admin/AdminLayout';
import { Toaster } from './components/ui/toaster';
import { QuickActionsProvider } from './components/QuickActionsProvider';

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
      <QuickActionsProvider>
        <AdminLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/users" component={Users} />
            <Route path="/projects" component={Projects} />
            <Route path="/forms" component={FormBuilder} />
            <Route path="/integrations" component={Integrations} />
            <Route path="/collaboration" component={Collaboration} />
            <Route path="/companies" component={Companies} />
            <Route path="/subscription-plans" component={SubscriptionPlans} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/roles" component={Roles} />
            <Route path="/reports" component={Reports} />
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
        <Toaster />
      </QuickActionsProvider>
    </QueryClientProvider>
  );
}

export default App;