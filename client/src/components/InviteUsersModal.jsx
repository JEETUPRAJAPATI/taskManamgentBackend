import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Mail, 
  X, 
  UserPlus, 
  Check, 
  AlertCircle,
  Users,
  Shield,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function InviteUsersModal({ isOpen, onClose }) {
  const [inviteList, setInviteList] = useState([
    { 
      email: "", 
      roles: ["member"], 
      emailError: "",
      isValid: false 
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get organization license info
  const { data: licenseInfo } = useQuery({
    queryKey: ["/api/organization/license"],
    enabled: isOpen,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setInviteList([
        { 
          email: "", 
          roles: ["member"], 
          emailError: "",
          isValid: false 
        }
      ]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return "Email is required";
    }
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }
    return "";
  };

  // Update email and validate
  const updateInviteEmail = (index, email) => {
    const emailError = validateEmail(email);
    const isValid = !emailError && email.trim() !== "";
    
    setInviteList(prev => prev.map((invite, i) => 
      i === index 
        ? { ...invite, email, emailError, isValid }
        : invite
    ));
  };

  // Toggle role selection
  const toggleRole = (index, role) => {
    setInviteList(prev => prev.map((invite, i) => {
      if (i !== index) return invite;
      
      const currentRoles = invite.roles;
      if (role === "member") {
        // Member role cannot be removed
        return invite;
      }
      
      const hasRole = currentRoles.includes(role);
      const newRoles = hasRole 
        ? currentRoles.filter(r => r !== role)
        : [...currentRoles, role];
      
      return { ...invite, roles: newRoles };
    }));
  };

  // Add new invite row
  const addInviteRow = () => {
    setInviteList(prev => [
      ...prev, 
      { 
        email: "", 
        roles: ["member"], 
        emailError: "",
        isValid: false 
      }
    ]);
  };

  // Remove invite row
  const removeInviteRow = (index) => {
    if (inviteList.length > 1) {
      setInviteList(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Invite users mutation
  const inviteUsersMutation = useMutation({
    mutationFn: async (inviteData) => {
      const response = await fetch("/api/organization/invite-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ invites: inviteData })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send invitations");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitations sent successfully",
        description: `${data.successCount || 0} invitations were sent`,
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users-detailed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/license"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send invitations",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit invitations
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all rows
    const validInvites = inviteList.filter(invite => invite.isValid);
    const invalidInvites = inviteList.filter(invite => !invite.isValid);
    
    if (invalidInvites.length > 0) {
      toast({
        title: "Please fix validation errors",
        description: "Some email addresses are invalid or empty",
        variant: "destructive",
      });
      return;
    }

    if (validInvites.length === 0) {
      toast({
        title: "No valid invitations",
        description: "Please enter at least one valid email address",
        variant: "destructive",
      });
      return;
    }

    // Check license limits
    if (licenseInfo && validInvites.length > licenseInfo.availableSlots) {
      toast({
        title: "License limit exceeded",
        description: `You can only invite ${licenseInfo.availableSlots} more users. Upgrade your plan for more licenses.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await inviteUsersMutation.mutateAsync(validInvites);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid
  const isFormValid = inviteList.some(invite => invite.isValid) && 
                     inviteList.every(invite => invite.email === "" || invite.isValid);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            Invite Users
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 mt-2">
            Send invitations to new team members. They'll receive an email with instructions to join your organization.
          </DialogDescription>
        </DialogHeader>

        {/* License Information */}
        {licenseInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">License Usage</h3>
                <p className="text-sm text-blue-700">
                  {licenseInfo.usedLicenses} of {licenseInfo.totalLicenses} licenses used • 
                  {licenseInfo.availableSlots} slots available
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invitation Rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Team Members to Invite</h3>
              <span className="text-sm text-gray-500">{inviteList.length} invitation{inviteList.length !== 1 ? 's' : ''}</span>
            </div>

            {inviteList.map((invite, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-700">Invitation #{index + 1}</h4>
                  {inviteList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInviteRow(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email Input */}
                  <div>
                    <Label htmlFor={`email-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        placeholder="Enter email address"
                        value={invite.email}
                        onChange={(e) => updateInviteEmail(index, e.target.value)}
                        className={`pl-10 ${
                          invite.emailError 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : invite.isValid 
                              ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                      />
                      {invite.isValid && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Check className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                    </div>
                    {invite.emailError && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {invite.emailError}
                      </p>
                    )}
                  </div>
                  
                  {/* Role Selection */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Role Assignment
                    </Label>
                    <div className="space-y-3">
                      {/* Member Role (Required) */}
                      <div className="flex items-center">
                        <Checkbox
                          id={`member-${index}`}
                          checked={invite.roles.includes("member")}
                          disabled={true}
                          className="mr-3"
                        />
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <Label htmlFor={`member-${index}`} className="text-sm text-gray-700">
                            Member <span className="text-xs text-gray-500">(Required)</span>
                          </Label>
                        </div>
                      </div>
                      
                      {/* Manager Role (Optional) */}
                      <div className="flex items-center">
                        <Checkbox
                          id={`manager-${index}`}
                          checked={invite.roles.includes("manager")}
                          onCheckedChange={() => toggleRole(index, "manager")}
                          className="mr-3"
                        />
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-blue-500 mr-2" />
                          <Label htmlFor={`manager-${index}`} className="text-sm text-gray-700">
                            Manager
                          </Label>
                        </div>
                      </div>
                      
                      {/* Admin Role (Optional) */}
                      <div className="flex items-center">
                        <Checkbox
                          id={`admin-${index}`}
                          checked={invite.roles.includes("admin")}
                          onCheckedChange={() => toggleRole(index, "admin")}
                          className="mr-3"
                        />
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-orange-500 mr-2" />
                          <Label htmlFor={`admin-${index}`} className="text-sm text-gray-700">
                            Admin
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Another Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={addInviteRow}
              className="flex items-center space-x-2 border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
              <span>Add Another User</span>
            </Button>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {inviteList.filter(invite => invite.isValid).length} valid invitation{inviteList.filter(invite => invite.isValid).length !== 1 ? 's' : ''} ready to send
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Invitations...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invitations
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}