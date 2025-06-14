import { Link, useLocation } from "wouter";
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
  BarChart3
} from "lucide-react";

export function Sidebar({ isOpen, isMobileMenuOpen, onToggle, onMobileToggle }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Projects", href: "/projects", icon: FolderOpen },
    { name: "Forms", href: "/forms", icon: FileText },
    { name: "Users", href: "/users", icon: Users },
    { name: "Role Management", href: "/roles", icon: Shield },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Integrations", href: "/integrations", icon: Settings },
  ];

  const isActive = (href) => {
    return location === href || (href === "/dashboard" && location === "/");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 bg-black border-r border-gray-800 transition-all duration-300 shadow-xl ${
        isOpen ? 'w-64' : 'w-16'
      } hidden lg:block`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="sidebar-modern-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <CheckSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-800 dark:from-slate-100 dark:to-blue-300 bg-clip-text text-transparent">
              TaskSetu
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Admin Panel</p>
          </div>
        </div>
      </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
            {/* Core Features Section */}
            <div className="space-y-1">
              <div className="px-2 py-1">
                {isOpen && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Core Features
                  </p>
                )}
              </div>

              {navigation.slice(0, 3).map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.name}>
                    <Link 
                      href={item.href} 
                      className={`group flex items-center px-3 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out relative ${
                        isActive(item.href)
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'text-slate-300 hover:bg-slate-700/70 hover:text-white hover:shadow-md'
                      }`}
                    >
                      <Icon className={`flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'text-blue-100'
                          : 'text-slate-400 group-hover:text-blue-400'
                      } ${isOpen ? 'mr-3' : ''}`} />

                      {isOpen && (
                        <span className="font-medium">{item.name}</span>
                      )}

                      {!isOpen && (
                        <div className="absolute left-16 bg-slate-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                          {item.name}
                        </div>
                      )}

                      {isActive(item.href) && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full"></div>
                      )}
                    </Link>

                    {index < 3 && (
                      <div className="my-2 mx-3 border-t border-slate-700/50 dark:border-slate-800/50"></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Section Divider */}
            <div className="my-6">
              <div className="border-t border-slate-600/60 dark:border-slate-700/60 mx-3"></div>
              {isOpen && (
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4 mb-2 px-3 uppercase tracking-wider">
                  Management
                </p>
              )}
            </div>

            {/* Management Section */}
            <div className="space-y-1">
              {navigation.slice(3, 7).map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.name}>
                    <Link 
                      href={item.href} 
                      className={`group flex items-center px-3 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out relative ${
                        isActive(item.href)
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'text-slate-300 hover:bg-slate-700/70 hover:text-white hover:shadow-md'
                      }`}
                    >
                      <Icon className={`flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'text-blue-100'
                          : 'text-slate-400 group-hover:text-blue-400'
                      } ${isOpen ? 'mr-3' : ''}`} />

                      {isOpen && (
                        <span className="font-medium">{item.name}</span>
                      )}

                      {!isOpen && (
                        <div className="absolute left-16 bg-slate-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                          {item.name}
                        </div>
                      )}

                      {isActive(item.href) && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full"></div>
                      )}
                    </Link>

                    {index < 3 && (
                      <div className="my-2 mx-3 border-t border-slate-700/50 dark:border-slate-800/50"></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Section Divider */}
            <div className="my-6">
              <div className="border-t border-slate-600/60 dark:border-slate-700/60 mx-3"></div>
              {isOpen && (
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4 mb-2 px-3 uppercase tracking-wider">
                  Settings
                </p>
              )}
            </div>

            {/* Integration Section */}
            <div className="space-y-1">
              {navigation.slice(7).map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.name}>
                    <Link 
                      href={item.href} 
                      className={`group flex items-center px-3 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out relative ${
                        isActive(item.href)
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'text-slate-300 hover:bg-slate-700/70 hover:text-white hover:shadow-md'
                      }`}
                    >
                      <Icon className={`flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'text-blue-100'
                          : 'text-slate-400 group-hover:text-blue-400'
                      } ${isOpen ? 'mr-3' : ''}`} />

                      {isOpen && (
                        <span className="font-medium">{item.name}</span>
                      )}

                      {!isOpen && (
                        <div className="absolute left-16 bg-slate-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-lg">
                          {item.name}
                        </div>
                      )}

                      {isActive(item.href) && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full"></div>
                      )}
                    </Link>

                    {index < navigation.slice(7).length - 1 && (
                      <div className="my-2 mx-3 border-t border-slate-700/50 dark:border-slate-800/50"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-y-0 left-0 w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center">
                <CheckSquare className="h-8 w-8 text-blue-600" />
                <h1 className="ml-3 text-xl font-bold text-slate-900 dark:text-white">
                  TaskSetu
                </h1>
              </div>
              <button
                onClick={onMobileToggle}
                className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href} 
                    onClick={onMobileToggle}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`flex-shrink-0 h-5 w-5 ${
                      isActive(item.href)
                        ? 'text-blue-600'
                        : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                    }`} />
                    <span className="ml-3">{item.name}</span>
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

function SidebarItem({ icon: Icon, label, path, isActive }) {
  return (
    <Link
      to={path}
      className={`nav-item-modern group ${isActive ? 'active' : ''}`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
        isActive ? 'text-blue-600 dark:text-blue-400' : ''
      }`} />
      <span className="relative z-10">{label}</span>
      {isActive && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-l-full" />
      )}
    </Link>
  );
}