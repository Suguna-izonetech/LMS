import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
  fullWidth?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = '', value, onChange, onClear, fullWidth = true, placeholder = 'Search...', ...props }, ref) => {
    const handleClear = () => {
      if (onClear) {
        onClear();
      }
    };

    const hasValue = value !== undefined && value !== null && value !== '';

    return (
      <div className={`relative flex items-center ${fullWidth ? 'w-full' : 'w-72'}`}>
        <div className="absolute left-3 text-slate-500 pointer-events-none flex items-center justify-center">
          <Search className="h-4 w-4" />
        </div>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full rounded-lg border bg-slate-900 pl-10 pr-9 py-2 text-sm text-slate-200 transition-all duration-200 focus-ring border-slate-800 hover:border-slate-700 focus:border-violet-500
            placeholder:text-slate-600 disabled:opacity-50
            ${className}
          `}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors focus-ring"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
