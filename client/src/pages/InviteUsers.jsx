import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Mail, X, UserPlus, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function InviteUsers() {
  const [inviteList, setInviteList] = useState([{ email: "", role: "employee" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/roles"],
  });

  // Get organization license info
  const { data: licenseInfo, isLoading: licenseLoading } = useQuery({
    queryKey: ["/api/organization/license"],
  });

  // Invite users mutation
  const inviteUsersMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await fetch("/api/users/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ users: userData })
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
        description: `${data.results?.length || 0} invitations were sent`,
      });
      setInviteList([{ email: "", role: "employee" }]);
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users-detailed"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send invitations",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addInviteRow = () => {
    setInviteList([...inviteList, { email: "", role: "employee" }]);
  };

  const removeInviteRow = (index) => {
    if (inviteList.length > 1) {
      setInviteList(inviteList.filter((_, i) => i !== index));
    }
  };

  const updateInviteRow = (index, field, value) => {
    const updated = [...inviteList];
    updated[index][field] = value;
    setInviteList(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all emails are filled
    const validInvites = inviteList.filter(invite => invite.email.trim() !== "");
    
    if (validInvites.length === 0) {
      toast({
        title: "No valid invitations",
        description: "Please add at least one email address",
        variant: "destructive",
      });
      return;
    }

    // Check license limits
    if (licenseInfo && validInvites.length > licenseInfo.availableSlots) {
      toast({
        title: "License limit exceeded",
        description: `You can only invite ${licenseInfo.availableSlots} more users. Upgrade your plan for more slots.`,
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

  if (rolesLoading || licenseLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Invite Users</h1>
          <p className="text-gray-400 mt-1">
            Send invitations to new team members to join your organization
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <UserPlus className="h-4 w-4" />
          <span>
            {licenseInfo ? `${licenseInfo.availableSlots} slots available` : "Loading..."}
          </span>
        </div>
      </div>

      {/* License Warning */}
      {licenseInfo && licenseInfo.availableSlots <= 5 && (
        <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="text-amber-400 font-medium">Limited slots available</h3>
            <p className="text-amber-300 text-sm mt-1">
              You have {licenseInfo.availableSlots} invitation slots remaining. 
              Consider upgrading your plan to invite more team members.
            </p>
          </div>
        </div>
      )}

      {/* Invite Form */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Team Member Invitations
              </label>
              
              <div className="space-y-3">
                {inviteList.map((invite, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={invite.email}
                          onChange={(e) => updateInviteRow(index, "email", e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="w-40">
                      <select
                        value={invite.role}
                        onChange={(e) => updateInviteRow(index, "role", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="employee">Employee</option>
                        <option value="org_admin">Admin</option>
                        {roles.map((role) => (
                          <option key={role._id} value={role.name}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {inviteList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInviteRow(index)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-md transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addInviteRow}
                className="mt-3 flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add another invitation
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Invited users will receive an email with setup instructions
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || inviteUsersMutation.isPending}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting || inviteUsersMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Invitations...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Send Invitations
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent Invitations */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-100 mb-4">Recent Activity</h3>
          <div className="text-sm text-gray-400">
            Recent invitation activity will appear here once the system tracks invitation history.
          </div>
        </div>
      </div>
    </div>
  );
}