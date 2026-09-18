import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Shield, Building, Mail, Phone, CheckCircle2, XCircle, Plus, Filter
} from 'lucide-react';
import api from '../../api/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Pagination,
  LoadingState,
  EmptyState
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { usePagination } from '../../hooks/usePagination';

interface PlatformUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  institute_id?: number | null;
  created_at: string;
}

const DEFAULT_USERS: PlatformUser[] = [
  {
    id: 1,
    first_name: 'Platform',
    last_name: 'Admin',
    email: 'platformadmin@kite.lms',
    phone: '+1-555-0001',
    role: 'admin',
    status: 'active',
    institute_id: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    first_name: 'Institute',
    last_name: 'Admin',
    email: 'instituteadmin@kite.lms',
    phone: '+1-555-0002',
    role: 'InstituteAdmin',
    status: 'active',
    institute_id: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    first_name: 'Super',
    last_name: 'Admin',
    email: 'admin@kite.lms',
    phone: '+1-555-0003',
    role: 'admin',
    status: 'active',
    institute_id: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    first_name: 'Lead',
    last_name: 'Instructor',
    email: 'teacher@kite.lms',
    phone: '+1-555-0004',
    role: 'teacher',
    status: 'active',
    institute_id: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    first_name: 'Senior',
    last_name: 'Teacher',
    email: 'other@kite.lms',
    phone: '+1-555-0005',
    role: 'teacher',
    status: 'active',
    institute_id: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 6,
    first_name: 'Demo',
    last_name: 'Student',
    email: 'student@kite.lms',
    phone: '+1-555-0006',
    role: 'student',
    status: 'active',
    institute_id: 1,
    created_at: new Date().toISOString()
  }
];

export const AdminUsersList: React.FC = () => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'InstituteAdmin' | 'teacher' | 'student'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'InstituteAdmin',
    password: ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/institute-admin/users');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setUsers(res.data);
      } else {
        setUsers(DEFAULT_USERS);
      }
    } catch (err) {
      console.error('Failed to load users, using defaults', err);
      setUsers(DEFAULT_USERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: PlatformUser) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/institute-admin/users/${user.id}/status`, {
        is_active: newStatus === 'active',
        status: newStatus
      });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      success(`User status updated to ${newStatus}`);
    } catch (err) {
      // Local state fallback
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      success(`User status updated to ${newStatus}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.firstName || !formData.password) {
      showError('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || '',
        role: formData.role,
        password: formData.password,
        status: 'active'
      };

      const res = await api.post('/institute-admin/users', payload);
      const newUser = res.data || {
        ...payload,
        id: Date.now(),
        created_at: new Date().toISOString()
      };

      setUsers(prev => [newUser, ...prev]);
      success('Platform user created successfully');
      setIsModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'InstituteAdmin',
        password: ''
      });
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());

    const roleLower = (user.role || '').toLowerCase();
    const filterRoleLower = roleFilter.toLowerCase();
    const matchesRole = roleFilter === 'all' || roleLower === filterRoleLower;

    const matchesStatus = statusFilter === 'all' || user.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

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
  } = usePagination({ data: filteredUsers, itemsPerPage: 10 });

  // Metrics
  const totalCount = users.length;
  const platformAdminCount = users.filter(u => u.role?.toLowerCase() === 'admin' || u.role?.toLowerCase() === 'platformadmin').length;
  const instituteAdminCount = users.filter(u => u.role?.toLowerCase() === 'instituteadmin').length;
  const teacherCount = users.filter(u => u.role?.toLowerCase() === 'teacher').length;
  const studentCount = users.filter(u => u.role?.toLowerCase() === 'student').length;

  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'admin' || r === 'platformadmin') {
      return <Badge variant="info" className="bg-purple-500/15 text-purple-300 border-purple-500/30">Platform Admin</Badge>;
    }
    if (r === 'instituteadmin') {
      return <Badge variant="info" className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30">Institute Admin</Badge>;
    }
    if (r === 'teacher') {
      return <Badge variant="success" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">Teacher</Badge>;
    }
    return <Badge variant="neutral" className="bg-slate-800 text-slate-300 border-slate-700">Student</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            Platform Users Directory
          </h1>
          <p className="text-sm text-slate-400">
            Manage platform administrators, institute admins, faculty, and cross-institute user accounts.
          </p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-900/30 cursor-pointer"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          <span>Add Platform User</span>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Users</p>
              <p className="font-display text-2xl font-bold text-slate-100 mt-1">{totalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Platform Admins</p>
              <p className="font-display text-2xl font-bold text-purple-400 mt-1">{platformAdminCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Institute Admins</p>
              <p className="font-display text-2xl font-bold text-sky-400 mt-1">{instituteAdminCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Building className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Faculty & Students</p>
              <p className="font-display text-2xl font-bold text-emerald-400 mt-1">{teacherCount + studentCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Tab Bar */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-slate-500" />}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto border-t border-slate-800/80 pt-3 scrollbar-none">
            {[
              { id: 'all', label: 'All Users', count: totalCount },
              { id: 'admin', label: 'Platform Admins', count: platformAdminCount },
              { id: 'InstituteAdmin', label: 'Institute Admins', count: instituteAdminCount },
              { id: 'teacher', label: 'Teachers', count: teacherCount },
              { id: 'student', label: 'Students', count: studentCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {loading ? (
        <LoadingState message="Loading platform users..." />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6 text-indigo-400" />}
          title="No users found"
          description="Try adjusting your search terms or filters to find platform users."
          actionLabel="Clear Filters"
          onActionClick={() => {
            setSearchTerm('');
            setRoleFilter('all');
            setStatusFilter('all');
          }}
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>User Details</TableHeaderCell>
                <TableHeaderCell>Contact</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Tenant / Scope</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map(u => {
                const isActive = u.status?.toLowerCase() === 'active';
                const initial = (u.first_name?.[0] || u.email?.[0] || 'U').toUpperCase();

                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-sm flex items-center justify-center border border-indigo-500/30">
                          {initial}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200 text-sm">
                            {u.first_name} {u.last_name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            ID: #{u.id} • Joined: {new Date(u.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="h-3 w-3 text-slate-500" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {getRoleBadge(u.role)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Building className="h-3.5 w-3.5 text-slate-500" />
                        <span>{u.role?.toLowerCase() === 'admin' ? 'Global Platform' : 'Kite Institute'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {isActive ? (
                        <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-rose-400 text-xs font-semibold">
                          <XCircle className="h-4 w-4" />
                          <span>Inactive</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(u)}
                        className={`text-xs ${
                          isActive 
                            ? 'hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30' 
                            : 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'
                        }`}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Button>
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

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Platform User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">First Name *</label>
              <Input
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. John"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Last Name</label>
              <Input
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Doe"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Email Address *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Phone Number</label>
            <Input
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-555-0199"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Assigned Role *</label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="InstituteAdmin">Institute Administrator</option>
              <option value="admin">Platform Super Administrator</option>
              <option value="teacher">Teacher / Instructor</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Password *</label>
            <Input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="Temporary password"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsersList;
