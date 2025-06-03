import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RoleForm } from "@/components/roles/RoleForm";
import { AssignRoleModal } from "@/components/roles/AssignRoleModal";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Users, 
  Shield, 
  Eye,
  AlertCircle,
  UserPlus,
  Settings
} from "lucide-react";

export default function Roles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      const response = await fetch("/api/roles");
      if (!response.ok) throw new Error("Failed to fetch roles");
      return response.json();
    }
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete role");
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/roles"]);
      toast({
        title: "Role deleted successfully",
        description: "The role has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete role",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData) => {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleData)
      });
      if (!response.ok) throw new Error("Failed to create role");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["/api/roles"]);
      setShowCreateForm(false);
      toast({
        title: "Role created successfully",
        description: `"${data.name}" has been created.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create role",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/roles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update role");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["/api/roles"]);
      setEditingRole(null);
      toast({
        title: "Role updated successfully",
        description: `"${data.name}" has been updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeleteRole = (roleId) => {
    if (confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  const handleCreateRole = (roleData) => {
    createRoleMutation.mutate(roleData);
  };

  const handleUpdateRole = (roleData) => {
    updateRoleMutation.mutate({ 
      id: editingRole._id, 
      data: roleData 
    });
  };

  const getUserCount = (roleId) => {
    return users.filter(user => user.roleId === roleId).length;
  };

  const getPermissionsBadge = (permissions) => {
    if (!permissions || permissions.length === 0) {
      return <Badge variant="outline" className="text-slate-500">No permissions</Badge>;
    }
    
    const count = permissions.length;
    const colorClass = count > 10 ? "bg-green-100 text-green-700" : 
                     count > 5 ? "bg-blue-100 text-blue-700" : 
                     "bg-orange-100 text-orange-700";
    
    return (
      <Badge className={`${colorClass} border-0`}>
        {count} permission{count !== 1 ? 's' : ''}
      </Badge>
    );
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="p-8 space-y-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Failed to load roles
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
            {error.message}
          </p>
          <Button 
            onClick={() => queryClient.invalidateQueries(["/api/roles"])}
            variant="outline"
            className="border-slate-300"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Role Management
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Manage user roles and permissions across your organization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAssignModal(true)}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Roles
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-blue-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-50">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Roles</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{roles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-green-50">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <Settings className="h-5 w-5 mr-2 text-blue-600" />
            Roles & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Role Name</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Description</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Users Assigned</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Permissions</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="border-slate-200 dark:border-slate-700">
                      <TableCell><div className="h-4 bg-slate-200 rounded animate-pulse w-24"></div></TableCell>
                      <TableCell><div className="h-4 bg-slate-200 rounded animate-pulse w-32"></div></TableCell>
                      <TableCell><div className="h-4 bg-slate-200 rounded animate-pulse w-16"></div></TableCell>
                      <TableCell><div className="h-6 bg-slate-200 rounded animate-pulse w-20"></div></TableCell>
                      <TableCell><div className="h-8 bg-slate-200 rounded animate-pulse w-20 ml-auto"></div></TableCell>
                    </TableRow>
                  ))
                ) : filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-3">
                        <Shield className="h-8 w-8 text-slate-400" />
                        <p className="text-slate-500 dark:text-slate-400">
                          {searchTerm ? "No roles found matching your search" : "No roles created yet"}
                        </p>
                        <Button 
                          onClick={() => setShowCreateForm(true)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Role
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <TableRow key={role._id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span>{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        <div className="max-w-xs truncate">
                          {role.description || "No description provided"}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span>{getUserCount(role._id)} users</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPermissionsBadge(role.permissions)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRole(role)}
                            className="hover:bg-blue-50 hover:text-blue-700 border-slate-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(role._id)}
                            className="hover:bg-red-50 hover:text-red-700 border-slate-300"
                            disabled={getUserCount(role._id) > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Role Form */}
      <RoleForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateRole}
        isLoading={createRoleMutation.isPending}
      />

      {/* Edit Role Form */}
      <RoleForm
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        onSubmit={handleUpdateRole}
        initialData={editingRole}
        isLoading={updateRoleMutation.isPending}
      />

      {/* Assign Role Modal */}
      <AssignRoleModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        users={users}
        roles={roles}
      />
    </div>
  );
}