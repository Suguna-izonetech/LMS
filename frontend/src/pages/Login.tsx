import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
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
      const authUser = await login(email, password);
      toast.success('Signed in successfully!');
      
      if (authUser?.roles) {
        const roles = authUser.roles.map(r => r.name.toLowerCase());
        if (roles.includes('student')) {
          navigate('/student/dashboard');
        } else if (roles.includes('instituteadmin')) {
          navigate('/institute-admin/dashboard');
        } else if (roles.includes('admin') || roles.includes('platformadmin')) {
          navigate('/admin/dashboard');
        } else {
          navigate('/teacher/dashboard');
        }
      } else {
        navigate('/teacher/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message || 'Invalid email or password.';
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 font-display text-lg font-bold text-slate-100 shadow-md shadow-violet-900/30">
            iZ
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            iZone <span className="text-violet-500">LMS</span> Portal
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Sign in to access your role dashboard and classrooms
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address / Username"
                placeholder="teacher@kite.lms"
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
                <Button type="submit" className="w-full bg-violet-650 hover:bg-violet-550 cursor-pointer" isLoading={isLoading}>
                  Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo Helper Info */}
        <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-4 text-xs text-slate-400 space-y-1.5">
          <p className="font-bold text-slate-300 text-center mb-2">Development Credentials (Password: <span className="text-violet-400">password123</span>)</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-violet-500/50" onClick={() => { setEmail('institute_admin'); setPassword('password123'); }}>
              <span className="font-bold text-emerald-400 block">Institute Admin</span>
              <span className="text-slate-400">institute_admin</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-violet-500/50" onClick={() => { setEmail('teacher@kite.lms'); setPassword('password123'); }}>
              <span className="font-bold text-violet-400 block">Teacher</span>
              <span className="text-slate-400">teacher@kite.lms</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-violet-500/50" onClick={() => { setEmail('student@kite.lms'); setPassword('password123'); }}>
              <span className="font-bold text-sky-400 block">Student</span>
              <span className="text-slate-400">student@kite.lms</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-violet-500/50" onClick={() => { setEmail('platform_admin'); setPassword('password123'); }}>
              <span className="font-bold text-indigo-400 block">Platform Admin</span>
              <span className="text-slate-400">platform_admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
