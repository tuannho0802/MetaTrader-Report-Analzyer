import { Search, Calendar, Download, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TableToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateFilter: { from: string; to: string } | null;
  onDateFilterChange: (filter: { from: string; to: string } | null) => void;
  onExport: () => void;
  totalResults: number;
  totalTrades: number;
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  onExport,
  totalResults,
  totalTrades
}: TableToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
      {/* Real-time Search */}
      <div className="flex-1 relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm ticket, EA ID, symbol, comment, profit..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-32"
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-24 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {(searchQuery || dateFilter) && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background pl-2">
            {totalResults} / {totalTrades}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Secondary Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={dateFilter ? "default" : "outline"} className="gap-2 flex-1 sm:flex-none">
              <Calendar className="h-4 w-4" />
              {dateFilter 
                ? `${formatDate(dateFilter.from)} - ${formatDate(dateFilter.to)}`
                : 'Lọc ngày'
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Từ ngày</label>
                <Input
                  type="date"
                  value={dateFilter?.from || ''}
                  onChange={(e) => onDateFilterChange({
                    from: e.target.value,
                    to: dateFilter?.to || e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Đến ngày</label>
                <Input
                  type="date"
                  value={dateFilter?.to || ''}
                  min={dateFilter?.from}
                  onChange={(e) => onDateFilterChange({
                    from: dateFilter?.from || e.target.value,
                    to: e.target.value
                  })}
                />
              </div>
              <div className="flex justify-between gap-2 pt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDateFilterChange(null)}
                  disabled={!dateFilter}
                >
                  Xóa lọc
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Export Button */}
        <Button onClick={onExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          CSV
        </Button>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
