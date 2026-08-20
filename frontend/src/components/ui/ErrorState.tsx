import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-rose-950/60 bg-rose-950/5 rounded-2xl min-h-[280px] ${className}`}>
      <div className="flex items-center justify-center p-3.5 bg-rose-950/30 border border-rose-900/50 rounded-2xl mb-4 text-rose-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="font-display text-base font-semibold text-rose-350 mb-1.5">{title}</h3>
      <p className="text-sm text-rose-400/70 font-medium max-w-sm mb-5 leading-normal">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
export default ErrorState;
