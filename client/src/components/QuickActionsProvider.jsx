import React, { createContext, useContext, useState } from 'react';
import { FloatingSidebar } from '@/components/ui/floating-sidebar';
import { QuickActionModals } from '@/components/modals/QuickActionModals';
import { useCreateTask } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { queryClient } from '@/lib/queryClient';

const QuickActionsContext = createContext();

export function useQuickActions() {
  const context = useContext(QuickActionsContext);
  if (!context) {
    throw new Error('useQuickActions must be used within a QuickActionsProvider');
  }
  return context;
}

export function QuickActionsProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const createTaskMutation = useCreateTask();
  const { toast } = useToast();

  // Define keyboard shortcuts
  const shortcuts = {
    'ctrl+n': () => handleAction('create-task'),
    'ctrl+k': () => handleAction('search'),
    'ctrl+shift+n': () => handleAction('notifications'),
    'ctrl+shift+c': () => handleAction('calendar'),
    'ctrl+shift+t': () => handleAction('team'),
    'ctrl+shift+f': () => handleAction('quick-filters'),
    'escape': () => setActiveModal(null),
  };

  useKeyboardShortcuts(shortcuts);

  const handleAction = (actionId) => {
    switch (actionId) {
      case 'create-task':
      case 'search':
      case 'notifications':
      case 'calendar':
      case 'team':
      case 'chat':
      case 'reports':
      case 'quick-filters':
      case 'time-tracker':
      case 'goals':
      case 'forms':
      case 'automation':
      case 'settings':
        setActiveModal(actionId);
        break;
      default:
        toast({
          title: "Feature Coming Soon",
          description: "This feature is under development.",
        });
    }
  };

  const handleModalSubmit = async (modalType, data) => {
    try {
      switch (modalType) {
        case 'create-task':
          await createTaskMutation.mutateAsync(data);
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
          toast({
            title: "Task Created",
            description: "Your task has been created successfully.",
          });
          break;
        case 'search':
          // Handle search action
          toast({
            title: "Search",
            description: "Search functionality activated.",
          });
          break;
        default:
          toast({
            title: "Action Completed",
            description: "Your action has been processed.",
          });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const contextValue = {
    activeModal,
    handleAction,
    handleModalSubmit,
    closeModal,
  };

  return (
    <QuickActionsContext.Provider value={contextValue}>
      {children}
      <FloatingSidebar onAction={handleAction} />
      <QuickActionModals
        activeModal={activeModal}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />
    </QuickActionsContext.Provider>
  );
}