import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  CheckSquare, 
  FolderOpen, 
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalUsers: 0,
    totalProjects: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalTasks: 156,
        completedTasks: 89,
        pendingTasks: 45,
        overdueTasks: 22,
        totalUsers: 34,
        totalProjects: 12
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-1"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-slate-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="h-5 bg-slate-200 rounded w-1/2 mb-3"></div>
              <div className="h-48 bg-slate-200 rounded"></div>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="h-5 bg-slate-200 rounded w-1/2 mb-3"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-slate-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      description: "Active tasks in system",
      icon: CheckSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "Completed", 
      value: stats.completedTasks,
      description: "Tasks finished this month",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8%",
      changeType: "positive"
    },
    {
      title: "Active Users",
      value: stats.totalUsers,
      description: "Registered users",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+15%",
      changeType: "positive"
    },
    {
      title: "Projects",
      value: stats.totalProjects,
      description: "Active projects",
      icon: FolderOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+5%",
      changeType: "positive"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      user: "John Smith",
      action: "completed task",
      target: "Database Migration",
      time: "2 minutes ago",
      type: "completion"
    },
    {
      id: 2,
      user: "Sarah Wilson",
      action: "created project",
      target: "Mobile App Redesign",
      time: "15 minutes ago",
      type: "creation"
    },
    {
      id: 3,
      user: "Mike Johnson",
      action: "assigned task",
      target: "API Documentation",
      time: "1 hour ago",
      type: "assignment"
    },
    {
      id: 4,
      user: "Emily Davis",
      action: "updated project",
      target: "Website Optimization",
      time: "2 hours ago",
      type: "update"
    },
    {
      id: 5,
      user: "David Brown",
      action: "completed milestone",
      target: "Phase 1 Development",
      time: "3 hours ago",
      type: "milestone"
    }
  ];

  const upcomingDeadlines = [
    {
      id: 1,
      task: "Mobile App Beta Release",
      project: "Mobile Development",
      dueDate: "2024-01-15",
      priority: "high",
      assignee: "Development Team"
    },
    {
      id: 2,
      task: "Security Audit Report",
      project: "Security Review",
      dueDate: "2024-01-18",
      priority: "medium",
      assignee: "Security Team"
    },
    {
      id: 3,
      task: "User Testing Phase 2",
      project: "UX Research",
      dueDate: "2024-01-20",
      priority: "high",
      assignee: "UX Team"
    },
    {
      id: 4,
      task: "Database Performance Optimization",
      project: "Backend Infrastructure",
      dueDate: "2024-01-22",
      priority: "medium",
      assignee: "Backend Team"
    }
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Dashboard</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">TaskSetu - Comprehensive task management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-md ${card.bgColor} dark:bg-slate-700`}>
                    <Icon className={`h-4 w-4 ${card.color} dark:text-slate-300`} />
                  </div>
                  <Badge variant={card.changeType === 'positive' ? 'default' : 'destructive'} className="text-xs px-1.5 py-0.5">
                    {card.change}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">{card.title}</h3>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{card.value}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Task Overview Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Task Progress Overview
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                Weekly task completion and progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-48 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Chart visualization placeholder</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Task completion analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
              Latest team actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-2 p-2 rounded bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'completion' && <CheckCircle className="h-3 w-3 text-green-600" />}
                    {activity.type === 'creation' && <Plus className="h-3 w-3 text-blue-600" />}
                    {activity.type === 'assignment' && <Users className="h-3 w-3 text-purple-600" />}
                    {activity.type === 'update' && <Activity className="h-3 w-3 text-blue-600" />}
                    {activity.type === 'milestone' && <CheckSquare className="h-3 w-3 text-indigo-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium text-slate-900 dark:text-white">{activity.user}</span>
                      <span className="text-slate-600 dark:text-slate-300"> {activity.action} </span>
                      <span className="font-medium text-slate-900 dark:text-white">{activity.target}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Upcoming Deadlines */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-red-600" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
              Tasks and projects requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">{deadline.task}</h4>
                      <Badge 
                        variant={deadline.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs px-1.5 py-0.5"
                      >
                        {deadline.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{deadline.project} • {deadline.assignee}</p>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {deadline.dueDate}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {deadline.priority === 'high' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
              Common workflow shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="flex items-center justify-center gap-2 h-16 text-sm">
                <Plus className="h-4 w-4" />
                <span>New Task</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center justify-center gap-2 h-16 text-sm">
                <FolderOpen className="h-4 w-4" />
                <span>New Project</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center justify-center gap-2 h-16 text-sm">
                <Users className="h-4 w-4" />
                <span>Add User</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center justify-center gap-2 h-16 text-sm">
                <BarChart3 className="h-4 w-4" />
                <span>View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}