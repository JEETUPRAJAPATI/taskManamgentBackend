import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { TaskComments } from "./TaskComments";
import { ActivityFeed } from "./ActivityFeed";
import {
  Users,
  UserPlus,
  MessageSquare,
  Activity,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Crown,
  Shield,
  User
} from "lucide-react";

export function TeamCollaboration({ 
  taskId, 
  projectId, 
  users = [], 
  currentUser,
  className = "" 
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team members
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ["/api/team-members", { taskId, projectId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (taskId) params.append("taskId", taskId);
      if (projectId) params.append("projectId", projectId);
      
      const response = await fetch(`/api/team-members?${params}`);
      if (!response.ok) throw new Error("Failed to fetch team members");
      return response.json();
    }
  });

  // Fetch collaboration stats
  const { data: stats = {} } = useQuery({
    queryKey: ["/api/collaboration-stats", { taskId, projectId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (taskId) params.append("taskId", taskId);
      if (projectId) params.append("projectId", projectId);
      
      const response = await fetch(`/api/collaboration-stats?${params}`);
      if (!response.ok) throw new Error("Failed to fetch collaboration stats");
      return response.json();
    }
  });

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role = "member" }) => {
      const endpoint = taskId 
        ? `/api/tasks/${taskId}/members`
        : `/api/projects/${projectId}/members`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role })
      });
      if (!response.ok) throw new Error("Failed to add team member");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/team-members"]);
      toast({
        title: "Team member added",
        description: "The user has been added to the team successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add team member",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }) => {
      const endpoint = taskId 
        ? `/api/tasks/${taskId}/members/${memberId}`
        : `/api/projects/${projectId}/members/${memberId}`;
      
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (!response.ok) throw new Error("Failed to update role");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/team-members"]);
      toast({
        title: "Role updated",
        description: "Team member role has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Remove team member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId) => {
      const endpoint = taskId 
        ? `/api/tasks/${taskId}/members/${memberId}`
        : `/api/projects/${projectId}/members/${memberId}`;
      
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove team member");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/team-members"]);
      toast({
        title: "Team member removed",
        description: "The user has been removed from the team."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove team member",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "member":
        return <User className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "member":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Filter team members
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = searchTerm === "" || 
      `${member.user.firstName} ${member.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Available users to add (not already in team)
  const availableUsers = users.filter(user => 
    !teamMembers.find(member => member.user._id === user._id)
  );

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Collaboration Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalMembers || 0}</p>
                    <p className="text-xs text-muted-foreground">Team Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalComments || 0}</p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.recentActivities || 0}</p>
                    <p className="text-xs text-muted-foreground">Activities</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.avgResponseTime || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members Management */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({filteredMembers.length})
                </CardTitle>
                
                {availableUsers.length > 0 && (
                  <Select onValueChange={(userId) => addMemberMutation.mutate({ userId })}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map(user => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            {user.firstName} {user.lastName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search team members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Team Members List */}
              <div className="space-y-3">
                {membersLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg animate-pulse">
                      <div className="h-10 w-10 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-24"></div>
                      </div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                    </div>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No team members found</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div key={member._id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm">
                            {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`}></div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {member.user.firstName} {member.user.lastName}
                          </span>
                          {member.user._id === currentUser._id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        {member.lastActive && (
                          <p className="text-xs text-muted-foreground">
                            Last active: {new Date(member.lastActive).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`${getRoleColor(member.role)} flex items-center gap-1`}>
                          {getRoleIcon(member.role)}
                          {member.role}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {/* View profile */}}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            {member.user._id !== currentUser._id && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => updateRoleMutation.mutate({ 
                                    memberId: member._id, 
                                    role: member.role === "admin" ? "member" : "admin" 
                                  })}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  {member.role === "admin" ? "Remove Admin" : "Make Admin"}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => removeMemberMutation.mutate(member._id)}
                                  className="text-destructive"
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Remove from Team
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <TaskComments
                taskId={taskId}
                users={users}
                currentUser={currentUser}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <ActivityFeed
                taskId={taskId}
                projectId={projectId}
                limit={50}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}