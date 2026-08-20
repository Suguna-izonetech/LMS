import React from 'react';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  outline?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  children,
  variant = 'neutral',
  outline = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold select-none border tracking-wide uppercase';

  const styles = {
    neutral: outline
      ? 'border-slate-700 bg-transparent text-slate-400'
      : 'border-slate-800 bg-slate-800 text-slate-300',
    info: outline
      ? 'border-violet-800 bg-transparent text-violet-400'
      : 'border-violet-950 bg-violet-950/40 text-violet-300',
    success: outline
      ? 'border-emerald-800 bg-transparent text-emerald-400'
      : 'border-emerald-950 bg-emerald-950/40 text-emerald-300',
    warning: outline
      ? 'border-amber-800 bg-transparent text-amber-400'
      : 'border-amber-950 bg-amber-950/40 text-amber-300',
    danger: outline
      ? 'border-rose-800 bg-transparent text-rose-400'
      : 'border-rose-950 bg-rose-950/40 text-rose-300',
  };

  return (
    <span className={`${baseStyles} ${styles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
