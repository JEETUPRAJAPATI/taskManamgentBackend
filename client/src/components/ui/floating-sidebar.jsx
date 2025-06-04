import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Bell, 
  Calendar, 
  Users, 
  Settings, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Zap,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function FloatingSidebar({ onAction = () => {}, className }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [notifications, setNotifications] = useState(3);
  const [upcomingTasks, setUpcomingTasks] = useState(5);

  // Auto-collapse after 10 seconds when expanded
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const quickActions = [
    {
      id: 'create-task',
      icon: Plus,
      label: 'Create Task',
      description: 'Add new task',
      color: 'bg-blue-500 hover:bg-blue-600',
      shortcut: 'Ctrl+N',
      action: () => onAction('create-task')
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search',
      description: 'Find tasks, projects, users',
      color: 'bg-gray-500 hover:bg-gray-600',
      shortcut: 'Ctrl+K',
      action: () => onAction('search')
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      description: 'View notifications',
      color: 'bg-orange-500 hover:bg-orange-600',
      badge: notifications > 0 ? notifications : null,
      action: () => onAction('notifications')
    },
    {
      id: 'calendar',
      icon: Calendar,
      label: 'Calendar',
      description: 'View calendar & deadlines',
      color: 'bg-green-500 hover:bg-green-600',
      action: () => onAction('calendar')
    },
    {
      id: 'team',
      icon: Users,
      label: 'Team',
      description: 'Manage team members',
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => onAction('team')
    },
    {
      id: 'chat',
      icon: MessageSquare,
      label: 'Chat',
      description: 'Team collaboration',
      color: 'bg-pink-500 hover:bg-pink-600',
      action: () => onAction('chat')
    },
    {
      id: 'reports',
      icon: BarChart3,
      label: 'Reports',
      description: 'Analytics & insights',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => onAction('reports')
    },
    {
      id: 'quick-filters',
      icon: Filter,
      label: 'Quick Filters',
      description: 'Filter tasks & projects',
      color: 'bg-teal-500 hover:bg-teal-600',
      action: () => onAction('quick-filters')
    },
    {
      id: 'time-tracker',
      icon: Clock,
      label: 'Time Tracker',
      description: 'Track time spent',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      action: () => onAction('time-tracker')
    },
    {
      id: 'goals',
      icon: Target,
      label: 'Goals',
      description: 'View & set goals',
      color: 'bg-red-500 hover:bg-red-600',
      badge: upcomingTasks > 0 ? upcomingTasks : null,
      action: () => onAction('goals')
    },
    {
      id: 'forms',
      icon: FileText,
      label: 'Forms',
      description: 'Create & manage forms',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      action: () => onAction('forms')
    },
    {
      id: 'automation',
      icon: Zap,
      label: 'Automation',
      description: 'Workflow automation',
      color: 'bg-amber-500 hover:bg-amber-600',
      action: () => onAction('automation')
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      description: 'App preferences',
      color: 'bg-slate-500 hover:bg-slate-600',
      action: () => onAction('settings')
    }
  ];

  const handleActionClick = (action) => {
    setActiveAction(action.id);
    action.action();
    
    // Reset active state after animation
    setTimeout(() => {
      setActiveAction(null);
    }, 200);
  };

  const sidebarVariants = {
    collapsed: {
      width: 56,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    expanded: {
      width: 280,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  const itemVariants = {
    collapsed: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 }
    },
    expanded: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, delay: 0.1 }
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        variants={sidebarVariants}
        animate={isExpanded ? "expanded" : "collapsed"}
        className={cn(
          "fixed left-4 top-1/2 -translate-y-1/2 z-50",
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
          "rounded-2xl shadow-2xl",
          "overflow-hidden",
          className
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  variants={itemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="flex items-center space-x-2"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Quick Actions</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 p-0 shrink-0"
            >
              {isExpanded ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="p-2">
          <div className={cn(
            "grid gap-2",
            isExpanded ? "grid-cols-2" : "grid-cols-1"
          )}>
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              
              return (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative"
                    >
                      <Button
                        variant="ghost"
                        onClick={() => handleActionClick(action)}
                        className={cn(
                          "relative w-full h-12 p-2 rounded-xl",
                          "transition-all duration-200",
                          "hover:shadow-lg",
                          isExpanded ? "justify-start" : "justify-center",
                          activeAction === action.id && "ring-2 ring-blue-500 ring-offset-2"
                        )}
                      >
                        <div className={cn(
                          "flex items-center",
                          isExpanded ? "space-x-3" : "justify-center"
                        )}>
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg text-white",
                            action.color,
                            "transition-all duration-200"
                          )}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                variants={itemVariants}
                                initial="collapsed"
                                animate="expanded"
                                exit="collapsed"
                                className="flex-1 text-left min-w-0"
                              >
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {action.label}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {action.description}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Badge */}
                        {action.badge && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center"
                          >
                            {action.badge}
                          </Badge>
                        )}
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  
                  {!isExpanded && (
                    <TooltipContent side="right" className="ml-2">
                      <div className="text-sm font-medium">{action.label}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                      {action.shortcut && (
                        <div className="text-xs text-gray-400 mt-1">
                          {action.shortcut}
                        </div>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              variants={itemVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="p-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Hover to expand • Auto-collapse in 10s
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
}