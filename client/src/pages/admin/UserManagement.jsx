import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  UserCheck, 
  UserX, 
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter
} from "lucide-react";

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "member"
  });

  // Fetch license information
  const { data: licenseInfo, isLoading: licenseLoading } = useQuery({
    queryKey: ["/api/organization/license"],
    retry: false
  });

  // Fetch organization users
  const { data: users = [], isLoading: usersLoading, refetch } = useQuery({
    queryKey: ["/api/organization/users-detailed"],
    retry: false
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (data) => {
      return await apiRequest("POST", "/api/organization/invite-user", {
        email: data.email,
        roles: [data.role]
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "User invitation has been sent successfully"
      });
      setShowInviteModal(false);
      setInviteData({ email: "", role: "member" });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Invitation failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      return await apiRequest("PATCH", `/api/organization/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been updated successfully"
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId) => {
      return await apiRequest("PATCH", `/api/organization/users/${userId}/deactivate`);
    },
    onSuccess: () => {
      toast({
        title: "User deactivated",
        description: "User has been deactivated successfully"
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Deactivation failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Activate user mutation
  const activateUserMutation = useMutation({
    mutationFn: async (userId) => {
      return await apiRequest("PATCH", `/api/organization/users/${userId}/activate`);
    },
    onSuccess: () => {
      toast({
        title: "User activated",
        description: "User has been activated successfully"
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Activation failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleInviteUser = () => {
    if (!inviteData.email || !inviteData.role) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (licenseInfo && licenseInfo.available <= 0) {
      toast({
        title: "License limit reached",
        description: "Cannot invite more users. Please upgrade your plan.",
        variant: "destructive"
      });
      return;
    }

    inviteUserMutation.mutate(inviteData);
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  const formatRelativeTime = (date) => {
    if (!date) return "Never";
    const now = new Date();
    const target = new Date(date);
    const diffMs = now - target;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  if (licenseLoading || usersLoading) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600">Manage your organization's users and permissions</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          disabled={licenseInfo && licenseInfo.available <= 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          <UserPlus className="h-4 w-4" />
          Invite User
        </button>
      </div>

      {/* License Information */}
      {licenseInfo && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">License Usage</h3>
                <p className="text-sm text-gray-600">
                  {licenseInfo.used} of {licenseInfo.total} licenses used
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Available</div>
                <div className={`text-lg font-bold ${licenseInfo.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {licenseInfo.available}
                </div>
              </div>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    licenseInfo.used / licenseInfo.total > 0.8 ? 'bg-red-500' :
                    licenseInfo.used / licenseInfo.total > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((licenseInfo.used / licenseInfo.total) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          {licenseInfo.available <= 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">License limit reached</p>
                <p>You've reached your user limit. Contact support to upgrade your plan.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Last Login</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Joined</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    {searchTerm || filterRole !== "all" ? "No users match your search criteria" : "No users found"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-gray-500 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => updateRoleMutation.mutate({ userId: user._id, role: e.target.value })}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={updateRoleMutation.isPending}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-700 text-sm">Active</span>
                          </>
                        ) : (
                          <>
                            <UserX className="h-4 w-4 text-red-500" />
                            <span className="text-red-700 text-sm">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatRelativeTime(user.lastLoginAt)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <button
                            onClick={() => deactivateUserMutation.mutate(user._id)}
                            disabled={deactivateUserMutation.isPending}
                            className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                            title="Deactivate user"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => activateUserMutation.mutate(user._id)}
                            disabled={activateUserMutation.isPending}
                            className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                            title="Activate user"
                          >
                            <UserCheck className="h-4 w-4" />
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

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Invite New User</h3>
                <p className="text-sm text-gray-600">Send an invitation to join your organization</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {licenseInfo && licenseInfo.available <= 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    License limit reached. Cannot invite more users.
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleInviteUser}
                disabled={inviteUserMutation.isPending || (licenseInfo && licenseInfo.available <= 0)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}