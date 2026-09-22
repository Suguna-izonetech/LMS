import React, { useState } from 'react';
import { Globe, MapPin, Save, CheckCircle } from 'lucide-react';
import {
  PageHeader,
  Breadcrumb,
  Card,
  CardContent,
  Button,
  Input
} from '../components/ui';

export const InstituteProfile: React.FC = () => {
  // Tabs config
  const [activeTab, setActiveTab] = useState('branding');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Branding state ---
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&q=80');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1557683316-973673baf926?w=600&q=80');
  const [primaryTheme, setPrimaryTheme] = useState('#6366f1');

  // --- Info state ---
  const [instName, setInstName] = useState('iZone Developer Academy');
  const [instAbout, setInstAbout] = useState('An advanced, SaaS-enabled educational academy for professional web engineering.');
  const [instEmail, setInstEmail] = useState('support@izonedev.com');
  const [instPhone, setInstPhone] = useState('+1 (555) 019-9231');
  const [instAddress, setInstAddress] = useState('Building 42, Silicon Valley, CA');

  // --- Media & Socials ---
  const [youtubeChannel, setYoutubeChannel] = useState('https://youtube.com/c/izonedevacademy');
  const [socialFb, setSocialFb] = useState('https://facebook.com/izonedev');
  const [socialLinkedin, setSocialLinkedin] = useState('https://linkedin.com/company/izonedev');

  // --- Domains ---
  const [subdomain, setSubdomain] = useState('izonedev');
  const [customDomain, setCustomDomain] = useState('academy.izonedev.com');

  // --- SEO ---
  const [seoTitle, setSeoTitle] = useState('iZone Developer Academy - Master Modern Coding');
  const [seoKeywords, setSeoKeywords] = useState('coding bootcamp, react course, data science, software engineer');
  const [seoDesc, setSeoDesc] = useState('Join the premier SaaS development camp. Master React, Python, and full stack systems.');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  const handleUploadImage = (type: 'logo' | 'banner') => {
    if (type === 'logo') {
      setLogoUrl('https://images.unsplash.com/photo-1572044160444-ad60f028b14a?w=120&q=80');
    } else {
      setBannerUrl('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80');
    }
  };

  const tabsItems = [
    { id: 'branding', label: 'Branding & Theme' },
    { id: 'info', label: 'Identity & Map' },
    { id: 'socials', label: 'Socials & Media' },
    { id: 'domain', label: 'Domain Settings' },
    { id: 'seo', label: 'SEO Metadata' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institute Profile Configuration"
        description="Establish identity credentials, upload logos, configure customized subdomains, and edit SEO tags."
        breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Profile' }]} />}
      />

      {saveSuccess && (
        <div className="bg-emerald-950/20 border border-emerald-900/60 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-xs font-semibold">
          <CheckCircle className="h-4.5 w-4.5 fill-emerald-500/10 shrink-0" />
          <span>Profile configuration parameters updated successfully! Changes are propagated across the LMS template client.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-800">
          <div className="flex gap-4">
            {tabsItems.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-xs font-bold border-b-2 px-1 transition-all cursor-pointer ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content panels */}
        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logo & Visuals</span>
                  
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400">Academy Logo</label>
                      <div className="w-24 h-24 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center p-3 relative group shadow-inner">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-md" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                          <button type="button" onClick={() => handleUploadImage('logo')} className="text-[10px] font-bold text-indigo-400 hover:underline">Change</button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-600">Recommends 512x512 PNG format.</p>
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-semibold text-slate-400">Branding Banner Header</label>
                      <div className="h-24 w-full rounded-xl border border-slate-800 bg-slate-950 overflow-hidden relative group shadow-inner">
                        <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => handleUploadImage('banner')} className="text-[10px] font-bold text-indigo-400 hover:underline">Replace Banner</button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-600 font-medium">Recommends 1200x400 Landscape vector background.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visual Color Theme</span>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Primary Brand Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryTheme}
                        onChange={e => setPrimaryTheme(e.target.value)}
                        className="bg-transparent border-0 w-8 h-8 cursor-pointer rounded-full"
                      />
                      <Input
                        value={primaryTheme}
                        onChange={e => setPrimaryTheme(e.target.value)}
                        className="max-w-[120px] font-mono text-xs text-center"
                      />
                      <span className="text-xs text-slate-500">Determines visual outline color rings and buttons color weights.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Branding Preview</span>
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-md">
                    <img src={bannerUrl} alt="Banner prev" className="h-16 w-full object-cover" />
                    <div className="p-4 flex gap-3 -mt-6 relative">
                      <img src={logoUrl} alt="Logo prev" className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-lg p-1 shrink-0 shadow-md" />
                      <div className="flex flex-col pt-6 leading-tight">
                        <span className="text-xs font-bold text-slate-200">{instName || 'Academy Name'}</span>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5" style={{ color: primaryTheme }}>Theme Active</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identity Details</span>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Academy Name <span className="text-red-500">*</span></label>
                    <Input value={instName} onChange={e => setInstName(e.target.value)} placeholder="e.g. KITE Developer Center" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">About / Description</label>
                    <textarea
                      value={instAbout}
                      onChange={e => setInstAbout(e.target.value)}
                      placeholder="About details for student catalogs..."
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact & Office Address</span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">Support Email Address</label>
                      <Input type="email" value={instEmail} onChange={e => setInstEmail(e.target.value)} placeholder="admin@institution.edu" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">Support Contact Number</label>
                      <Input value={instPhone} onChange={e => setInstPhone(e.target.value)} placeholder="+1 (555) 019-2831" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Office Physical Address</label>
                    <Input value={instAddress} onChange={e => setInstAddress(e.target.value)} placeholder="123 Education Boulevard, Suite 400..." />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Office Map</span>
                  <div className="aspect-square bg-slate-950 border border-slate-850 rounded-xl overflow-hidden relative flex items-center justify-center p-3 text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-40" />
                    <div className="space-y-2 z-10">
                      <MapPin className="h-6 w-6 text-indigo-400 mx-auto" />
                      <span className="text-xs font-semibold text-slate-300 block">{instAddress || 'Coordinates Unassigned'}</span>
                      <p className="text-[10px] text-slate-550 leading-relaxed max-w-[200px] mx-auto">Google Maps integration available. Configure API parameters in settings.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'socials' && (
          <div className="space-y-6 max-w-3xl">
            <Card>
              <CardContent className="p-6 space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Social Channels & Youtube Integration</span>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">YouTube Channel URL (Video Integration)</label>
                  <Input value={youtubeChannel} onChange={e => setYoutubeChannel(e.target.value)} placeholder="e.g. https://youtube.com/c/channel_id" />
                  <p className="text-[10px] text-slate-600">Maps latest video embeds directly into student course directory panels.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Facebook URL</label>
                    <Input value={socialFb} onChange={e => setSocialFb(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">LinkedIn Company Page</label>
                    <Input value={socialLinkedin} onChange={e => setSocialLinkedin(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'domain' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subdomain & Domain Parameters</span>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">iZone LMS Subdomain</label>
                    <div className="flex items-center">
                      <Input
                        value={subdomain}
                        onChange={e => setSubdomain(e.target.value)}
                        className="rounded-r-none text-right font-semibold"
                      />
                      <span className="bg-slate-900 border border-l-0 border-slate-800 px-3.5 py-2 rounded-r-lg text-xs font-bold text-slate-500 select-none">
                        .izonelms.com
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Custom Canonical Domain</label>
                    <Input value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="e.g. learn.myacademy.org" />
                  </div>
                </CardContent>
              </Card>

              {/* DNS table */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">DNS Configuration Records</span>
                  <p className="text-xs text-slate-400">Map the following DNS records inside your domain provider dashboard (GoDaddy, Cloudflare, etc.) to activate custom domain proxying.</p>
                  
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                          <th className="p-2.5 font-bold">Type</th>
                          <th className="p-2.5 font-bold">Host / Name</th>
                          <th className="p-2.5 font-bold">Value / Point To</th>
                          <th className="p-2.5 font-bold">TTL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-300 font-mono">
                        <tr>
                          <td className="p-2.5 font-bold text-slate-500">CNAME</td>
                          <td className="p-2.5">academy</td>
                          <td className="p-2.5">domains.izonelms.com</td>
                          <td className="p-2.5">Automatic</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-500">A</td>
                          <td className="p-2.5">@</td>
                          <td className="p-2.5">185.199.108.153</td>
                          <td className="p-2.5">3600 (1 Hr)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WordPress Sync Portal</span>
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2 text-center">
                    <Globe className="h-6 w-6 text-indigo-400 mx-auto" />
                    <span className="text-xs font-bold text-slate-200 block">WordPress integration sync active</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Map catalog widgets to WordPress layouts using iZone official shortcode plugins.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-6 max-w-3xl">
            <Card>
              <CardContent className="p-6 space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Google SEO Metadata</span>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350">Default Browser Page Title</label>
                  <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350">SEO Keyword Tags (Comma Separated)</label>
                  <Input value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350">Meta Description Summary</label>
                  <textarea
                    value={seoDesc}
                    onChange={e => setSeoDesc(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form controls button footer */}
        <div className="flex gap-2 justify-end max-w-3xl pt-2">
          <Button
            variant="primary"
            leftIcon={<Save className="h-4 w-4" />}
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? 'Saving Configurations...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InstituteProfile;
