import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onClear: () => void;
}
const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear
}) => {
  return <div className="flex items-center gap-2 mb-4 bg-gray-200">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">From:</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[120px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'dd/MM/yyyy') : 'Start Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={startDate || undefined} onSelect={onStartDateChange} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">To:</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[120px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'dd/MM/yyyy') : 'End Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={endDate || undefined} onSelect={onEndDateChange} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <Button onClick={onClear} variant="outline" size="sm">
        Clear
      </Button>
    </div>;
};
export default DateRangeFilter;