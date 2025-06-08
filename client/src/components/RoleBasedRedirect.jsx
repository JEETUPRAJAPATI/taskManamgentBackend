
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

export default function RoleBasedRedirect() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem('token');

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/verify"],
    enabled: !!token,
    queryFn: async ({ queryKey }) => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const res = await fetch(queryKey[0], {
        headers,
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        return null;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    // If no token, redirect to login
    if (!token) {
      setLocation('/login');
      return;
    }

    // If we have a token but query failed, redirect to login
    if (!isLoading && !user && token) {
      localStorage.removeItem('token');
      setLocation('/login');
      return;
    }

    // If we have a user, redirect based on role
    if (user) {
      switch (user.role) {
        case 'super_admin':
          setLocation('/super-admin');
          break;
        case 'admin':
        case 'member':
          setLocation('/dashboard');
          break;
        default:
          setLocation('/login');
      }
    }
  }, [user, isLoading, token, setLocation]);

  // Show loading while we have a token and are fetching user data
  if (token && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
