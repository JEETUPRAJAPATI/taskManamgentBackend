import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, UserPlus, UserX, Mail, Trash2, Plus } from "lucide-react";

export default function UserManagement() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteUsers, setInviteUsers] = useState([{ email: "", roles: ["member"] }]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organization users and license info
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/users/organization"],
    enabled: true
  });

  // Invite users mutation
  const inviteUsersMutation = useMutation({
    mutationFn: (users) => apiRequest("POST", "/api/users/invite", { users }),
    onSuccess: (data) => {
      setInviteModalOpen(false);
      setInviteUsers([{ email: "", roles: ["member"] }]);
      queryClient.invalidateQueries({ queryKey: ["/api/users/organization"] });
      
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Partial Success",
          description: `${data.invited.length} users invited successfully. ${data.errors.length} errors occurred.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully invited ${data.invited.length} users`,
          variant: "default"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to invite users",
        variant: "destructive"
      });
    }
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
    // Always ensure 'member' is included
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
    const variants = {
      active: "default",
      invited: "secondary",
      pending: "outline",
      inactive: "destructive"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const getRolesBadges = (roles) => {
    if (!Array.isArray(roles)) return null;
    
    return (
      <div className="flex gap-1 flex-wrap">
        {roles.map((role, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        ))}
      </div>
    );
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage team members and their access</p>
        </div>
        
        <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Users
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite Users</DialogTitle>
              <DialogDescription>
                Add multiple users to your organization. They will receive email invitations to join.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {inviteUsers.map((user, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">User {index + 1}</Label>
                    {inviteUsers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUserRow(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`email-${index}`}>Email Address</Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      value={user.email}
                      onChange={(e) => handleUserChange(index, "email", e.target.value)}
                      placeholder="user@company.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Roles</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`member-${index}`}
                          checked={true}
                          disabled={true}
                        />
                        <Label htmlFor={`member-${index}`} className="text-sm text-gray-500">
                          Member (Required)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`manager-${index}`}
                          checked={user.roles.includes("manager")}
                          onCheckedChange={(checked) => handleRoleChange(index, "manager", checked)}
                        />
                        <Label htmlFor={`manager-${index}`} className="text-sm">
                          Manager
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`admin-${index}`}
                          checked={user.roles.includes("admin")}
                          onCheckedChange={(checked) => handleRoleChange(index, "admin", checked)}
                        />
                        <Label htmlFor={`admin-${index}`} className="text-sm">
                          Admin
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={handleAddUserRow}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another
              </Button>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleInviteSubmit}
                  disabled={inviteUsersMutation.isPending}
                  className="flex-1"
                >
                  {inviteUsersMutation.isPending ? "Sending Invites..." : "Send Invitations"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setInviteModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* License Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            License Summary
          </CardTitle>
          <CardDescription>
            Overview of your organization's user licenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{licenseInfo.totalLicenses || 0}</div>
              <div className="text-sm text-gray-600">Total Licenses</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{licenseInfo.usedLicenses || 0}</div>
              <div className="text-sm text-gray-600">Used Licenses</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{licenseInfo.availableLicenses || 0}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{licenseInfo.licenseType || 'Standard'}</div>
              <div className="text-sm text-gray-600">License Type</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your organization's users and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.email.split('@')[0]
                    }
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRolesBadges(user.roles)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {(user.status === 'invited' || user.status === 'pending') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resendInviteMutation.mutate(user._id)}
                          disabled={resendInviteMutation.isPending}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      {user.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deactivateUserMutation.mutate(user._id)}
                          disabled={deactivateUserMutation.isPending}
                          className="text-red-600 hover:text-red-700"
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

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found. Start by inviting team members.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}