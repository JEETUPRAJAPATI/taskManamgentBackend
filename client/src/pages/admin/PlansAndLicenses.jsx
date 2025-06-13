import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CreditCard, 
  Users, 
  CheckCircle, 
  Clock, 
  UserX, 
  Mail, 
  MoreHorizontal, 
  RefreshCw,
  AlertCircle,
  Shield,
  User,
  Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function PlansAndLicenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get organization license information
  const { data: licenseInfo, isLoading: licenseLoading } = useQuery({
    queryKey: ["/api/organization/license"],
  });

  // Get detailed users with license assignments
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/organization/users-detailed"],
  });

  // Resend invitation mutation
  const resendInviteMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await fetch(`/api/users/${userId}/resend-invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to resend invitation');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation Resent",
        description: "The invitation email has been sent successfully.",
      });
      queryClient.invalidateQueries(["/api/organization/users-detailed"]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    },
  });

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await fetch(`/api/users/${userId}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to deactivate user');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Deactivated",
        description: "The user has been deactivated successfully.",
      });
      queryClient.invalidateQueries(["/api/organization/users-detailed"]);
      queryClient.invalidateQueries(["/api/organization/license"]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate user",
        variant: "destructive",
      });
    },
  });

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
      case "org_admin":
        return <Shield className="h-3 w-3" />;
      case "member":
      case "employee":
        return <User className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  // Format roles array
  const formatRoles = (roles) => {
    if (Array.isArray(roles)) return roles;
    return roles ? [roles] : ["member"];
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
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

  // Calculate usage percentage
  const usagePercentage = licenseInfo?.totalLicenses 
    ? Math.round((licenseInfo.usedLicenses / licenseInfo.totalLicenses) * 100) 
    : 0;

  // Get usage color
  const getUsageColor = (percentage) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-orange-600";
    return "text-green-600";
  };

  if (licenseLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plans & Licenses</h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage your organization's licensing and user assignments
          </p>
        </div>
      </div>

      {/* License Summary Cards */}
      {licenseInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{licenseInfo.totalLicenses}</div>
              <p className="text-xs text-muted-foreground">
                {licenseInfo.planType || "Standard"} Plan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Used Licenses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{licenseInfo.usedLicenses}</div>
              <p className="text-xs text-muted-foreground">
                Assigned to users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{licenseInfo.availableSlots}</div>
              <p className="text-xs text-muted-foreground">
                Can invite more
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usage</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getUsageColor(usagePercentage)}`}>
                {usagePercentage}%
              </div>
              <p className="text-xs text-muted-foreground">
                License utilization
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* License Details Card */}
      {licenseInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>License Details</span>
            </CardTitle>
            <CardDescription>
              Current subscription and usage information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Plan Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Plan Type:</span>
                    <span className="text-sm font-medium">{licenseInfo.planType || "Standard"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Usage Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Users:</span>
                    <span className="text-sm font-medium">{users.filter(u => u.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Invited Users:</span>
                    <span className="text-sm font-medium">{users.filter(u => u.status === 'invited').length}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Available Actions</h4>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    {licenseInfo.availableSlots > 0 
                      ? `You can invite ${licenseInfo.availableSlots} more users`
                      : "All licenses are currently assigned"
                    }
                  </div>
                  {licenseInfo.availableSlots === 0 && (
                    <div className="text-sm text-orange-600">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Consider upgrading for more licenses
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Licensed Users</span>
          </CardTitle>
          <CardDescription>
            All users assigned to your organization's licenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm">Start by inviting your first team member</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role(s)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id || user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.status === 'invited' 
                                ? 'Invitation Pending'
                                : 'User'
                            }
                          </div>
                          {user.status === 'invited' && user.invitedAt && (
                            <div className="text-xs text-slate-500">
                              Invited: {new Date(user.invitedAt).toLocaleDateString()}
                            </div>
                          )}
                          {user.lastLoginAt && user.status === 'active' && (
                            <div className="text-xs text-slate-500">
                              Last active: {new Date(user.lastLoginAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {formatRoles(user.roles || [user.role]).map((role, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {getRoleIcon(role)}
                            <span className="ml-1 capitalize">{role}</span>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      {user.invitedBy ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {user.invitedBy.firstName} {user.invitedBy.lastName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {user.invitedBy.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.status === "invited" && (
                            <DropdownMenuItem
                              onClick={() => resendInviteMutation.mutate(user._id || user.id)}
                              disabled={resendInviteMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Resend Invite
                            </DropdownMenuItem>
                          )}
                          {user.status === "active" && (
                            <DropdownMenuItem
                              onClick={() => deactivateUserMutation.mutate(user._id || user.id)}
                              disabled={deactivateUserMutation.isPending}
                              className="text-red-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}