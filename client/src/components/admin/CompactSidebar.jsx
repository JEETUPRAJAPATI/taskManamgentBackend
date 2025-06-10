import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  FolderOpen,
  FileText,
  Settings,
  Menu,
  X,
  Shield,
  BarChart3,
  UserCog
} from "lucide-react";

export function Sidebar({ isOpen, isMobileMenuOpen, onToggle, onMobileToggle }) {
  const [location] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Projects", href: "/projects", icon: FolderOpen },
    { name: "Forms", href: "/forms", icon: FileText },
    { name: "Users", href: "/users", icon: Users },
    { name: "Roles", href: "/roles", icon: Shield },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Integrations", href: "/integrations", icon: Settings },
    { name: "Settings", href: "/settings/user-management", icon: UserCog },
  ];

  // Add admin-only navigation items
  const adminOnlyItems = [
    // Settings link is now in base navigation for all users
  ];

  // Build navigation based on user role
  const navigation = baseNavigation.reduce((nav, item) => {
    nav.push(item);
    
    // Add admin-only items after specific items if user is admin
    if (user?.role === 'admin') {
      const adminItem = adminOnlyItems.find(adminItem => adminItem.insertAfter === item.name);
      if (adminItem) {
        nav.push({
          name: adminItem.name,
          href: adminItem.href,
          icon: adminItem.icon
        });
      }
    }
    
    return nav;
  }, []);

  const isActive = (href) => {
    return location === href || (href === "/dashboard" && location === "/");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 bg-slate-800 dark:bg-slate-900 border-r border-slate-700 dark:border-slate-800 transition-all duration-300 shadow-xl ${
        isOpen ? 'w-56' : 'w-14'
      } hidden lg:block`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-10 px-2 border-b border-slate-700 dark:border-slate-800 bg-slate-900 dark:bg-slate-950">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckSquare className="h-5 w-5 text-blue-400" />
              </div>
              {isOpen && (
                <div className="ml-2">
                  <h1 className="text-sm font-bold text-white">TaskSetu</h1>
                  <p className="text-xs text-slate-400">Professional</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-1 py-2 space-y-0.5 overflow-y-auto">
            {/* Core Features Section */}
            <div className="space-y-0.5">
              <div className="px-2 py-1">
                {isOpen && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Core
                  </p>
                )}
              </div>
              
              {navigation.slice(0, 3).map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className={index < 2 ? 'border-b border-slate-700/30 dark:border-slate-600/30' : ''}>
                    <Link 
                      href={item.href} 
                      className={`group flex items-center px-2 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative ${
                        isActive(item.href)
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'text-slate-300 hover:bg-slate-700/70 hover:text-white hover:shadow-md'
                      }`}
                    >
                      <Icon className={`flex-shrink-0 h-4 w-4 transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'text-blue-100'
                          : 'text-slate-400 group-hover:text-blue-400'
                      } ${isOpen ? 'mr-2' : ''}`} />
                      
                      {isOpen && (
                        <span className="font-medium text-sm">{item.name}</span>
                      )}
                      
                      {!isOpen && (
                        <div className="absolute left-14 bg-slate-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                          {item.name}
                        </div>
                      )}
                      
                      {isActive(item.href) && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full"></div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Management Section */}
            <div className="space-y-0.5 pt-2">
              <div className="px-2 py-1">
                {isOpen && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Management
                  </p>
                )}
              </div>
              
              {navigation.slice(3, 7).map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className={index < 3 ? 'border-b border-slate-700/30 dark:border-slate-600/30' : ''}>
                    <Link 
                      href={item.href} 
                      className={`group flex items-center px-2 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative ${
                        isActive(item.href)
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'text-slate-300 hover:bg-slate-700/70 hover:text-white hover:shadow-md'
                      }`}
                    >
                      <Icon className={`flex-shrink-0 h-4 w-4 transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'text-blue-100'
                          : 'text-slate-400 group-hover:text-blue-400'
                      } ${isOpen ? 'mr-2' : ''}`} />
                      
                      {isOpen && (
                        <span className="font-medium text-sm">{item.name}</span>
                      )}
                      
                      {!isOpen && (
                        <div className="absolute left-14 bg-slate-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                          {item.name}
                        </div>
                      )}
                      
                      {isActive(item.href) && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full"></div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Settings Section */}
            <div className="space-y-0.5 pt-2">
              <div className="px-2 py-1">
                {isOpen && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Settings
                  </p>
                )}
              </div>
              
              {navigation.slice(7).map((item, index) => {
                const Icon = item.icon;
                const isLast = index === navigation.slice(7).length - 1;
                return (
                  <div key={item.name} className={!isLast ? 'border-b border-slate-700/30 dark:border-slate-600/30' : ''}>
                    <Link 
                      href={item.href} 
                      className={`group flex items-center px-2 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative ${
                        isActive(item.href)
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'text-slate-300 hover:bg-slate-700/70 hover:text-white hover:shadow-md'
                      }`}
                    >
                      <Icon className={`flex-shrink-0 h-4 w-4 transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'text-blue-100'
                          : 'text-slate-400 group-hover:text-blue-400'
                      } ${isOpen ? 'mr-2' : ''}`} />
                      
                      {isOpen && (
                        <span className="font-medium text-sm">{item.name}</span>
                      )}
                      
                      {!isOpen && (
                        <div className="absolute left-14 bg-slate-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                          {item.name}
                        </div>
                      )}
                      
                      {isActive(item.href) && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full"></div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-y-0 left-0 w-56 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between h-10 px-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <h1 className="ml-2 text-sm font-bold text-slate-900 dark:text-white">
                  TaskSetu
                </h1>
              </div>
              <button
                onClick={onMobileToggle}
                className="p-1 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 px-2 py-2 space-y-0.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href} 
                    onClick={onMobileToggle}
                    className={`group flex items-center px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`flex-shrink-0 h-4 w-4 ${
                      isActive(item.href)
                        ? 'text-blue-600'
                        : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                    }`} />
                    <span className="ml-2">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}