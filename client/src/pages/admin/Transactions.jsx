import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Receipt, 
  Search, 
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye
} from 'lucide-react';

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['/api/transactions', { 
      page: currentPage, 
      limit: itemsPerPage,
      search: searchTerm,
      status: statusFilter,
      company: companyFilter,
      date: dateFilter
    }],
    refetchInterval: 30000
  });

  // Fetch companies for filtering
  const { data: companies = [] } = useQuery({
    queryKey: ['/api/companies/list']
  });

  // Fetch subscription plans for display
  const { data: subscriptionPlans = [] } = useQuery({
    queryKey: ['/api/subscription-plans']
  });

  const transactions = transactionsData?.transactions || [];
  const totalPages = Math.ceil((transactionsData?.total || 0) / itemsPerPage);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesCompany = companyFilter === 'all' || transaction.companyId === companyFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = transactionDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesCompany && matchesDate;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method) => {
    switch (method) {
      case 'credit_card':
        return <Badge variant="outline" className="text-blue-700 border-blue-200">Credit Card</Badge>;
      case 'bank_transfer':
        return <Badge variant="outline" className="text-green-700 border-green-200">Bank Transfer</Badge>;
      case 'paypal':
        return <Badge variant="outline" className="text-purple-700 border-purple-200">PayPal</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const getPlanName = (planId) => {
    const plan = subscriptionPlans.find(p => p.id === planId);
    return plan ? plan.name : 'Unknown Plan';
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || companyFilter !== 'all' || dateFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCompanyFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">
            View and manage all payment transactions across companies
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-300 dark:border-slate-600">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            {/* Company Filter */}
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="border-slate-300 dark:border-slate-600"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Transaction History
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            {transactionsData?.total || 0} total transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4">
                  <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/6 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/8 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/6 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No transactions found
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Transactions will appear here once companies start making payments.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700">
                      <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Date</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Company</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Plan</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Amount</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Payment Method</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Status</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Transaction ID</TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <TableCell className="text-slate-900 dark:text-white font-medium">
                          {formatDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {transaction.companyName || 'Unknown Company'}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {getPlanName(transaction.subscriptionPlanId)}
                        </TableCell>
                        <TableCell className="text-slate-900 dark:text-white font-semibold">
                          {formatPrice(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(transaction.paymentMethod)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                          {transaction.transactionId || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, transactionsData?.total || 0)} of {transactionsData?.total || 0} transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="border-slate-300 dark:border-slate-600"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600 dark:text-slate-300 px-3">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="border-slate-300 dark:border-slate-600"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}