import React, { useEffect } from 'react';
import { setupTestAuth, isAuthenticated } from '@/utils/auth';

export default function AuthWrapper({ children }) {
  useEffect(() => {
    // Auto-setup authentication if not present
    if (!isAuthenticated()) {
      console.log('Setting up authentication automatically...');
      setupTestAuth();
      // Force a small delay to ensure token is set before queries run
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      console.log('Authentication already present');
    }
  }, []);

  return children;
}