import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  RefreshCw, 
  UserX, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  UserCheck,
  Clock,
  Crown,
  User
} from 'lucide-react';

export default function TeamMembers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [inviteUsers, setInviteUsers] = useState([
    { email: '', roles: ['employee'], firstName: '', lastName: '' }
  ]);

  // Fetch team members
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['/api/organization/users'],
    enabled: true
  });

  // Fetch license info
  const { data: licenseInfo } = useQuery({
    queryKey: ['/api/organization/license-info'],
    enabled: true
  });

  console.log('TeamMembers component state:', { isLoading, users, error });

  // Test login function
  const testLogin = async () => {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: 'admin@demo.com', password: 'admin123' }
      });
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        window.location.reload();
      }
    } catch (error) {
      console.log('Test login failed:', error);
      toast({
        title: "Login Failed",
        description: "Could not log in as demo admin",
        variant: "destructive"
      });
    }
  };

  // Mutations
  const inviteUsersMutation = useMutation({
    mutationFn: (inviteData) => apiRequest('/api/organization/invite-users', {
      method: 'POST',
      body: { users: inviteData }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organization/users'] });
      setInviteModalOpen(false);
      setInviteUsers([{ email: '', roles: ['employee'], firstName: '', lastName: '' }]);
      toast({
        title: "Invitations sent",
        description: "Team member invitations have been sent successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitations",
        variant: "destructive"
      });
    }
  });

  const resendInviteMutation = useMutation({
    mutationFn: (userId) => apiRequest(`/api/organization/users/${userId}/resend-invite`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organization/users'] });
      toast({
        title: "Invitation resent",
        description: "The invitation has been resent successfully"
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

  const revokeInviteMutation = useMutation({
    mutationFn: (userId) => apiRequest(`/api/organization/users/${userId}/revoke-invite`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organization/users'] });
      toast({
        title: "Invitation revoked",
        description: "The invitation has been revoked successfully"
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

  // Filter and pagination logic
  const filteredAndPaginatedData = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const userRoles = user.roles || [user.role];
      const matchesRole = roleFilter === 'all' || userRoles.includes(roleFilter);
      
      return matchesSearch && matchesStatus && matchesRole;
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filtered.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [users, searchTerm, statusFilter, roleFilter, currentPage]);

  // Helper functions
  const getDisplayName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email?.split('@')[0] || 'Unknown User';
  };

  const getInitials = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    const email = user.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleIcon = (roles) => {
    if (roles.includes('admin')) return <Crown className="h-4 w-4 text-yellow-600" />;
    if (roles.includes('employee')) return <UserCheck className="h-4 w-4 text-blue-600" />;
    return <User className="h-4 w-4 text-gray-600" />;
  };

  const getStatusIcon = (status) => {
    if (status === 'active') return <UserCheck className="h-4 w-4 text-green-600" />;
    return <Clock className="h-4 w-4 text-orange-600" />;
  };

  const getStatusColor = (status) => {
    if (status === 'active') return 'text-green-600';
    return 'text-orange-600';
  };

  const addInviteUser = () => {
    setInviteUsers([...inviteUsers, { email: '', roles: ['employee'], firstName: '', lastName: '' }]);
  };

  const removeInviteUser = (index) => {
    if (inviteUsers.length > 1) {
      setInviteUsers(inviteUsers.filter((_, i) => i !== index));
    }
  };

  const updateInviteUser = (index, field, value) => {
    const updated = [...inviteUsers];
    updated[index] = { ...updated[index], [field]: value };
    setInviteUsers(updated);
  };

  const handleInviteSubmit = () => {
    const validUsers = inviteUsers.filter(user => user.email.trim());
    if (validUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one email address",
        variant: "destructive"
      });
      return;
    }
    inviteUsersMutation.mutate(validUsers);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading team members</div>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/organization/users'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* License Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            License Information
          </CardTitle>
          <CardDescription>
            Current subscription and usage details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-blue-600">{licenseInfo?.usedLicenses || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Active Users</h4>
              <p className="text-sm text-gray-600">Currently using licenses</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-green-600">{licenseInfo?.totalLicenses || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Total Licenses</h4>
              <p className="text-sm text-gray-600">Available for your organization</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-600 rounded-lg">
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
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={(value) => {
                setRoleFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredAndPaginatedData.users.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-600 mb-4">Start building your team by inviting members to collaborate.</p>
              <div className="space-y-3">
                <Button
                  onClick={testLogin}
                  className="bg-green-600 hover:bg-green-700 mr-3"
                >
                  Login as Demo Admin
                </Button>
                <Button
                  onClick={() => setInviteModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite First Member
                </Button>
              </div>
            </div>
          ) : (
            <>
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
                    {filteredAndPaginatedData.users.map((user) => (
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
                          <div className="flex items-center gap-2">
                            {getStatusIcon(user.status)}
                            <span className={`text-sm font-medium ${getStatusColor(user.status)}`}>
                              {user.status === 'invited' ? 'Pending' : 'Active'}
                            </span>
                          </div>
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

              {/* Pagination Controls */}
              {filteredAndPaginatedData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndPaginatedData.totalItems)} of {filteredAndPaginatedData.totalItems} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!filteredAndPaginatedData.hasPrevPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: filteredAndPaginatedData.totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!filteredAndPaginatedData.hasNextPage}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
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
                      <h4 className="font-medium text-gray-900">Team Member {index + 1}</h4>
                      <p className="text-sm text-gray-600">Enter details for the new team member</p>
                    </div>
                  </div>
                  {inviteUsers.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInviteUser(index)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <Input
                      placeholder="Enter first name"
                      value={user.firstName}
                      onChange={(e) => updateInviteUser(index, 'firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <Input
                      placeholder="Enter last name"
                      value={user.lastName}
                      onChange={(e) => updateInviteUser(index, 'lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={user.email}
                    onChange={(e) => updateInviteUser(index, 'email', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <Select 
                    value={user.roles[0]} 
                    onValueChange={(value) => updateInviteUser(index, 'roles', [value])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={addInviteUser}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Another Member
              </Button>
              <Button
                onClick={handleInviteSubmit}
                disabled={inviteUsersMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {inviteUsersMutation.isPending ? 'Sending...' : 'Send Invitations'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}