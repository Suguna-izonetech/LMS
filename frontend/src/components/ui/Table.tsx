import React from 'react';

// Basic sub-components for custom layouts
export const TableContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20 ${className}`} {...props}>
    {children}
  </div>
);

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className = '', children, ...props }, ref) => (
    <table ref={ref} className={`w-full border-collapse text-left text-sm text-slate-300 ${className}`} {...props}>
      {children}
    </table>
  )
);
Table.displayName = 'Table';

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className = '', ...props }) => (
  <thead className={`bg-slate-900/60 border-b border-slate-850 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className = '', ...props }) => (
  <tbody className={`divide-y divide-slate-900/60 bg-transparent ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className = '', ...props }) => (
  <tr className={`transition-colors hover:bg-slate-900/40 border-b border-slate-900/20 ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHeaderCell: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <th className={`px-5 py-3 font-bold select-none ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <td className={`px-5 py-3 text-xs md:text-sm text-slate-300 align-middle ${className}`} {...props}>
    {children}
  </td>
);
