import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-ring cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

    // Variant styles
    const variants = {
      primary: 'bg-violet-600 hover:bg-violet-500 text-slate-100 border border-violet-700/50 shadow-sm shadow-violet-900/10 active:scale-[0.98]',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 active:scale-[0.98]',
      outline: 'bg-transparent border border-slate-700 hover:bg-slate-900/50 text-slate-300 hover:text-slate-100 active:scale-[0.98]',
      ghost: 'bg-transparent hover:bg-slate-900/50 text-slate-400 hover:text-slate-200',
      danger: 'bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-900/50 active:scale-[0.98]',
    };

    // Size styles
    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
