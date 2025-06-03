import { useState } from "react";
import { TaskTableView } from "@/components/tasks/TaskTableView";
import { TaskKanbanView } from "@/components/tasks/TaskKanbanView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, Kanban, Plus } from "lucide-react";

export default function Tasks() {
  const [activeView, setActiveView] = useState("table");

  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Tasks Management
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Create, organize and track all your tasks
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Export Tasks
          </Button>
          <Button 
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-80 grid-cols-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <TabsTrigger 
            value="table" 
            className="flex items-center space-x-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Table className="h-4 w-4" />
            <span>Table View</span>
          </TabsTrigger>
          <TabsTrigger 
            value="kanban"
            className="flex items-center space-x-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Kanban className="h-4 w-4" />
            <span>Kanban Board</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-8">
          <TaskTableView />
        </TabsContent>

        <TabsContent value="kanban" className="mt-8">
          <TaskKanbanView />
        </TabsContent>
      </Tabs>
    </div>
  );
}