import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Mail, 
  X, 
  UserPlus, 
  Check, 
  AlertCircle, 
  Users, 
  CreditCard,
  MoreHorizontal,
  UserCheck,
  UserX,
  RefreshCw,
  Crown,
  Shield,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserManagement() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteList, setInviteList] = useState([{ email: "", roles: ["member"] }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user data to check role
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/verify"],
    enabled: !!localStorage.getItem('token'),
  });

  // Check if user can manage organization
  const canManageOrganization = currentUser?.role === 'org_admin' || currentUser?.role === 'superadmin';

  // Get organization license info
  const { data: licenseInfo, isLoading: licenseLoading } = useQuery({
    queryKey: ["/api/organization/license"],
    enabled: canManageOrganization,
  });

  // Get organization users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/organization/users-detailed"],
    enabled: canManageOrganization,
  });

  // Get available roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/roles"],
    enabled: canManageOrganization,
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
      setIsInviteModalOpen(false);
      setInviteList([{ email: "", roles: ["member"] }]);
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

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await fetch(`/api/organization/users/${userId}/deactivate`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to deactivate user");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User deactivated",
        description: "User has been successfully deactivated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users-detailed"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to deactivate user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await fetch(`/api/users/${userId}/resend-invite`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend invitation");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation resent",
        description: "Invitation email has been sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to resend invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Redirect if not authorized
  if (!canManageOrganization) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You don't have permission to access this page. Only organization administrators can manage users and subscriptions.</p>
        </div>
      </div>
    );
  }

  const addInviteRow = () => {
    setInviteList([...inviteList, { email: "", roles: ["member"] }]);
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

  const toggleRole = (index, role) => {
    const updated = [...inviteList];
    const currentRoles = updated[index].roles;
    
    if (role === "member") {
      // Member cannot be removed
      return;
    }
    
    if (currentRoles.includes(role)) {
      updated[index].roles = currentRoles.filter(r => r !== role);
    } else {
      updated[index].roles = [...currentRoles, role];
    }
    
    setInviteList(updated);
  };

  const handleInviteSubmit = async (e) => {
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

    // Check for existing emails
    const existingEmails = users.map(user => user.email.toLowerCase());
    const duplicateEmails = validInvites.filter(invite => 
      existingEmails.includes(invite.email.toLowerCase())
    );

    if (duplicateEmails.length > 0) {
      toast({
        title: "Duplicate emails found",
        description: `${duplicateEmails.map(e => e.email).join(', ')} already exist in your organization.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert roles array to single role for backend compatibility
      const formattedInvites = validInvites.map(invite => ({
        email: invite.email,
        role: invite.roles.includes("admin") ? "org_admin" : "employee"
      }));
      
      await inviteUsersMutation.mutateAsync(formattedInvites);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'org_admin':
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (user) => {
    if (!user.isActive && user.status === 'invited') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    }
    
    if (user.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  if (licenseLoading || usersLoading || rolesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management / Subscription</h1>
          <p className="text-gray-600 mt-1">
            Manage team members, licenses, and user permissions
          </p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* License Summary */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            License Summary
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {licenseInfo?.totalLicenses || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Licenses Purchased</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {licenseInfo?.licenseType || 'Monthly'}
              </div>
              <div className="text-sm text-gray-600 mt-1">License Type</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {licenseInfo?.usedLicenses || users.filter(u => u.isActive).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Used Licenses</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {licenseInfo?.availableSlots || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Available Licenses</div>
            </div>
          </div>
          
          {licenseInfo && licenseInfo.availableSlots <= 2 && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="text-amber-800 font-medium">Low license availability</h3>
                <p className="text-amber-700 text-sm mt-1">
                  You have {licenseInfo.availableSlots} licenses remaining. Consider upgrading your plan to add more team members.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Team Members ({users.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role(s)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p>No team members found</p>
                    <p className="text-sm">Start by inviting your first team member</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(user.role)}
                        <span className="text-sm text-gray-900 capitalize">
                          {user.role === 'org_admin' ? 'Admin' : user.role || 'Employee'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {!user.isActive && user.status === 'invited' && (
                          <button
                            onClick={() => resendInviteMutation.mutate(user._id)}
                            disabled={resendInviteMutation.isPending}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            title="Resend Invite"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        
                        {user.isActive && user._id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to deactivate this user?')) {
                                deactivateUserMutation.mutate(user._id);
                              }
                            }}
                            disabled={deactivateUserMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Deactivate User"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Users Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Invite Users</h2>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {inviteList.map((invite, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email ID
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            placeholder="Enter email address"
                            value={invite.email}
                            onChange={(e) => updateInviteRow(index, "email", e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role Selection
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={invite.roles.includes("member")}
                              disabled={true}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span className="text-sm text-gray-700">Member (Required)</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={invite.roles.includes("manager")}
                              onChange={() => toggleRole(index, "manager")}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span className="text-sm text-gray-700">Manager</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={invite.roles.includes("admin")}
                              onChange={() => toggleRole(index, "admin")}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span className="text-sm text-gray-700">Admin</span>
                          </label>
                        </div>
                      </div>
                      
                      {inviteList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInviteRow(index)}
                          className="mt-8 p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addInviteRow}
                className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Another
              </button>
              
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Invited users will receive an email with setup instructions
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || inviteUsersMutation.isPending}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting || inviteUsersMutation.isPending ? (
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
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}