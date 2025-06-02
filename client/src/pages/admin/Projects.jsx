import { useState } from "react";
import { Plus, MoreHorizontal, Edit, Trash2, FolderOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProjects, useDeleteProject } from "@/hooks/useProjects";
import { ProjectWithDetails } from "@shared/schema";
import { formatDate, getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Projects() {
  const { toast } = useToast();
  const { data: projects = [], isLoading } = useProjects();
  const deleteProjectMutation = useDeleteProject();

  const handleDeleteProject = async (project: ProjectWithDetails) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) return;
    
    try {
      await deleteProjectMutation.mutateAsync(project.id);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400";
      case "completed":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400";
      case "on-hold":
        return "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track project progress
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <Card className="admin-card">
            <CardContent className="p-6">
              <div className="text-center">Loading projects...</div>
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="admin-card col-span-full">
            <CardContent className="p-8 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No projects found</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="admin-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {project.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace("-", " ")}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteProject(project)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {project.description}
                  </p>
                )}

                <div className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Progress</span>
                      <span className="text-sm text-muted-foreground">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Tasks:</span>
                        <span className="font-medium">{project.taskCount || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="font-medium">{project.completedTasks || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner and Due Date */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      {project.owner && (
                        <>
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={project.owner.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(project.owner.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">{project.owner.fullName}</span>
                        </>
                      )}
                    </div>
                    {project.dueDate && (
                      <span className="text-muted-foreground">
                        Due: {formatDate(project.dueDate)}
                      </span>
                    )}
                  </div>

                  {/* Team Members */}
                  {project.teamMembers && project.teamMembers.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {project.teamMembers.length} team member{project.teamMembers.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
