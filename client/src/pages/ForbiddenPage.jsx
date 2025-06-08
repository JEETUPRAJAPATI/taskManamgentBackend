import { useLocation } from "wouter";
import { Shield, ArrowLeft, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function ForbiddenPage() {
  const [, setLocation] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const handleGoHome = () => {
    if (user) {
      if (user.role === 'super_admin') {
        setLocation('/super-admin');
      } else if (user.role === 'admin' || user.role === 'member') {
        setLocation('/dashboard');
      } else {
        setLocation('/login');
      }
    } else {
      setLocation('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">403</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Forbidden</h2>
          
          <p className="text-gray-600 mb-6">
            You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
          </p>

          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Current role:</span> {user.role}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Email:</span> {user.email}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoHome}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </button>
            
            <button
              onClick={() => setLocation('/login')}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Login as Different User
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              If you need access to this area, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}