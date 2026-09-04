import React, { useState, useEffect } from 'react';
import { 
  Mail, MessageCircle, CreditCard, DollarSign, Settings, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import api from '../api/client';
import {
  PageHeader, Breadcrumb, Card, CardContent, Button, Badge, Input, Select, 
  LoadingState, ErrorState, Modal, Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';

interface Integration {
  id?: number;
  provider_type: string;
  provider_name: string;
  status: string;
  credentials: Record<string, any>;
}

export const Integrations: React.FC<{ defaultTab?: string }> = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [uiState, setUiState] = useState<'loading' | 'normal' | 'error'>('loading');
  const { success, error: showError } = useToast();
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);
  
  // Form State
  const [providerName, setProviderName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('Configured');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIntegrations = async () => {
      setUiState('loading');
      try {
          const res = await api.get('/institute-admin/integrations');
          setIntegrations(res.data);
          setUiState('normal');
      } catch (err) {
          console.error(err);
          showError("Failed to load integrations");
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchIntegrations();
  }, []);
  
  const getIntegration = (type: string) => integrations.find(i => i.provider_type === type);

  const openModal = (type: string) => {
      setActiveType(type);
      const existing = getIntegration(type);
      
      if (existing) {
          setProviderName(existing.provider_name);
          setStatus(existing.status);
          setCredentials(existing.credentials || {});
      } else {
          setProviderName(type === 'email' ? 'smtp' : type === 'whatsapp' ? 'twilio' : type);
          setStatus('Configured');
          setCredentials({});
      }
      setIsModalOpen(true);
  };
  
  const handleCredChange = (key: string, value: string) => {
      setCredentials(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeType) return;
      
      setIsSubmitting(true);
      try {
          await api.post(`/institute-admin/integrations/${activeType}`, {
              provider_name: providerName,
              status,
              credentials
          });
          setIsModalOpen(false);
          success("Integration saved successfully");
          fetchIntegrations();
      } catch (err) {
          showError("Failed to save integration.");
      } finally {
          setIsSubmitting(false);
      }
  };
  
  const handleVerify = async (type: string) => {
      try {
          await api.post(`/institute-admin/integrations/${type}/verify`);
          success("Verification successful");
          fetchIntegrations();
      } catch (e) {
          showError("Verification failed.");
      }
  };

  const handleTestEmail = async () => {
      try {
          const res = await api.post('/institute-admin/integrations/email/test');
          success(res.data.detail);
      } catch (e) {
          showError("Test failed.");
      }
  };

  if (uiState === 'loading') return (
      <div className="space-y-6">
          <PageHeader title="Integrations" description="Manage connections." breadcrumbs={<Breadcrumb items={[{ label: 'Integrations' }]} />} />
          <LoadingState message="Loading integrations..." />
      </div>
  );

  const renderBadge = (status: string) => {
      switch(status) {
          case 'Active': return <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>;
          case 'Verified': return <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Verified</Badge>;
          case 'Error': return <Badge variant="danger" className="bg-rose-500/10 text-rose-400 border-rose-500/20">Error</Badge>;
          case 'Configured': return <Badge variant="neutral" className="bg-amber-500/10 text-amber-400 border-amber-500/20">Configured</Badge>;
          default: return <Badge variant="neutral" className="bg-slate-800 text-slate-400 border-slate-700">Not Configured</Badge>;
      }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="App Integrations"
        description="Configure API keys and webhooks for external services securely."
        breadcrumbs={<Breadcrumb items={[{ label: 'Settings' }, { label: 'Integrations' }]} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EMAIL */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col">
              <CardContent className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                              <Mail className="w-6 h-6 text-indigo-400" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-slate-200">Email Gateway</h3>
                              <p className="text-sm text-slate-400">SMTP / SendGrid</p>
                          </div>
                      </div>
                      {renderBadge(getIntegration('email')?.status || 'Not Configured')}
                  </div>
                  <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                      Send automated welcome emails, password resets, and receipts.
                  </p>
                  
                  <div className="flex gap-2 mt-auto pt-4 border-t border-slate-800/50">
                      <Button variant="primary" onClick={() => openModal('email')} className="flex-1">Configure</Button>
                      <Button variant="outline" onClick={() => handleVerify('email')} disabled={!getIntegration('email')} title="Verify Connection"><CheckCircle className="w-4 h-4" /></Button>
                      <Button variant="secondary" onClick={handleTestEmail} disabled={getIntegration('email')?.status !== 'Active'} title="Send Test Email"><RefreshCw className="w-4 h-4" /></Button>
                  </div>
              </CardContent>
          </Card>

          {/* WHATSAPP */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col">
              <CardContent className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <MessageCircle className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-slate-200">WhatsApp</h3>
                              <p className="text-sm text-slate-400">Twilio / Meta</p>
                          </div>
                      </div>
                      {renderBadge(getIntegration('whatsapp')?.status || 'Not Configured')}
                  </div>
                  <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                      Send instant notifications and alerts directly to student phones.
                  </p>
                  
                  <div className="flex gap-2 mt-auto pt-4 border-t border-slate-800/50">
                      <Button variant="primary" onClick={() => openModal('whatsapp')} className="flex-1">Configure</Button>
                      <Button variant="outline" onClick={() => handleVerify('whatsapp')} disabled={!getIntegration('whatsapp')}><CheckCircle className="w-4 h-4" /></Button>
                  </div>
              </CardContent>
          </Card>

          {/* RAZORPAY */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col">
              <CardContent className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <CreditCard className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-slate-200">Razorpay</h3>
                              <p className="text-sm text-slate-400">Payment Gateway</p>
                          </div>
                      </div>
                      {renderBadge(getIntegration('razorpay')?.status || 'Not Configured')}
                  </div>
                  <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                      Process student payments securely. Automatically grants course access on success.
                  </p>
                  
                  <div className="flex gap-2 mt-auto pt-4 border-t border-slate-800/50">
                      <Button variant="primary" onClick={() => openModal('razorpay')} className="flex-1">Configure</Button>
                      <Button variant="outline" onClick={() => handleVerify('razorpay')} disabled={!getIntegration('razorpay')}><CheckCircle className="w-4 h-4" /></Button>
                  </div>
              </CardContent>
          </Card>

          {/* PAYPAL */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col">
              <CardContent className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-sky-400" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-slate-200">PayPal</h3>
                              <p className="text-sm text-slate-400">International Payments</p>
                          </div>
                      </div>
                      {renderBadge(getIntegration('paypal')?.status || 'Not Configured')}
                  </div>
                  <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                      Accept global payments. Supports IPN webhooks for automated enrollment workflows.
                  </p>
                  
                  <div className="flex gap-2 mt-auto pt-4 border-t border-slate-800/50">
                      <Button variant="primary" onClick={() => openModal('paypal')} className="flex-1">Configure</Button>
                      <Button variant="outline" onClick={() => handleVerify('paypal')} disabled={!getIntegration('paypal')}><CheckCircle className="w-4 h-4" /></Button>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* CONFIGURATION MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Configure ${activeType?.toUpperCase()}`} size="sm">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mb-4">
                  <p className="text-xs text-amber-400 flex gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Secrets are securely masked. Entering new values will overwrite existing keys. Leave blank to keep existing keys.
                  </p>
              </div>

              {activeType === 'email' && (
                  <>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Provider</label>
                          <Select value={providerName} onChange={e => setProviderName(e.target.value)}>
                              <option value="smtp">Custom SMTP</option>
                              <option value="sendgrid">SendGrid API</option>
                          </Select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Host / API Endpoint</label>
                          <Input value={credentials.host || ''} onChange={e => handleCredChange('host', e.target.value)} placeholder="smtp.mailgun.org" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">Port</label>
                              <Input value={credentials.port || ''} onChange={e => handleCredChange('port', e.target.value)} placeholder="587" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">Username</label>
                              <Input value={credentials.user || ''} onChange={e => handleCredChange('user', e.target.value)} />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Password / API Key</label>
                          <Input type="password" value={credentials.password || ''} onChange={e => handleCredChange('password', e.target.value)} placeholder={credentials.password === '********' ? '********' : 'Enter secret'} />
                      </div>
                  </>
              )}

              {activeType === 'whatsapp' && (
                  <>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Provider</label>
                          <Select value={providerName} onChange={e => setProviderName(e.target.value)}>
                              <option value="twilio">Twilio</option>
                              <option value="meta">Meta Official API</option>
                          </Select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Account SID</label>
                          <Input value={credentials.account_sid || ''} onChange={e => handleCredChange('account_sid', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Auth Token</label>
                          <Input type="password" value={credentials.auth_token || ''} onChange={e => handleCredChange('auth_token', e.target.value)} placeholder={credentials.auth_token === '********' ? '********' : 'Enter secret'} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Sender Phone Number</label>
                          <Input value={credentials.phone_number || ''} onChange={e => handleCredChange('phone_number', e.target.value)} placeholder="+1234567890" />
                      </div>
                  </>
              )}

              {activeType === 'razorpay' && (
                  <>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Key ID</label>
                          <Input value={credentials.key_id || ''} onChange={e => handleCredChange('key_id', e.target.value)} placeholder="rzp_live_..." />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Key Secret</label>
                          <Input type="password" value={credentials.key_secret || ''} onChange={e => handleCredChange('key_secret', e.target.value)} placeholder={credentials.key_secret === '********' ? '********' : 'Enter secret'} />
                      </div>
                      <div className="mt-4 p-3 bg-slate-800 rounded-md border border-slate-700">
                          <label className="text-xs font-bold text-slate-300 block mb-1">Webhook URL (Copy to Razorpay Dashboard)</label>
                          <code className="text-xs text-indigo-400 break-all">https://api.yourlms.com/api/webhooks/payments/razorpay</code>
                      </div>
                  </>
              )}

              {activeType === 'paypal' && (
                  <>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Environment</label>
                          <Select value={credentials.environment || 'sandbox'} onChange={e => handleCredChange('environment', e.target.value)}>
                              <option value="sandbox">Sandbox</option>
                              <option value="live">Live</option>
                          </Select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Client ID</label>
                          <Input value={credentials.client_id || ''} onChange={e => handleCredChange('client_id', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Client Secret</label>
                          <Input type="password" value={credentials.client_secret || ''} onChange={e => handleCredChange('client_secret', e.target.value)} placeholder={credentials.client_secret === '********' ? '********' : 'Enter secret'} />
                      </div>
                      <div className="mt-4 p-3 bg-slate-800 rounded-md border border-slate-700">
                          <label className="text-xs font-bold text-slate-300 block mb-1">IPN Webhook URL</label>
                          <code className="text-xs text-indigo-400 break-all">https://api.yourlms.com/api/webhooks/payments/paypal</code>
                      </div>
                  </>
              )}

              <div className="space-y-1 pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-400">Integration Status</label>
                  <Select value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="Configured">Configured (Pending Test)</option>
                      <option value="Active">Active (Live)</option>
                      <option value="Not Configured">Disabled</option>
                  </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                  <Button variant="primary" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Configuration'}
                  </Button>
              </div>
          </form>
      </Modal>

    </div>
  );
};

export default Integrations;
