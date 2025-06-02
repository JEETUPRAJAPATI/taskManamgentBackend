import { useQuery } from "@tanstack/react-query";
import { 
  CheckSquare, 
  Users, 
  FolderOpen, 
  Clock,
  TrendingUp,
  Plus,
  UserPlus,
  FileText,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatsCard } from "@/components/admin/StatsCard";
import { TaskCard } from "@/components/admin/TaskCard";
// Note: Schema types removed for JavaScript compatibility
import { useTasks } from "@/hooks/useTasks";
import { formatRelativeTime, getInitials } from "@/lib/utils";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/activities/recent"],
  });

  const { data: recentTasks } = useTasks();

  const displayTasks = recentTasks?.slice(0, 6) || [];

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Tasks"
          value={stats?.totalTasks || 0}
          change="+12% from last month"
          trend="up"
          icon={CheckSquare}
          iconColor="text-primary"
        />
        <StatsCard
          title="Completed"
          value={stats?.completedTasks || 0}
          change="+8% from last month"
          trend="up"
          icon={CheckSquare}
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="In Progress"
          value={stats?.inProgressTasks || 0}
          change="+3% from last month"
          trend="up"
          icon={Clock}
          iconColor="text-amber-600"
        />
        <StatsCard
          title="Active Users"
          value={stats?.activeUsers || 0}
          change="+4 new this month"
          trend="up"
          icon={Users}
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Completion Chart Placeholder */}
        <div className="lg:col-span-2">
          <Card className="admin-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Task Completion Trend</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">7D</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">30D</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">90D</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Chart visualization would go here</p>
                  <p className="text-xs text-muted-foreground">Use Recharts or similar library</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities?.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {(!activities || activities.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Recent Tasks</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-primary rounded" 
                    defaultChecked={task.status === "completed"}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                    </p>
                  </div>
                  <Badge className={`text-xs px-2 py-1 priority-${task.priority}`}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
              {displayTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto flex flex-col items-center p-6 border-dashed hover:border-primary hover:bg-primary/5"
              >
                <Plus className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Create Task</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto flex flex-col items-center p-6 border-dashed hover:border-primary hover:bg-primary/5"
              >
                <FolderOpen className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">New Project</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto flex flex-col items-center p-6 border-dashed hover:border-primary hover:bg-primary/5"
              >
                <UserPlus className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Invite User</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto flex flex-col items-center p-6 border-dashed hover:border-primary hover:bg-primary/5"
              >
                <FileText className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
