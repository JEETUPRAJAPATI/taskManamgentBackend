import React, { useEffect } from 'react';
import { setupTestAuth, isAuthenticated } from '@/utils/auth';

export default function AuthWrapper({ children }) {
  useEffect(() => {
    // Auto-setup authentication if not present
    if (!isAuthenticated()) {
      console.log('Setting up authentication automatically...');
      setupTestAuth();
    }
  }, []);

  return children;
}