import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(method, url, data) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

export const getQueryFn = ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('token');
    
    console.log('API Request:', queryKey[0]);
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length);
    
    const headers = {
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };

    console.log('Request headers:', headers);

    const res = await fetch(queryKey[0], {
      headers,
      credentials: "include",
    });

    console.log('Response status:', res.status);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log('401 unauthorized, returning null');
      return null;
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.log('Error response body:', errorText);
      throw new Error(`${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log('Success response:', Array.isArray(data) ? `Array[${data.length}]` : typeof data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 0, // Always consider data stale for fresh updates
      gcTime: 0, // Don't cache data
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
