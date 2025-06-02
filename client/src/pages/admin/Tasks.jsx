import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SmartTaskInput } from "@/components/tasks/SmartTaskInput";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  User, 
  Flag, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Tag
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function Tasks() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    statusId: "all",
    priority: "all",
    assignedToId: "all",
    projectId: "all"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks from MongoDB
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks", filters, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.statusId !== "all") params.append("statusId", filters.statusId);
      if (filters.priority !== "all") params.append("priority", filters.priority);
      if (filters.assignedToId !== "all") params.append("assignedToId", filters.assignedToId);
      if (filters.projectId !== "all") params.append("projectId", filters.projectId);
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    }
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    }
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    }
  });

  // Fetch task statuses
  const { data: taskStatuses = [] } = useQuery({
    queryKey: ["/api/task-statuses"],
    queryFn: async () => {
      const response = await fetch("/api/task-statuses");
      if (!response.ok) throw new Error("Failed to fetch task statuses");
      return response.json();
    }
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/tasks"]);
      setShowCreateForm(false);
      toast({ title: "Task created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating task", description: error.message, variant: "destructive" });
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/tasks"]);
      toast({ title: "Task updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/tasks"]);
      setShowTaskDetail(false);
      toast({ title: "Task deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting task", description: error.message, variant: "destructive" });
    }
  });

  // Smart task creation handler
  const handleSmartTaskCreate = async (parsedData) => {
    const taskData = {
      title: parsedData.title,
      description: parsedData.description || "",
      dueDate: parsedData.dueDate,
      priority: parsedData.priority,
      tags: parsedData.tags,
      assignedTo: parsedData.assignees.map(user => user._id),
      mentions: parsedData.mentions.map(user => user._id)
    };
    
    createTaskMutation.mutate(taskData);
  };

  // Fetch task details including comments and audit logs
  const { data: taskDetails } = useQuery({
    queryKey: ["/api/tasks", selectedTask?._id, "details"],
    queryFn: async () => {
      if (!selectedTask?._id) return null;
      
      const [commentsRes, auditRes] = await Promise.all([
        fetch(`/api/tasks/${selectedTask._id}/comments`),
        fetch(`/api/tasks/${selectedTask._id}/audit-logs`)
      ]);
      
      const comments = commentsRes.ok ? await commentsRes.json() : [];
      const auditLogs = auditRes.ok ? await auditRes.json() : [];
      
      return { comments, auditLogs };
    },
    enabled: !!selectedTask?._id && showTaskDetail
  });

  // Helper functions
  const getStatusColor = (status) => {
    switch (status?.name?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "in progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "todo":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleTaskUpdate = (id, data) => {
    updateTaskMutation.mutate({ id, data });
  };

  const handleTaskDelete = (id) => {
    deleteTaskMutation.mutate(id);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tasks Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Create, manage and collaborate on tasks with smart parsing and real-time updates
        </p>
      </div>

      {/* Smart Task Creation */}
      <div className="mb-6">
        {showCreateForm ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Task</h3>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SmartTaskInput 
              onTaskCreate={handleSmartTaskCreate}
              users={users}
              projects={projects}
            />
          </Card>
        ) : (
          <Button onClick={() => setShowCreateForm(true)} className="mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={filters.statusId} onValueChange={(value) => setFilters(prev => ({ ...prev, statusId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {taskStatuses.map(status => (
                <SelectItem key={status._id} value={status._id}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.assignedToId} onValueChange={(value) => setFilters(prev => ({ ...prev, assignedToId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {users.map(user => (
                <SelectItem key={user._id} value={user._id}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.projectId} onValueChange={(value) => setFilters(prev => ({ ...prev, projectId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Grid */}
      {tasksLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tasks...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const status = taskStatuses.find(s => s._id === task.statusId);
            const project = projects.find(p => p._id === task.projectId);
            
            return (
              <Card key={task._id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleTaskClick(task)}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-2">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTaskDelete(task._id); }}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  {status && (
                    <Badge className={getStatusColor(status)}>
                      {status.name}
                    </Badge>
                  )}
                  <Badge className={getPriorityColor(task.priority)}>
                    <Flag className="h-3 w-3 mr-1" />
                    {task.priority}
                  </Badge>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {task.description || "No description provided"}
                </p>

                <div className="space-y-2 text-sm">
                  {task.assignedTo && task.assignedTo.length > 0 && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">Assigned to:</span>
                      <div className="flex -space-x-1">
                        {task.assignedTo.slice(0, 3).map((user, index) => (
                          <Avatar key={index} className="h-6 w-6 border-2 border-white">
                            <AvatarFallback className="text-xs">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {task.assignedTo.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-500">+{task.assignedTo.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {project && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Project:</span>
                      <span className="text-gray-900 dark:text-white">{project.name}</span>
                    </div>
                  )}

                  {task.dueDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">Due:</span>
                      <span className="text-gray-900 dark:text-white">
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}

                  {task.tags && task.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="h-4 w-4 text-gray-400" />
                      {task.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{task.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!tasksLoading && tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tasks found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get started by creating your first task with smart parsing.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Task
          </Button>
        </div>
      )}

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        isOpen={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
        users={users}
        projects={projects}
        taskStatuses={taskStatuses}
        comments={taskDetails?.comments || []}
        auditLogs={taskDetails?.auditLogs || []}
        onAddComment={async (commentData) => {
          // Add comment logic here
          console.log('Add comment:', commentData);
        }}
        onEditComment={async (id, data) => {
          // Edit comment logic here
          console.log('Edit comment:', id, data);
        }}
        onDeleteComment={async (id) => {
          // Delete comment logic here
          console.log('Delete comment:', id);
        }}
        currentUser={users[0]} // You can implement proper current user logic
      />
    </div>
  );
}