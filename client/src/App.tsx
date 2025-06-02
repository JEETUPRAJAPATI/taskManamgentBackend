import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import { AdminLayout } from "@/components/admin/AdminLayout";
import NotFound from "@/pages/not-found";

// Admin Pages
import Dashboard from "@/pages/admin/Dashboard";
import Tasks from "@/pages/admin/Tasks";
import Users from "@/pages/admin/Users";
import Projects from "@/pages/admin/Projects";
import Analytics from "@/pages/admin/Analytics";
import Settings from "@/pages/admin/Settings";

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/tasks" component={Tasks} />
        <Route path="/admin/users" component={Users} />
        <Route path="/admin/projects" component={Projects} />
        <Route path="/admin/analytics" component={Analytics} />
        <Route path="/admin/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AdminRouter />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
