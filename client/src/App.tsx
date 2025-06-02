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
    <Switch>
      <Route path="/" component={() => <AdminLayout><Dashboard /></AdminLayout>} />
      <Route path="/admin" component={() => <AdminLayout><Dashboard /></AdminLayout>} />
      <Route path="/admin/tasks" component={() => <AdminLayout><Tasks /></AdminLayout>} />
      <Route path="/admin/users" component={() => <AdminLayout><Users /></AdminLayout>} />
      <Route path="/admin/projects" component={() => <AdminLayout><Projects /></AdminLayout>} />
      <Route path="/admin/analytics" component={() => <AdminLayout><Analytics /></AdminLayout>} />
      <Route path="/admin/settings" component={() => <AdminLayout><Settings /></AdminLayout>} />
      <Route component={NotFound} />
    </Switch>
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
