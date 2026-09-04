import React, { useState, useEffect } from 'react';
import { 
  GitBranch, Play, StopCircle, Plus, Trash2, CheckCircle, XCircle, Settings, FileJson, Clock, List
} from 'lucide-react';
import api from '../api/client';
import {
  LoadingState, TableContainer, Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell, Modal, Pagination,
  PageHeader, Breadcrumb, Button, Card, CardContent, Badge, Input, Select
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface WorkflowAction {
  id?: number;
  action_type: string;
  action_payload: string;
  order_index: number;
}

interface Workflow {
  id: number;
  name: string;
  trigger_event: string;
  is_active: boolean;
  conditions: string;
  actions: WorkflowAction[];
  created_at: string;
}

interface WorkflowLog {
  id: number;
  workflow_id: number;
  trigger_payload: string;
  status: string;
  error_message: string | null;
  execution_date: string;
}

export const WorkflowsList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'logs'>('workflows');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [uiState, setUiState] = useState<'loading' | 'normal' | 'error'>('loading');
  const { success, error: showError } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [wfName, setWfName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('Payment Successful');
  const [conditions, setConditions] = useState('[{"field": "amount", "operator": ">", "value": 0}]');
  const [actions, setActions] = useState<{type: string, payload: string}[]>([
      { type: 'Create Enrollment', payload: '{"status": "active"}' }
  ]);

  const fetchData = async () => {
      setUiState('loading');
      try {
          const [wfRes, logsRes] = await Promise.all([
              api.get('/institute-admin/workflows'),
              api.get('/institute-admin/workflows/logs')
          ]);
          setWorkflows(wfRes.data);
          setLogs(logsRes.data);
          setUiState('normal');
      } catch (err) {
          console.error(err);
          showError("Failed to load workflows");
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleDelete = async (id: number) => {
      if (!confirm('Are you sure you want to delete this workflow?')) return;
      try {
          await api.delete(`/institute-admin/workflows/${id}`);
          success("Workflow deleted successfully");
          fetchData();
      } catch (e) {
          showError("Failed to delete workflow");
      }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
      try {
          await api.put(`/institute-admin/workflows/${id}`, { is_active: !currentStatus });
          success("Workflow status updated");
          fetchData();
      } catch (e) {
          showError("Failed to update status");
      }
  };

  const handleAddAction = () => {
      setActions([...actions, { type: 'Send Email', payload: '{"template": "welcome"}' }]);
  };

  const handleActionChange = (index: number, key: 'type' | 'payload', val: string) => {
      const newActs = [...actions];
      newActs[index][key] = val;
      setActions(newActs);
  };

  const handleRemoveAction = (index: number) => {
      setActions(actions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          await api.post('/institute-admin/workflows', {
              name: wfName,
              trigger_event: triggerEvent,
              is_active: true,
              conditions,
              actions: actions.map((a, i) => ({
                  action_type: a.type,
                  action_payload: a.payload,
                  order_index: i + 1
              }))
          });
          setIsModalOpen(false);
          // reset
          setWfName('');
          setActions([{ type: 'Create Enrollment', payload: '{"status": "active"}' }]);
          success("Workflow saved successfully");
          fetchData();
      } catch (err) {
          showError("Failed to save workflow");
      } finally {
          setIsSubmitting(false);
      }
  };

  const {
      paginatedData: paginatedWorkflows,
      currentPage: workflowsPage,
      totalPages: workflowsTotalPages,
      startIndex: workflowsStartIndex,
      endIndex: workflowsEndIndex,
      totalItems: workflowsTotalItems,
      goToPage: goToWorkflowsPage,
      nextPage: nextWorkflowsPage,
      prevPage: prevWorkflowsPage
  } = usePagination({ data: workflows, itemsPerPage: 10 });

  const {
      paginatedData: paginatedLogs,
      currentPage: logsPage,
      totalPages: logsTotalPages,
      startIndex: logsStartIndex,
      endIndex: logsEndIndex,
      totalItems: logsTotalItems,
      goToPage: goToLogsPage,
      nextPage: nextLogsPage,
      prevPage: prevLogsPage
  } = usePagination({ data: logs, itemsPerPage: 10 });

  if (uiState === 'loading') return (
      <div className="space-y-6">
          <PageHeader title="Workflows" description="Manage automations." breadcrumbs={[]} />
          <LoadingState message="Loading workflows..." />
      </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow Automations"
        description="Design conditional rule engines to automate enrollments, emails, and CRM progression."
        breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Workflows' }]} />}
        actions={
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create Workflow
            </Button>
        }
      />

      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800 w-max">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'workflows' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" /> Active Workflows
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'logs' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <List className="w-4 h-4" /> Execution Logs
        </button>
      </div>

      {activeTab === 'workflows' && (
          <Card>
              <CardContent className="p-0">
                  <TableContainer>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHeaderCell>Workflow Name</TableHeaderCell>
                                  <TableHeaderCell>Trigger Event</TableHeaderCell>
                                  <TableHeaderCell>Actions Pipeline</TableHeaderCell>
                                  <TableHeaderCell>Status</TableHeaderCell>
                                  <TableHeaderCell className="text-right">Manage</TableHeaderCell>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {workflows.length === 0 ? (
                                  <TableRow>
                                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                          <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                          <p>No workflows configured.</p>
                                      </TableCell>
                                  </TableRow>
                              ) : (
                                  paginatedWorkflows.map(wf => (
                                      <TableRow key={wf.id}>
                                          <TableCell>
                                              <span className="font-bold text-slate-200">{wf.name}</span>
                                          </TableCell>
                                          <TableCell>
                                              <Badge variant="info" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-mono text-xs">
                                                  {wf.trigger_event}
                                              </Badge>
                                          </TableCell>
                                          <TableCell>
                                              <div className="flex flex-wrap gap-1">
                                                  {wf.actions.map((act, idx) => (
                                                      <span key={idx} className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                                          {act.action_type}
                                                      </span>
                                                  ))}
                                              </div>
                                          </TableCell>
                                          <TableCell>
                                              <button 
                                                  onClick={() => handleToggleStatus(wf.id, wf.is_active)}
                                                  className={`px-2 py-0.5 rounded text-xs font-semibold ${wf.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                                              >
                                                  {wf.is_active ? 'Active' : 'Disabled'}
                                              </button>
                                          </TableCell>
                                          <TableCell className="text-right">
                                              <Button variant="danger" size="sm" onClick={() => handleDelete(wf.id)}>
                                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))
                              )}
                          </TableBody>
                      </Table>
                      <Pagination
                          currentPage={workflowsPage}
                          totalPages={workflowsTotalPages}
                          startIndex={workflowsStartIndex}
                          endIndex={workflowsEndIndex}
                          totalItems={workflowsTotalItems}
                          onPageChange={goToWorkflowsPage}
                          onNext={nextWorkflowsPage}
                          onPrev={prevWorkflowsPage}
                      />
                  </TableContainer>
              </CardContent>
          </Card>
      )}

      {activeTab === 'logs' && (
          <Card>
              <CardContent className="p-0">
                  <TableContainer>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHeaderCell>Date</TableHeaderCell>
                                  <TableHeaderCell>Workflow ID</TableHeaderCell>
                                  <TableHeaderCell>Trigger Payload</TableHeaderCell>
                                  <TableHeaderCell>Result Status</TableHeaderCell>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {logs.length === 0 ? (
                                  <TableRow>
                                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                          <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                          <p>No executions yet.</p>
                                      </TableCell>
                                  </TableRow>
                              ) : (
                                  paginatedLogs.map(log => (
                                      <TableRow key={log.id}>
                                          <TableCell>
                                              <span className="text-sm text-slate-300">
                                                  {new Date(log.execution_date).toLocaleString()}
                                              </span>
                                          </TableCell>
                                          <TableCell>
                                              <span className="font-mono text-xs text-slate-400">WF-{log.workflow_id}</span>
                                          </TableCell>
                                          <TableCell>
                                              <code className="text-[10px] text-emerald-300 bg-slate-900 px-2 py-1 rounded max-w-[200px] truncate block">
                                                  {log.trigger_payload}
                                              </code>
                                          </TableCell>
                                          <TableCell>
                                              {log.status === 'Success' ? (
                                                  <span className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                                                      <CheckCircle className="w-4 h-4" /> Success
                                                  </span>
                                              ) : (
                                                  <span className="flex flex-col text-rose-400 text-sm font-semibold">
                                                      <span className="flex items-center gap-1"><XCircle className="w-4 h-4" /> Failed</span>
                                                      <span className="text-xs text-rose-500 font-normal">{log.error_message}</span>
                                                  </span>
                                              )}
                                          </TableCell>
                                      </TableRow>
                                  ))
                              )}
                          </TableBody>
                      </Table>
                      <Pagination
                          currentPage={logsPage}
                          totalPages={logsTotalPages}
                          startIndex={logsStartIndex}
                          endIndex={logsEndIndex}
                          totalItems={logsTotalItems}
                          onPageChange={goToLogsPage}
                          onNext={nextLogsPage}
                          onPrev={prevLogsPage}
                      />
                  </TableContainer>
              </CardContent>
          </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Workflow" size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Workflow Name</label>
                      <Input value={wfName} onChange={e => setWfName(e.target.value)} placeholder="e.g. Enrollment on Payment" required />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Trigger Event</label>
                      <Select value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)}>
                          <option value="Lead Created">Lead Created</option>
                          <option value="Lead Follow-up Due">Lead Follow-up Due</option>
                          <option value="Student Enrolled">Student Enrolled</option>
                          <option value="Payment Successful">Payment Successful</option>
                          <option value="Course Access Required">Course Access Required</option>
                          <option value="Certificate Eligible">Certificate Eligible</option>
                      </Select>
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                      <FileJson className="w-4 h-4" /> Condition Rules (JSON Array)
                  </label>
                  <textarea 
                      value={conditions} 
                      onChange={e => setConditions(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-300 font-mono"
                      rows={3}
                  />
                  <p className="text-xs text-slate-500">Example: [{`{"field": "amount", "operator": ">", "value": 0}`}]</p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-800">
                  <label className="text-sm font-bold text-slate-300">Execution Actions Pipeline</label>
                  
                  {actions.map((act, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-slate-900 p-3 rounded-md border border-slate-800">
                          <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 text-xs font-bold">
                              {idx + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                              <Select value={act.type} onChange={e => handleActionChange(idx, 'type', e.target.value)}>
                                  <option value="Create Enrollment">Create Enrollment</option>
                                  <option value="Grant Course Access">Grant Course Access</option>
                                  <option value="Send Email">Send Email</option>
                                  <option value="Send Notification">Send Notification</option>
                                  <option value="Update Lead Status">Update Lead Status</option>
                              </Select>
                              <Input value={act.payload} onChange={e => handleActionChange(idx, 'payload', e.target.value)} placeholder="JSON Payload" />
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveAction(idx)}>
                              <Trash2 className="w-4 h-4 text-rose-400" />
                          </Button>
                      </div>
                  ))}

                  <Button type="button" variant="secondary" onClick={handleAddAction} className="w-full mt-2">
                      <Plus className="w-4 h-4 mr-2" /> Add Next Action
                  </Button>
              </div>

              <div className="flex justify-end pt-4">
                  <Button variant="primary" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Workflow'}
                  </Button>
              </div>
          </form>
      </Modal>

    </div>
  );
};

export default WorkflowsList;
