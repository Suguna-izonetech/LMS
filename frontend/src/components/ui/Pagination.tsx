import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPageChange,
  onNext,
  onPrev
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-2 py-3">
      <div className="text-sm text-slate-400">
        Showing <span className="font-medium text-slate-200">{startIndex + 1}</span> to <span className="font-medium text-slate-200">{endIndex}</span> of <span className="font-medium text-slate-200">{totalItems}</span> results
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-300"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
            // Simple pagination display: show first, last, current, and adjacent pages
            if (
              page === 1 || 
              page === totalPages || 
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {page}
                </button>
              );
            } else if (
              page === currentPage - 2 ||
              page === currentPage + 2
            ) {
              return <span key={page} className="px-2 text-slate-500">...</span>;
            }
            return null;
          })}
        </div>

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-300"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
