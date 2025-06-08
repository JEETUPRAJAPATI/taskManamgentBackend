import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Save, 
  X, 
  Calendar, 
  User, 
  Flag, 
  FolderOpen,
  Clock,
  FileText,
  Tag,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCreateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useUsers } from "@/hooks/useUsers";
import { formatDate } from "@/lib/utils";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["todo", "in-progress", "completed", "blocked"]).default("todo"),
  dueDate: z.string().optional(),
  projectId: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).default([]),
  estimatedHours: z.number().min(0).optional(),
  dependencies: z.array(z.string()).default([])
});

export default function CreateTask() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");

  const { data: projects = [] } = useProjects();
  const { data: users = [] } = useUsers();
  const createTaskMutation = useCreateTask();

  const form = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
      dueDate: "",
      projectId: "",
      assignedTo: "",
      tags: [],
      estimatedHours: "",
      dependencies: []
    }
  });

  const watchedTags = form.watch("tags");

  const handleAddTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      form.setValue("tags", [...watchedTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    form.setValue("tags", watchedTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data) => {
    try {
      // Convert estimatedHours to number if provided
      const taskData = {
        ...data,
        estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : undefined,
        dueDate: data.dueDate || undefined,
        projectId: data.projectId || undefined,
        assignedTo: data.assignedTo || undefined
      };

      await createTaskMutation.mutateAsync(taskData);
      
      toast({
        title: "Success",
        description: "Task created successfully"
      });
      
      setLocation("/admin/tasks");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "todo":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "blocked":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Task</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Define a new task with all necessary details and requirements
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setLocation("/admin/tasks")}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={createTaskMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Task Title *</Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                      placeholder="Enter a descriptive task title"
                      className="mt-1"
                    />
                    {form.formState.errors.title && (
                      <p className="text-red-600 text-sm mt-1">
                        {form.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Provide detailed description of the task requirements and objectives"
                      rows={4}
                      className="mt-1"
                    />
                    {form.formState.errors.description && (
                      <p className="text-red-600 text-sm mt-1">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Task Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={form.watch("priority")} 
                        onValueChange={(value) => form.setValue("priority", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              Low Priority
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              Medium Priority
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              High Priority
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">Initial Status</Label>
                      <Select 
                        value={form.watch("status")} 
                        onValueChange={(value) => form.setValue("status", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="datetime-local"
                        {...form.register("dueDate")}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="estimatedHours">Estimated Hours</Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        min="0"
                        step="0.5"
                        {...form.register("estimatedHours", { valueAsNumber: true })}
                        placeholder="e.g., 8.5"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline">
                        Add
                      </Button>
                    </div>

                    {watchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {watchedTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            {tag}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="projectId">Project</Label>
                    <Select 
                      value={form.watch("projectId")} 
                      onValueChange={(value) => form.setValue("projectId", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select project (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Project</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project._id} value={project._id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Select 
                      value={form.watch("assignedTo")} 
                      onValueChange={(value) => form.setValue("assignedTo", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Assign to team member (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Task Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">
                      {form.watch("title") || "Task Title"}
                    </h4>
                    {form.watch("description") && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {form.watch("description").length > 100 
                          ? `${form.watch("description").substring(0, 100)}...` 
                          : form.watch("description")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getPriorityColor(form.watch("priority"))}>
                      <Flag className="h-3 w-3 mr-1" />
                      {form.watch("priority")} priority
                    </Badge>
                    <Badge className={getStatusColor(form.watch("status"))}>
                      {form.watch("status")}
                    </Badge>
                  </div>

                  {form.watch("dueDate") && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Due: {formatDate(form.watch("dueDate"))}</span>
                    </div>
                  )}

                  {form.watch("estimatedHours") && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{form.watch("estimatedHours")} hours estimated</span>
                    </div>
                  )}

                  {watchedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {watchedTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Help */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                  <ul className="space-y-2">
                    <li>• Use clear, actionable titles</li>
                    <li>• Add detailed descriptions for complex tasks</li>
                    <li>• Set realistic due dates</li>
                    <li>• Use tags for better organization</li>
                    <li>• Assign tasks to appropriate team members</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}