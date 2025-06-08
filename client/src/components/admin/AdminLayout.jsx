import { useState } from "react";
import { Sidebar } from "./CompactSidebar";
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
      <Sidebar 
        isOpen={sidebarOpen} 
        isMobileMenuOpen={isMobileMenuOpen}
        onToggle={toggleSidebar}
        onMobileToggle={toggleMobileMenu}
      />
      
      <div className={`transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-56' : 'lg:ml-14'
      }`}>
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

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}
    </div>
  );
}