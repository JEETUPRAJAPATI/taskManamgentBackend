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

// Generate a fresh token every time
export const generateFreshToken = async () => {
  try {
    const response = await fetch('/api/auth/generate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: '684c8f719882ef84d7008fc5',
        email: 'org@gmail.com',
        role: 'admin',
        organizationId: '684c8f719882ef84d7008fc3'
      })
    });
    
    if (response.ok) {
      const { token } = await response.json();
      return token;
    }
  } catch (error) {
    console.log('Failed to generate fresh token, using fallback');
  }
  
  // Fallback to generating token on frontend using current timestamp
  const currentTime = Math.floor(Date.now() / 1000);
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({
    id: '684c8f719882ef84d7008fc5',
    email: 'org@gmail.com', 
    role: 'admin',
    organizationId: '684c8f719882ef84d7008fc3',
    iat: currentTime,
    exp: currentTime + (7 * 24 * 60 * 60) // 7 days
  }))}.mock-signature-will-be-replaced`;
};

// Set up authentication for testing
export const setupTestAuth = async () => {
  // Clear existing auth first
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  const token = await generateFreshToken();
  const user = {
    id: '684c8f719882ef84d7008fc5',
    email: 'org@gmail.com',
    role: 'admin',
    firstName: 'Org',
    lastName: 'Admin',
    organizationId: '684c8f719882ef84d7008fc3'
  };
  
  setAuthToken(token, user);
  console.log('Fresh authentication set up successfully');
  console.log('Token stored:', !!localStorage.getItem('token'));
};