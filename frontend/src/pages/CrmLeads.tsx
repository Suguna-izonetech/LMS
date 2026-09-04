import React, { useState } from 'react';
import { Search, Plus, Edit2, Phone, Calendar, Mail, UserCheck } from 'lucide-react';
import { useMockDb } from '../context/MockDbContext';
import type { Lead } from '../context/MockDbContext';

export type LeadStatus = 'Inquiry' | 'Assigned' | 'Follow-up' | 'Enrolled' | 'Incomplete' | 'Closed';
export type LeadSource = 'Organic' | 'Google Ads' | 'Meta Ads' | 'Referral';
import {
  PageHeader,
  Breadcrumb,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  ConfirmationDialog,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  LoadingState,
  EmptyState,
  ErrorState,
  Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

export const CrmLeads: React.FC = () => {
  const { leads, courses, users, addLead, updateLead, logFollowUp, enrollLead } = useMockDb();

  const { success, error: showError } = useToast();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');

  // Modals Open
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected lead pointers
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // --- Lead Form State ---
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSource, setFormSource] = useState<LeadSource>('Organic');
  const [formStatus, setFormStatus] = useState<LeadStatus>('Inquiry');
  const [formAssignedStaff, setFormAssignedStaff] = useState('Unassigned');
  const [formError, setFormError] = useState('');

  // --- Follow-up Log State ---
  const [followText, setFollowText] = useState('');
  const [followType, setFollowType] = useState<'Call' | 'Email' | 'WhatsApp'>('Call');
  const [followOutcome, setFollowOutcome] = useState('Connected, warm interest.');

  // --- Assign Lead State ---
  const [newStaff, setNewStaff] = useState('');

  // Filter List
  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.mobile.includes(searchQuery) ||
                          l.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'Incomplete') {
      // Incomplete leads: missing email, missing mobile, or status in incomplete criteria
      matchesStatus = !l.email || !l.mobile || l.mobile.length < 8;
    } else if (statusFilter !== 'All') {
      matchesStatus = l.status === statusFilter;
    }

    const matchesSource = sourceFilter === 'All' || l.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  // Open Form for Create
  const handleOpenAdd = () => {
    setSelectedLead(null);
    setFormName('');
    setFormMobile('');
    setFormEmail('');
    setFormSource('Organic');
    setFormStatus('Inquiry');
    setFormAssignedStaff('Unassigned');
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (l: Lead) => {
    setSelectedLead(l);
    setFormName(l.name);
    setFormMobile(l.mobile);
    setFormEmail(l.email);
    setFormSource(l.source as LeadSource);
    setFormStatus(l.status);
    setFormAssignedStaff(l.assignedStaffId);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) { showError('Lead Name is required.'); return; }
    if (!formMobile.trim() || formMobile.length < 8) { showError('Enter a valid mobile contact number.'); return; }

    const payload = {
      name: formName,
      mobile: formMobile,
      email: formEmail || `${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
      source: formSource,
      status: formStatus,
      assignedStaffId: formAssignedStaff
    };

    if (selectedLead) {
      updateLead(selectedLead.id, payload);
    } else {
      addLead(payload);
    }

    setIsFormOpen(false);
    success(`Lead ${selectedLead ? 'updated' : 'added'} successfully`);
  };

  // Open Assign Modal
  const handleOpenAssign = (l: Lead) => {
    setSelectedLead(l);
    setNewStaff(l.assignedStaffId !== 'Unassigned' ? l.assignedStaffId : '');
    setIsAssignOpen(true);
  };

  const handleAssignSave = () => {
    if (selectedLead && newStaff) {
      // Save lead updates
      updateLead(selectedLead.id, {
        assignedStaffId: newStaff,
        status: selectedLead.status === 'Inquiry' ? 'Assigned' : selectedLead.status
      });

      // Append follow up log
      logFollowUp(selectedLead.id, `Lead assigned to staff advisor: ${newStaff}`, 'Admin User');

      setIsAssignOpen(false);
      setSelectedLead(null);
      success('Lead assigned successfully');
    }
  };

  // Save Follow-up log
  const handleAddFollowLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followText.trim() || !selectedLead) return;

    logFollowUp(selectedLead.id, `${followType}: ${followText} (Outcome: ${followOutcome})`, 'Admin User');

    // Update status to follow up if in previous states
    if (selectedLead.status === 'Inquiry' || selectedLead.status === 'Assigned') {
      updateLead(selectedLead.id, {
        status: 'Follow-up'
      });
    }

    setFollowText('');
    setFollowOutcome('Connected, warm interest.');
    
    // Refresh active details pointer
    const updated = leads.find(l => l.id === selectedLead.id)!;
    setSelectedLead(updated);
    success('Follow up logged successfully');
  };

  // Convert Lead to Enrollment
  const handleConvertToEnrollment = (courseId: string) => {
    if (selectedLead && courseId) {
      const targetCourse = courses.find(c => c.id === courseId)!;
      const enrollName = selectedLead.name;
      
      const res = window.confirm(`Enroll ${enrollName} into "${targetCourse.title}"? This registers user accounts and triggers automated workflow actions.`);
      if (res) {
        enrollLead(selectedLead.id);
        setIsDetailsOpen(false);
        setSelectedLead(null);
        success('Lead enrolled into course');
      }
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedLead) {
      updateLead(selectedLead.id, { status: 'Closed' });
      setIsDeleteOpen(false);
      setSelectedLead(null);
      success('Lead closed successfully');
    }
  };

  // Staff list (seeded role === 'Teacher' or 'Admin')
  const staffMembers = users.filter(u => u.role === 'Teacher' || u.role === 'Admin');

  function renderDevToolbar() {
    return (
      <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dev State:</span>
        <button onClick={() => setUiState('normal')} className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${uiState === 'normal' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40' : 'bg-transparent text-slate-400 border-transparent hover:border-slate-800'}`}>Normal</button>
        <button onClick={() => setUiState('loading')} className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${uiState === 'loading' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40' : 'bg-transparent text-slate-400 border-transparent hover:border-slate-800'}`}>Loading</button>
        <button onClick={() => setUiState('empty')} className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${uiState === 'empty' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40' : 'bg-transparent text-slate-400 border-transparent hover:border-slate-800'}`}>Empty</button>
        <button onClick={() => setUiState('error')} className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${uiState === 'error' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40' : 'bg-transparent text-slate-400 border-transparent hover:border-slate-800'}`}>Error</button>
      </div>
    );
  }

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
  } = usePagination({ data: filteredLeads, itemsPerPage: 10 });

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="CRM Leads Workspace" description="Manage lead acquisitions." breadcrumbs={<Breadcrumb items={[{ label: 'CRM' }, { label: 'Leads' }]} />} />
        <div className="flex justify-end">{renderDevToolbar()}</div>
        <LoadingState message="Connecting lead tracking triggers..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="CRM Leads Workspace" description="Manage lead acquisitions." breadcrumbs={<Breadcrumb items={[{ label: 'CRM' }, { label: 'Leads' }]} />} />
        <div className="flex justify-end">{renderDevToolbar()}</div>
        <ErrorState
          title="Lead Index Latency Timeout"
          message="Could not synchronize meta details with lead lists. Try reconnecting."
          onRetry={() => setUiState('normal')}
          retryLabel="Retry"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Lead Management CRM Console"
          description="Track incoming customer inquiries, log follow-up calls, assign advisor staff, and enroll converted users."
          breadcrumbs={<Breadcrumb items={[{ label: 'CRM' }, { label: 'Leads' }]} />}
          actions={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenAdd}
            >
              Add Inquiry Lead
            </Button>
          }
        />
        <div className="flex shrink-0">{renderDevToolbar()}</div>
      </div>

      {/* CRM Workflow Stages Indicator */}
      <div className="grid grid-cols-5 border border-slate-850 rounded-xl overflow-hidden bg-slate-950/60 divide-x divide-slate-900 text-center py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <div className="space-y-1">
          <span className="text-indigo-400">Inquiry</span>
          <span className="text-xs text-slate-350 block">{leads.filter(l => l.status === 'Inquiry').length}</span>
        </div>
        <div className="space-y-1">
          <span className="text-indigo-400">Assigned</span>
          <span className="text-xs text-slate-350 block">{leads.filter(l => l.status === 'Assigned').length}</span>
        </div>
        <div className="space-y-1">
          <span className="text-indigo-400">Follow-up</span>
          <span className="text-xs text-slate-350 block">{leads.filter(l => l.status === 'Follow-up').length}</span>
        </div>
        <div className="space-y-1">
          <span className="text-indigo-400">Enrollment</span>
          <span className="text-xs text-emerald-400 block">{leads.filter(l => l.status === 'Enrolled').length}</span>
        </div>
        <div className="space-y-1 text-red-400/80">
          <span>Incomplete</span>
          <span className="text-xs text-slate-350 block">
            {leads.filter(l => !l.email || !l.mobile || l.mobile.length < 8).length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Leads</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by name, email, or mobile..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:min-w-[320px]">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stage Status</label>
              <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Leads</option>
                <option value="Inquiry">Inquiry</option>
                <option value="Assigned">Assigned Staff</option>
                <option value="Follow-up">Follow-up Log</option>
                <option value="Enrolled">Enrolled (Won)</option>
                <option value="Incomplete">Incomplete Leads</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acquisition Source</label>
              <Select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                <option value="All">All Sources</option>
                <option value="Organic">Organic Search</option>
                <option value="Google Ads">Google AdWords</option>
                <option value="Meta Ads">Meta Facebook Ads</option>
                <option value="Referral">Roster Referral</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads listing table */}
      {filteredLeads.length === 0 || uiState === 'empty' ? (
        <EmptyState
          title="No Leads Found"
          description="Your current filter parameters do not match any lead registrations."
          actionLabel="Reset CRM filters"
          onActionClick={() => { setSearchQuery(''); setStatusFilter('All'); setSourceFilter('All'); }}
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Lead details</TableHeaderCell>
                <TableHeaderCell>Mobile Contact</TableHeaderCell>
                <TableHeaderCell>Assigned Staff</TableHeaderCell>
                <TableHeaderCell>Source</TableHeaderCell>
                <TableHeaderCell>Inquiry Date</TableHeaderCell>
                <TableHeaderCell>Last Activity</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map(l => {
                const lastLog = l.followUps[l.followUps.length - 1];
                const isInc = !l.email || !l.mobile || l.mobile.length < 8;
                return (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">{l.name}</span>
                        <span className="text-xs text-slate-550 font-mono">{l.email || 'Missing Email'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-slate-300 font-semibold">{l.mobile || 'Missing'}</TableCell>
                    <TableCell>
                      <Badge variant={l.assignedStaffId === 'Unassigned' ? 'neutral' : 'info'}>
                        {l.assignedStaffId}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs font-semibold">{l.source}</TableCell>
                    <TableCell className="text-slate-450 text-xs font-medium">
                      {new Date(l.inquiryDate).toLocaleDateString([], { dateStyle: 'medium' })}
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {lastLog ? (
                        <div className="flex flex-col leading-tight max-w-[140px] truncate">
                          <span className="font-semibold text-slate-350">{lastLog.note}</span>
                          <span className="text-[9px] text-slate-500 font-bold">By {lastLog.staffName} on {new Date(lastLog.loggedAt).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-bold">No follow ups logged</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.status === 'Enrolled' ? 'success' : l.status === 'Follow-up' ? 'warning' : l.status === 'Assigned' ? 'info' : 'neutral'}>
                        {l.status}
                      </Badge>
                      {isInc && (
                        <Badge variant="danger" className="ml-1">Incomplete</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedLead(l);
                            setIsDetailsOpen(true);
                          }}
                        >
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAssign(l)}
                        >
                          Assign
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEdit(l)}
                          title="Edit Details"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
      )}

      {/* Modal 1: Lead Add/Edit Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedLead ? 'Edit Lead Specifications' : 'Register Incoming Lead Inquiry'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && <div className="text-xs font-semibold text-red-500 bg-red-950/20 border border-red-900/60 p-2.5 rounded-lg">{formError}</div>}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Lead Prospect Name <span className="text-red-500">*</span></label>
            <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Marie Curie" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Mobile Contact Number <span className="text-red-500">*</span></label>
              <Input value={formMobile} onChange={e => setFormMobile(e.target.value)} placeholder="e.g. +1 (555) 012-3498" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address (Optional)</label>
              <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="e.g. marie@curie.org" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-350">Source</label>
              <Select value={formSource} onChange={e => setFormSource(e.target.value as any)}>
                <option value="Organic">Organic Search</option>
                <option value="Google Ads">Google AdWords</option>
                <option value="Meta Ads">Meta Facebook Ads</option>
                <option value="Referral">Campus Referral</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-355">Assigned Staff</label>
              <Select value={formAssignedStaff} onChange={e => setFormAssignedStaff(e.target.value)}>
                <option value="Unassigned">Unassigned</option>
                {staffMembers.map(s => <option key={s.id} value={s.name}>{s.name} ({s.role})</option>)}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-350">Status Stage</label>
              <Select value={formStatus} onChange={e => setFormStatus(e.target.value as any)}>
                <option value="Inquiry">Inquiry Stage</option>
                <option value="Assigned">Assigned Staff</option>
                <option value="Follow-up">Follow-up Action</option>
                <option value="Enrolled">Enrollment Won</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Lead Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Assign Staff Advisor */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title={`Assign Lead Representative: ${selectedLead?.name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Map an advisor staff representative to take ownership of this inquirer contact profile.</p>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Choose Advisor Staff</label>
            <Select value={newStaff} onChange={e => setNewStaff(e.target.value)}>
              <option value="">-- Choose Representative --</option>
              {staffMembers.map(s => <option key={s.id} value={s.name}>{s.name} ({s.role})</option>)}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssignSave} disabled={!newStaff}>
              Assign & Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Lead Details & Interaction History */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedLead(null); }}
        title="Lead Profile & Activity Details"
      >
        {selectedLead && (
          <div className="space-y-5">
            {/* Split cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-900 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Prospect Information</span>
                <h4 className="text-sm font-bold text-slate-200">{selectedLead.name}</h4>
                <div className="text-xs text-slate-400 space-y-1 pt-1 leading-relaxed">
                  <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-500" /> {selectedLead.email}</p>
                  <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-500" /> {selectedLead.mobile}</p>
                  <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-500" /> Inquired: {new Date(selectedLead.inquiryDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">CRM Status Scope</span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Representative:</span>
                    <strong className="text-slate-350">{selectedLead.assignedStaffId}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Source:</span>
                    <strong className="text-slate-350">{selectedLead.source}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Stage Stage:</span>
                    <Badge variant={selectedLead.status === 'Enrolled' ? 'success' : selectedLead.status === 'Follow-up' ? 'warning' : 'info'}>
                      {selectedLead.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick action: Conversion to Course Enrollment */}
            {selectedLead.status !== 'Enrolled' && (
              <div className="p-3 bg-indigo-950/15 border border-indigo-900/40 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4" /> Convert Lead to Course Enrollment
                  </span>
                  <Badge variant="info">SaaS pipeline</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-200 focus:outline-none"
                    onChange={e => handleConvertToEnrollment(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Select Purchased Course to Complete Enrollment --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title} (${c.price})</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Activity History Timeline */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Follow-up Log Timeline ({selectedLead.followUps.length})</span>
              
              <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                {selectedLead.followUps.length === 0 ? (
                  <div className="text-xs text-slate-550 italic py-2 text-center">No follow up interactions recorded.</div>
                ) : (
                  selectedLead.followUps.map((f, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span className="text-indigo-400">By {f.staffName}</span>
                        <span>{new Date(f.loggedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-semibold">{f.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Follow-up Form */}
            {selectedLead.status !== 'Enrolled' && (
              <form onSubmit={handleAddFollowLog} className="pt-2 border-t border-slate-900 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Add Follow-up Entry</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-0.5 col-span-2">
                    <Input
                      placeholder="e.g. Called to pitch React course outline..."
                      value={followText}
                      onChange={e => setFollowText(e.target.value)}
                      className="h-8.5 text-xs"
                    />
                  </div>
                  <Select value={followType} onChange={e => setFollowType(e.target.value as any)} className="h-8.5 text-xs">
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email Sync</option>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Next action details (e.g. warm, will enroll next week)"
                    value={followOutcome}
                    onChange={e => setFollowOutcome(e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                  <Button variant="secondary" className="h-8 text-xs" type="submit" disabled={!followText.trim()}>
                    Log Entry
                  </Button>
                </div>
              </form>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-900">
              <Button variant="outline" onClick={() => { setIsDetailsOpen(false); setSelectedLead(null); }}>
                Close Window
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        title="Confirm Lead Deletion"
        message={`Are you sure you want to delete lead prospect "${selectedLead?.name}"? All activity logs will be wiped.`}
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedLead(null);
        }}
        variant="danger"
      />
    </div>
  );
};

export default CrmLeads;
