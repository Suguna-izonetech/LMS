import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, PhoneCall, CheckCircle, Search, Clock, PlusCircle, AlertCircle, TrendingUp, Calendar, ChevronRight, MessageSquare 
} from 'lucide-react';
import api from '../api/client';
import {
  PageHeader, Breadcrumb, Card, CardContent, Button, Badge, Input, Select, 
  LoadingState, EmptyState, ErrorState, TableContainer, Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell, Modal, Pagination
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface CRMDashboardStats {
  total_leads: number;
  new_leads: number;
  pending_followups: number;
  incomplete_leads: number;
  converted_leads: number;
}

interface CRMFollowup {
  id: number;
  notes: string;
  status: string;
  followup_date: string | null;
  created_at: string;
}

interface CRMLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  inquiry_date: string;
  assigned_staff_id: number | null;
  assigned_staff_name: string | null;
  followups: CRMFollowup[];
}

export const CRMList: React.FC = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const [stats, setStats] = useState<CRMDashboardStats | null>(null);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [users, setUsers] = useState<any[]>([]); // For assigning staff
  
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'error'>('loading');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Lead Modal
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Lead Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('New');
  const [source, setSource] = useState('Website');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Follow-up Form
  const [followupNotes, setFollowupNotes] = useState('');
  const [followupStatus, setFollowupStatus] = useState('Completed');
  const [followupDate, setFollowupDate] = useState('');

  const fetchData = async () => {
      setUiState('loading');
      try {
          const [statsRes, leadsRes, usersRes] = await Promise.all([
              api.get('/institute-admin/crm/dashboard-stats'),
              api.get(`/institute-admin/crm/leads?status=${statusFilter}&search=${search}`),
              api.get('/institute-admin/users') // For staff assignments
          ]);
          setStats(statsRes.data);
          setLeads(leadsRes.data);
          setUsers(usersRes.data);
          setUiState('normal');
      } catch (err) {
          console.error(err);
          showError("Failed to load CRM data");
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, [statusFilter, search]);

  const openLeadModal = (lead?: CRMLead) => {
      if (lead) {
          setSelectedLead(lead);
          setIsCreating(false);
          setName(lead.name);
          setEmail(lead.email);
          setPhone(lead.phone);
          setStatus(lead.status);
          setSource(lead.source);
          setAssignedStaff(lead.assigned_staff_id?.toString() || '');
      } else {
          setSelectedLead(null);
          setIsCreating(true);
          setName('');
          setEmail('');
          setPhone('');
          setStatus('New');
          setSource('Website');
          setAssignedStaff('');
      }
      setFollowupNotes('');
      setFollowupStatus('Completed');
      setFollowupDate('');
      setIsLeadModalOpen(true);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
        showError("Name and Phone are required.");
        return;
    }

    setIsSubmitting(true);
    const payload = {
        name, email, phone, status, source,
        assigned_staff_id: assignedStaff ? parseInt(assignedStaff) : null
    };

    try {
        if (isCreating) {
            await api.post('/institute-admin/crm/leads', payload);
        } else if (selectedLead) {
            await api.put(`/institute-admin/crm/leads/${selectedLead.id}`, payload);
        }
        setIsLeadModalOpen(false);
        success(`Lead ${isCreating ? 'created' : 'updated'} successfully`);
        fetchData();
    } catch (e: any) {
        showError("Failed to save lead.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleFollowupSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedLead || !followupNotes) return;
      
      setIsSubmitting(true);
      const payload = {
          notes: followupNotes,
          status: followupStatus,
          followup_date: followupDate || null
      };
      
      try {
          await api.post(`/institute-admin/crm/leads/${selectedLead.id}/followups`, payload);
          // Quick refresh of the single lead details
          const res = await api.get(`/institute-admin/crm/leads`);
          const updatedLead = res.data.find((l: any) => l.id === selectedLead.id);
          if (updatedLead) setSelectedLead(updatedLead);
          
          setFollowupNotes('');
          setFollowupDate('');
          success("Follow-up added successfully");
          fetchData(); // refresh background stats
      } catch (e) {
          showError("Failed to add follow-up");
      } finally {
          setIsSubmitting(false);
      }
  };

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
  } = usePagination({ data: leads, itemsPerPage: 10 });

  if (uiState === 'loading' && !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="CRM" description="Manage leads and inquiries." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'CRM' }]} />} />
        <LoadingState message="Loading CRM dashboard..." />
      </div>
    );
  }

  if (uiState === 'error' && !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="CRM" description="Manage leads and inquiries." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'CRM' }]} />} />
        <ErrorState title="Failed to load CRM" message="Could not fetch data from the server." onRetry={fetchData} />
      </div>
    );
  }

  const staffOptions = users.filter(u => u.role === 'Admin' || u.role === 'InstituteAdmin' || u.role === 'Teacher');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="CRM & Leads Pipeline"
          description="Track incoming student inquiries, assign counselors, and monitor conversion rates."
          breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'CRM' }]} />}
          actions={
            <Button variant="primary" size="sm" onClick={() => openLeadModal()} leftIcon={<UserPlus className="w-4 h-4" />}>
              Add New Lead
            </Button>
          }
        />
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Leads</p>
              <p className="text-2xl font-bold text-slate-200">{stats?.total_leads || 0}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400"><Users className="h-5 w-5" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Converted Students</p>
              <p className="text-2xl font-bold text-emerald-400">{stats?.converted_leads || 0}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400"><CheckCircle className="h-5 w-5" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Pending Follow-ups</p>
              <p className="text-2xl font-bold text-blue-400">{stats?.pending_followups || 0}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><PhoneCall className="h-5 w-5" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Incomplete Leads</p>
              <p className="text-2xl font-bold text-rose-400">{stats?.incomplete_leads || 0}</p>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-lg text-rose-400"><Clock className="h-5 w-5" /></div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Leads</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 w-full md:w-auto md:min-w-[160px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Incomplete">Incomplete</option>
              <option value="Converted">Converted</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* LEADS TABLE */}
      <Card>
        <CardContent className="p-0">
            {leads.length === 0 ? (
                <EmptyState title="No Leads Found" description="Try adjusting your search or filters." icon={<Users className="w-12 h-12 text-slate-700" />} />
            ) : (
                <TableContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Lead Info</TableHeaderCell>
                        <TableHeaderCell>Contact</TableHeaderCell>
                        <TableHeaderCell>Source & Staff</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell className="text-right">Action</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map(l => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-200">{l.name}</span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3 h-3" /> Inq: {new Date(l.inquiry_date).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><PhoneCall className="w-3 h-3" /> {l.phone}</span>
                              {l.email && <span>{l.email}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                                <Badge variant="neutral" className="w-max bg-slate-800 border-slate-700">{l.source}</Badge>
                                <span className="text-xs text-indigo-400 truncate max-w-[120px]">{l.assigned_staff_name || 'Unassigned'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                              {l.status === 'New' && <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">New</Badge>}
                              {l.status === 'Contacted' && <Badge variant="info" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Contacted</Badge>}
                              {l.status === 'Incomplete' && <Badge variant="danger" className="bg-rose-500/10 text-rose-400 border-rose-500/20">Incomplete</Badge>}
                              {l.status === 'Converted' && <Badge variant="success" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Converted</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => openLeadModal(l)}>
                              Manage <ChevronRight className="w-3.5 h-3.5 ml-1" />
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
            )}
        </CardContent>
      </Card>

      {/* LEAD MANAGEMENT MODAL */}
      <Modal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} title={isCreating ? "Add New Lead" : `Manage Lead: ${selectedLead?.name}`} size="xl">
        <div className="flex flex-col md:flex-row gap-6">
            
            {/* LEFT COL: LEAD DETAILS FORM */}
            <div className={`flex flex-col gap-4 ${isCreating ? 'w-full' : 'w-full md:w-1/2'}`}>
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">Lead Information</h4>
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Full Name <span className="text-red-500">*</span></label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Student name" required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Phone <span className="text-red-500">*</span></label>
                        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234..." required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Email</label>
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-xs font-semibold text-slate-400">Status</label>
                         <Select value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Incomplete">Incomplete</option>
                            <option value="Converted">Converted (Enrolled)</option>
                         </Select>
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-semibold text-slate-400">Source</label>
                         <Select value={source} onChange={e => setSource(e.target.value)}>
                            <option value="Website">Website</option>
                            <option value="Walk-in">Walk-in</option>
                            <option value="Referral">Referral</option>
                            <option value="Social Media">Social Media</option>
                            <option value="Campaign">Marketing Campaign</option>
                         </Select>
                      </div>
                  </div>
                  
                  <div className="space-y-1">
                     <label className="text-xs font-semibold text-slate-400">Assign Staff Member</label>
                     <Select value={assignedStaff} onChange={e => setAssignedStaff(e.target.value)}>
                        <option value="">-- Unassigned --</option>
                        {staffOptions.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                        ))}
                     </Select>
                  </div>
        
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Lead Details'}
                    </Button>
                  </div>
                </form>
            </div>
            
            {/* RIGHT COL: FOLLOW-UPS TIMELINE (ONLY IF EDITING) */}
            {!isCreating && selectedLead && (
                <div className="w-full md:w-1/2 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6 pt-4 md:pt-0">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">Follow-up Activity</h4>
                    
                    {/* Add follow up form */}
                    <form onSubmit={handleFollowupSubmit} className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 space-y-3">
                        <textarea 
                            value={followupNotes} 
                            onChange={e => setFollowupNotes(e.target.value)} 
                            rows={2} 
                            className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" 
                            placeholder="Log notes from a call, email, or meeting..." 
                            required
                        />
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Next Action (Optional)</label>
                                <Input type="date" value={followupDate} onChange={e => setFollowupDate(e.target.value)} className="h-8 text-xs" />
                            </div>
                            <div className="w-1/3 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">Status</label>
                                <Select value={followupStatus} onChange={e => setFollowupStatus(e.target.value)} className="h-8 text-xs py-1">
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                </Select>
                            </div>
                            <Button variant="secondary" type="submit" size="sm" className="h-8" disabled={isSubmitting || !followupNotes}>Add</Button>
                        </div>
                    </form>
                    
                    {/* Timeline */}
                    <div className="flex-1 overflow-y-auto max-h-[400px] space-y-4 pr-2">
                        {selectedLead.followups.length === 0 ? (
                            <div className="text-center p-4 text-slate-500">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-xs">No follow-up activity logged yet.</p>
                            </div>
                        ) : (
                            <div className="relative border-l-2 border-slate-800 ml-3 space-y-6">
                                {selectedLead.followups.map((f, idx) => (
                                    <div key={f.id} className="relative pl-6">
                                        <div className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-slate-950 ${f.status === 'Pending' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-sm">
                                            <p className="text-sm text-slate-300">{f.notes}</p>
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50">
                                                <span className="text-[10px] text-slate-500">{new Date(f.created_at).toLocaleString()}</span>
                                                {f.status === 'Pending' && f.followup_date && (
                                                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                        Next: {new Date(f.followup_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </Modal>

    </div>
  );
};

export default CRMList;
