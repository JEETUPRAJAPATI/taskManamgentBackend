import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  MessageCircle,
  Edit,
  UserPlus,
  Clock,
  Flag,
  CheckCircle,
  FileText,
  Tag,
  Calendar,
  Users
} from "lucide-react";

export function ActivityFeed({ 
  taskId = null, 
  projectId = null, 
  userId = null,
  limit = 20,
  className = "" 
}) {
  // Fetch activity data
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activities", { taskId, projectId, userId, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (taskId) params.append("taskId", taskId);
      if (projectId) params.append("projectId", projectId);
      if (userId) params.append("userId", userId);
      params.append("limit", limit.toString());
      
      const response = await fetch(`/api/activities?${params}`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case "task_created":
        return <FileText className="h-4 w-4 text-blue-400" />;
      case "task_updated":
        return <Edit className="h-4 w-4 text-amber-400" />;
      case "task_completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "comment_added":
        return <MessageCircle className="h-4 w-4 text-purple-400" />;
      case "user_assigned":
        return <UserPlus className="h-4 w-4 text-blue-400" />;
      case "status_changed":
        return <Flag className="h-4 w-4 text-orange-400" />;
      case "due_date_changed":
        return <Calendar className="h-4 w-4 text-red-400" />;
      case "priority_changed":
        return <Flag className="h-4 w-4 text-yellow-400" />;
      case "tag_added":
        return <Tag className="h-4 w-4 text-cyan-400" />;
      case "file_attached":
        return <FileText className="h-4 w-4 text-gray-400" />;
      case "team_joined":
        return <Users className="h-4 w-4 text-green-400" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get activity color based on type
  const getActivityColor = (type) => {
    switch (type) {
      case "task_created":
      case "user_assigned":
        return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10";
      case "task_updated":
      case "status_changed":
        return "border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10";
      case "task_completed":
      case "team_joined":
        return "border-l-green-500 bg-green-50/50 dark:bg-green-900/10";
      case "comment_added":
        return "border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10";
      case "due_date_changed":
        return "border-l-red-500 bg-red-50/50 dark:bg-red-900/10";
      case "priority_changed":
        return "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10";
      case "tag_added":
        return "border-l-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/10";
      default:
        return "border-l-gray-500 bg-gray-50/50 dark:bg-gray-900/10";
    }
  };

  // Format activity description
  const formatActivityDescription = (activity) => {
    const { type, user, details, task } = activity;
    const userName = `${user?.firstName} ${user?.lastName}`;
    const taskTitle = task?.title;

    switch (type) {
      case "task_created":
        return (
          <span>
            <span className="font-medium">{userName}</span> created task{" "}
            <span className="font-medium text-primary">"{taskTitle}"</span>
          </span>
        );
      case "task_updated":
        return (
          <span>
            <span className="font-medium">{userName}</span> updated task{" "}
            <span className="font-medium">"{taskTitle}"</span>
            {details?.field && (
              <span className="text-muted-foreground"> - {details.field}</span>
            )}
          </span>
        );
      case "task_completed":
        return (
          <span>
            <span className="font-medium">{userName}</span> completed task{" "}
            <span className="font-medium text-green-600">"{taskTitle}"</span>
          </span>
        );
      case "comment_added":
        return (
          <span>
            <span className="font-medium">{userName}</span> commented on{" "}
            <span className="font-medium">"{taskTitle}"</span>
          </span>
        );
      case "user_assigned":
        return (
          <span>
            <span className="font-medium">{userName}</span> was assigned to{" "}
            <span className="font-medium">"{taskTitle}"</span>
          </span>
        );
      case "status_changed":
        return (
          <span>
            <span className="font-medium">{userName}</span> changed status of{" "}
            <span className="font-medium">"{taskTitle}"</span>
            {details?.from && details?.to && (
              <span className="ml-2">
                <Badge variant="outline" className="mr-1 text-xs">
                  {details.from}
                </Badge>
                →
                <Badge variant="outline" className="ml-1 text-xs">
                  {details.to}
                </Badge>
              </span>
            )}
          </span>
        );
      case "due_date_changed":
        return (
          <span>
            <span className="font-medium">{userName}</span> updated due date for{" "}
            <span className="font-medium">"{taskTitle}"</span>
            {details?.dueDate && (
              <span className="ml-2 text-muted-foreground">
                to {new Date(details.dueDate).toLocaleDateString()}
              </span>
            )}
          </span>
        );
      case "priority_changed":
        return (
          <span>
            <span className="font-medium">{userName}</span> changed priority of{" "}
            <span className="font-medium">"{taskTitle}"</span>
            {details?.from && details?.to && (
              <span className="ml-2">
                <Badge variant="outline" className="mr-1 text-xs">
                  {details.from}
                </Badge>
                →
                <Badge variant="outline" className="ml-1 text-xs">
                  {details.to}
                </Badge>
              </span>
            )}
          </span>
        );
      case "tag_added":
        return (
          <span>
            <span className="font-medium">{userName}</span> added tag{" "}
            {details?.tag && (
              <Badge variant="outline" className="mx-1 text-xs">
                #{details.tag}
              </Badge>
            )}
            to <span className="font-medium">"{taskTitle}"</span>
          </span>
        );
      case "file_attached":
        return (
          <span>
            <span className="font-medium">{userName}</span> attached{" "}
            {details?.fileName && (
              <span className="font-medium">{details.fileName}</span>
            )}{" "}
            to <span className="font-medium">"{taskTitle}"</span>
          </span>
        );
      case "team_joined":
        return (
          <span>
            <span className="font-medium">{userName}</span> joined the team
          </span>
        );
      default:
        return (
          <span>
            <span className="font-medium">{userName}</span> performed an action
          </span>
        );
    }
  };

  if (!activities.length && !isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="bg-card border-border animate-pulse">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            activities.map((activity) => (
              <Card
                key={activity._id}
                className={`bg-card border-border border-l-4 ${getActivityColor(activity.type)}`}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                            {activity.user?.firstName?.[0]}{activity.user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full border border-border">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground mb-1">
                        {formatActivityDescription(activity)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        
                        {activity.project && (
                          <>
                            <span>•</span>
                            <span>{activity.project.name}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Show comment preview for comment activities */}
                      {activity.type === "comment_added" && activity.details?.commentPreview && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground border-l-2 border-purple-400">
                          "{activity.details.commentPreview}"
                        </div>
                      )}
                      
                      {/* Show file details for file activities */}
                      {activity.type === "file_attached" && activity.details && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{activity.details.fileName}</span>
                          {activity.details.fileSize && (
                            <span>({activity.details.fileSize})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}