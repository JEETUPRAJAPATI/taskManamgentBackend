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
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-gray-800 text-gray-100 border-l-2 border-gray-600'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                <Icon className={`flex-shrink-0 h-4 w-4 mr-3 ${
                  isActive(item.href)
                    ? 'text-gray-300'
                    : 'text-gray-400 group-hover:text-gray-300'
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