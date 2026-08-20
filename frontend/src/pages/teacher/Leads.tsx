import React, { useEffect, useState } from 'react';
import { Users, Phone, Mail, MessageSquare, ArrowLeft, RefreshCw, Plus, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { teacherApi } from '../../api/teacher';

export const Leads: React.FC = () => {
  const toast = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Lead details
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [leadDetails, setLeadDetails] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Followup State
  const [followupNote, setFollowupNote] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await teacherApi.getLeads();
      setLeads(res);
    } catch (err) {
      toast.error('Failed to load assigned leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenLeadDetails = async (id: number) => {
    try {
      setDetailLoading(true);
      setSelectedLeadId(id);
      const res = await teacherApi.getLead(id);
      setLeadDetails(res);
    } catch (err) {
      toast.error('Failed to load lead follow-up history.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupNote || !selectedLeadId) {
      toast.error('Follow-up note is required.');
      return;
    }
    try {
      await teacherApi.addLeadFollowup(selectedLeadId, followupNote);
      toast.success('Followup note logged!');
      setFollowupNote('');
      handleOpenLeadDetails(selectedLeadId);
    } catch (err) {
      toast.error('Failed to add follow-up log.');
    }
  };

  if (loading || detailLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading prospects...</p>
      </div>
    );
  }

  // --- SUBVIEW: LEAD DETAIL AND FOLLOW-UP TIMELINE ---
  if (selectedLeadId && leadDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setSelectedLeadId(null); loadData(); }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Leads</span>
          </Button>
        </div>

        <div className="border-b border-slate-850 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-violet-400 bg-violet-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {leadDetails.status}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">{leadDetails.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Interested Course: <span className="text-slate-300 font-medium">{leadDetails.course_interest}</span></p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Detail Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader><CardTitle>Prospect Information</CardTitle></CardHeader>
              <CardContent className="p-5 space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-violet-400" />
                  <span>{leadDetails.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-violet-400" />
                  <span>Prospect Email (via Enquiry form)</span>
                </div>
                <div className="border-t border-slate-850 pt-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Lead Source</span>
                  <span className="text-sm font-semibold text-slate-350">{leadDetails.source}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Prospect Notes</span>
                  <span className="text-xs text-slate-400 italic">"{leadDetails.notes || 'No notes specified.'}"</span>
                </div>
              </CardContent>
            </Card>

            {/* Follow-up Note Form */}
            <Card>
              <CardHeader><CardTitle>Log Follow-up</CardTitle></CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleAddFollowup} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-450">Follow-up Note</label>
                    <Input value={followupNote} onChange={(e) => setFollowupNote(e.target.value)} placeholder="e.g. Called, scheduled demo session" required />
                  </div>
                  <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-550 flex items-center justify-center gap-1">
                    <Plus className="h-4 w-4" />
                    <span>Log Call</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Follow-up Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-300">Interaction History Logs</h3>
            {leadDetails.followups.length === 0 ? (
              <div className="text-center py-12 text-slate-550 text-xs border border-dashed border-slate-800 rounded-lg">
                No follow-ups recorded yet. Log your first call to nurture this prospect.
              </div>
            ) : (
              <div className="relative pl-6 border-l border-slate-800 space-y-6">
                {leadDetails.followups.map((fp: any, idx: number) => (
                  <div key={fp.id} className="relative">
                    <span className="absolute -left-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-950 border border-violet-800">
                      <span className="h-2 w-2 rounded-full bg-violet-550" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(fp.followup_date).toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-200 mt-1">{fp.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN VIEW: LEADS LIST ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          Enrollment Leads
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Manage prospective student queries and trial session follow-ups assigned to you.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead) => (
          <Card key={lead.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-[10px] font-bold text-violet-400 bg-violet-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {lead.status}
              </span>
              <Users className="h-4.5 w-4.5 text-violet-400" />
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-200">{lead.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{lead.course_interest}</p>
              </div>

              <div className="space-y-2 border-t border-slate-850 pt-3 text-slate-400">
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-650" />
                  <span>{lead.phone}</span>
                </p>
                <p className="text-slate-550 font-bold block text-[10px]">
                  Last follow-up: {lead.last_followup ? new Date(lead.last_followup).toLocaleDateString() : 'Never'}
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-850">
                <Button 
                  onClick={() => handleOpenLeadDetails(lead.id)}
                  className="bg-violet-650 hover:bg-violet-550 text-xs cursor-pointer flex items-center gap-1 w-full justify-center"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Nurture & Log Follow-up</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default Leads;
