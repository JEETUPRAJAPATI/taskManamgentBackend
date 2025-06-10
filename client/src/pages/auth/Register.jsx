import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Mail, Building2, User, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [registrationType, setRegistrationType] = useState("individual");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organizationName: "",
    organizationSlug: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateSlug = (slug) => {
    return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug for organization name
    if (field === "organizationName" && registrationType === "organization") {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, organizationSlug: slug }));
    }
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const newErrors = {};

    // Validate common fields
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate organization-specific fields
    if (registrationType === "organization") {
      if (!formData.organizationName) {
        newErrors.organizationName = "Organization name is required";
      }
      if (!formData.organizationSlug) {
        newErrors.organizationSlug = "Organization slug is required";
      } else if (!validateSlug(formData.organizationSlug)) {
        newErrors.organizationSlug = "Slug must be lowercase letters, numbers, and hyphens only";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const endpoint = registrationType === "individual" 
        ? "/api/auth/register-individual"
        : "/api/auth/register-organization";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        // Store email for verification
        localStorage.setItem('verificationEmail', formData.email);
        
        toast({
          title: "Registration successful!",
          description: "Please check your email for verification link"
        });

        // Clear form and show success message
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          organizationName: '',
          organizationSlug: ''
        });
        setErrors({});
        
        // Show additional success information
        setTimeout(() => {
          toast({
            title: "Check your email",
            description: "Click the verification link to complete your registration"
          });
        }, 1000);
      } else {
        setErrors({ submit: result.message || "Registration failed" });
        toast({
          title: "Registration failed",
          description: result.message || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
      toast({
        title: "Connection error",
        description: "Please check your internet connection",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Get started with TaskSetu today
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md">
          {/* Registration Type Toggle */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <button
                type="button"
                onClick={() => setRegistrationType("individual")}
                className={`flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  registrationType === "individual"
                    ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <User className="w-4 h-4 mr-2" />
                Individual
              </button>
              <button
                type="button"
                onClick={() => setRegistrationType("organization")}
                className={`flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  registrationType === "organization"
                    ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Organization
              </button>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John"
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Doe"
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="john@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Organization Fields */}
            {registrationType === "organization" && (
              <>
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Organization Name
                  </label>
                  <input
                    id="organizationName"
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange("organizationName", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Acme Corporation"
                  />
                  {errors.organizationName && <p className="mt-1 text-sm text-red-600">{errors.organizationName}</p>}
                </div>

                <div>
                  <label htmlFor="organizationSlug" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Organization URL
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm">
                      tasksetu.com/
                    </span>
                    <input
                      id="organizationSlug"
                      type="text"
                      value={formData.organizationSlug}
                      onChange={(e) => handleInputChange("organizationSlug", e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-r-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="acme-corp"
                    />
                  </div>
                  {errors.organizationSlug && <p className="mt-1 text-sm text-red-600">{errors.organizationSlug}</p>}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>
              </>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}