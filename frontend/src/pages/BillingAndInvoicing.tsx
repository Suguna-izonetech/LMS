import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Settings, Building2, Hash, DollarSign, Receipt, CheckCircle, Percent, Clock
} from 'lucide-react';
import api from '../api/client';
import {
  PageHeader, Breadcrumb, Card, CardContent, Button, Badge, Input, Select, 
  LoadingState, ErrorState, TableContainer, Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell, Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface BillingConfig {
  gst_enabled: boolean;
  gst_number: string | null;
  legal_business_name: string | null;
  billing_address: string | null;
  tax_percentage: number;
  invoice_prefix: string;
  currency: string;
  next_invoice_number: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  student_name: string;
  course_name: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_reference: string | null;
  status: string;
  issue_date: string;
}

export const BillingAndInvoicing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'settings'>('invoices');
  
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [uiState, setUiState] = useState<'loading' | 'normal' | 'error'>('loading');
  const { success, error: showError } = useToast();
  
  // Settings Form State
  const [isSaving, setIsSaving] = useState(false);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [taxPercent, setTaxPercent] = useState('0');
  const [prefix, setPrefix] = useState('INV-');
  const [currency, setCurrency] = useState('USD');

  const fetchData = async () => {
      setUiState('loading');
      try {
          const [configRes, invoicesRes] = await Promise.all([
              api.get('/institute-admin/billing/config'),
              api.get('/institute-admin/billing/invoices')
          ]);
          
          const cfg = configRes.data;
          setConfig(cfg);
          
          setGstEnabled(cfg.gst_enabled);
          setGstNumber(cfg.gst_number || '');
          setBusinessName(cfg.legal_business_name || '');
          setAddress(cfg.billing_address || '');
          setTaxPercent(cfg.tax_percentage.toString());
          setPrefix(cfg.invoice_prefix || 'INV-');
          setCurrency(cfg.currency || 'USD');
          
          setInvoices(invoicesRes.data);
          setUiState('normal');
      } catch (err) {
          console.error(err);
          showError("Failed to load billing data");
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          await api.put('/institute-admin/billing/config', {
              gst_enabled: gstEnabled,
              gst_number: gstNumber,
              legal_business_name: businessName,
              billing_address: address,
              tax_percentage: parseFloat(taxPercent),
              invoice_prefix: prefix,
              currency
          });
          success("Billing configuration saved.");
          fetchData();
      } catch (err) {
          showError("Failed to save configuration.");
      } finally {
          setIsSaving(false);
      }
  };

  const getCurrencySymbol = (cur: string) => {
      if (cur === 'USD') return '$';
      if (cur === 'INR') return '₹';
      if (cur === 'EUR') return '€';
      if (cur === 'GBP') return '£';
      return '$';
  };

  if (uiState === 'loading') return (
      <div className="space-y-6">
          <PageHeader title="Billing & Invoicing" description="Manage GST and invoices." breadcrumbs={<Breadcrumb items={[{ label: 'Billing' }]} />} />
          <LoadingState message="Loading billing data..." />
      </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Invoicing"
        description="Configure tax rates, GST rules, and view automated student invoices."
        breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Billing' }]} />}
      />

      {/* TABS */}
      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800 w-max">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'invoices' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" /> Invoices Ledger
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'settings' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" /> Tax & Settings
        </button>
      </div>

      {activeTab === 'settings' && (
          <Card className="max-w-3xl">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                  <h3 className="text-lg font-bold text-slate-200">Billing Configuration</h3>
                  <p className="text-sm text-slate-400">These settings dictate how invoices are dynamically generated on student payment.</p>
              </div>
              <CardContent className="p-6">
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                      
                      {/* Legal Information */}
                      <div className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-indigo-400" /> Legal Entity
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-xs font-semibold text-slate-400">Legal Business Name</label>
                                  <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Learning Inc." required />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-xs font-semibold text-slate-400">Billing Currency</label>
                                  <Select value={currency} onChange={e => setCurrency(e.target.value)}>
                                      <option value="USD">USD ($)</option>
                                      <option value="INR">INR (₹)</option>
                                      <option value="EUR">EUR (€)</option>
                                      <option value="GBP">GBP (£)</option>
                                  </Select>
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                  <label className="text-xs font-semibold text-slate-400">Official Billing Address</label>
                                  <textarea 
                                      value={address} onChange={e => setAddress(e.target.value)} 
                                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" 
                                      rows={2} required 
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Tax Settings */}
                      <div className="space-y-4 pt-4 border-t border-slate-800">
                          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                              <Percent className="w-4 h-4 text-emerald-400" /> Taxation & GST
                          </h4>
                          
                          <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-md">
                              <div>
                                  <p className="text-sm font-bold text-slate-200">Enable Tax Processing</p>
                                  <p className="text-xs text-slate-400">Automatically calculate tax breakdown on generated invoices.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={gstEnabled} onChange={e => setGstEnabled(e.target.checked)} />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                              </label>
                          </div>
                          
                          {gstEnabled && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                      <label className="text-xs font-semibold text-slate-400">GST / Tax Identification Number</label>
                                      <Input value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="e.g., 27AADCB2230M1Z2" required />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-xs font-semibold text-slate-400">Tax Percentage (%)</label>
                                      <Input type="number" step="0.01" value={taxPercent} onChange={e => setTaxPercent(e.target.value)} placeholder="18" required />
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* Invoice Formatting */}
                      <div className="space-y-4 pt-4 border-t border-slate-800">
                          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                              <Hash className="w-4 h-4 text-blue-400" /> Invoice Formatting
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <label className="text-xs font-semibold text-slate-400">Invoice Prefix</label>
                                  <Input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="INV-" required />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-xs font-semibold text-slate-400">Next Invoice Number (Preview)</label>
                                  <div className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-500">
                                      {prefix}{config?.next_invoice_number.toString().padStart(6, '0') || '000001'}
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="flex justify-end pt-4 border-t border-slate-800">
                          <Button variant="primary" type="submit" disabled={isSaving}>
                              {isSaving ? 'Saving...' : 'Save Configuration'}
                          </Button>
                      </div>
                  </form>
              </CardContent>
          </Card>
      )}

      {activeTab === 'invoices' && (
          <Card>
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                  <div>
                      <h3 className="text-lg font-bold text-slate-200">Issued Invoices</h3>
                      <p className="text-sm text-slate-400">All invoices generated from successful transactions.</p>
                  </div>
              </div>
              <CardContent className="p-0">
                 {(() => {
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
                    } = usePagination({ data: invoices, itemsPerPage: 10 });

                    return (
                  <TableContainer>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHeaderCell>Invoice Details</TableHeaderCell>
                                  <TableHeaderCell>Customer & Course</TableHeaderCell>
                                  <TableHeaderCell>Breakdown</TableHeaderCell>
                                  <TableHeaderCell>Total</TableHeaderCell>
                                  <TableHeaderCell>Status</TableHeaderCell>
                                  <TableHeaderCell className="text-right">Action</TableHeaderCell>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {invoices.length === 0 ? (
                                  <TableRow>
                                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                          <p>No invoices generated yet.</p>
                                      </TableCell>
                                  </TableRow>
                              ) : (
                                  paginatedData.map(inv => (
                                      <TableRow key={inv.id}>
                                          <TableCell>
                                              <div className="flex flex-col">
                                                  <span className="font-bold text-slate-200">{inv.invoice_number}</span>
                                                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                      <Clock className="w-3 h-3" /> {new Date(inv.issue_date).toLocaleDateString()}
                                                  </span>
                                              </div>
                                          </TableCell>
                                          <TableCell>
                                              <div className="flex flex-col">
                                                  <span className="text-sm font-semibold text-slate-300">{inv.student_name}</span>
                                                  <span className="text-xs text-slate-500 truncate max-w-[150px]">{inv.course_name}</span>
                                              </div>
                                          </TableCell>
                                          <TableCell>
                                              <div className="flex flex-col text-[10px] text-slate-400 font-mono">
                                                  <span className="flex justify-between w-24">Sub: <span>{inv.subtotal.toFixed(2)}</span></span>
                                                  <span className="flex justify-between w-24 text-rose-400">Tax: <span>{inv.tax_amount.toFixed(2)}</span></span>
                                              </div>
                                          </TableCell>
                                          <TableCell>
                                              <span className="font-bold text-emerald-400">
                                                  {getCurrencySymbol(config?.currency || 'USD')} {inv.total_amount.toFixed(2)}
                                              </span>
                                          </TableCell>
                                          <TableCell>
                                              {inv.status === 'Paid' && <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>}
                                              {inv.status === 'Refunded' && <Badge variant="neutral" className="bg-slate-700 text-slate-300">Refunded</Badge>}
                                          </TableCell>
                                          <TableCell className="text-right">
                                              <Button variant="outline" size="sm" title="Download PDF">
                                                  <Download className="w-3.5 h-3.5" />
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))
                              )}
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
                  })()}
              </CardContent>
          </Card>
      )}

    </div>
  );
};

export default BillingAndInvoicing;
