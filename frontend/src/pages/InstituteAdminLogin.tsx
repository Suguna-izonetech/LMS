import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

export const InstituteAdminLogin: React.FC = () => {
  const { instituteLogin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await instituteLogin(email, password, rememberMe);
      toast.success('Signed in successfully!');
      navigate('/institute-admin/dashboard');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Invalid email or password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      toast.success(response.data.detail || 'Password reset link sent.');
      setIsForgotPassword(false);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to request password reset.';
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 font-display text-lg font-bold text-slate-100 shadow-md shadow-emerald-900/30">
            K
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            KITE <span className="text-emerald-500">LMS</span> Admin
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Sign in to access your institute's management portal
          </p>
        </div>

        <Card>
          {!isForgotPassword ? (
            <>
              <CardHeader className="pb-4">
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Enter your credentials to access the institute dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <Input
                    label="Email Address / Username"
                    placeholder="admin@kite.lms"
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
                  
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-600/50"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      Remember Session
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm font-semibold text-emerald-500 hover:text-emerald-400"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {error && <p className="text-xs text-rose-450 font-semibold">{error}</p>}

                  <div className="pt-2">
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 cursor-pointer" isLoading={isLoading}>
                      Sign In
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="pb-4">
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>Enter your email to receive a password reset link.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <Input
                    label="Email Address"
                    placeholder="admin@kite.lms"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="h-4 w-4" />}
                  />

                  {error && <p className="text-xs text-rose-450 font-semibold">{error}</p>}

                  <div className="pt-2 flex flex-col gap-3">
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 cursor-pointer" isLoading={isLoading}>
                      Send Reset Link
                    </Button>
                    <button 
                      type="button" 
                      onClick={() => setIsForgotPassword(false)}
                      className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-300 w-full py-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to login
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        {/* Demo Helper Info */}
        <div className="rounded-lg bg-slate-900/45 border border-slate-900/70 p-4 text-center text-xs text-slate-500">
          <p className="font-bold text-slate-400 mb-1">Development Credentials</p>
          <p className="mb-0.5">Institute Admin: <span className="text-slate-350 font-semibold">institute_admin</span> / <span className="text-slate-350 font-semibold">password123</span></p>
        </div>
      </div>
    </div>
  );
};

export default InstituteAdminLogin;
