import React, { useEffect, useState } from 'react';
import { setupTestAuth, isAuthenticated } from '@/utils/auth';
import { useQueryClient } from '@tanstack/react-query';

export default function AuthWrapper({ children }) {
  const [authReady, setAuthReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const initAuth = async () => {
      console.log('Setting up fresh authentication...');
      
      // Clear any existing query cache to force refetch
      queryClient.clear();
      
      try {
        await setupTestAuth();
        console.log('Authentication setup complete');
      } catch (error) {
        console.error('Auth setup failed:', error);
      }
      
      // Set auth ready after ensuring token is set
      setTimeout(() => {
        setAuthReady(true);
        // Invalidate queries to force refetch with new token
        queryClient.invalidateQueries();
      }, 200);
    };
    
    initAuth();
  }, [queryClient]);

  // Don't render children until auth is ready
  if (!authReady) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return children;
}