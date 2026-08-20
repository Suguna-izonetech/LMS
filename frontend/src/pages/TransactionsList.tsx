import React, { useState, useEffect } from 'react';
import { Search, Filter, IndianRupee, FileText, Calendar, CreditCard, ChevronDown, CheckCircle2, Clock, XCircle, RefreshCcw } from 'lucide-react';
import api from '../api/client';
import {
  PageHeader,
  Breadcrumb,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  LoadingState,
  EmptyState,
  ErrorState,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Modal,
  Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface TransactionData {
  id: number;
  student_name: string;
  course_name: string | null;
  amount: number;
  currency: string;
  payment_gateway: string;
  payment_status: string;
  transaction_date: string;
  invoice_reference_id: string;
}

interface MonthlySummary {
  month: string;
  total_amount: number;
}

export const TransactionsList: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [summary, setSummary] = useState<MonthlySummary[]>([]);
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'error'>('loading');
  const { error: showError } = useToast();

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('All');
  const [gateway, setGateway] = useState('All');
  const [search, setSearch] = useState('');

  // Modal States
  const [selectedTx, setSelectedTx] = useState<TransactionData | null>(null);

  const fetchData = async () => {
      setUiState('loading');
      try {
          const params = new URLSearchParams();
          if (dateFrom) params.append('date_from', dateFrom);
          if (dateTo) params.append('date_to', dateTo);
          if (status !== 'All') params.append('status', status);
          if (gateway !== 'All') params.append('gateway', gateway);
          if (search) params.append('student_search', search);

          const [txRes, sumRes] = await Promise.all([
              api.get(`/institute-admin/transactions?${params.toString()}`),
              api.get('/institute-admin/transactions/monthly-summary')
          ]);
          setTransactions(txRes.data);
          setSummary(sumRes.data);
          setUiState('normal');
      } catch (err) {
          console.error(err);
          showError('Failed to load ledger');
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, [dateFrom, dateTo, status, gateway, search]);
  
  const currentMonthRevenue = summary.length > 0 ? summary[summary.length - 1].total_amount : 0;
  const previousMonthRevenue = summary.length > 1 ? summary[summary.length - 2].total_amount : 0;
  
  const calculateGrowth = () => {
      if (previousMonthRevenue === 0) return 0;
      return ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
  };

  if (uiState === 'loading' && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Transactions" description="Track financial activity." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Transactions' }]} />} />
        <LoadingState message="Loading financial ledger..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Transactions" description="Track financial activity." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Transactions' }]} />} />
        <ErrorState title="Failed to load ledger" message="Could not fetch data from the server." onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Financial Transactions"
          description="Monitor payments, refunds, and track monthly revenue."
          breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Transactions' }]} />}
          actions={
              <Button variant="outline" size="sm" onClick={fetchData} leftIcon={<RefreshCcw className="w-4 h-4" />}>
                  Refresh Ledger
              </Button>
          }
        />
      </div>
      
      {/* METRICS HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-300/70 uppercase">Current Month Revenue</p>
              <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-white">₹{currentMonthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400"><IndianRupee className="h-6 w-6" /></div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <p className="text-xs font-semibold text-slate-500 uppercase">Growth vs Previous Month</p>
            <div className="flex items-baseline gap-2 mt-1">
                <p className={`text-2xl font-bold ${calculateGrowth() >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {calculateGrowth() >= 0 ? '+' : ''}{calculateGrowth().toFixed(1)}%
                </p>
                <span className="text-xs text-slate-500">from ₹{previousMonthRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Transactions (MTD)</p>
            <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-slate-200">{transactions.length}</p>
                <span className="text-xs text-slate-500">records</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* FILTER TOOLBAR */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input placeholder="Search student name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-slate-950" />
                  </div>
                  <div className="flex gap-2">
                      <div className="relative min-w-[140px]">
                         <Select value={status} onChange={e => setStatus(e.target.value)} className="bg-slate-950">
                            <option value="All">All Statuses</option>
                            <option value="successful">Successful</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                         </Select>
                      </div>
                      <div className="relative min-w-[140px]">
                         <Select value={gateway} onChange={e => setGateway(e.target.value)} className="bg-slate-950">
                            <option value="All">All Gateways</option>
                            <option value="razorpay">Razorpay</option>
                            <option value="paypal">PayPal</option>
                            <option value="manual">Manual / Offline</option>
                         </Select>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* LEDGER TABLE */}
          {transactions.length === 0 ? (
              <EmptyState 
                  title="No Transactions Found" 
                  description="Your financial ledger is currently empty. This table will populate automatically once real payment integrations capture transactions."
                  icon={<CreditCard className="w-12 h-12 text-slate-700" />}
              />
          ) : (() => {
                const {
                  paginatedData,
                  currentPage,
                  totalPages,
                  startIndex,
                  endIndex,
                  totalItems,
                  goToPage,
                  nextPage,
                  prevPage
                } = usePagination({ data: transactions, itemsPerPage: 10 });

                return (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Transaction Details</TableHeaderCell>
                    <TableHeaderCell>Customer / Product</TableHeaderCell>
                    <TableHeaderCell>Amount</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-indigo-400 font-semibold">{t.invoice_reference_id}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(t.transaction_date).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{t.student_name}</span>
                          <span className="text-xs text-slate-500 truncate max-w-[200px]">{t.course_name || 'General Payment'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                          <div className="flex flex-col">
                              <span className="font-bold text-slate-200">{t.currency} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{t.payment_gateway}</span>
                          </div>
                      </TableCell>
                      <TableCell>
                          {t.payment_status === 'successful' ? (
                              <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
                                  <CheckCircle2 className="w-3 h-3" /> Successful
                              </Badge>
                          ) : t.payment_status === 'pending' ? (
                              <Badge variant="warning" className="bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit">
                                  <Clock className="w-3 h-3" /> Pending
                              </Badge>
                          ) : (
                              <Badge variant="danger" className="bg-rose-500/10 text-rose-400 border-rose-500/20 flex items-center gap-1 w-fit">
                                  <XCircle className="w-3 h-3" /> {t.payment_status}
                              </Badge>
                          )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" onClick={() => setSelectedTx(t)} leftIcon={<FileText className="w-3.5 h-3.5" />}>
                            Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={totalItems}
                  onPageChange={goToPage}
                  onNext={nextPage}
                  onPrev={prevPage}
              />
            </TableContainer>
                  );
                })()
            }
        </CardContent>
      </Card>

      {/* RECEIPT MODAL */}
      <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Receipt">
        {selectedTx && (
            <div className="space-y-6">
                <div className="flex justify-center pb-6 border-b border-slate-800">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-200">{selectedTx.currency} {selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                        <p className="text-xs text-slate-500 uppercase font-semibold mt-1">Payment {selectedTx.payment_status}</p>
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Date</span>
                        <span className="font-medium text-slate-200">{new Date(selectedTx.transaction_date).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Reference ID</span>
                        <span className="font-mono text-xs text-indigo-400">{selectedTx.invoice_reference_id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Customer</span>
                        <span className="font-medium text-slate-200">{selectedTx.student_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Product / Course</span>
                        <span className="font-medium text-slate-200 text-right max-w-[200px] truncate">{selectedTx.course_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Gateway Provider</span>
                        <span className="font-medium text-slate-200 uppercase">{selectedTx.payment_gateway}</span>
                    </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800">
                    <Button variant="primary" className="w-full" onClick={() => setSelectedTx(null)}>
                        Close Receipt
                    </Button>
                </div>
            </div>
        )}
      </Modal>

    </div>
  );
};

export default TransactionsList;
