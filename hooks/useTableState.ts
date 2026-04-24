import { useState, useMemo } from 'react';
import { Trade } from '@/lib/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type SortDirection = 'asc' | 'desc' | null;
export type SortableColumn = 
  | 'ticket' 
  | 'eaId' 
  | 'openTime' 
  | 'closeTime' 
  | 'type' 
  | 'size' 
  | 'item' 
  | 'profit' 
  | 'comment'
  | 'similarity';

export function useTableState(trades: Trade[]) {
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Reset to page 1 when filters or page size change
  useMemo(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, dateFilter, sortColumn, sortDirection, pageSize]);

  // Sort handler: ASC → DESC → Reset
  const handleSort = (column: SortableColumn) => {
    if (sortColumn !== column) {
      setSortColumn(column);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortColumn(null);
      setSortDirection(null);
    }
  };

  // Apply filters and sorting
  const processedTrades = useMemo(() => {
    let result = [...trades];

    // 1. Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(trade => 
        trade.ticket.toLowerCase().includes(query) ||
        (trade.eaId && trade.eaId.toLowerCase().includes(query)) ||
        trade.item.toLowerCase().includes(query) ||
        (trade.comment && trade.comment.toLowerCase().includes(query)) ||
        trade.profit.toString().includes(query) ||
        trade.size.toString().includes(query)
      );
    }

    // 2. Apply date filter (secondary filter)
    if (dateFilter) {
      const fromDate = new Date(dateFilter.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateFilter.to);
      toDate.setHours(23, 59, 59, 999);

      result = result.filter(trade => {
        // Handle dates with dots like 2026.04.15
        const parseDateString = (d: string) => new Date(d.replace(/\./g, '/'));
        const openDate = parseDateString(trade.openTime);
        const closeDate = parseDateString(trade.closeTime);
        return (openDate >= fromDate && openDate <= toDate) ||
               (closeDate >= fromDate && closeDate <= toDate);
      });
    }

    // 3. Apply sorting
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case 'ticket':
            aValue = parseInt(a.ticket);
            bValue = parseInt(b.ticket);
            break;
          case 'eaId':
            aValue = parseInt(a.eaId || '0');
            bValue = parseInt(b.eaId || '0');
            break;
          case 'openTime':
          case 'closeTime':
            aValue = new Date(a[sortColumn].replace(/\./g, '/')).getTime();
            bValue = new Date(b[sortColumn].replace(/\./g, '/')).getTime();
            break;
          case 'profit':
          case 'size':
          case 'similarity':
            aValue = a[sortColumn];
            bValue = b[sortColumn];
            break;
          case 'type':
          case 'item':
          case 'comment':
            aValue = (a[sortColumn] || '').toLowerCase();
            bValue = (b[sortColumn] || '').toLowerCase();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [trades, sortColumn, sortDirection, debouncedSearchQuery, dateFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedTrades.length / pageSize));
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTrades.slice(start, start + pageSize);
  }, [processedTrades, currentPage, pageSize]);

  return {
    // Data
    paginatedTrades,
    totalTrades: processedTrades.length,
    totalPages,
    
    // Sort state
    sortColumn,
    sortDirection,
    handleSort,
    
    // Search state
    searchQuery,
    setSearchQuery,
    
    // Date filter state
    dateFilter,
    setDateFilter,
    
    // Pagination state
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
  };
}
