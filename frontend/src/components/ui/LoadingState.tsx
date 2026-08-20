import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center min-h-[280px] ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin text-violet-500 mb-4" />
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 select-none">{message}</p>
    </div>
  );
};
export default LoadingState;
