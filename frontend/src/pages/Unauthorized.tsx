import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-955/20 border border-rose-500/20 text-rose-450 shadow-lg shadow-rose-950/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            Access Denied
          </h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Your account does not have permission to access the Teacher Portal. This workspace is restricted to active Teacher or Admin accounts.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-violet-650 hover:bg-violet-550 cursor-pointer"
          >
            Return to Login
          </Button>
        </div>
      </div>
    </div>
  );
};
export default Unauthorized;
