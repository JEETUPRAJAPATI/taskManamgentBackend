// Authentication utilities for the frontend
export const setAuthToken = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getAuthUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getAuthUser();
  return !!(token && user);
};

// Set up authentication for testing
export const setupTestAuth = () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGNmMTc3NzExYzc5ZTFiOWMwZGQwMCIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoiYWRtaW4iLCJvcmdhbml6YXRpb25JZCI6IjY4NGNmMTc2NzExYzc5ZTFiOWMwZGNmZCIsImlhdCI6MTc0OTk4Mjc5NywiZXhwIjoxNzUwNTg3NTk3fQ.vAssY1iv0tBSgvKZwXGpEBfZv-g4i5G9e68oialVWaM';
  const user = {
    id: '684cf177711c79e1b9c0dd00',
    email: 'admin@demo.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    organizationId: '684cf176711c79e1b9c0dcfd'
  };
  setAuthToken(token, user);
  console.log('Test authentication set up successfully');
};