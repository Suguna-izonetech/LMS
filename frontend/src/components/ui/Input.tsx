import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      id,
      disabled,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const uniqueId = id || React.useId();

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'} flex flex-col gap-1.5`}>
        {label && (
          <label
            htmlFor={uniqueId}
            className="text-xs font-semibold text-slate-400 tracking-wide uppercase select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-500 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={uniqueId}
            type={type}
            disabled={disabled}
            className={`
              w-full rounded-lg border bg-slate-900 px-3.5 py-2 text-sm text-slate-200 transition-all duration-200 focus-ring
              placeholder:text-slate-600 disabled:opacity-50 disabled:bg-slate-950 disabled:border-slate-800/80
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-rose-900/60 focus:ring-rose-500' : 'border-slate-800 hover:border-slate-700 focus:border-violet-500'}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-slate-500 pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
