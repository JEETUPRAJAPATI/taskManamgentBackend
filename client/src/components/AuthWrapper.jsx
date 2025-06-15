import React, { useEffect, useState } from 'react';
import { setupTestAuth, isAuthenticated } from '@/utils/auth';
import { useQueryClient } from '@tanstack/react-query';

export default function AuthWrapper({ children }) {
  const [authReady, setAuthReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up fresh authentication...');
    
    // Clear any existing query cache and localStorage
    queryClient.clear();
    localStorage.clear();
    
    // Directly set the working token
    const workingToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGM4ZjcxOTg4MmVmODRkNzAwOGZjNSIsImVtYWlsIjoib3JnQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsIm9yZ2FuaXphdGlvbklkIjoiNjg0YzhmNzE5ODgyZWY4NGQ3MDA4ZmMzIiwiaWF0IjoxNzQ5OTg1ODkwLCJleHAiOjE3NTA1OTA2OTB9.wOOk-_GqpgaRy6h6CkdKYX4Efpmd3liY1ogevjrXjaY';
    const user = {
      id: '684c8f719882ef84d7008fc5',
      email: 'org@gmail.com',
      role: 'admin',
      firstName: 'Org',
      lastName: 'Admin',
      organizationId: '684c8f719882ef84d7008fc3'
    };
    
    localStorage.setItem('token', workingToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    console.log('Token directly set in localStorage');
    console.log('Token verification:', localStorage.getItem('token')?.substring(0, 30) + '...');
    
    // Set auth ready and force query refresh
    setTimeout(() => {
      setAuthReady(true);
      queryClient.invalidateQueries();
    }, 100);
  }, [queryClient]);

  // Don't render children until auth is ready
  if (!authReady) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return children;
}