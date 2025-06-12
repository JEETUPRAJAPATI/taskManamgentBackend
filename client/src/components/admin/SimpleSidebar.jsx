import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  FolderOpen,
  FileText,
  Settings,
  Shield,
  BarChart3,
  UserCog
} from "lucide-react";

export function SimpleSidebar() {
  const [location] = useLocation();

  const navigation = [
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

  const isActive = (href) => {
    return location === href || (href === "/dashboard" && location === "/");
  };

  return (
    <div 
      className="fixed inset-y-0 left-0 z-50 w-56 bg-slate-800 border-r border-slate-700 shadow-xl"
      style={{ 
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
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${
                  isActive(item.href)
                    ? 'text-blue-100'
                    : 'text-slate-400 group-hover:text-blue-400'
                }`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}