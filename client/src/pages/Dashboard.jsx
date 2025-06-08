import { useState } from "react";
import { Link } from "wouter";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Plus, 
  Users, 
  FolderOpen,
  TrendingUp,
  AlertCircle,
  Filter,
  Search,
  Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { formatDateTime, formatRelativeTime, getInitials } from "@/lib/utils";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({
    status: filter === "all" ? undefined : filter,
    search: searchQuery
  });
  
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  // Calculate dashboard statistics
  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === "completed").length,
    inProgressTasks: tasks.filter(t => t.status === "in-progress").length,
    overdueTasks: tasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && t.status !== "completed";
    }).length
  };

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  // Get recent tasks (last 5)
  const recentTasks = tasks
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Get upcoming tasks (due in next 7 days)
  const upcomingTasks = tasks
    .filter(t => {
      if (!t.dueDate || t.status === "completed") return false;
      const dueDate = new Date(t.dueDate);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return dueDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  if (tasksLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back! Here's what's happening with your tasks.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Link href="/admin/tasks/create">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {completionRate}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
              <p className="text-xs text-muted-foreground">
                Active tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                Successfully finished
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "todo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("todo")}
                >
                  To Do
                </Button>
                <Button
                  variant={filter === "in-progress" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("in-progress")}
                >
                  In Progress
                </Button>
                <Button
                  variant={filter === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("completed")}
                >
                  Completed
                </Button>
              </div>
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
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No recent tasks</p>
                  <Link href="/admin/tasks/create">
                    <Button className="mt-4" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Task
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div key={task._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {task.description && task.description.length > 50 
                            ? `${task.description.substring(0, 50)}...` 
                            : task.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {task.priority && (
                            <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                              {task.priority} priority
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              Due {formatRelativeTime(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Deadlines</CardTitle>
              <Link href="/admin/tasks?filter=upcoming">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No upcoming deadlines</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingTasks.map((task) => (
                    <div key={task._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                            {task.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Due {formatDateTime(task.dueDate)}
                          </span>
                          {new Date(task.dueDate) < new Date() && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Projects Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Projects</CardTitle>
            <Link href="/admin/projects">
              <Button variant="outline" size="sm">
                <FolderOpen className="h-4 w-4 mr-2" />
                Manage Projects
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No projects yet</p>
                <Link href="/admin/projects/create">
                  <Button className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.slice(0, 6).map((project) => {
                  const projectTasks = tasks.filter(t => t.projectId === project._id);
                  const completedProjectTasks = projectTasks.filter(t => t.status === "completed");
                  const projectProgress = projectTasks.length > 0 
                    ? Math.round((completedProjectTasks.length / projectTasks.length) * 100) 
                    : 0;

                  return (
                    <div key={project._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h4 className="font-medium mb-2">{project.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {project.description && project.description.length > 60 
                          ? `${project.description.substring(0, 60)}...` 
                          : project.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {projectTasks.length} tasks
                          </span>
                        </div>
                        <Badge variant="outline">
                          {projectProgress}% complete
                        </Badge>
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
  );
}