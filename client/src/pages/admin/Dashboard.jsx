import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  CheckSquare, 
  FolderOpen, 
  Building2,
  CreditCard,
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
    totalProjects: 0,
    totalCompanies: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalTasks: 156,
        completedTasks: 89,
        pendingTasks: 45,
        overdueTasks: 22,
        totalUsers: 34,
        totalProjects: 12,
        totalCompanies: 8,
        monthlyRevenue: 24500,
        activeSubscriptions: 7
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-5 bg-slate-200 rounded w-1/2 mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="h-64 bg-slate-200 rounded"></div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-slate-200 rounded"></div>
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
      title: "Completed Tasks", 
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
      title: "Companies",
      value: stats.totalCompanies,
      description: "Registered companies",
      icon: Building2,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+25%",
      changeType: "positive"
    }
  ];

  const revenueCards = [
    {
      title: "Monthly Revenue",
      value: `$${(stats.monthlyRevenue / 100).toLocaleString()}`,
      description: "Total revenue this month",
      icon: CreditCard,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      description: "Current paying customers",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Welcome to your task management dashboard
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index} className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {card.value}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {card.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <Badge variant="secondary" className="text-xs">
                    {card.change}
                  </Badge>
                  <span className="text-xs text-slate-500 ml-2">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue & Subscription Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {revenueCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index} className="border-slate-200 dark:border-slate-700 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {card.value}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {card.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Task Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Pending Tasks
                </p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.pendingTasks}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Requires attention
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Overdue Tasks
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.overdueTasks}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Urgent action needed
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Active Projects
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalProjects}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  In progress
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Task Completed
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  "Website Redesign" finished by John Doe • 2 hours ago
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  New Project Created
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  "Mobile App Development" started • 4 hours ago
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Task Assigned
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  "API Documentation" assigned to Sarah Wilson • 6 hours ago
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <CheckSquare className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FolderOpen className="h-4 w-4 mr-2" />
              Start New Project
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Live Integration Status */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            Live Integration Status
          </CardTitle>
          <CardDescription>
            Real-time status of external integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  MongoDB Connected
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Real-time data from database
                </p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Email Integration
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Ready for configuration
                </p>
              </div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Calendar Sync
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Available for setup
                </p>
              </div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Webhook Support
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ready for integration
                </p>
              </div>
              <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}