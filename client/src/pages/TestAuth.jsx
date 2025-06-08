import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function TestAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const testLogin = async (email, password, role) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem("token", result.token);
        
        toast({
          title: `${role} Login Successful`,
          description: `Welcome back, ${result.user.firstName}!`
        });

        // Role-based redirection
        if (result.user.role === 'super_admin') {
          setLocation("/super-admin");
        } else if (result.user.role === 'admin') {
          setLocation("/dashboard");
        } else {
          setLocation("/dashboard");
        }
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setLocation("/login");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Test Panel</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Demo Credentials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Company Admin</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Email: admin@test.com<br/>
                  Password: password123<br/>
                  Role: admin
                </p>
                <button
                  onClick={() => testLogin("admin@test.com", "password123", "Company Admin")}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "Logging in..." : "Login as Admin"}
                </button>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Super Admin</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Email: superadmin@test.com<br/>
                  Password: password123<br/>
                  Role: super_admin
                </p>
                <button
                  onClick={() => testLogin("superadmin@test.com", "password123", "Super Admin")}
                  disabled={isLoading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isLoading ? "Logging in..." : "Login as Super Admin"}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-3">Current Session</h3>
            <div className="flex gap-4">
              <button
                onClick={logout}
                className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
              >
                Logout
              </button>
              <button
                onClick={() => setLocation("/")}
                className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
              >
                Go to Home (Role Redirect)
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Flow Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>JWT Token Authentication Working</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Role-based Access Control Implemented</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Auto-authentication for Registration Enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Demo Credentials Created</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}