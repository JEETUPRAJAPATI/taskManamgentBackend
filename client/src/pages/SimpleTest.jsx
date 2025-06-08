import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function SimpleTest() {
  const [location, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken || "No token found");
  }, []);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser("No token in localStorage");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(`Error: ${response.status} - ${await response.text()}`);
      }
    } catch (error) {
      setUser(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@test.com",
          password: "password123"
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem("token", result.token);
        setToken(result.token);
        alert(`Login successful! Role: ${result.user.role}`);
        
        // Force refresh auth check
        setTimeout(checkAuth, 100);
      } else {
        alert(`Login failed: ${result.message}`);
      }
    } catch (error) {
      alert(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRedirect = (path) => {
    console.log(`Attempting to redirect to: ${path}`);
    setLocation(path);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug Panel</h1>
      
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Current Location</h2>
          <p className="text-sm bg-gray-100 p-2 rounded">{location}</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Token Status</h2>
          <p className="text-sm bg-gray-100 p-2 rounded break-all">
            {token.length > 50 ? token.substring(0, 50) + "..." : token}
          </p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Authentication Check</h2>
          <button 
            onClick={checkAuth}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-3"
          >
            {loading ? "Checking..." : "Check Auth Status"}
          </button>
          
          {user && (
            <div className="mt-3 p-3 bg-gray-100 rounded">
              <pre className="text-sm overflow-auto">
                {typeof user === 'string' ? user : JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Login Test</h2>
          <button 
            onClick={testLogin}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Logging in..." : "Test Login (admin@test.com)"}
          </button>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Navigation Test</h2>
          <div className="space-x-3">
            <button 
              onClick={() => testRedirect("/dashboard")}
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Go to /dashboard
            </button>
            <button 
              onClick={() => testRedirect("/super-admin")}
              className="bg-purple-600 text-white px-4 py-2 rounded"
            >
              Go to /super-admin
            </button>
            <button 
              onClick={() => testRedirect("/login")}
              className="bg-gray-600 text-white px-4 py-2 rounded"
            >
              Go to /login
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Clear Session</h2>
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              setToken("Token cleared");
              setUser(null);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Clear Token
          </button>
        </div>
      </div>
    </div>
  );
}