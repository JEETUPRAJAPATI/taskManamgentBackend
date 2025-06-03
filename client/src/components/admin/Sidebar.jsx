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
  MessageSquare,
  Building2,
  CreditCard,
  Receipt
} from "lucide-react";

export function Sidebar({ isOpen, isMobileMenuOpen, onToggle, onMobileToggle }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Projects", href: "/projects", icon: FolderOpen },
    { name: "Collaboration", href: "/collaboration", icon: MessageSquare },
    { name: "Forms", href: "/forms", icon: FileText },
    { name: "Users", href: "/users", icon: Users },
    { name: "Companies", href: "/companies", icon: Building2 },
    { name: "Subscription Plans", href: "/subscription-plans", icon: CreditCard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Integrations", href: "/integrations", icon: Settings },
  ];

  const isActive = (href) => {
    return location === href || (href === "/dashboard" && location === "/");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      } hidden lg:block`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckSquare className="h-8 w-8 text-orange-600" />
              </div>
              {isOpen && (
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    TaskSetu
                  </h1>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-orange-100 text-orange-900 dark:bg-orange-900/20 dark:text-orange-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}>
                  <Icon className={`flex-shrink-0 h-5 w-5 ${
                    isActive(item.href)
                      ? 'text-orange-600'
                      : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                  }`} />
                  {isOpen && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </Link>
              );
            })}
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
                <CheckSquare className="h-8 w-8 text-orange-600" />
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
                        ? 'bg-orange-100 text-orange-900 dark:bg-orange-900/20 dark:text-orange-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`flex-shrink-0 h-5 w-5 ${
                      isActive(item.href)
                        ? 'text-orange-600'
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