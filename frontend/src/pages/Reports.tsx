import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Clock, BarChart3, Database, CheckCircle, RefreshCw, AlertCircle
} from 'lucide-react';
import api from '../api/client';
import {
  PageHeader, Breadcrumb, Card, CardContent, Button, Badge, Select, 
  LoadingState, TableContainer, Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell, Input, Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface ReportHistory {
  id: number;
  report_type: string;
  status: string;
  file_url: string | null;
  generated_at: string;
}

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [uiState, setUiState] = useState<'loading' | 'normal' | 'error'>('loading');
  const { success, error: showError } = useToast();

  // Generator State
  const [reportType, setReportType] = useState('Transaction Report');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchHistory = async () => {
      try {
          const res = await api.get('/institute-admin/reports/history');
          setHistory(res.data);
          setUiState('normal');
      } catch (err) {
          console.error(err);
          showError("Failed to load reports history");
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchHistory();
      
      // Auto-refresh history every 10 seconds if on history tab
      const interval = setInterval(() => {
          if (activeTab === 'history') {
              fetchHistory();
          }
      }, 10000);
      return () => clearInterval(interval);
  }, [activeTab]);

  const handleGenerate = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsGenerating(true);
      try {
          await api.post('/institute-admin/reports/generate', {
              report_type: reportType,
              start_date: startDate || null,
              end_date: endDate || null
          });
          success("Report generation started. Check History tab shortly.");
          setActiveTab('history');
      } catch (err) {
          showError("Failed to generate report.");
      } finally {
          setIsGenerating(false);
      }
  };

  if (uiState === 'loading') return (
      <div className="space-y-6">
          <PageHeader title="Reports" description="Generate system reports." breadcrumbs={[]} />
          <LoadingState message="Loading reports data..." />
      </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics Engine"
        description="Extract complex datasets and download historical CSV logs generated via background processes."
        breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Reports' }]} />}
      />

      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800 w-max">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'generate' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Generate Report
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'history' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" /> Download History
        </button>
      </div>

      {activeTab === 'generate' && (
          <Card className="max-w-2xl">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                      <Database className="w-5 h-5 text-indigo-400" /> New Data Extraction
                  </h3>
              </div>
              <CardContent className="p-6">
                  <form onSubmit={handleGenerate} className="space-y-6">
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Select Report Type</label>
                          <Select value={reportType} onChange={e => setReportType(e.target.value)}>
                              <option value="User Report">User Directory Report</option>
                              <option value="Course Report">Course Catalog Report</option>
                              <option value="Enrollment Report">Enrollments Report</option>
                              <option value="Transaction Report">Transaction Ledger Report</option>
                              <option value="Lead Report">CRM Leads Report</option>
                              <option value="Learning Activity Report">Learning Activity Report</option>
                              <option value="Certificate Report">Certificates Issued Report</option>
                          </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">Start Date (Optional)</label>
                              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">End Date (Optional)</label>
                              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                          </div>
                      </div>
                      
                      <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md flex gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                          <p className="text-xs text-amber-400">
                              Large extractions are queued automatically. The file link will appear in your Download History once processing is complete.
                          </p>
                      </div>

                      <div className="flex justify-end pt-2">
                          <Button variant="primary" type="submit" disabled={isGenerating}>
                              {isGenerating ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Queuing Job...</> : 'Generate Report'}
                          </Button>
                      </div>
                  </form>
              </CardContent>
          </Card>
      )}

      {activeTab === 'history' && (
          <Card>
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
                      } = usePagination({ data: history, itemsPerPage: 10 });

                      return (
                  <TableContainer>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHeaderCell>Generated At (UTC)</TableHeaderCell>
                                  <TableHeaderCell>Report Type</TableHeaderCell>
                                  <TableHeaderCell>Status</TableHeaderCell>
                                  <TableHeaderCell className="text-right">File Link</TableHeaderCell>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {history.length === 0 ? (
                                  <TableRow>
                                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                          <p>No reports generated yet.</p>
                                      </TableCell>
                                  </TableRow>
                              ) : (
                                  paginatedData.map(rh => (
                                      <TableRow key={rh.id}>
                                          <TableCell>
                                              <span className="text-sm text-slate-300">
                                                  {new Date(rh.generated_at).toLocaleString()}
                                              </span>
                                          </TableCell>
                                          <TableCell>
                                              <span className="font-bold text-slate-200">{rh.report_type}</span>
                                          </TableCell>
                                          <TableCell>
                                              {rh.status === 'Completed' && <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>}
                                              {rh.status === 'Processing' && <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>}
                                              {rh.status === 'Failed' && <Badge variant="danger" className="bg-rose-500/10 text-rose-400 border-rose-500/20">Failed</Badge>}
                                          </TableCell>
                                          <TableCell className="text-right">
                                              {rh.status === 'Completed' && rh.file_url ? (
                                                  <a href={`http://localhost:8000${rh.file_url}`} target="_blank" rel="noreferrer">
                                                      <Button variant="outline" size="sm" className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10">
                                                          <Download className="w-4 h-4 mr-2" /> Download CSV
                                                      </Button>
                                                  </a>
                                              ) : (
                                                  <span className="text-xs text-slate-500">Not Available</span>
                                              )}
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

export default Reports;
