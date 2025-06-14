import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, UserPlus, Mail, Plus, Shield, Clock, CheckCircle, XCircle, AlertCircle, MoreHorizontal, RefreshCw, UserX } from "lucide-react";

export default function TeamMembers() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteUsers, setInviteUsers] = useState([{ email: "", roles: ["member"] }]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organization users with detailed information including invited users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/organization/users-detailed"],
    enabled: true
  });

  // Fetch organization license info
  const { data: licenseInfo } = useQuery({
    queryKey: ["/api/organization/license"],
    enabled: true
  });

  // Invite users mutation
  const inviteUsersMutation = useMutation({
    mutationFn: (invites) => apiRequest("/api/organization/invite-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invites })
    }),
    onSuccess: (data) => {
      setInviteModalOpen(false);
      setInviteUsers([{ email: "", roles: ["member"] }]);
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users-detailed"] });
      
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Partial Success",
          description: `${data.successCount} users invited successfully. ${data.errors.length} errors occurred.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Invitation sent successfully",
          description: `Successfully invited ${data.successCount} users`,
          variant: "default"
        });
      }
    },
    onError: (error) => {
      if (error.message && error.message.includes("already invited")) {
        toast({
          title: "User already invited or registered",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to invite users",
          variant: "destructive"
        });
      }
    }
  });

  // Resend invitation mutation
  const resendInviteMutation = useMutation({
    mutationFn: (userId) => apiRequest(`/api/organization/resend-invite/${userId}`, {
      method: "POST"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users-detailed"] });
      toast({
        title: "Invitation resent successfully",
        description: "The user will receive a new invitation email",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive"
      });
    }
  });

  // Revoke invitation mutation
  const revokeInviteMutation = useMutation({
    mutationFn: (userId) => apiRequest(`/api/organization/revoke-invite/${userId}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users-detailed"] });
      toast({
        title: "Invitation revoked successfully",
        description: "The invitation has been cancelled",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke invitation",
        variant: "destructive"
      });
    }
  });

  const handleAddUserRow = () => {
    setInviteUsers([...inviteUsers, { email: "", roles: ["member"] }]);
  };

  const handleRemoveUserRow = (index) => {
    if (inviteUsers.length > 1) {
      setInviteUsers(inviteUsers.filter((_, i) => i !== index));
    }
  };

  const handleUserChange = (index, field, value) => {
    const updated = [...inviteUsers];
    updated[index][field] = value;
    setInviteUsers(updated);
  };

  const handleRoleChange = (index, role, checked) => {
    const updated = [...inviteUsers];
    if (checked && !updated[index].roles.includes(role)) {
      updated[index].roles.push(role);
    } else if (!checked) {
      updated[index].roles = updated[index].roles.filter(r => r !== role);
    }
    if (!updated[index].roles.includes('member')) {
      updated[index].roles.push('member');
    }
    setInviteUsers(updated);
  };

  const handleInviteSubmit = () => {
    const validUsers = inviteUsers.filter(user => user.email.trim() !== "");
    
    if (validUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid email address",
        variant: "destructive"
      });
      return;
    }

    inviteUsersMutation.mutate(validUsers);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { 
        icon: CheckCircle, 
        color: "text-green-600 bg-green-50 border-green-200",
        label: "Active"
      },
      invited: { 
        icon: Mail, 
        color: "text-blue-600 bg-blue-50 border-blue-200",
        label: "Invited"
      },
      pending: { 
        icon: Clock, 
        color: "text-slate-700 bg-slate-100 border-slate-300",
        label: "Pending"
      },
      inactive: { 
        icon: XCircle, 
        color: "text-red-600 bg-red-50 border-red-200",
        label: "Inactive"
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`inline-flex items-center gap-1 px-2 py-1 text-xs border ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getRoleIcon = (roles) => {
    if (roles.includes("admin")) {
      return <Shield className="h-4 w-4 text-red-500" />;
    } else if (roles.includes("manager")) {
      return <Users className="h-4 w-4 text-blue-500" />;
    } else {
      return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDisplayName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split('@')[0];
  };

  const getInitials = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">Manage your organization's team members and invitations</p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Members
        </Button>
      </div>

      {/* License Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            License Overview
          </CardTitle>
          <CardDescription>Current license usage and availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-blue-600">{licenseInfo?.totalLicenses || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Total Licenses</h4>
              <p className="text-sm text-gray-600">Maximum team size</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-green-600">{licenseInfo?.usedLicenses || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Active Users</h4>
              <p className="text-sm text-gray-600">Currently using licenses</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-orange-600">{licenseInfo?.availableSlots || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Available</h4>
              <p className="text-sm text-gray-600">Ready for new team members</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-lg font-bold text-purple-600">{licenseInfo?.licenseType || 'Standard'}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Plan Type</h4>
              <p className="text-sm text-gray-600">Current subscription</p>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">License Usage</span>
              <span className="text-sm text-gray-600">
                {licenseInfo?.usedLicenses || 0} of {licenseInfo?.totalLicenses || 0} used
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${licenseInfo?.totalLicenses > 0 ? (licenseInfo.usedLicenses / licenseInfo.totalLicenses) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({users.length})</CardTitle>
          <CardDescription>
            All team members including active users and pending invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-600 mb-4">Start building your team by inviting members to collaborate.</p>
              <Button
                onClick={() => setInviteModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Member
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role(s)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {getInitials(user)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {getDisplayName(user)}
                            </div>
                            {user.status === 'invited' && (
                              <div className="text-xs text-gray-500">Pending registration</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.roles || [user.role])}
                          <div className="flex flex-wrap gap-1">
                            {(user.roles || [user.role]).map((role) => (
                              <Badge key={role} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {user.invitedAt ? new Date(user.invitedAt).toLocaleDateString() : 
                           user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.status === 'invited' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => resendInviteMutation.mutate(user._id)}
                                disabled={resendInviteMutation.isPending}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Resend Invite
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => revokeInviteMutation.mutate(user._id)}
                                disabled={revokeInviteMutation.isPending}
                                className="text-red-600"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Revoke Invite
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Users Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Invite Team Members</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add new team members to your organization. Each member will receive an email invitation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-6">
            {inviteUsers.map((user, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <Label className="text-base font-semibold text-gray-900">Team Member {index + 1}</Label>
                      <p className="text-sm text-gray-600">Configure access and permissions</p>
                    </div>
                  </div>
                  {inviteUsers.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUserRow(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor={`email-${index}`} className="text-sm font-medium text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      value={user.email}
                      onChange={(e) => handleUserChange(index, "email", e.target.value)}
                      placeholder="Enter email address"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Role Permissions</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Checkbox
                          id={`member-${index}`}
                          checked={true}
                          disabled={true}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`member-${index}`} className="text-sm font-medium text-blue-700">
                            Member
                          </Label>
                          <p className="text-xs text-blue-600">Basic access (Required)</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id={`manager-${index}`}
                          checked={user.roles.includes("manager")}
                          onCheckedChange={(checked) => handleRoleChange(index, "manager", checked)}
                          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`manager-${index}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                            Manager
                          </Label>
                          <p className="text-xs text-gray-500">Project oversight and team coordination</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id={`admin-${index}`}
                          checked={user.roles.includes("admin")}
                          onCheckedChange={(checked) => handleRoleChange(index, "admin", checked)}
                          className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`admin-${index}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                            Administrator
                          </Label>
                          <p className="text-xs text-gray-500">Full system access and user management</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
              <Button
                variant="ghost"
                onClick={handleAddUserRow}
                className="w-full h-auto py-4 text-gray-600 hover:text-gray-900 hover:bg-white"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Another Team Member
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setInviteModalOpen(false)}
                disabled={inviteUsersMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteSubmit}
                disabled={inviteUsersMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {inviteUsersMutation.isPending ? "Sending..." : `Send ${inviteUsers.length} Invitation${inviteUsers.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}