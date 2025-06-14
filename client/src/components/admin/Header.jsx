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
    <header className="bg-blue-900 border-b border-blue-800 h-14">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-blue-200  lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={onSidebarToggle}
            className="hidden lg:block p-2 rounded-md text-blue-200 "
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Search */}
          <div className="ml-4 flex items-center">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-blue-400" />
              </div>
              <input
                className="block w-64 pl-10 pr-3 py-2 border border-blue-700 rounded-md bg-blue-800 placeholder-blue-300 text-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search..."
                type="search"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Invite User Button - Only for organization admins */}
          {canInviteUsers && (
            <Link href="/invite-users">
              <button className="flex items-center px-3 py-2 text-sm font-medium text-blue-200  rounded-md transition-colors">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </button>
            </Link>
          )}

          {/* Notifications */}
          <button className="p-2 rounded-md text-blue-200  relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center p-2 rounded-md text-blue-200  transition-colors"
            >
              <div className="flex items-center">
                <div className="relative">
                  <User className="h-5 w-5" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-gray-800 rounded-full"></div>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-100 hidden sm:block">
                  Admin
                </span>
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                  profileDropdownOpen ? 'rotate-180' : ''
                }`} />
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-blue-800 rounded-lg shadow-lg border border-blue-700 py-2 z-50">
                {/* Profile Header */}
                <div className="px-4 py-3 border-b border-blue-700">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-blue-100 font-semibold">
                        AU
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-blue-800 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-100">Admin User</p>
                      <p className="text-xs text-blue-300">admin@tasksetu.com</p>
                      <p className="text-xs text-green-400">● Online</p>
                    </div>
                  </div>
                </div>

                {/* Profile Setup Options */}
                <div className="px-2 py-2">
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                      Profile Setup
                    </p>
                  </div>
                  
                  {profileMenuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={index}
                        onClick={item.action}
                        className="w-full flex items-start p-3 rounded-lg  transition-colors text-left group"
                      >
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5 text-blue-300 group-hover:text-blue-200 transition-colors" />
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <p className="text-sm font-medium text-blue-100 group-hover:text-white">
                            {item.label}
                          </p>
                          <p className="text-xs text-blue-300 mt-1">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Logout Section */}
                <div className="border-t border-gray-700 px-2 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-red-900/20 transition-colors text-left group"
                  >
                    <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                    <span className="ml-3 text-sm font-medium text-gray-100 group-hover:text-red-400">
                      Sign Out
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}