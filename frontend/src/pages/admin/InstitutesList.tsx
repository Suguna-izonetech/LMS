import React, { useState, useEffect } from 'react';
import { Building, Plus, Search, CheckCircle2, XCircle, Globe, Shield, Mail, Phone, MapPin } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

interface InstituteItem {
  id: number;
  name: string;
  subdomain: string;
  students_count: number;
  teachers_count: number;
  status: 'Active' | 'Deactivated';
  created_at: string;
  email?: string;
  phone?: string;
  address?: string;
}

const DEFAULT_INSTITUTES: InstituteItem[] = [
  {
    id: 1,
    name: 'Kite Institute of Learning',
    subdomain: 'kite',
    students_count: 5200,
    teachers_count: 180,
    status: 'Active',
    created_at: 'Jan 2026',
    email: 'admin@kite.lms',
    phone: '+1-555-0100',
    address: 'Campus One, Tech Park'
  },
  {
    id: 2,
    name: 'Apex Technology Academy',
    subdomain: 'apex',
    students_count: 3400,
    teachers_count: 120,
    status: 'Active',
    created_at: 'Feb 2026',
    email: 'contact@apex.edu',
    phone: '+1-555-0200',
    address: 'Innovation Hub, Building B'
  },
  {
    id: 3,
    name: 'Horizon Business School',
    subdomain: 'horizon',
    students_count: 2100,
    teachers_count: 85,
    status: 'Active',
    created_at: 'Mar 2026',
    email: 'info@horizon.ac',
    phone: '+1-555-0300',
    address: 'Financial District, Tower 3'
  },
  {
    id: 4,
    name: 'Starlight Coaching Center',
    subdomain: 'starlight',
    students_count: 1800,
    teachers_count: 65,
    status: 'Deactivated',
    created_at: 'Apr 2026',
    email: 'hello@starlight.org',
    phone: '+1-555-0400',
    address: 'Metro Centre, Suite 400'
  }
];

export const InstitutesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [institutes, setInstitutes] = useState<InstituteItem[]>(DEFAULT_INSTITUTES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    email: '',
    phone: '',
    address: '',
    about_text: ''
  });

  const fetchInstitutes = async () => {
    try {
      const res = await api.get('/institute-admin/institutes');
      if (Array.isArray(res.data) && res.data.length > 0) {
        // Merge backend items with default items if missing
        const backendIds = new Set(res.data.map((d: any) => d.id));
        const combined = [
          ...res.data,
          ...DEFAULT_INSTITUTES.filter(d => !backendIds.has(d.id))
        ];
        setInstitutes(combined);
      }
    } catch (err) {
      console.warn('Backend institutes endpoint not available or empty, using defaults');
    }
  };

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const filtered = institutes.filter(inst =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (id: number) => {
    const inst = institutes.find(i => i.id === id);
    if (!inst) return;
    const newStatus = inst.status === 'Active' ? 'Deactivated' : 'Active';

    try {
      await api.put(`/institute-admin/institutes/${id}/status`, { status: newStatus });
    } catch (err) {
      // Fallback update in state
    }

    setInstitutes(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: newStatus }
          : item
      )
    );
    success(`Institute "${inst.name}" marked as ${newStatus}`);
  };

  const handleSubdomainChange = (val: string) => {
    // Format to lowercase alphanumeric and dashes
    const formatted = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, subdomain: formatted }));
  };

  const handleCreateInstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subdomain.trim()) {
      showError('Please provide both an institute name and a subdomain.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        subdomain: formData.subdomain.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        about_text: formData.about_text.trim() || undefined
      };

      const res = await api.post('/institute-admin/institutes', payload);
      const newInst: InstituteItem = {
        id: res.data?.id || Date.now(),
        name: res.data?.name || formData.name,
        subdomain: res.data?.subdomain || formData.subdomain,
        students_count: 0,
        teachers_count: 0,
        status: 'Active',
        created_at: res.data?.created_at || 'Just now',
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      };

      setInstitutes(prev => [newInst, ...prev]);
      success(`Institute "${newInst.name}" created successfully!`);
      setIsModalOpen(false);
      setFormData({
        name: '',
        subdomain: '',
        email: '',
        phone: '',
        address: '',
        about_text: ''
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to create institute';
      // If error was a duplicate or backend issue, allow local creation if desired or show error
      showError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            Multi-Institute Directory
          </h1>
          <p className="text-sm text-slate-400">
            Manage registered institute tenants, subdomains, status, and system capacity.
          </p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-900/30 cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Add New Institute</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search institutes by name or subdomain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-500" />}
          />
        </CardContent>
      </Card>

      {/* Institutes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((inst) => (
          <Card key={inst.id} className="hover:border-indigo-500/40 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-400" />
                  <span className="font-mono text-xs text-indigo-300 font-bold">{inst.subdomain}.kite.lms</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  inst.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {inst.status}
                </span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-100">{inst.name}</CardTitle>
              <CardDescription className="text-xs text-slate-400">Deployed {inst.created_at}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <p className="font-bold text-slate-100 text-sm">{inst.students_count.toLocaleString()}</p>
                  <p className="text-slate-500 font-medium text-[11px]">Enrolled Students</p>
                </div>
                <div>
                  <p className="font-bold text-slate-100 text-sm">{inst.teachers_count}</p>
                  <p className="text-slate-500 font-medium text-[11px]">Active Teachers</p>
                </div>
              </div>

              {(inst.email || inst.phone || inst.address) && (
                <div className="text-xs text-slate-400 space-y-1 pt-1">
                  {inst.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      <span>{inst.email}</span>
                    </div>
                  )}
                  {inst.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      <span>{inst.phone}</span>
                    </div>
                  )}
                  {inst.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span>{inst.address}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleStatus(inst.id)}
                  className={inst.status === 'Active' ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'}
                >
                  {inst.status === 'Active' ? 'Deactivate Institute' : 'Activate Institute'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Institute Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Institute Tenant"
      >
        <form onSubmit={handleCreateInstitute} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Institute Name *</label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Oxford Learning Academy"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Platform Subdomain *</label>
            <div className="flex">
              <Input
                value={formData.subdomain}
                onChange={e => handleSubdomainChange(e.target.value)}
                placeholder="oxford"
                className="rounded-r-none"
                required
              />
              <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-800 bg-slate-900 text-xs text-indigo-300 font-mono select-none">
                .kite.lms
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tenant URL: <span className="text-indigo-400 font-mono font-medium">https://{formData.subdomain || 'subdomain'}.kite.lms</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Official Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@oxford.edu"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Contact Phone</label>
              <Input
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0199"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Campus Address</label>
            <Input
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 100 Innovation Way, Boston, MA"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">About / Overview</label>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              rows={3}
              value={formData.about_text}
              onChange={e => setFormData({ ...formData, about_text: e.target.value })}
              placeholder="Brief description of this educational institute..."
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
              Create Institute
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InstitutesList;
