import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Globe } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Platform Admin authenticated!');
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Invalid admin credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 font-display text-lg font-bold text-slate-100 shadow-md shadow-indigo-900/30">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            KITE <span className="text-indigo-400">ADMIN</span> Portal
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Platform governance and ecosystem administration
          </p>
        </div>

        <Card className="border-indigo-900/40">
          <CardHeader className="pb-4">
            <CardTitle>Platform Sign In</CardTitle>
            <CardDescription>Enter admin credentials to access global LMS configuration.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Platform Admin Email / Username"
                placeholder="platformadmin@kite.lms"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Password"
                placeholder="••••••••"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<KeyRound className="h-4 w-4" />}
              />

              {error && <p className="text-xs text-rose-450 font-semibold">{error}</p>}

              <div className="pt-2">
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-md shadow-indigo-900/30" isLoading={isLoading}>
                  Sign In to Platform Admin
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo Helper Info */}
        <div className="rounded-lg bg-slate-900/50 border border-slate-900 p-4 text-center text-xs text-slate-400">
          <p className="font-bold text-slate-300 mb-1">Platform Admin Credentials</p>
          <p>Login: <span className="text-indigo-300 font-semibold">platformadmin@kite.lms</span> (or <span className="text-indigo-300 font-semibold">platform_admin</span>) / <span className="text-indigo-300 font-semibold">password123</span></p>
        </div>
      </div>
    </div>
  );
};
export default AdminLogin;
