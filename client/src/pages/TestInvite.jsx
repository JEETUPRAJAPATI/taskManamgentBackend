import React from 'react';

export function TestInvite() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  console.log('TestInvite component loaded');
  console.log('Token:', token);
  console.log('URL:', window.location.href);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Test Invitation Page</h1>
        <p className="mb-2">Current URL: {window.location.href}</p>
        <p className="mb-2">Token: {token || 'No token found'}</p>
        <p className="text-sm text-gray-600">This is a test component to debug routing issues.</p>
      </div>
    </div>
  );
}

export default TestInvite;