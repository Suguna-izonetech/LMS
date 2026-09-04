import React, { useState } from 'react';
import { Building, Plus, Search, CheckCircle2, XCircle, Globe, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface InstituteItem {
  id: number;
  name: string;
  subdomain: string;
  students_count: number;
  teachers_count: number;
  status: 'Active' | 'Deactivated';
  created_at: string;
}

export const InstitutesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [institutes, setInstitutes] = useState<InstituteItem[]>([
    {
      id: 1,
      name: 'Kite Institute of Learning',
      subdomain: 'kite',
      students_count: 5200,
      teachers_count: 180,
      status: 'Active',
      created_at: 'Jan 2026'
    },
    {
      id: 2,
      name: 'Apex Technology Academy',
      subdomain: 'apex',
      students_count: 3400,
      teachers_count: 120,
      status: 'Active',
      created_at: 'Feb 2026'
    },
    {
      id: 3,
      name: 'Horizon Business School',
      subdomain: 'horizon',
      students_count: 2100,
      teachers_count: 85,
      status: 'Active',
      created_at: 'Mar 2026'
    },
    {
      id: 4,
      name: 'Starlight Coaching Center',
      subdomain: 'starlight',
      students_count: 1800,
      teachers_count: 65,
      status: 'Deactivated',
      created_at: 'Apr 2026'
    }
  ]);

  const filtered = institutes.filter(inst =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = (id: number) => {
    setInstitutes(prev =>
      prev.map(inst =>
        inst.id === id
          ? { ...inst, status: inst.status === 'Active' ? 'Deactivated' : 'Active' }
          : inst
      )
    );
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

        <Button className="bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-900/30 cursor-pointer">
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
    </div>
  );
};
export default InstitutesList;
