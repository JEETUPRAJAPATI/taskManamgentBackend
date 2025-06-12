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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SimpleSidebar />
      
      <div className="ml-56">
        <Header 
          onMenuClick={toggleMobileMenu}
          onSidebarToggle={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
        
        <main className="px-4 py-4 min-h-screen">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}