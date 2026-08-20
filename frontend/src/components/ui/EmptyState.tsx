import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onActionClick?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onActionClick,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-850 rounded-2xl bg-slate-900/5 min-h-[280px] ${className}`}>
      <div className="flex items-center justify-center p-3.5 bg-slate-950/80 rounded-2xl border border-slate-850 mb-4 text-violet-400 shadow-inner shadow-violet-950/10">
        {icon || <HelpCircle className="h-6 w-6" />}
      </div>
      <h3 className="font-display text-base font-semibold text-slate-200 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-400 font-medium max-w-sm mb-5 leading-normal">{description}</p>
      {actionLabel && onActionClick && (
        <Button variant="primary" size="sm" onClick={onActionClick}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;
