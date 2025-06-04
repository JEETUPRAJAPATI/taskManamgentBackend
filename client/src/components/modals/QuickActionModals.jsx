import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Users, 
  Bell, 
  MessageSquare, 
  BarChart3, 
  Filter,
  Clock,
  Target,
  Settings,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

export function QuickActionModals({ activeModal, onClose, onSubmit }) {
  const [formData, setFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch real data from the API
  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: activeModal === 'notifications'
  });

  const { data: teamMembers } = useQuery({
    queryKey: ['/api/users'],
    enabled: activeModal === 'team'
  });

  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: activeModal === 'create-task'
  });

  const { data: tasks } = useQuery({
    queryKey: ['/api/tasks'],
    enabled: activeModal === 'search'
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(activeModal, formData);
    setFormData({});
    onClose();
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'create-task':
        return (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create New Task</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Enter task title..."
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Task description..."
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project</Label>
                  <Select onValueChange={(value) => handleInputChange('projectId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit}>Create Task</Button>
              </div>
            </div>
          </DialogContent>
        );

      case 'search':
        return (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Search Everything</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Search tasks, projects, people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-lg"
                />
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {tasks?.filter(task => 
                    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((task) => (
                    <div key={task._id} className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.description}</div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary">{task.status}</Badge>
                        <Badge variant="outline">{task.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        );

      case 'notifications':
        return (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
                {notifications?.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{notifications.length}</Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {notifications?.map((notification) => (
                  <div key={notification._id} className="p-3 rounded-lg border">
                    <div className="flex items-start space-x-3">
                      <Bell className="w-5 h-5 mt-0.5 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{notification.message}</div>
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        );

      case 'team':
        return (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Team Members</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {teamMembers?.map((member) => (
                <div key={member._id} className="flex items-center space-x-3 p-3 rounded-lg border">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {member.firstName?.[0]}{member.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{member.firstName} {member.lastName}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                  <Badge variant="default">
                    {member.role || 'Member'}
                  </Badge>
                </div>
              ))}
            </div>
          </DialogContent>
        );

      case 'quick-filters':
        return (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Quick Filters</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {['My Tasks', 'High Priority', 'Due Today', 'Overdue', 'Completed', 'In Progress'].map((filter) => (
                  <Button key={filter} variant="outline" className="justify-start" onClick={onClose}>
                    {filter}
                  </Button>
                ))}
              </div>
              <Separator />
              <div>
                <Label>Custom Filter</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select criteria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignee">Assignee</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        );

      default:
        return (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>Feature Coming Soon</span>
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <p className="text-gray-500">This feature is under development and will be available soon.</p>
              <Button onClick={onClose} className="mt-4">Close</Button>
            </div>
          </DialogContent>
        );
    }
  };

  return (
    <Dialog open={!!activeModal} onOpenChange={onClose}>
      {renderModalContent()}
    </Dialog>
  );
}