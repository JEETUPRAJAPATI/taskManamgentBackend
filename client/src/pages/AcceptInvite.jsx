import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, EyeOff, UserPlus, CheckCircle, AlertCircle, Shield, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export function AcceptInvite() {
  console.log('AcceptInvite function called');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get token from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  // Debug logging
  console.log('AcceptInvite component loaded');
  console.log('URL:', window.location.href);
  console.log('Token from URL:', token);
  
  // Early return if no token
  if (!token) {
    console.log('No token found, showing error');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              No invitation token provided in the URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/login')} 
              className="w-full"
              variant="outline"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Validate invitation token and get invitation details
  const { data: inviteData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/validate-invite", token],
    queryFn: async () => {
      console.log('Fetching invitation data for token:', token);
      const response = await fetch(`/api/auth/validate-invite?token=${token}`);
      console.log('Response status:', response.status);
      if (!response.ok) {
        const error = await response.json();
        console.log('Error response:', error);
        throw new Error(error.message || "Invalid or expired invitation");
      }
      const data = await response.json();
      console.log('Invitation data received:', data);
      return data;
    },
    enabled: !!token,
    retry: false,
  });

  // Complete invitation mutation
  const completeInviteMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await fetch("/api/auth/complete-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          ...userData
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete invitation");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome to TaskSetu!",
        description: "Your account has been created successfully. You can now log in.",
      });
      
      // Store token if provided and redirect to dashboard
      if (data.token) {
        localStorage.setItem('token', data.token);
        setLocation('/dashboard');
      } else {
        setLocation('/login');
      }
    },
    onError: (error) => {
      const isAlreadyRegistered = error.message?.includes("already been accepted") || 
                                 error.message?.includes("already registered");
      
      if (isAlreadyRegistered) {
        toast({
          title: "Already Registered",
          description: "This invitation has already been used. Please log in instead.",
          variant: "destructive",
        });
        
        // Redirect to login after showing the error
        setTimeout(() => setLocation('/login'), 2000);
      } else {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    completeInviteMutation.mutate({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      password: formData.password
    });
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
      case "org_admin":
        return <Shield className="h-4 w-4 text-orange-500" />;
      case "manager":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "member":
        return <User className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  // Debug logging for states
  console.log('Component state:', { isLoading, error, inviteData, token });

  // Add a simple test render to debug the blank page
  if (!token && !isLoading) {
    console.log('Rendering no token message');
  }
  
  // Debug: Check if we're reaching the main render
  if (!isLoading && !error && inviteData) {
    console.log('About to render registration form with data:', inviteData);
  }

  // Loading state
  if (isLoading) {
    console.log('Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !inviteData) {
    const isAlreadyRegistered = error?.message?.includes("already been accepted") || 
                               error?.message?.includes("already registered");
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className={`w-12 h-12 ${isAlreadyRegistered ? 'bg-blue-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {isAlreadyRegistered ? (
                <CheckCircle className="h-6 w-6 text-blue-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <CardTitle className={isAlreadyRegistered ? "text-blue-600" : "text-red-600"}>
              {isAlreadyRegistered ? "Already Registered" : "Invalid Invitation"}
            </CardTitle>
            <CardDescription>
              {error?.message || "This invitation link is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => setLocation('/login')} 
              className="w-full"
              variant={isAlreadyRegistered ? "default" : "outline"}
            >
              {isAlreadyRegistered ? "Log In" : "Go to Login"}
            </Button>
            {isAlreadyRegistered && (
              <Button 
                onClick={() => setLocation('/')} 
                className="w-full"
                variant="outline"
              >
                Go to Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Rendering main registration form');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Complete Your Registration</h2>
          <p className="mt-2 text-gray-600">
            You've been invited to join <span className="font-semibold text-blue-600">{inviteData?.organizationName}</span>
          </p>
        </div>

        {/* Invitation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Invitation Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm text-gray-600">Organization</Label>
              <p className="font-medium">{inviteData.organizationName}</p>
            </div>
            
            <div>
              <Label className="text-sm text-gray-600">Your Role(s)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(inviteData.roles || [inviteData.role]).map((role, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {getRoleIcon(role)}
                    <span className="ml-1 capitalize">{role}</span>
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-gray-600">Email</Label>
              <p className="font-medium">{inviteData.email}</p>
            </div>
            
            {inviteData.invitedByName && (
              <div>
                <Label className="text-sm text-gray-600">Invited by</Label>
                <p className="font-medium">{inviteData.invitedByName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Fill in your details to complete the registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={completeInviteMutation.isPending}
              >
                {completeInviteMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Complete Registration
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}