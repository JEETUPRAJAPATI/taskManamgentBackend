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
      icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
      title: "Real-time Comments",
      description: "Thread-based commenting with edit, delete, and reply functionality",
      color: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
    },
    {
      icon: <AtSign className="h-6 w-6 text-green-600" />,
      title: "Smart Mentions",
      description: "@mention team members with autocomplete and notifications",
      color: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700"
    },
    {
      icon: <Activity className="h-6 w-6 text-orange-600" />,
      title: "Activity Feed",
      description: "Real-time tracking of all task changes and team interactions",
      color: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700"
    },
    {
      icon: <Users className="h-6 w-6 text-purple-600" />,
      title: "Team Management",
      description: "Add/remove members, assign roles, track online status",
      color: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700"
    },
    {
      icon: <Bell className="h-6 w-6 text-red-600" />,
      title: "Notifications",
      description: "Real-time notifications for mentions, assignments, and updates",
      color: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700"
    },
    {
      icon: <Zap className="h-6 w-6 text-indigo-600" />,
      title: "Live Updates",
      description: "Automatic refresh every 30 seconds for real-time collaboration",
      color: "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Team Collaboration Hub
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
          Streamline team communication with real-time comments, smart mentions, activity tracking, 
          and comprehensive project collaboration tools.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className={`${feature.color} border-2 shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-lg">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Eye className="h-5 w-5 text-blue-600" />
              Select a Task to Collaborate On
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.slice(0, 6).map((task) => (
                <Card 
                  key={task._id}
                  className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                    selectedTaskId === task._id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' 
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600'
                  }`}
                  onClick={() => setSelectedTaskId(task._id)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3 truncate">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${
                        task.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        task.priority === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' :
                        task.priority === 'low' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                      } border`}>
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority || 'medium'}
                      </Badge>
                      {task.dueDate && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 border">
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
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Collaborating on: {selectedTask.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <TeamCollaboration
                  taskId={selectedTask._id}
                  users={users}
                  currentUser={currentUser}
                />
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Mention System Demo */}
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <AtSign className="h-5 w-5 text-green-600" />
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
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 shadow-sm">
        <CardHeader className="bg-white/50 dark:bg-slate-800/50 border-b border-green-200 dark:border-green-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Zap className="h-5 w-5 text-indigo-600" />
            Live Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-700">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-900 dark:text-white">MongoDB Connected:</span> Real data from your database
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-900 dark:text-white">Real-time Updates:</span> 30-second refresh intervals
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-900 dark:text-white">Theme Optimized:</span> Enhanced for collaboration
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-slate-900 dark:text-white">Integration Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">Components Created:</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-200">TaskComments.jsx</code> 
                  <span className="text-slate-600 dark:text-slate-400">- Real-time commenting system</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-200">ActivityFeed.jsx</code>
                  <span className="text-slate-600 dark:text-slate-400">- Activity tracking and display</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-200">TeamCollaboration.jsx</code>
                  <span className="text-slate-600 dark:text-slate-400">- Team management panel</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-200">MentionSystem.jsx</code>
                  <span className="text-slate-600 dark:text-slate-400">- Smart mentions and notifications</span>
                </li>
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