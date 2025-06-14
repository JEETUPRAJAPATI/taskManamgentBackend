import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import TeamMembersWidget from "@/components/admin/TeamMembersWidget";

export default function Dashboard() {
  // Get current user data to check role
  const { data: user } = useQuery({
    queryKey: ["/api/auth/verify"],
    enabled: !!localStorage.getItem('token'),
  });

  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalUsers: 0,
    totalProjects: 0
  });

  const [loading, setLoading] = useState(true);

  // Check if user can access organizational features
  const isIndividualUser = user?.role === 'individual';
  const canAccessTeamFeatures = !isIndividualUser && (user?.role === 'org_admin' || user?.role === 'admin' || user?.role === 'superadmin');

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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></div>
              Dashboard
            </h1>
            <p className="text-slate-600">Welcome back! Here's what's happening with your team</p>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">Today</p>
              <p className="text-xs text-slate-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <Badge 
                    variant={card.changeType === 'positive' ? 'default' : 'destructive'} 
                    className={`text-xs px-2 py-1 font-medium ${
                      card.changeType === 'positive' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}
                  >
                    {card.change}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">{card.title}</h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">{card.value}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Recent Activity */}
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              Recent Activity
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 ml-12">
              Latest team actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 hover:border-slate-200">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'completion' ? 'bg-green-100' :
                      activity.type === 'creation' ? 'bg-blue-100' :
                      activity.type === 'assignment' ? 'bg-purple-100' :
                      activity.type === 'update' ? 'bg-orange-100' :
                      'bg-indigo-100'
                    }`}>
                      {activity.type === 'completion' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {activity.type === 'creation' && <Plus className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'assignment' && <Users className="h-4 w-4 text-purple-600" />}
                      {activity.type === 'update' && <Activity className="h-4 w-4 text-orange-600" />}
                      {activity.type === 'milestone' && <CheckSquare className="h-4 w-4 text-indigo-600" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-relaxed">
                      <span className="font-semibold text-slate-900">{activity.user}</span>
                      <span className="text-slate-600"> {activity.action} </span>
                      <span className="font-medium text-slate-800">{activity.target}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center mt-2">
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
      <div className={`grid grid-cols-1 gap-4 ${canAccessTeamFeatures ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-4xl mx-auto'}`}>
        
        {/* Upcoming Deadlines */}
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
              Upcoming Deadlines
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 ml-12">
              Tasks and projects requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-start justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 hover:border-slate-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{deadline.task}</h4>
                      <Badge 
                        className={`text-xs px-2 py-1 font-medium ${
                          deadline.priority === 'high' 
                            ? 'bg-red-100 text-red-700 border-red-200' 
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}
                      >
                        {deadline.priority} priority
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{deadline.project} • {deadline.assignee}</p>
                    <div className="flex items-center text-xs text-slate-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Due {deadline.dueDate}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <div className={`p-2 rounded-full ${
                      deadline.priority === 'high' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {deadline.priority === 'high' ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Members Widget - Only show for organizational users */}
        {canAccessTeamFeatures && <TeamMembersWidget showActions={true} maxItems={5} />}
      </div>
    </div>
  );
}