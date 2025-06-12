import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  FolderOpen,
  FileText,
  Settings,
  Shield,
  BarChart3,
  UserCog,
  UserPlus,
  ChevronRight,
  HelpCircle,
  Bell,
  Database
} from "lucide-react";

export function SimpleSidebar() {
  const [location] = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    admin: true,
    system: false
  });

  // Get current user data to check role
  const { data: user } = useQuery({
    queryKey: ["/api/auth/verify"],
    enabled: !!localStorage.getItem('token'),
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Check if user has organization management permissions
  const canManageOrganization = user?.role === 'org_admin' || user?.role === 'superadmin';
  const isIndividualUser = user?.role === 'individual';

  const mainNavigation = [
    { 
      name: isIndividualUser ? "Dashboard" : "Organization Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard,
      description: "Overview and analytics"
    },
    { 
      name: "Task Management", 
      href: "/tasks", 
      icon: CheckSquare,
      description: "Create and track tasks"
    },
    { 
      name: "Project Management", 
      href: "/projects", 
      icon: FolderOpen,
      description: "Manage active projects"
    },
    ...(canManageOrganization ? [{ 
      name: "Team Members", 
      href: "/users", 
      icon: Users,
      description: "Manage team and users"
    }] : []),
    { 
      name: "Reports & Analytics", 
      href: "/reports", 
      icon: BarChart3,
      description: "Performance insights"
    },
  ];

  const workflowNavigation = [
    { 
      name: "Forms & Workflows", 
      href: "/forms", 
      icon: FileText,
      description: "Create forms and processes"
    },
    { 
      name: "Integrations", 
      href: "/integrations", 
      icon: Settings,
      description: "Connect external tools"
    },
  ];

  const adminNavigation = [
    ...(canManageOrganization ? [
      { 
        name: "Invite Users", 
        href: "/invite-users", 
        icon: UserPlus,
        description: "Invite new team members"
      },
      { 
        name: "Role Management", 
        href: "/roles", 
        icon: Shield,
        description: "Configure permissions"
      }
    ] : []),
    { 
      name: "Admin Settings", 
      href: "/admin-settings", 
      icon: UserCog,
      description: "System configuration"
    },
  ];

  const isActive = (href) => {
    return location === href || (href === "/dashboard" && location === "/");
  };

  const renderNavItem = (item) => (
    <Link key={item.name} href={item.href}>
      <div className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 group hover:bg-gray-800 ${
        isActive(item.href) 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-300 hover:text-white'
      }`}>
        <item.icon className={`h-4 w-4 mr-3 ${
          isActive(item.href) ? 'text-blue-100' : 'text-gray-400 group-hover:text-blue-400'
        }`} />
        <div className="flex-1">
          <div className="font-medium">{item.name}</div>
          <div className="text-xs text-gray-500 group-hover:text-gray-400">
            {item.description}
          </div>
        </div>
      </div>
    </Link>
  );

  const renderSection = (title, items, sectionKey) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-6">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors"
        >
          {title}
          <ChevronRight className={`h-3 w-3 transition-transform ${
            expandedSections[sectionKey] ? 'rotate-90' : ''
          }`} />
        </button>
        {expandedSections[sectionKey] && (
          <div className="mt-2 space-y-1">
            {items.map(renderNavItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-56 bg-gray-900 border-r border-gray-800 shadow-xl">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800 bg-gray-950">
          <CheckSquare className="h-5 w-5 text-gray-400" />
          <div className="ml-3">
            <h1 className="text-sm font-semibold text-gray-100">TaskSetu</h1>
            <p className="text-xs text-gray-500">
              {isIndividualUser ? 'Personal' : 'Admin Panel'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Main Features */}
          <div className="mb-6">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main
            </div>
            <div className="mt-2 space-y-1">
              {mainNavigation.map(renderNavItem)}
            </div>
          </div>

          {/* Workflow Features */}
          <div className="mb-6">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Workflow
            </div>
            <div className="mt-2 space-y-1">
              {workflowNavigation.map(renderNavItem)}
            </div>
          </div>

          {/* Admin Features - Only show for organization admins */}
          {!isIndividualUser && renderSection("Administration", adminNavigation, "admin")}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            {user?.email || 'Loading...'}
          </div>
        </div>
      </div>
    </div>
  );

  const adminNavigation = [
    ...(canManageOrganization ? [
      { 
        name: "Invite Users", 
        href: "/invite-users", 
        icon: UserPlus,
        description: "Invite new team members"
      },
      { 
        name: "Role Management", 
        href: "/roles", 
        icon: Shield,
        description: "Configure permissions"
      }
    ] : []),
    { 
      name: "Admin Settings", 
      href: "/admin-settings", 
      icon: UserCog,
      description: "System configuration"
    },
  ];

  const isActive = (href) => {
    return location === href || (href === "/dashboard" && location === "/");
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-56 bg-gray-900 border-r border-gray-800 shadow-xl">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800 bg-gray-950">
          <CheckSquare className="h-5 w-5 text-gray-400" />
          <div className="ml-3">
            <h1 className="text-sm font-semibold text-gray-100">TaskSetu</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-4 overflow-y-auto">
          {/* Main Navigation Section */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Core Features
            </h3>
            <div className="space-y-1">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <div key={item.name} className="relative group">
                    <Link 
                      href={item.href} 
                      className={`group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-gray-700 text-gray-100 shadow-sm border-l-3 border-blue-500'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <Icon className={`flex-shrink-0 h-5 w-5 mr-3 transition-colors ${
                          active
                            ? 'text-blue-400'
                            : 'text-gray-400 group-hover:text-blue-400'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{item.name}</span>
                          <p className={`text-xs mt-0.5 transition-colors ${
                            active
                              ? 'text-gray-300'
                              : 'text-gray-500 group-hover:text-gray-400'
                          }`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                        active 
                          ? 'text-blue-400 transform rotate-90' 
                          : 'text-gray-500 group-hover:text-gray-400 group-hover:transform group-hover:translate-x-1'
                      }`} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Section */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Workflow & Automation
            </h3>
            <div className="space-y-1">
              {workflowNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <div key={item.name} className="relative group">
                    <Link 
                      href={item.href} 
                      className={`group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-gray-700 text-gray-100 shadow-sm border-l-3 border-blue-500'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <Icon className={`flex-shrink-0 h-5 w-5 mr-3 transition-colors ${
                          active
                            ? 'text-blue-400'
                            : 'text-gray-400 group-hover:text-blue-400'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{item.name}</span>
                          <p className={`text-xs mt-0.5 transition-colors ${
                            active
                              ? 'text-gray-300'
                              : 'text-gray-500 group-hover:text-gray-400'
                          }`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                        active 
                          ? 'text-blue-400 transform rotate-90' 
                          : 'text-gray-500 group-hover:text-gray-400 group-hover:transform group-hover:translate-x-1'
                      }`} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin Section */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Administration
            </h3>
            <div className="space-y-1">
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <div key={item.name} className="relative group">
                    <Link 
                      href={item.href} 
                      className={`group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-gray-700 text-gray-100 shadow-sm border-l-3 border-blue-500'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <Icon className={`flex-shrink-0 h-5 w-5 mr-3 transition-colors ${
                          active
                            ? 'text-blue-400'
                            : 'text-gray-400 group-hover:text-blue-400'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{item.name}</span>
                          <p className={`text-xs mt-0.5 transition-colors ${
                            active
                              ? 'text-gray-300'
                              : 'text-gray-500 group-hover:text-gray-400'
                          }`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                        active 
                          ? 'text-blue-400 transform rotate-90' 
                          : 'text-gray-500 group-hover:text-gray-400 group-hover:transform group-hover:translate-x-1'
                      }`} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer Section */}
        <div className="px-2 py-3 border-t border-gray-700">
          {/* Quick Actions */}
          <div className="space-y-1 mb-3">
            <button className="w-full flex items-center px-3 py-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-md transition-colors">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help & Support
            </button>
            <button className="w-full flex items-center px-3 py-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-md transition-colors">
              <Bell className="h-4 w-4 mr-2" />
              System Alerts
            </button>
            <button className="w-full flex items-center px-3 py-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-md transition-colors">
              <Database className="h-4 w-4 mr-2" />
              System Status
            </button>
          </div>

          {/* Version Info */}
          <div className="px-3 py-2 bg-gray-950 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300">TaskSetu</span>
              <span className="text-xs text-gray-500">v2.1.0</span>
            </div>
            <div className="flex items-center mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-500">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}