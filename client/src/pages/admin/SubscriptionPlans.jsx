import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Folder,
  HardDrive,
  Check,
  X,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SubscriptionPlanForm } from '@/components/plans/SubscriptionPlanForm';

export default function SubscriptionPlans() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Fetch subscription plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['/api/subscription-plans'],
    refetchInterval: 30000
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId) => {
      return await apiRequest(`/api/subscription-plans/${planId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription plan deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription plan",
        variant: "destructive"
      });
    }
  });

  // Toggle plan status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ planId, isActive }) => {
      return await apiRequest(`/api/subscription-plans/${planId}/status`, {
        method: 'PATCH',
        body: { isActive }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Plan status updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update plan status",
        variant: "destructive"
      });
    }
  });

  // Filter plans
  const filteredPlans = plans.filter(plan => 
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setShowForm(true);
  };

  const handleDelete = (planId) => {
    deletePlanMutation.mutate(planId);
  };

  const handleToggleStatus = (plan) => {
    toggleStatusMutation.mutate({
      planId: plan.id,
      isActive: !plan.isActive
    });
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatStorage = (mb) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Subscription Plans</h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">
            Create and manage subscription plans for your SaaS platform
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedPlan(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search plans by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
              />
            </div>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                className="border-slate-300 dark:border-slate-600"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-8 bg-slate-200 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded"></div>
                    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No subscription plans found
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {searchTerm 
                ? 'Try adjusting your search to see more results.'
                : 'Get started by creating your first subscription plan.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-200 ${
                !plan.isActive ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        {plan.name}
                      </CardTitle>
                      <Badge variant={plan.isActive ? "default" : "secondary"} className={
                        plan.isActive 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {plan.description && (
                      <CardDescription className="text-slate-600 dark:text-slate-300 font-medium">
                        {plan.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <DropdownMenuItem onClick={() => handleEdit(plan)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(plan)}>
                        {plan.isActive ? <X className="h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        {plan.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-slate-900 dark:text-white">
                              Delete Subscription Plan
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600 dark:text-slate-300">
                              Are you sure you want to delete the "{plan.name}" plan? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-slate-300 dark:border-slate-600">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(plan.id)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center py-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {formatPrice(plan.monthlyPrice)}
                    <span className="text-sm font-normal text-slate-600 dark:text-slate-300">/month</span>
                  </div>
                  <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {formatPrice(plan.yearlyPrice)}
                    <span className="text-sm font-normal text-slate-600 dark:text-slate-300">/year</span>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Save {Math.round((1 - (plan.yearlyPrice / 12) / plan.monthlyPrice) * 100)}% annually
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Users</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Projects</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {plan.maxProjects === -1 ? 'Unlimited' : plan.maxProjects}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Storage</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatStorage(plan.maxStorage)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                {plan.features && plan.features.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Features</h4>
                    <div className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 3 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 pl-5">
                          +{plan.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Companies Count */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {plan.companiesCount || 0} companies subscribed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Subscription Plan Form Modal */}
      <SubscriptionPlanForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
      />
    </div>
  );
}