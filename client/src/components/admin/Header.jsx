import { useLocation } from "wouter";
import { Search, Bell, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
  sidebarOpen: boolean;
}

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/admin": "Dashboard", 
  "/admin/tasks": "Tasks",
  "/admin/users": "Users",
  "/admin/projects": "Projects",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
};

export function Header({ onToggleSidebar, onToggleMobileMenu, sidebarOpen }: HeaderProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const currentPageName = pageNames[location] || "Dashboard";

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onToggleMobileMenu}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-foreground">{currentPageName}</h1>
            <nav className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground ml-4">
              <span>Admin</span>
              <span>/</span>
              <span className="text-foreground font-medium">{currentPageName}</span>
            </nav>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              className="w-64 pl-10 bg-background"
            />
          </div>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="relative"
          >
            <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
