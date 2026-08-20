import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  fullWidth?: boolean;
  placeholder?: string;
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = '',
      label,
      error,
      helperText,
      options,
      fullWidth = true,
      id,
      disabled,
      placeholder,
      children,
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
        <div className="relative">
          <select
            ref={ref}
            id={uniqueId}
            disabled={disabled}
            className={`
              w-full rounded-lg border bg-slate-900 px-3.5 py-2 pr-10 text-sm text-slate-200 transition-all duration-200 focus-ring appearance-none cursor-pointer
              disabled:opacity-50 disabled:bg-slate-950 disabled:border-slate-800/80
              ${error ? 'border-rose-900/60 focus:ring-rose-500' : 'border-slate-800 hover:border-slate-700 focus:border-violet-500'}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              : children}
          </select>
          {/* Custom dropdown indicator chevron */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none flex items-center justify-center">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
