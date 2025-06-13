import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Users, Shield, Mail, Plus, CheckCircle, Clock, UserX, MoreHorizontal, RefreshCw, Crown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InviteUsersModal } from "@/components/InviteUsersModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function InviteUsers() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get organization license info
  const { data: licenseInfo } = useQuery({
    queryKey: ["/api/organization/license"],
  });

  // Get organization users including invited users
  const { data: users = [] } = useQuery({
    queryKey: ["/api/organization/users-detailed"],
  });

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: async (userId) => {
      return apiRequest(`/api/organization/resend-invite/${userId}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation resent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users-detailed"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    },
  });

  // Revoke invite mutation
  const revokeInviteMutation = useMutation({
    mutationFn: async (userId) => {
      return apiRequest(`/api/organization/revoke-invite/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation revoked successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users-detailed"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke invitation",
        variant: "destructive",
      });
    },
  });

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case "org_admin":
      case "admin":
        return <Crown className="h-4 w-4 text-orange-600" />;
      case "manager":
        return <Shield className="h-4 w-4 text-blue-600" />;
      case "employee":
        return <User className="h-4 w-4 text-green-600" />;
      case "member":
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "accepted":
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case "invited":
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200"><Mail className="h-3 w-3 mr-1" />Invited</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-slate-50 text-slate-700 border-slate-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "inactive":
      case "deactivated":
        return <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200"><UserX className="h-3 w-3 mr-1" />Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  // Format roles for display
  const formatRoles = (roles) => {
    if (!roles || roles.length === 0) return ["member"];
    return Array.isArray(roles) ? roles : [roles];
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invite Users</h1>
          <p className="text-lg text-gray-600 mt-2">
            Add new team members to your organization
          </p>
        </div>
        <Button
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add User
        </Button>
      </div>

      {/* License Information Card */}
      {licenseInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>License Information</span>
            </CardTitle>
            <CardDescription>
              Current license usage and available slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {licenseInfo.totalLicenses}
                </div>
                <div className="text-sm text-gray-600">Total Licenses</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {licenseInfo.usedLicenses}
                </div>
                <div className="text-sm text-gray-600">Used Licenses</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {licenseInfo.availableSlots}
                </div>
                <div className="text-sm text-gray-600">Available Slots</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Team Members Table */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-600" />
            <span>Current Team Members</span>
          </CardTitle>
          <CardDescription>
            All users and invited members in your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-white">
          {users.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-gray-100 rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600">No team members found</p>
              <p className="text-sm text-gray-500 mt-1">Start by inviting your first user</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700">Role(s)</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id || user.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.status === 'invited' 
                                  ? 'Invitation Pending'
                                  : 'User'
                              }
                            </div>
                            {user.status === 'invited' && user.invitedAt && (
                              <div className="text-xs text-gray-500">
                                Invited: {new Date(user.invitedAt).toLocaleDateString()}
                              </div>
                            )}
                            {user.lastLoginAt && user.status === 'active' && (
                              <div className="text-xs text-gray-500">
                                Last active: {new Date(user.lastLoginAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-700">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {formatRoles(user.roles || [user.role]).map((role, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-white">
                              {getRoleIcon(role)}
                              <span className="ml-1 capitalize">{role}</span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            {user.status === "invited" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => resendInviteMutation.mutate(user._id || user.id)}
                                  disabled={resendInviteMutation.isPending}
                                  className="hover:bg-gray-50"
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Resend Invite
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => revokeInviteMutation.mutate(user._id || user.id)}
                                  disabled={revokeInviteMutation.isPending}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Revoke Invite
                                </DropdownMenuItem>
                              </>
                            )}
                            {user.status === "active" && (
                              <DropdownMenuItem
                                className="text-gray-600 hover:bg-gray-50"
                                disabled
                              >
                                User Active
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            How to invite users to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Click "Add User"</h4>
                <p className="text-sm text-gray-600">
                  Use the blue "Add User" button to open the invitation modal
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Enter Email Addresses</h4>
                <p className="text-sm text-gray-600">
                  Add email addresses for each person you want to invite
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Assign Roles</h4>
                <p className="text-sm text-gray-600">
                  Choose appropriate roles - Member is required, additional roles are optional
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Send Invitations</h4>
                <p className="text-sm text-gray-600">
                  Invited users will receive email instructions to join your organization
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Users Modal */}
      <InviteUsersModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}