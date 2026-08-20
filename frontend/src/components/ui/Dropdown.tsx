import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItemProps {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItemProps[];
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (onClick?: () => void) => {
    if (onClick) {
      onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer select-none">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-30 mt-1.5 w-48 rounded-lg border border-slate-800 bg-slate-900 shadow-xl overflow-hidden focus:outline-hidden
            ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}
          `}
        >
          <div className="py-1">
            {items.map((item, index) => {
              const isDanger = item.variant === 'danger';
              return (
                <button
                  key={index}
                  onClick={() => !item.disabled && handleItemClick(item.onClick)}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors duration-150 cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      isDanger
                        ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-350'
                        : 'text-slate-300 hover:bg-slate-850 hover:text-slate-100'
                    }
                  `}
                >
                  {item.icon && <span className="text-slate-500 shrink-0">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownSeparator: React.FC = () => (
  <div className="border-t border-slate-800/80 my-1" />
);
