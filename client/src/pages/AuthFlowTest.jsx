
import { useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, User, Shield, Building } from "lucide-react";

export default function AuthFlowTest() {
  const [, setLocation] = useLocation();
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userCreationResults, setUserCreationResults] = useState(null);

  const runAuthTests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/auth-flow');
      const results = await response.json();
      setTestResults(results);
    } catch (error) {
      setTestResults({
        error: 'Failed to run tests',
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTestUsers = async () => {
    try {
      const response = await fetch('/api/test/create-test-users', {
        method: 'POST'
      });
      const results = await response.json();
      setUserCreationResults(results);
    } catch (error) {
      setUserCreationResults({
        error: 'Failed to create test users',
        message: error.message
      });
    }
  };

  const testLogin = async (email, password, userType) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('token', result.token);
        
        // Redirect based on role
        if (result.user.role === 'super_admin') {
          setLocation('/super-admin');
        } else {
          setLocation('/dashboard');
        }
      } else {
        const error = await response.json();
        alert(`Login failed: ${error.message}`);
      }
    } catch (error) {
      alert(`Login error: ${error.message}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'SKIP':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Authentication Flow Test Panel
          </h1>
          <p className="text-gray-600">
            Comprehensive testing for registration, login, and role-based access
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              <button
                onClick={runAuthTests}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {isLoading ? 'Running Tests...' : 'Run Authentication Tests'}
              </button>

              <button
                onClick={createTestUsers}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <User className="h-4 w-4" />
                Create Test Users
              </button>
            </div>

            {/* Test Login Credentials */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Test Login Credentials</h3>
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Super Admin</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Email: superadmin@test.com<br />
                    Password: password123
                  </p>
                  <button
                    onClick={() => testLogin('superadmin@test.com', 'password123', 'Super Admin')}
                    className="w-full bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700"
                  >
                    Login as Super Admin
                  </button>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Company Admin</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Email: admin@test.com<br />
                    Password: password123
                  </p>
                  <button
                    onClick={() => testLogin('admin@test.com', 'password123', 'Company Admin')}
                    className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                  >
                    Login as Company Admin
                  </button>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Member</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Email: member@test.com<br />
                    Password: password123
                  </p>
                  <button
                    onClick={() => testLogin('member@test.com', 'password123', 'Member')}
                    className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                  >
                    Login as Member
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
            
            {testResults && (
              <div className="space-y-4">
                {testResults.error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p className="font-medium">Error:</p>
                    <p>{testResults.message}</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Test run at: {testResults.timestamp}
                      </p>
                      {testResults.summary && (
                        <p className="text-sm font-medium">
                          Results: {testResults.summary.passed}/{testResults.summary.total} tests passed
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      {testResults.tests.map((test, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(test.status)}
                            <span className="font-medium">{test.test}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              test.status === 'PASS' ? 'bg-green-100 text-green-800' :
                              test.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {test.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{test.message}</p>
                          {test.userRole && (
                            <p className="text-xs text-gray-500 mt-1">User Role: {test.userRole}</p>
                          )}
                          {test.tokenData && (
                            <div className="text-xs text-gray-500 mt-2">
                              <p>Token Data:</p>
                              <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(test.tokenData, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {userCreationResults && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-3">User Creation Results</h3>
                {userCreationResults.error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                    <p>{userCreationResults.message}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userCreationResults.results.map((result, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {result.status === 'created' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {result.status === 'exists' && <AlertCircle className="h-4 w-4 text-orange-500" />}
                        {result.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                        <span className="capitalize font-medium">{result.type}:</span>
                        <span>{result.email || 'N/A'}</span>
                        <span className="text-gray-500">({result.status})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Test Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setLocation('/register/individual')}
              className="bg-blue-100 text-blue-800 py-3 px-4 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Test Individual Registration
            </button>
            <button
              onClick={() => setLocation('/register/organization')}
              className="bg-indigo-100 text-indigo-800 py-3 px-4 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              Test Organization Registration
            </button>
            <button
              onClick={() => setLocation('/login')}
              className="bg-green-100 text-green-800 py-3 px-4 rounded-lg hover:bg-green-200 transition-colors"
            >
              Test Login Flow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
