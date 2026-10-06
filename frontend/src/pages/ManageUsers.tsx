import React, { useState, useEffect, useRef } from 'react';
import { Search, Edit2, Trash2, Users, UploadCloud, UserPlus, FileDown, ShieldCheck, Mail, Phone, CheckCircle2, XCircle } from 'lucide-react';
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
  ConfirmationDialog,
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
  Tabs,
  Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  status?: string;
  created_at: string;
}

interface UserTableProps {
  data: UserData[];
  onToggleStatus: (id: number, currentStatus: boolean) => void;
}

const UserTable: React.FC<UserTableProps> = ({ data, onToggleStatus }) => {
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
  } = usePagination({ data, itemsPerPage: 10 });

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        No users match this category.
      </div>
    );
  }
  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>User Details</TableHeaderCell>
            <TableHeaderCell>Contact</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map(u => {
            const isActive = typeof u.is_active === 'boolean' ? u.is_active : (u.status === 'active');
            return (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {u.first_name?.[0] || 'U'}{u.last_name?.[0] || ''}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">{u.first_name} {u.last_name}</span>
                      <span className="text-xs text-slate-500">Joined: {new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span className="text-xs">{u.email}</span>
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span className="text-xs">{u.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === 'student' ? 'info' : u.role === 'teacher' ? 'success' : 'neutral'}>
                    {u.role.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  {isActive ? (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Inactive</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => onToggleStatus(u.id, isActive)}>
                      {isActive ? 'Deactivate' : 'Activate'}
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
  );
};

export const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'admins'>('students');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<{success_count: number, error_count: number, errors: string[]} | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const { success, error: showError } = useToast();

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [crmAccess, setCrmAccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = async (silent = false) => {
      if (!silent) setUiState('loading');
      try {
          const res = await api.get('/institute-admin/users');
          setUsers(res.data);
          
          if (res.data.length === 0) setUiState('empty');
          else setUiState('normal');
      } catch (err) {
          console.error(err);
          showError('Failed to load users');
          if (!silent) setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const filteredUsers = users.filter(u => 
      u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const students = filteredUsers.filter(u => u.role === 'student');
  const teachers = filteredUsers.filter(u => u.role === 'teacher');
  const admins = filteredUsers.filter(u => u.role === 'InstituteAdmin' || u.role === 'admin');

  const openCreateForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('student');
    setCrmAccess(false);
    setIsFormOpen(true);
  };
  
  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
      const nextStatus = !currentStatus;
      // Optimistically update UI
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: nextStatus, status: nextStatus ? 'active' : 'inactive' } : u));
      try {
          await api.patch(`/institute-admin/users/${userId}/status`, { 
              is_active: nextStatus,
              status: nextStatus ? 'active' : 'inactive'
          });
          success(`User ${nextStatus ? 'activated' : 'deactivated'} successfully`);
          fetchData(true);
      } catch (e) {
          fetchData(true);
          showError("Failed to update user status.");
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
        alert("Name, Email, and Password are required.");
        return;
    }

    setIsSubmitting(true);
    
    const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
        role,
        status: 'active'
    };

    try {
        await api.post('/institute-admin/users', payload);
        setIsFormOpen(false);
        success('User created successfully');
        fetchData();
    } catch (e: any) {
        showError(e.response?.data?.detail || "Failed to save user.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleBulkSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedFile) {
          alert("Please select a CSV file first.");
          return;
      }
      
      setIsSubmitting(true);
      setBulkResult(null);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      try {
          const res = await api.post('/institute-admin/users/bulk-upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          setBulkResult(res.data);
          success('Bulk upload processed successfully');
          fetchData();
      } catch (e: any) {
          showError(e.response?.data?.detail || "Failed to process bulk upload.");
      } finally {
          setIsSubmitting(false);
      }
  };
  
  const downloadTemplate = () => {
      const csvContent = "first_name,last_name,email,phone,role\nJohn,Doe,john@example.com,+1234567890,student\nJane,Smith,jane@example.com,+0987654321,teacher";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "user_import_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Manage Users" description="Manage roles and access." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Users' }]} />} />
        <LoadingState message="Loading users directory..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Manage Users" description="Manage roles and access." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Users' }]} />} />
        <ErrorState title="Failed to load data" message="Could not fetch data from the server." onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="User Directory"
          description="Enrol students offline, manage teachers, and designate admins."
          breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Users' }]} />}
          actions={
            <div className="flex gap-2">
                <Button variant="outline" size="sm" leftIcon={<UploadCloud className="h-4 w-4" />} onClick={() => { setBulkResult(null); setSelectedFile(null); setIsBulkOpen(true); }}>
                  Bulk Upload
                </Button>
                <Button variant="primary" size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={openCreateForm}>
                  Create User
                </Button>
            </div>
          }
        />
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-slate-800 bg-slate-900/50 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <Tabs
                  activeId={activeTab}
                  onChange={(id) => setActiveTab(id as any)}
                  items={[
                      { id: 'students', label: `Students (${students.length})` },
                      { id: 'teachers', label: `Teachers (${teachers.length})` },
                      { id: 'admins', label: `Admins (${admins.length})` }
                  ]}
                  className="w-full md:w-auto"
              />
              <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input placeholder="Search name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
              </div>
          </div>
          
          <div className="p-0">
              {activeTab === 'students' && <UserTable data={students} onToggleStatus={handleToggleStatus} />}
              {activeTab === 'teachers' && <UserTable data={teachers} onToggleStatus={handleToggleStatus} />}
              {activeTab === 'admins' && <UserTable data={admins} onToggleStatus={handleToggleStatus} />}
          </div>
        </CardContent>
      </Card>

      {/* CREATE USER MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Manually Create User">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">First Name <span className="text-red-500">*</span></label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Last Name <span className="text-red-500">*</span></label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email Address <span className="text-red-500">*</span></label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
          </div>
          
          <div className="space-y-1">
             <label className="text-xs font-semibold text-slate-300">Temporary Password <span className="text-red-500">*</span></label>
             <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          
          <div className="space-y-1">
             <label className="text-xs font-semibold text-slate-300">Assign Role <span className="text-red-500">*</span></label>
             <Select value={role} onChange={e => setRole(e.target.value)}>
                <option value="student">Student (Enrolls in Courses)</option>
                <option value="teacher">Teacher (Instructs Courses)</option>
                <option value="InstituteAdmin">Institute Admin (Manages Institute)</option>
             </Select>
             <p className="text-[10px] text-slate-500 mt-1">* Note: Global Super Admins cannot be created from this panel.</p>
          </div>
          
          {role !== 'student' && (
              <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <input type="checkbox" id="crm" checked={crmAccess} onChange={(e) => setCrmAccess(e.target.checked)} className="rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-indigo-500/20" />
                  <label htmlFor="crm" className="text-xs font-medium text-slate-300">Grant CRM Access</label>
              </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Enroll User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* BULK UPLOAD MODAL */}
      <Modal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="Bulk Upload Users (CSV)">
        {!bulkResult ? (
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                      <div className="space-y-1">
                          <p className="text-sm font-semibold text-indigo-100">Formatting Instructions</p>
                          <p className="text-xs text-indigo-200/70">
                              Upload a CSV file with the exact headers: <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">first_name,last_name,email,phone,role</code>. 
                              Valid roles are <code>student</code> or <code>teacher</code>.
                          </p>
                          <button type="button" onClick={downloadTemplate} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline mt-2 flex items-center gap-1">
                              <FileDown className="w-3 h-3" /> Download Template
                          </button>
                      </div>
                  </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Select CSV File</label>
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-800 border-dashed rounded-lg cursor-pointer bg-slate-950 hover:bg-slate-900">
                        <div className="flex flex-col items-center justify-center pt-3 pb-4">
                            <UploadCloud className="w-6 h-6 mb-2 text-slate-500" />
                            <p className="text-xs text-slate-500">
                                {selectedFile ? selectedFile.name : "Click to attach CSV file"}
                            </p>
                        </div>
                        <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
                        }} />
                    </label>
                </div>
              </div>
    
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <Button variant="outline" type="button" onClick={() => setIsBulkOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting || !selectedFile}>
                  {isSubmitting ? 'Processing...' : 'Run Import'}
                </Button>
              </div>
            </form>
        ) : (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                        <span className="text-2xl font-bold text-emerald-100">{bulkResult.success_count}</span>
                        <span className="text-xs text-emerald-200/70 uppercase font-bold tracking-wider">Successfully Added</span>
                    </div>
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex flex-col items-center justify-center">
                        <XCircle className="w-8 h-8 text-rose-400 mb-2" />
                        <span className="text-2xl font-bold text-rose-100">{bulkResult.error_count}</span>
                        <span className="text-xs text-rose-200/70 uppercase font-bold tracking-wider">Errors Skipped</span>
                    </div>
                </div>
                
                {bulkResult.error_count > 0 && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">Error Report:</label>
                        <ul className="text-[10px] text-rose-400 bg-rose-950/20 p-3 rounded-lg border border-rose-900/30 max-h-32 overflow-y-auto space-y-1 font-mono">
                            {bulkResult.errors.map((e, i) => (
                                <li key={i}>• {e}</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <div className="flex justify-end pt-4">
                    <Button variant="primary" onClick={() => setIsBulkOpen(false)}>
                        Close Report
                    </Button>
                </div>
            </div>
        )}
      </Modal>

    </div>
  );
};

export default ManageUsers;
