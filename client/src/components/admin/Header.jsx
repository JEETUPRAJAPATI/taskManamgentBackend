import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, Bell, Search, User, Settings, LogOut, Edit, Shield, Key, Palette, HelpCircle, ChevronDown, UserPlus } from "lucide-react";

export function Header({ onMenuClick, onSidebarToggle, sidebarOpen }) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [, setLocation] = useLocation();
  const dropdownRef = useRef(null);

  // Get current user data to check role
  const { data: user } = useQuery({
    queryKey: ["/api/auth/verify"],
    enabled: !!localStorage.getItem('token'),
  });

  // Check if user can invite users (organization admins only)
  const canInviteUsers = user?.role === 'org_admin' || user?.role === 'superadmin';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem('token');
    // Close dropdown
    setProfileDropdownOpen(false);
    // Redirect to login
    setLocation('/login');
  };

  const profileMenuItems = [
    {
      icon: Edit,
      label: "Edit Profile",
      description: "Update your personal information",
      action: () => console.log("Edit profile clicked")
    },
    {
      icon: Settings,
      label: "Account Settings",
      description: "Manage your account preferences",
      action: () => console.log("Account settings clicked")
    },
    {
      icon: Shield,
      label: "Security & Privacy",
      description: "Two-factor auth and privacy settings",
      action: () => console.log("Security settings clicked")
    },
    {
      icon: Key,
      label: "API Keys",
      description: "Manage your API access keys",
      action: () => console.log("API keys clicked")
    },
    {
      icon: Palette,
      label: "Appearance",
      description: "Theme and display preferences",
      action: () => console.log("Appearance clicked")
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      description: "Get help and contact support",
      action: () => console.log("Help clicked")
    }
  ];

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            {getPageTitle()}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              type="search"
              placeholder="Search..."
              className="input-modern pl-10 w-64"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 hover:scale-105">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-full animate-pulse"></span>
          </Button>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 hover:scale-105"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-4 py-2 transition-all duration-200 hover:scale-105">
                <Avatar className="w-8 h-8 ring-2 ring-slate-200 dark:ring-slate-700">
                  <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Admin User</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Administrator</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
              <DropdownMenuLabel className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">AD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Admin User</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">admin@taskflow.com</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <div className="p-2">
                <DropdownMenuItem className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}