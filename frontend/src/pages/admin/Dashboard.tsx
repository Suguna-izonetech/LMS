import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, GraduationCap, BookOpen, DollarSign, Activity, Globe, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-800/30 p-6 md:p-8 shadow-xl shadow-indigo-950/20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20">
            <Globe className="h-3.5 w-3.5" />
            <span>Platform Governance & Multi-Institute LMS Administration</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
            Platform Admin Command Center
          </h1>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Monitor multi-institute deployments, subscription plans, global integrations, platform-wide revenue telemetry, and user RBAC controls.
          </p>
        </div>
      </div>

      {/* Platform Telemetry Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-indigo-500/40 transition-all cursor-pointer" onClick={() => navigate('/admin/institutes')}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Institutes</p>
              <p className="font-display text-2xl font-bold text-slate-100 mt-1">25</p>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">22 Active Deployments</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Building className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-500/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Students</p>
              <p className="font-display text-2xl font-bold text-slate-100 mt-1">12,500</p>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">9,800 Active Sessions</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-500/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Teachers</p>
              <p className="font-display text-2xl font-bold text-slate-100 mt-1">450</p>
              <p className="text-[11px] text-slate-500 mt-1">Across all institutes</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <GraduationCap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-500/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Monthly Revenue</p>
              <p className="font-display text-2xl font-bold text-emerald-400 mt-1">₹14,50,000</p>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">+12.5% vs last month</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Platform System Activity</span>
                </CardTitle>
                <CardDescription>Realtime events across multi-institute tenants</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div>
                    <p className="font-bold text-slate-200">New Institute Onboarded: Apex Academy</p>
                    <p className="text-[11px] text-slate-500">Subdomain: apex.kite.lms • Plan: Enterprise Pro</p>
                  </div>
                  <span className="text-slate-500">10 mins ago</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div>
                    <p className="font-bold text-slate-200">Payment Gateway Renewal: Kite Institute</p>
                    <p className="text-[11px] text-slate-500">Razorpay Auto-Settlement • Amount: ₹45,000</p>
                  </div>
                  <span className="text-slate-500">45 mins ago</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div>
                    <p className="font-bold text-slate-200">Global Add-on Activated: WhatsApp OTP Service</p>
                    <p className="text-[11px] text-slate-500">Activated across 18 Institutes</p>
                  </div>
                  <span className="text-slate-500">2 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Management Links */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Admin Management Shortcuts</CardTitle>
              <CardDescription>Direct navigation to administrative modules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate('/admin/institutes')}
                className="w-full justify-between bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 cursor-pointer"
              >
                <span>Manage Institutes Directory</span>
                <ArrowUpRight className="h-4 w-4 text-indigo-400" />
              </Button>

              <Button
                onClick={() => navigate('/institute-admin/institute-manager/users')}
                className="w-full justify-between bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 cursor-pointer"
              >
                <span>Platform Users & RBAC</span>
                <ArrowUpRight className="h-4 w-4 text-indigo-400" />
              </Button>

              <Button
                onClick={() => navigate('/institute-admin/explore-plans')}
                className="w-full justify-between bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 cursor-pointer"
              >
                <span>Plans & Add-ons</span>
                <ArrowUpRight className="h-4 w-4 text-indigo-400" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
