import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
  initialPage?: number;
}

export function usePagination<T>({ data, itemsPerPage = 10, initialPage = 1 }: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  // Ensure current page is within bounds when data changes
  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, safeCurrentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const nextPage = () => goToPage(safeCurrentPage + 1);
  const prevPage = () => goToPage(safeCurrentPage - 1);

  return {
    currentPage: safeCurrentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    startIndex: (safeCurrentPage - 1) * itemsPerPage,
    endIndex: Math.min(safeCurrentPage * itemsPerPage, data.length),
    totalItems: data.length
  };
}
