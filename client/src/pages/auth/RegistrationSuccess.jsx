import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";

export default function RegistrationSuccess() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [registrationType, setRegistrationType] = useState("individual");

  useEffect(() => {
    // Get email and type from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const typeParam = urlParams.get('type');
    
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('registrationEmail', emailParam);
    } else {
      const storedEmail = localStorage.getItem('registrationEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        // No email found, redirect to registration
        setLocation('/register');
        return;
      }
    }

    if (typeParam) {
      setRegistrationType(typeParam);
      localStorage.setItem('registrationType', typeParam);
    } else {
      const storedType = localStorage.getItem('registrationType');
      if (storedType) {
        setRegistrationType(storedType);
      }
    }
  }, [setLocation]);

  const getTitle = () => {
    return registrationType === "organization" 
      ? "Organization Registration Initiated"
      : "Account Registration Initiated";
  };

  const getDescription = () => {
    return registrationType === "organization"
      ? "Your organization workspace setup is almost complete"
      : "Your individual account setup is almost complete";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{getTitle()}</h2>
            <p className="text-gray-600 mt-2">{getDescription()}</p>
          </div>

          {email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Email sent to:</span> {email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Next Steps
              </h3>
              <p className="text-green-700 mb-4">
                A verification link has been sent to your email. Please complete your registration.
              </p>
              <div className="text-sm text-green-600 space-y-2">
                <p>1. Check your email inbox</p>
                <p>2. Click the verification link</p>
                <p>3. Set your secure password</p>
                <p>4. Start using TaskSetu</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Didn't receive the email?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure you entered the correct email</li>
                <li>• The link expires in 24 hours</li>
              </ul>
            </div>

            <div className="text-center space-y-3">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Login
              </Link>
              
              <div className="text-sm text-gray-500">
                <span>Need help? </span>
                <a href="mailto:support@tasksetu.com" className="text-blue-600 hover:text-blue-700">
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}