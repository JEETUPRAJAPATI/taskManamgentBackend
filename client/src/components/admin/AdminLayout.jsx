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
    <div className="min-h-screen bg-gray-100">
      <SimpleSidebar />
      
      <div className="ml-56">
        <Header 
          onMenuClick={toggleMobileMenu}
          onSidebarToggle={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
        
        <main className="px-6 py-6 min-h-screen bg-gray-50">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}