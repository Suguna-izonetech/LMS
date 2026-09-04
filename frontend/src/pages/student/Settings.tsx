import React, { useState } from 'react';
import { User, KeyRound, Bell, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const StudentSettings: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          Account Settings & Preferences
        </h1>
        <p className="text-sm text-slate-400">
          Manage your student profile information, security credentials, and notification settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-sky-400" />
              <span>Student Profile Information</span>
            </CardTitle>
            <CardDescription>Your registered student details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Username" value={user?.username || ''} disabled />
              <Input label="Email Address" value={user?.email || ''} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-sky-400" />
              <span>Security & Password</span>
            </CardTitle>
            <CardDescription>Update your account access password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <Input
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button type="submit" isLoading={updating} className="bg-sky-600 hover:bg-sky-500 cursor-pointer">
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default StudentSettings;
