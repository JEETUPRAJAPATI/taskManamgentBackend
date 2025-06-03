import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  DollarSign,
  Eye,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompanyForm } from '@/components/companies/CompanyForm';

export default function Companies() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Fetch companies
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['/api/companies'],
    refetchInterval: 30000
  });

  // Fetch subscription plans for filtering
  const { data: subscriptionPlans = [] } = useQuery({
    queryKey: ['/api/subscription-plans']
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId) => {
      return await apiRequest(`/api/companies/${companyId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete company",
        variant: "destructive"
      });
    }
  });

  // Toggle company status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ companyId, isActive }) => {
      return await apiRequest(`/api/companies/${companyId}/status`, {
        method: 'PATCH',
        body: { isActive }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company status updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update company status",
        variant: "destructive"
      });
    }
  });

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.adminEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && company.isActive) ||
                         (statusFilter === 'inactive' && !company.isActive);
    const matchesPlan = planFilter === 'all' || company.subscriptionPlanId === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setShowForm(true);
  };

  const handleDelete = (companyId) => {
    if (window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      deleteCompanyMutation.mutate(companyId);
    }
  };

  const handleToggleStatus = (company) => {
    toggleStatusMutation.mutate({
      companyId: company.id,
      isActive: !company.isActive
    });
  };

  const getStatusBadge = (company) => {
    if (!company.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    
    switch (company.subscriptionStatus) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Suspended</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPlanName = (planId) => {
    const plan = subscriptionPlans.find(p => p.id === planId);
    return plan ? plan.name : 'No Plan';
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Companies</h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">
            Manage all registered companies and their subscriptions
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedCompany(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Plan Filter */}
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {subscriptionPlans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || planFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPlanFilter('all');
                }}
                className="border-slate-300 dark:border-slate-600"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No companies found
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {searchTerm || statusFilter !== 'all' || planFilter !== 'all' 
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by adding your first company.'}
            </p>
            {!searchTerm && statusFilter === 'all' && planFilter === 'all' && (
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => {
            const plan = subscriptionPlans.find(p => p.id === company.subscriptionPlanId);
            
            return (
              <Card key={company.id} className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                        {company.name}
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-300 font-medium mt-1">
                        {company.adminEmail}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <DropdownMenuItem onClick={() => handleEdit(company)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(company)}>
                          <Eye className="h-4 w-4 mr-2" />
                          {company.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(company.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status and Plan */}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(company)}
                    <Badge variant="outline" className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600">
                      {getPlanName(company.subscriptionPlanId)}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {company.userCount || 0}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">Users</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {plan ? formatPrice(company.billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice) : '-'}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {company.billingCycle === 'yearly' ? '/year' : '/month'}
                      </div>
                    </div>
                  </div>

                  {/* Subscription dates */}
                  {company.subscriptionStartDate && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Started: {new Date(company.subscriptionStartDate).toLocaleDateString()}
                        </span>
                      </div>
                      {company.subscriptionEndDate && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Expires: {new Date(company.subscriptionEndDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Company Form Modal */}
      <CompanyForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedCompany(null);
        }}
        company={selectedCompany}
        subscriptionPlans={subscriptionPlans}
      />
    </div>
  );
}