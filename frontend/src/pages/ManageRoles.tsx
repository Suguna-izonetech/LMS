import React, { useState, useEffect } from 'react';
import { ShieldCheck, Edit2, Trash2, Key, Users, Settings, BookOpen, CreditCard, Activity } from 'lucide-react';
import api from '../api/client';
import {
  PageHeader,
  Breadcrumb,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
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
  Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

// Grouping logic for UI display
const groupPermissions = (perms: Permission[]) => {
    const groups: Record<string, Permission[]> = {
        'Course Management': [],
        'Learning Manager': [],
        'User Management': [],
        'CRM & Transactions': [],
        'Settings & Certificates': [],
        'Other': []
    };
    
    perms.forEach(p => {
        if (p.name.startsWith('course.')) groups['Course Management'].push(p);
        else if (p.name.startsWith('learning.')) groups['Learning Manager'].push(p);
        else if (p.name.startsWith('user.') || p.name.startsWith('student.') || p.name.startsWith('teacher.')) groups['User Management'].push(p);
        else if (p.name.startsWith('crm.') || p.name.startsWith('transactions.')) groups['CRM & Transactions'].push(p);
        else if (p.name.startsWith('settings.') || p.name.startsWith('certificates.')) groups['Settings & Certificates'].push(p);
        else groups['Other'].push(p);
    });
    
    // Remove empty groups
    Object.keys(groups).forEach(k => {
        if (groups[k].length === 0) delete groups[k];
    });
    
    return groups;
};

export const ManageRoles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const { success, error: showError } = useToast();

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Fields
  const [roleName, setRoleName] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
      setUiState('loading');
      try {
          const [rolesRes, permsRes] = await Promise.all([
              api.get('/institute-admin/roles'),
              api.get('/institute-admin/permissions')
          ]);
          setRoles(rolesRes.data);
          setAllPermissions(permsRes.data);
          
          if (rolesRes.data.length === 0) setUiState('empty');
          else setUiState('normal');
      } catch (err) {
          console.error(err);
          showError('Failed to load roles');
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (selectedRole) {
      try {
          await api.delete(`/institute-admin/roles/${selectedRole.id}`);
          fetchData();
          success('Role deleted successfully');
      } catch (e: any) {
          showError(e.response?.data?.detail || 'Failed to delete role');
      }
      setIsDeleteOpen(false);
      setSelectedRole(null);
    }
  };

  const openCreateForm = () => {
    setIsEdit(false);
    setSelectedRole(null);
    setRoleName('');
    setSelectedPermIds([]);
    setIsFormOpen(true);
  };

  const openEditForm = (role: Role) => {
    if (["admin", "InstituteAdmin"].includes(role.name)) {
        showError("System protected roles cannot be edited via the standard interface.");
        return;
    }
    setIsEdit(true);
    setSelectedRole(role);
    setRoleName(role.name);
    setSelectedPermIds(role.permissions.map(p => p.id));
    setIsFormOpen(true);
  };
  
  const togglePermission = (id: number) => {
      if (selectedPermIds.includes(id)) {
          setSelectedPermIds(prev => prev.filter(p => p !== id));
      } else {
          setSelectedPermIds(prev => [...prev, id]);
      }
  };
  
  const selectAllInGroup = (groupPerms: Permission[]) => {
      const groupIds = groupPerms.map(p => p.id);
      const allSelected = groupIds.every(id => selectedPermIds.includes(id));
      
      if (allSelected) {
          setSelectedPermIds(prev => prev.filter(id => !groupIds.includes(id)));
      } else {
          const toAdd = groupIds.filter(id => !selectedPermIds.includes(id));
          setSelectedPermIds(prev => [...prev, ...toAdd]);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) {
        showError("Role Name is required.");
        return;
    }

    setIsSubmitting(true);
    
    const payload = {
        name: roleName,
        permission_ids: selectedPermIds
    };

    try {
        if (isEdit && selectedRole) {
            await api.put(`/institute-admin/roles/${selectedRole.id}`, payload);
        } else {
            await api.post('/institute-admin/roles', payload);
        }
        setIsFormOpen(false);
        success(`Role ${isEdit ? 'updated' : 'created'} successfully`);
        fetchData();
    } catch (e: any) {
        showError(e.response?.data?.detail || "Failed to save role.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const groupedPerms = groupPermissions(allPermissions);

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
  } = usePagination({ data: roles, itemsPerPage: 10 });

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Manage Roles" description="Define access control policies." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Roles' }]} />} />
        <LoadingState message="Loading authorization framework..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Manage Roles" description="Define access control policies." breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Roles' }]} />} />
        <ErrorState title="Failed to load roles" message="Could not fetch data from the server." onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Role-Based Access Control"
          description="Create custom organizational roles and securely map granular permissions."
          breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Roles' }]} />}
          actions={
            <Button variant="primary" size="sm" leftIcon={<ShieldCheck className="h-4 w-4" />} onClick={openCreateForm}>
              Create Custom Role
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Role Definition</TableHeaderCell>
                  <TableHeaderCell>Security Mapping</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map(r => {
                  const isProtected = ["admin", "InstituteAdmin"].includes(r.name);
                  const isSystemDefault = ["teacher", "student"].includes(r.name);
                  
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border ${isProtected ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : isSystemDefault ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                            {isProtected ? <ShieldCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-200">{r.name}</span>
                            <span className="text-xs text-slate-500">
                                {isProtected ? 'Global System Administrator' : isSystemDefault ? 'System Default Role' : 'Custom Organizational Role'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-lg">
                            {r.permissions.length === 0 ? (
                                <span className="text-xs text-slate-500 italic">No permissions explicitly mapped</span>
                            ) : (
                                r.permissions.slice(0, 5).map(p => (
                                    <Badge key={p.id} variant="neutral" className="text-[10px] bg-slate-900 border-slate-700">
                                        <Key className="w-3 h-3 mr-1 inline" /> {p.name}
                                    </Badge>
                                ))
                            )}
                            {r.permissions.length > 5 && (
                                <Badge variant="neutral" className="text-[10px] bg-slate-900 border-slate-700">
                                    +{r.permissions.length - 5} more
                                </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isProtected && (
                              <Button variant="secondary" size="sm" onClick={() => openEditForm(r)}>
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                          )}
                          {!isProtected && !isSystemDefault && (
                              <Button variant="danger" size="sm" onClick={() => { setSelectedRole(r); setIsDeleteOpen(true); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                          )}
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
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isDeleteOpen}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${selectedRole?.name}"? Any users assigned to this role will lose their mapped permissions.`}
        confirmLabel="Delete Role"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteOpen(false)}
        variant="danger"
      />

      {/* ROLE BUILDER MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={isEdit ? `Edit Role: ${selectedRole?.name}` : "Create Custom Role"} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Role Identifier <span className="text-red-500">*</span></label>
            <Input 
                value={roleName} 
                onChange={e => setRoleName(e.target.value)} 
                placeholder="e.g. Content Reviewer" 
                disabled={isEdit && ["teacher", "student"].includes(selectedRole?.name || "")}
            />
            {isEdit && ["teacher", "student"].includes(selectedRole?.name || "") && (
                <p className="text-[10px] text-slate-500 mt-1">System default role names cannot be altered.</p>
            )}
          </div>
          
          <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <label className="text-sm font-semibold text-slate-200">Permissions Security Matrix</label>
                  <Badge variant="info">{selectedPermIds.length} Permissions Selected</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(groupedPerms).map(([groupName, perms]) => {
                      const groupIds = perms.map(p => p.id);
                      const allSelected = groupIds.every(id => selectedPermIds.includes(id));
                      
                      let Icon = ShieldCheck;
                      if (groupName === 'Course Management') Icon = BookOpen;
                      if (groupName === 'User Management') Icon = Users;
                      if (groupName === 'CRM & Transactions') Icon = CreditCard;
                      if (groupName === 'Settings & Certificates') Icon = Settings;
                      if (groupName === 'Learning Manager') Icon = Activity;
                      
                      return (
                          <div key={groupName} className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                                      <Icon className="w-4 h-4 text-indigo-400" />
                                      {groupName}
                                  </div>
                                  <button 
                                      type="button" 
                                      onClick={() => selectAllInGroup(perms)}
                                      className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
                                  >
                                      {allSelected ? 'Deselect All' : 'Select All'}
                                  </button>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-slate-800/50">
                                  {perms.map(p => (
                                      <div key={p.id} className="flex items-center gap-2 group cursor-pointer" onClick={() => togglePermission(p.id)}>
                                          <input 
                                              type="checkbox" 
                                              checked={selectedPermIds.includes(p.id)} 
                                              onChange={() => {}} 
                                              className="rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-indigo-500/20 pointer-events-none" 
                                          />
                                          <label className="text-xs text-slate-400 group-hover:text-slate-300 cursor-pointer pointer-events-none transition-colors">
                                              {p.name}
                                          </label>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Framework...' : 'Save Role Matrix'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ManageRoles;
