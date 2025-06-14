import { useState } from "react";
import { SimpleSidebar } from "./SimpleSidebar";
import { Header } from "./Header";

export function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <div className="sidebar-modern sticky top-0">
          <SimpleSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="nav-modern sticky top-0 z-40">
            <Header 
              onMenuClick={toggleMobileMenu}
              onSidebarToggle={toggleSidebar}
              sidebarOpen={sidebarOpen}
            />
          </div>

          {/* Page Content */}
          <main className="flex-1 p-6 layout-modern-container">
            <div className="animate-fade-in-up">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}