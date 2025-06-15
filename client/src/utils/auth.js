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
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NGM4ZjcxOTg4MmVmODRkNzAwOGZjNSIsImVtYWlsIjoib3JnQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsIm9yZ2FuaXphdGlvbklkIjoiNjg0YzhmNzE5ODgyZWY4NGQ3MDA4ZmMzIiwiaWF0IjoxNzQ5OTgzNTkwLCJleHAiOjE3NTA1ODgzOTB9.cWNRNFh93rRyfXGa_sugEchGmyrXZmaxQS4-07Rbepo';
  const user = {
    id: '684c8f719882ef84d7008fc5',
    email: 'org@gmail.com',
    role: 'admin',
    firstName: 'Org',
    lastName: 'Admin',
    organizationId: '684c8f719882ef84d7008fc3'
  };
  setAuthToken(token, user);
  console.log('Test authentication set up successfully');
};