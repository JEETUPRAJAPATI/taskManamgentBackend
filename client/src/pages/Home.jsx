import { useState } from "react";
import { Link } from "wouter";
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Users, 
  Calendar, 
  TrendingUp,
  Plus,
  Filter,
  Search,
  Bell,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { formatRelativeTime, getInitials } from "@/lib/utils";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({
    limit: 10,
    search: searchQuery
  });
  
  const { data: projects = [], isLoading: projectsLoading } = useProjects({
    limit: 6
  });

  // Calculate quick stats
  const myTasks = tasks.filter(t => t.status !== "completed");
  const todayTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(t.dueDate);
    return dueDate.toDateString() === today.toDateString();
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "todo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  if (tasksLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TaskSetu</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Your productivity workspace
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/api/logout"}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My Active Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{myTasks.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayTasks.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard">
                <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">Dashboard</span>
                </Button>
              </Link>
              <Link href="/admin/tasks/create">
                <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                  <Plus className="h-6 w-6" />
                  <span className="text-sm">New Task</span>
                </Button>
              </Link>
              <Link href="/admin/projects">
                <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Projects</span>
                </Button>
              </Link>
              <Link href="/admin/tasks">
                <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-sm">All Tasks</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks, projects, or team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Tasks</CardTitle>
              <Link href="/admin/tasks">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No tasks yet</p>
                  <Link href="/admin/tasks/create">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Task
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{getPriorityIcon(task.priority)}</span>
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                            {task.status}
                          </Badge>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {formatRelativeTime(task.dueDate)}
                            </span>
                          </div>
                        )}
                      </div>
                      <Link href={`/admin/tasks/${task._id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Projects</CardTitle>
              <Link href="/admin/projects">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No projects yet</p>
                  <Link href="/admin/projects/create">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 4).map((project) => {
                    const projectTasks = tasks.filter(t => t.projectId === project._id);
                    const completedTasks = projectTasks.filter(t => t.status === "completed");
                    const progress = projectTasks.length > 0 
                      ? Math.round((completedTasks.length / projectTasks.length) * 100) 
                      : 0;

                    return (
                      <div key={project._id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{project.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {progress}%
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {project.description && project.description.length > 50 
                            ? `${project.description.substring(0, 50)}...` 
                            : project.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {projectTasks.length} tasks
                          </span>
                          <Link href={`/admin/projects/${project._id}`}>
                            <Button variant="ghost" size="sm">
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}