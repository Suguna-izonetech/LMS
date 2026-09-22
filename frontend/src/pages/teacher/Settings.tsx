import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Shield, Key, Check, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { teacherApi } from '../../api/teacher';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const settings = await teacherApi.getSettings();
      setUsername(settings.username);
      setEmail(settings.email);
      setPhone(settings.phone || '');
    } catch (err) {
      toast.error('Failed to load profile settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) {
      toast.error('Username and Email are required.');
      return;
    }
    try {
      setSavingProfile(true);
      await teacherApi.updateProfile({ username, email, phone });
      toast.success('Profile details updated successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update profile.';
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('New password and confirmation are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters.');
      return;
    }

    try {
      setSavingPassword(true);
      await teacherApi.changePassword({
        new_password: newPassword,
      });
      toast.success('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to change password.';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-violet-400" />
          <span>Teacher Settings</span>
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Manage your account profile settings and password security.
        </p>
      </div>

      {/* Account Info Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Username</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Email Address</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Phone Number</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
            </div>

            <Button
              type="submit"
              disabled={savingProfile}
              className="w-full bg-violet-650 hover:bg-violet-550 cursor-pointer mt-2"
            >
              {savingProfile ? 'Saving Details...' : 'Save Profile Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4.5 w-4.5 text-violet-400" />
            <span>Update Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">New Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Confirm New Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={savingPassword}
              className="w-full bg-violet-650 hover:bg-violet-550 cursor-pointer mt-2"
            >
              {savingPassword ? 'Updating...' : 'Save Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
export default Settings;
