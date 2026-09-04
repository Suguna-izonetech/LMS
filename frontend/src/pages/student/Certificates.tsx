import React, { useEffect, useState } from 'react';
import { Award, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';

interface Certificate {
  id: number;
  certificate_number: string;
  course_title: string;
  template_name: string;
  issued_at: string;
  status: string;
}

export const Certificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/certificates');
      setCertificates(res.data);
    } catch (err) {
      console.error('Error fetching certificates', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your earned certificates..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          My Course Certificates
        </h1>
        <p className="text-sm text-slate-400">
          View and download verified completion certificates for your completed courses.
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="hover:border-emerald-500/40 transition-all border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Award className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verified</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">{cert.certificate_number}</span>
                  <h3 className="text-lg font-bold text-slate-100">{cert.course_title}</h3>
                  <p className="text-xs text-slate-400">Template: {cert.template_name}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-500">Issued Date: {cert.issued_at}</span>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-sm">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    <span>Download PDF</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <Award className="h-12 w-12 mx-auto text-slate-600 opacity-40" />
            <h3 className="text-base font-bold text-slate-300">No Certificates Issued Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Complete your enrolled courses, quizzes, and tasks to earn official course completion certificates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default Certificates;
