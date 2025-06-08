import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Mail, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EmailVerification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState({});
  const [verificationComplete, setVerificationComplete] = useState(false);

  useEffect(() => {
    // Get email from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
    } else {
      const storedEmail = localStorage.getItem('verificationEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, []);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    
    if (!email || !verificationCode) {
      setErrors({ submit: "Email and verification code are required" });
      return;
    }

    if (verificationCode.length !== 6) {
      setErrors({ verificationCode: "Verification code must be 6 digits" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          verificationCode: verificationCode
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setVerificationComplete(true);
        localStorage.removeItem('verificationEmail');
        
        toast({
          title: "Email verified",
          description: "Your email has been verified successfully"
        });

        // Redirect to password creation
        setTimeout(() => {
          setLocation(`/create-password?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        setErrors({ submit: result.message || "Invalid verification code" });
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setErrors({ submit: "Email is required to resend verification code" });
      return;
    }

    setIsResending(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Code resent",
          description: "A new verification code has been sent to your email"
        });
      } else {
        setErrors({ submit: result.message || "Failed to resend verification code" });
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (value) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(cleanValue);
    
    if (errors.verificationCode) {
      setErrors(prev => ({ ...prev, verificationCode: "" }));
    }
  };

  if (verificationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. You're being redirected to create your password.
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
            <p className="text-gray-600 mt-2">
              We've sent a verification code to your email address
            </p>
          </div>

          {email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Email:</span> {email}
              </p>
            </div>
          )}

          <form onSubmit={handleVerifyEmail} className="space-y-4">
            {!email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-widest ${
                  errors.verificationCode ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="000000"
                maxLength="6"
                required
              />
              {errors.verificationCode && (
                <p className="text-red-500 text-xs mt-1">{errors.verificationCode}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || verificationCode.length !== 6}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm mb-3">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendCode}
              disabled={isResending || !email}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="h-4 w-4" />
              {isResending ? "Resending..." : "Resend Code"}
            </button>
          </div>

          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <Link href="/register" className="text-gray-600 hover:text-gray-900 text-sm">
              Back to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}