import React, { useEffect, useState } from 'react';
import { setupTestAuth, isAuthenticated } from '@/utils/auth';

export default function AuthWrapper({ children }) {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Auto-setup authentication if not present
    if (!isAuthenticated()) {
      console.log('Setting up authentication automatically...');
      setupTestAuth();
    }
    
    // Always set auth ready after a brief delay to ensure token is in localStorage
    setTimeout(() => {
      setAuthReady(true);
    }, 50);
  }, []);

  // Don't render children until auth is ready
  if (!authReady) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return children;
}