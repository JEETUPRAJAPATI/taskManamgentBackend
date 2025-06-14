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

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Debug logging
  console.log('Sidebar render - user:', user, 'isLoading:', isLoading, 'isOpen:', isOpen);
  console.log('Navigation items:', navigation.length);

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
  const navigation = baseNavigation;

  const isActive = (href) => {
    return location === href || (href === "/dashboard" && location === "/");
  };

  return (
    <>
      {/* Debug Indicator */}
      <div className="fixed top-0 left-0 z-[9999] bg-red-500 text-white p-2 text-xs">
        Sidebar Loading: {isLoading ? 'Yes' : 'No'} | Open: {isOpen ? 'Yes' : 'No'}
      </div>

      {/* Desktop Sidebar */}
      <div 
        className="fixed inset-y-0 left-0 z-[1000] bg-slate-800 w-56 border-r border-slate-700 shadow-xl"
        style={{ 
          display: 'block !important', 
          visibility: 'visible !important',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '224px',
          backgroundColor: '#1e293b',
          zIndex: 1000
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-12 px-3 border-b border-slate-600 bg-slate-900">
            <CheckSquare className="h-6 w-6 text-blue-400" />
            <div className="ml-3">
              <h1 className="text-lg font-bold text-white">TaskSetu</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
            {/* Navigation Menu Items */}
            {navigation.map((item, index) => {
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

// Sample menu items for CompactSidebar (replace with your actual menu items)
const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", path: "/tasks", icon: CheckSquare },
    // ... other menu items
];

// Adding CompactSidebar component with updated styles
export function CompactSidebar() {
  const location = useLocation(); // Corrected from useLocation() to useLocation

  return (
    <div className="h-full w-16 bg-black border-r border-gray-800 flex flex-col items-center py-4">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">TS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col space-y-4">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`p-3 rounded-lg transition-all duration-200 group relative ${
              location[0] === item.path
                ? 'bg-blue-500 text-white'
                : 'text-white hover:bg-gray-800 hover:text-white'
            }`}
            title={item.name}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        ))}
      </nav>
    </div>
  );
}