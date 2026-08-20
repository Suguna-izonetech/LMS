import React, { useState, useEffect } from 'react';
import { 
  Rocket, Smartphone, Users, MessageCircle, Video, Globe, CheckCircle, Plus
} from 'lucide-react';
import api from '../api/client';
import {
  PageHeader, Breadcrumb, Card, CardContent, Button, Badge, LoadingState
} from '../components/ui';
import { useToast } from '../context/ToastContext';

interface PlanAddon {
  id: number;
  addon_name: string;
  status: string;
  activation_date: string | null;
}

export const ExplorePlans: React.FC = () => {
  const [addons, setAddons] = useState<PlanAddon[]>([]);
  const [uiState, setUiState] = useState<'loading' | 'normal' | 'error'>('loading');
  const { success, error: showError } = useToast();

  const fetchAddons = async () => {
      try {
          const res = await api.get('/institute-admin/plans/addons');
          setAddons(res.data);
          setUiState('normal');
      } catch (err) {
          console.error(err);
          showError("Failed to load addons");
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchAddons();
  }, []);

  const handleActivate = async (name: string) => {
      try {
          await api.post(`/institute-admin/plans/addons/${encodeURIComponent(name)}/activate`);
          success(`${name} activated successfully!`);
          fetchAddons();
      } catch (e) {
          showError("Failed to activate addon.");
      }
  };

  if (uiState === 'loading') return (
      <div className="space-y-6">
          <PageHeader title="Explore Plans" description="Manage add-ons." breadcrumbs={[]} />
          <LoadingState message="Loading platform plans..." />
      </div>
  );

  const features = [
      {
          name: "On Domain",
          icon: <Globe className="w-6 h-6 text-indigo-400" />,
          desc: "Host the LMS on your own custom domain (e.g., academy.yourbrand.com).",
          price: "$29 / month"
      },
      {
          name: "Android & iOS App",
          icon: <Smartphone className="w-6 h-6 text-sky-400" />,
          desc: "White-labeled mobile applications for your students on App Store & Google Play.",
          price: "$199 / month"
      },
      {
          name: "Nrich Lead Management",
          icon: <Users className="w-6 h-6 text-emerald-400" />,
          desc: "Advanced CRM pipelines, lead scoring, and automated follow-ups.",
          price: "$49 / month"
      },
      {
          name: "WhatsApp",
          icon: <MessageCircle className="w-6 h-6 text-emerald-500" />,
          desc: "Native WhatsApp Business API integration for automated alerts.",
          price: "$19 / month"
      },
      {
          name: "Zoom SDK",
          icon: <Video className="w-6 h-6 text-blue-400" />,
          desc: "Embed Zoom directly within the LMS player avoiding app switching.",
          price: "$39 / month"
      },
      {
          name: "WordPress",
          icon: <Rocket className="w-6 h-6 text-cyan-400" />,
          desc: "Synchronize LMS courses directly into your WordPress marketing site.",
          price: "Free"
      }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explore Plans & Add-ons"
        description="Upgrade your LMS capabilities with premium platform integrations."
        breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Explore Plans' }]} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {features.map(f => {
              const dbAddon = addons.find(a => a.addon_name === f.name);
              const isActive = dbAddon?.status === 'Active';
              
              return (
                  <Card key={f.name} className={`flex flex-col relative overflow-hidden transition-all duration-300 ${isActive ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      
                      {isActive && (
                          <div className="absolute top-0 right-0 p-3">
                              <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Active
                              </Badge>
                          </div>
                      )}
                      
                      <CardContent className="p-6 flex-1 flex flex-col">
                          <div className="w-12 h-12 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800 mb-4">
                              {f.icon}
                          </div>
                          
                          <h3 className="text-lg font-bold text-slate-200 mb-2">{f.name}</h3>
                          <p className="text-sm text-slate-400 mb-6 flex-1">{f.desc}</p>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                              <span className="font-mono text-slate-300 font-bold">{f.price}</span>
                              {isActive ? (
                                  <span className="text-xs text-slate-500">Since {new Date(dbAddon.activation_date!).toLocaleDateString()}</span>
                              ) : (
                                  <Button variant="primary" size="sm" onClick={() => handleActivate(f.name)}>
                                      <Plus className="w-4 h-4 mr-1" /> Activate
                                  </Button>
                              )}
                          </div>
                      </CardContent>
                  </Card>
              )
          })}
      </div>
    </div>
  );
};

export default ExplorePlans;
