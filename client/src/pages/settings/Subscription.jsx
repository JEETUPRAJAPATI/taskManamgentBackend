import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CreditCard, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Mail, 
  Clock, 
  XCircle, 
  UserX, 
  RotateCcw,
  Shield,
  TrendingUp,
  Calendar
} from "lucide-react";

export default function Subscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organization users and license info
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/users/organization"],
    enabled: true
  });

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: (userId) => apiRequest("PATCH", `/api/users/${userId}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/organization"] });
      toast({
        title: "Success",
        description: "User deactivated successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate user",
        variant: "destructive"
      });
    }
  });

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: (userId) => apiRequest("POST", `/api/users/${userId}/resend-invite`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation resent successfully",
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { 
        variant: "default", 
        icon: CheckCircle, 
        color: "text-green-600 bg-green-50 border-green-200",
        label: "Active"
      },
      invited: { 
        variant: "secondary", 
        icon: Mail, 
        color: "text-blue-600 bg-blue-50 border-blue-200",
        label: "Invited"
      },
      pending: { 
        variant: "outline", 
        icon: Clock, 
        color: "text-amber-700 bg-amber-50 border-amber-200",
        label: "Pending"
      },
      inactive: { 
        variant: "destructive", 
        icon: XCircle, 
        color: "text-red-600 bg-red-50 border-red-200",
        label: "Inactive"
      },
      suspended: { 
        variant: "destructive", 
        icon: AlertCircle, 
        color: "text-orange-600 bg-orange-50 border-orange-200",
        label: "Suspended"
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </div>
    );
  };

  const getRolesBadges = (roles) => {
    if (!Array.isArray(roles)) return null;
    
    const roleConfig = {
      admin: { color: "text-purple-700 bg-purple-100 border-purple-200", icon: Shield },
      manager: { color: "text-indigo-700 bg-indigo-100 border-indigo-200", icon: Users },
      member: { color: "text-gray-700 bg-gray-100 border-gray-200", icon: Users }
    };
    
    return (
      <div className="flex gap-1.5 flex-wrap">
        {roles.map((role, index) => {
          const config = roleConfig[role] || roleConfig.member;
          const Icon = config.icon;
          return (
            <div key={index} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${config.color}`}>
              <Icon className="h-3 w-3" />
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </div>
          );
        })}
      </div>
    );
  };

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split('@')[0];
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

  const { users = [], licenseInfo = {} } = userData || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Subscription & License Management</h1>
        <p className="text-lg text-gray-600 mt-2">Monitor your license usage and manage user access</p>
      </div>

      {/* License Summary */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            License Summary
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-2">
            Overview of your subscription and license allocation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-blue-600">{licenseInfo.totalLicenses || 10}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Total Licenses</h4>
              <p className="text-sm text-gray-600">Purchased licenses</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-green-600">{licenseInfo.usedLicenses || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Used Licenses</h4>
              <p className="text-sm text-gray-600">Currently active users</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-orange-600">{licenseInfo.availableLicenses || 10}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Available</h4>
              <p className="text-sm text-gray-600">Ready for new users</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-lg font-bold text-purple-600">{licenseInfo.licenseType || 'Professional'}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">License Type</h4>
              <p className="text-sm text-gray-600">Current subscription plan</p>
            </div>
          </div>
          
          {/* Usage Progress Bar */}
          <div className="mt-8 bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900">License Utilization</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Updated: {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Usage Progress</span>
              <span className="text-sm text-gray-600">
                {licenseInfo.usedLicenses || 0} of {licenseInfo.totalLicenses || 10} licenses used
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" 
                style={{ 
                  width: `${licenseInfo.totalLicenses > 0 ? (licenseInfo.usedLicenses / licenseInfo.totalLicenses) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">User License Management</CardTitle>
              <CardDescription className="mt-1">
                Manage user access and monitor license allocation
              </CardDescription>
            </div>
            <div className="text-sm text-gray-600">
              {users.length} {users.length === 1 ? 'user' : 'users'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">User</TableHead>
                    <TableHead className="font-semibold text-gray-900">Email</TableHead>
                    <TableHead className="font-semibold text-gray-900">Role(s)</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profileImageUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {getInitials(user.firstName, user.lastName, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate">
                              {getDisplayName(user)}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-gray-900">{user.email}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getRolesBadges(user.roles)}
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.status === 'invited' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resendInviteMutation.mutate(user._id)}
                              disabled={resendInviteMutation.isPending}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Resend Invite"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {user.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deactivateUserMutation.mutate(user._id)}
                              disabled={deactivateUserMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Deactivate User"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-4">Start by inviting team members to your organization.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}