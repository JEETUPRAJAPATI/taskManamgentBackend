import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskComments } from "./TaskComments";
import { ActivityFeed } from "./ActivityFeed";
import { TeamCollaboration } from "./TeamCollaboration";
import { MentionSystem, MentionNotifications } from "./MentionSystem";
import {
  MessageSquare,
  Activity,
  Users,
  AtSign,
  Bell,
  Zap,
  Eye,
  Calendar,
  Flag
} from "lucide-react";

export function CollaborationDemo() {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [mentionText, setMentionText] = useState("");

  // Fetch sample tasks for demonstration
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks?limit=5");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    }
  });

  // Fetch users for collaboration
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    }
  });

  // Mock current user (in real app, this would come from auth context)
  const currentUser = users[0] || { _id: "demo", firstName: "Demo", lastName: "User" };

  const selectedTask = tasks.find(task => task._id === selectedTaskId) || tasks[0];

  const features = [
    {
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
      title: "Real-time Comments",
      description: "Thread-based commenting with edit, delete, and reply functionality",
      color: "bg-primary/10 border-primary/30"
    },
    {
      icon: <AtSign className="h-6 w-6 text-primary" />,
      title: "Smart Mentions",
      description: "@mention team members with autocomplete and notifications",
      color: "bg-primary/10 border-primary/30"
    },
    {
      icon: <Activity className="h-6 w-6 text-success" />,
      title: "Activity Feed",
      description: "Real-time tracking of all task changes and team interactions",
      color: "bg-success/10 border-success/30"
    },
    {
      icon: <Users className="h-6 w-6 text-accent" />,
      title: "Team Management",
      description: "Add/remove members, assign roles, track online status",
      color: "bg-accent/10 border-accent/30"
    },
    {
      icon: <Bell className="h-6 w-6 text-destructive" />,
      title: "Notifications",
      description: "Real-time notifications for mentions, assignments, and updates",
      color: "bg-destructive/10 border-destructive/30"
    },
    {
      icon: <Zap className="h-6 w-6 text-accent" />,
      title: "Live Updates",
      description: "Automatic refresh every 30 seconds for real-time collaboration",
      color: "bg-accent/10 border-accent/30"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          Advanced Task Collaboration Features
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Experience real-time team collaboration with comments, mentions, activity tracking, 
          and comprehensive team management integrated with your MongoDB database.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className={`${feature.color} border-2`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Selection */}
      {tasks.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Select a Task to Collaborate On
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tasks.slice(0, 6).map((task) => (
                <Card 
                  key={task._id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTaskId === task._id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => setSelectedTaskId(task._id)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium text-foreground mb-2 truncate">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="priority-medium">
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority || 'medium'}
                      </Badge>
                      {task.dueDate && (
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due Soon
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Collaboration Features */}
      {selectedTask && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Collaboration Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Collaborating on: {selectedTask.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TeamCollaboration
                  taskId={selectedTask._id}
                  users={users}
                  currentUser={currentUser}
                />
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Mention System Demo */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AtSign className="h-5 w-5" />
                  Try Mentions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MentionSystem
                  value={mentionText}
                  onChange={setMentionText}
                  users={users}
                  currentUser={currentUser}
                  placeholder="Type @ to mention team members..."
                  onMention={(user) => {
                    console.log('Mentioned:', user);
                  }}
                />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed
                  taskId={selectedTask._id}
                  limit={10}
                />
              </CardContent>
            </Card>

            {/* Mention Notifications */}
            {currentUser && (
              <MentionNotifications
                userId={currentUser._id}
                onMentionClick={(mention) => {
                  console.log('Clicked mention:', mention);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Integration Information */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Live Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">
                <span className="font-medium">MongoDB Connected:</span> Real data from your database
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm">
                <span className="font-medium">Real-time Updates:</span> 30-second refresh intervals
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm">
                <span className="font-medium">Dark Theme:</span> Optimized for collaboration
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Integration Details</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Components Created:</h4>
              <ul className="space-y-1 text-sm">
                <li>• <code>TaskComments.jsx</code> - Real-time commenting system</li>
                <li>• <code>ActivityFeed.jsx</code> - Activity tracking and display</li>
                <li>• <code>TeamCollaboration.jsx</code> - Team management panel</li>
                <li>• <code>MentionSystem.jsx</code> - Smart mentions and notifications</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Key Features:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Thread-based commenting with replies</li>
                <li>• @mention autocomplete with notifications</li>
                <li>• Real-time activity feed with 15+ event types</li>
                <li>• Team member management with roles</li>
                <li>• Online status indicators</li>
                <li>• Dark theme optimized UI</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}