import { Link } from "wouter";
import { User, Building2, ArrowRight, Shield } from "lucide-react";

export default function RegistrationChoice() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join TaskSetu
          </h1>
          <p className="text-gray-600">
            Choose how you'd like to get started with our platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Individual User */}
          <Link href="/register/individual">
            <div className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-200 hover:border-blue-300 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Individual User
                </h3>
                <p className="text-gray-600 mb-6">
                  Join an existing organization or work independently with personal task management
                </p>
                <ul className="text-sm text-gray-500 space-y-2 mb-6">
                  <li>• Personal dashboard and task management</li>
                  <li>• Join existing company workspaces</li>
                  <li>• Collaborate with teams</li>
                  <li>• Free personal account</li>
                </ul>
                <div className="flex items-center justify-center text-blue-600 font-medium group-hover:text-blue-700">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>

          {/* Organization Admin */}
          <Link href="/register/organization">
            <div className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-200 hover:border-blue-300 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-200 transition-colors">
                  <Building2 className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Organization
                </h3>
                <p className="text-gray-600 mb-6">
                  Create and manage your company workspace with team collaboration tools
                </p>
                <ul className="text-sm text-gray-500 space-y-2 mb-6">
                  <li>• Complete organization management</li>
                  <li>• User and role management</li>
                  <li>• Project and task tracking</li>
                  <li>• Advanced analytics and reporting</li>
                </ul>
                <div className="flex items-center justify-center text-indigo-600 font-medium group-hover:text-indigo-700">
                  Create Organization
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Super Admin Access */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
            <Shield className="h-4 w-4" />
            <span>Platform administrators can access the</span>
            <Link href="/super-admin" className="font-medium hover:underline">
              super admin panel
            </Link>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}