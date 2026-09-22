import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Building, Monitor, MessageSquare, Shield, Save, MapPin
} from 'lucide-react';
import api from '../api/client';
import {
  PageHeader, Breadcrumb, Card, CardContent, Button, Input, LoadingState
} from '../components/ui';
import { useToast } from '../context/ToastContext';

export const Settings: React.FC<{ defaultTab?: string }> = ({ defaultTab }) => {
  const [activeTab, setActiveTab] = useState<'my_profile' | 'institute_profile' | 'class_integrations' | 'social_connect' | 'security'>(
      defaultTab === 'login' || defaultTab === 'security' ? 'security' :
      defaultTab === 'class' ? 'class_integrations' :
      defaultTab === 'chat-social' ? 'social_connect' :
      defaultTab === 'billing' ? 'institute_profile' :
      'my_profile'
  );
  const [uiState, setUiState] = useState<'loading' | 'normal' | 'error'>('loading');
  const [isSaving, setIsSaving] = useState(false);
  const { success, error: showError } = useToast();

  // My Profile
  const [myProfile, setMyProfile] = useState<any>({ name: '', email: '', phone: '', role: '', profile_image_url: null });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  // Institute Profile
  const [instProfile, setInstProfile] = useState<any>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Institute Settings
  const [settings, setSettings] = useState<any>({});

  const fetchData = async () => {
      setUiState('loading');
      try {
          const [meRes, instRes, setRes] = await Promise.all([
              api.get('/auth/me'),
              api.get('/institute-admin/institute/profile'),
              api.get('/institute-admin/institute/settings')
          ]);
          const userData = meRes.data?.user || meRes.data || {};
          setMyProfile({
              name: userData.name || userData.username || '',
              email: userData.email || '',
              phone: userData.phone || '',
              role: (userData.roles && userData.roles[0]?.name) || userData.role || 'Institute Admin',
              profile_image_url: userData.profile_image_url || null,
              ...userData
          });
          setInstProfile(instRes.data || {});
          setSettings(setRes.data || {});
          setUiState('normal');
      } catch (err) {
          console.error(err);
          showError("Failed to load settings data");
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleMyProfileSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          const fd = new FormData();
          fd.append('name', myProfile?.name || '');
          fd.append('email', myProfile?.email || '');
          if (myProfile?.phone) fd.append('phone', myProfile.phone);
          if (profileImageFile) fd.append('profile_image', profileImageFile);
          
          await api.put('/institute-admin/profile', fd);
          success('Profile updated successfully');
          fetchData();
      } catch (e) {
          showError('Failed to update profile');
      } finally {
          setIsSaving(false);
      }
  };

  const handleInstProfileSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          const fd = new FormData();
          fd.append('data', JSON.stringify({
              name: instProfile?.name || '',
              about_text: instProfile?.about_text || '',
              phone: instProfile?.phone || '',
              email: instProfile?.email || '',
              address: instProfile?.address || '',
              google_maps_link: instProfile?.google_maps_link || '',
              youtube_link: instProfile?.youtube_link || '',
              subdomain: instProfile?.subdomain || '',
              custom_domain: instProfile?.custom_domain || ''
          }));
          if (logoFile) fd.append('logo', logoFile);
          if (bannerFile) fd.append('banner', bannerFile);

          await api.put('/institute-admin/institute/profile', fd);
          success('Institute Profile updated successfully');
          fetchData();
      } catch (e) {
          showError('Failed to update institute profile');
      } finally {
          setIsSaving(false);
      }
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          await api.put('/institute-admin/institute/settings', settings || {});
          success('Settings updated successfully');
          fetchData();
      } catch (e) {
          showError('Failed to update settings');
      } finally {
          setIsSaving(false);
      }
  };

  const handleSettingToggle = (key: string) => {
      setSettings((prev: any) => ({ ...prev, [key]: !prev?.[key] }));
  };

  if (uiState === 'loading') return (
      <div className="space-y-6">
          <PageHeader title="Settings" description="Manage platform configurations." breadcrumbs={[]} />
          <LoadingState message="Loading configurations..." />
      </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Configurations"
        description="Manage your personal profile, institute branding, and deep operational controls."
        breadcrumbs={<Breadcrumb items={[{ label: 'Institute Manager' }, { label: 'Settings' }]} />}
      />

      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800 flex-wrap">
        <button
          onClick={() => setActiveTab('my_profile')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'my_profile' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserIcon className="w-4 h-4" /> My Profile
        </button>
        <button
          onClick={() => setActiveTab('institute_profile')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'institute_profile' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" /> Institute Profile
        </button>
        <button
          onClick={() => setActiveTab('class_integrations')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'class_integrations' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-4 h-4" /> Class & Integrations
        </button>
        <button
          onClick={() => setActiveTab('social_connect')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'social_connect' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Chat & Social Connect
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'security' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" /> Security & Fairness
        </button>
      </div>

      {activeTab === 'my_profile' && (
          <form onSubmit={handleMyProfileSave} className="space-y-6">
              <Card>
                  <CardContent className="p-6 space-y-6">
                      <div className="flex items-center gap-6">
                          <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center">
                              {myProfile?.profile_image_url ? (
                                  <img src={`http://localhost:8000${myProfile.profile_image_url}`} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                  <UserIcon className="w-8 h-8 text-slate-500" />
                              )}
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-slate-200">Profile Avatar</h3>
                              <p className="text-sm text-slate-400 mb-2">Upload a picture to display on your dashboard.</p>
                              <input type="file" className="text-sm text-slate-300" onChange={e => setProfileImageFile(e.target.files?.[0] || null)} />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">Full Name</label>
                              <Input value={myProfile?.name || ''} onChange={e => setMyProfile({...myProfile, name: e.target.value})} required />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">Email Address (Requires Re-verification on change)</label>
                              <Input type="email" value={myProfile?.email || ''} onChange={e => setMyProfile({...myProfile, email: e.target.value})} required />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">Phone Number</label>
                              <Input value={myProfile?.phone || ''} onChange={e => setMyProfile({...myProfile, phone: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">Role</label>
                              <Input value={myProfile?.role || 'Institute Admin'} disabled className="opacity-50" />
                          </div>
                      </div>
                  </CardContent>
              </Card>
              <div className="flex justify-end">
                  <Button variant="primary" type="submit" disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" /> Save Personal Profile
                  </Button>
              </div>
          </form>
      )}

      {activeTab === 'institute_profile' && (
          <form onSubmit={handleInstProfileSave} className="space-y-6">
              <Card>
                  <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                          <div>
                              <h3 className="text-sm font-bold text-slate-200 mb-2">Institute Logo</h3>
                              <div className="h-24 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden mb-2 relative">
                                  {instProfile?.logo_url && <img src={`http://localhost:8000${instProfile.logo_url}`} className="h-full object-contain" alt="Logo" />}
                                  {!instProfile?.logo_url && <span className="text-slate-500 text-sm">No Logo Uploaded</span>}
                              </div>
                              <input type="file" className="text-xs text-slate-400" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                          </div>
                          <div>
                              <h3 className="text-sm font-bold text-slate-200 mb-2">Banner Image</h3>
                              <div className="h-24 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden mb-2 relative">
                                  {instProfile?.banner_url && <img src={`http://localhost:8000${instProfile.banner_url}`} className="w-full h-full object-cover" alt="Banner" />}
                                  {!instProfile?.banner_url && <span className="text-slate-500 text-sm">No Banner Uploaded</span>}
                              </div>
                              <input type="file" className="text-xs text-slate-400" onChange={e => setBannerFile(e.target.files?.[0] || null)} />
                          </div>
                      </div>

                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">Institute Name</label>
                          <Input value={instProfile?.name || ''} onChange={e => setInstProfile({...instProfile, name: e.target.value})} required />
                      </div>
                      
                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-400">About Section</label>
                          <textarea 
                              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-300"
                              rows={4}
                              value={instProfile?.about_text || ''}
                              onChange={e => setInstProfile({...instProfile, about_text: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">Contact Email</label>
                              <Input value={instProfile?.email || ''} onChange={e => setInstProfile({...instProfile, email: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">Contact Phone</label>
                              <Input value={instProfile?.phone || ''} onChange={e => setInstProfile({...instProfile, phone: e.target.value})} />
                          </div>
                          <div className="space-y-1 col-span-2">
                              <label className="text-xs font-semibold text-slate-400">Physical Address</label>
                              <Input value={instProfile?.address || ''} onChange={e => setInstProfile({...instProfile, address: e.target.value})} />
                          </div>
                          <div className="space-y-1 col-span-2">
                              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3"/> Google Maps URL</label>
                              <Input value={instProfile?.google_maps_link || ''} onChange={e => setInstProfile({...instProfile, google_maps_link: e.target.value})} placeholder="https://maps.google.com/..." />
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">Platform Subdomain</label>
                              <div className="flex">
                                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-700 bg-slate-800 text-slate-400 sm:text-sm">
                                      https://
                                  </span>
                                  <input type="text" value={instProfile?.subdomain || ''} onChange={e => setInstProfile({...instProfile, subdomain: e.target.value})} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md bg-slate-950 border border-slate-800 text-sm text-slate-200" />
                                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-700 bg-slate-800 text-slate-400 sm:text-sm">
                                      .izonelms.com
                                  </span>
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-400">Custom Domain (Requires Plan Add-on)</label>
                              <Input value={instProfile?.custom_domain || ''} onChange={e => setInstProfile({...instProfile, custom_domain: e.target.value})} placeholder="academy.yourbrand.com" />
                          </div>
                      </div>
                  </CardContent>
              </Card>
              <div className="flex justify-end">
                  <Button variant="primary" type="submit" disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" /> Save Institute Profile
                  </Button>
              </div>
          </form>
      )}

      {/* RENDER DYNAMIC SETTINGS FOR OTHER TABS */}
      {(activeTab === 'class_integrations' || activeTab === 'social_connect' || activeTab === 'security') && (
          <form onSubmit={handleSettingsSave} className="space-y-6">
              <Card>
                  <CardContent className="p-6 space-y-6">
                      
                      {activeTab === 'class_integrations' && (
                          <>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                      <label className="text-xs font-semibold text-slate-400">Time Zone</label>
                                      <select 
                                          value={settings?.time_zone || 'Asia/Kolkata'} 
                                          onChange={e => setSettings({...settings, time_zone: e.target.value})}
                                          className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-300"
                                      >
                                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                          <option value="America/New_York">America/New_York (EST)</option>
                                          <option value="Europe/London">Europe/London (GMT)</option>
                                      </select>
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-xs font-semibold text-slate-400">Country</label>
                                      <Input value={settings?.country || ''} onChange={e => setSettings({...settings, country: e.target.value})} />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-xs font-semibold text-slate-400">Minimum Attendance % Required</label>
                                      <Input type="number" value={settings?.min_attendance_percentage ?? 75} onChange={e => setSettings({...settings, min_attendance_percentage: parseInt(e.target.value) || 0})} />
                                  </div>
                              </div>
                              <div className="space-y-4 pt-4 border-t border-slate-800">
                                  <label className="flex items-center gap-3 cursor-pointer">
                                      <input type="checkbox" checked={!!settings?.share_zoom_recordings} onChange={() => handleSettingToggle('share_zoom_recordings')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                      <span className="text-sm font-medium text-slate-300">Share Zoom Recordings with Students automatically</span>
                                  </label>
                                  <label className="flex items-center gap-3 cursor-pointer">
                                      <input type="checkbox" checked={!!settings?.enable_student_feedback} onChange={() => handleSettingToggle('enable_student_feedback')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                      <span className="text-sm font-medium text-slate-300">Enable Student Feedback and Ratings for Courses</span>
                                  </label>
                              </div>
                          </>
                      )}

                      {activeTab === 'social_connect' && (
                          <div className="space-y-4">
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.chat_enabled} onChange={() => handleSettingToggle('chat_enabled')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Enable 1:1 Chat Platform-wide</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.disappearing_chats_enabled} onChange={() => handleSettingToggle('disappearing_chats_enabled')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Enable Disappearing Chats (24h auto-delete)</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.allow_message_deletion} onChange={() => handleSettingToggle('allow_message_deletion')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Allow Users to Delete Sent Messages</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.allow_student_posts} onChange={() => handleSettingToggle('allow_student_posts')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Allow Students to Create Newsfeed Posts</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.allow_student_comments} onChange={() => handleSettingToggle('allow_student_comments')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Allow Students to Comment on Newsfeed</span>
                              </label>
                          </div>
                      )}

                      {activeTab === 'security' && (
                          <div className="space-y-4">
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.hide_student_info_from_teachers} onChange={() => handleSettingToggle('hide_student_info_from_teachers')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Hide Student Contact Information from Teachers</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.restrict_teacher_content_visibility} onChange={() => handleSettingToggle('restrict_teacher_content_visibility')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Restrict Teachers to View Only Their Assigned Content</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.allow_study_material_download} onChange={() => handleSettingToggle('allow_study_material_download')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Allow Students to Download Study Materials</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.allow_book_download} onChange={() => handleSettingToggle('allow_book_download')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Allow Students to Download E-Books (Offline Access)</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.require_live_class_approval} onChange={() => handleSettingToggle('require_live_class_approval')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Require Admin Approval for Teacher Live Class Scheduling</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.strict_quiz_timing} onChange={() => handleSettingToggle('strict_quiz_timing')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Enforce Strict Server-Side Quiz Timing (Anti-Cheat)</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={!!settings?.strict_assignment_deadlines} onChange={() => handleSettingToggle('strict_assignment_deadlines')} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500" />
                                  <span className="text-sm font-medium text-slate-300">Prevent Task Submissions After Deadline Passes</span>
                              </label>
                          </div>
                      )}
                  </CardContent>
              </Card>
              <div className="flex justify-end">
                  <Button variant="primary" type="submit" disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" /> Save Settings
                  </Button>
              </div>
          </form>
      )}

    </div>
  );
};

export default Settings;
