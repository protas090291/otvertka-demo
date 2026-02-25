import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import FullscreenCalendar from './FullscreenCalendar';

interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
  placeholder?: string;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  placeholder = "Выберите период",
  className = ""
}) => {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);


  const formatDateRange = () => {
    if (!startDate && !endDate) return placeholder;
    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('ru-RU');
      const end = new Date(endDate).toLocaleDateString('ru-RU');
      return `${start} - ${end}`;
    }
    if (startDate) {
      return `с ${new Date(startDate).toLocaleDateString('ru-RU')}`;
    }
    if (endDate) {
      return `до ${new Date(endDate).toLocaleDateString('ru-RU')}`;
    }
    return placeholder;
  };

  const clearSelection = () => {
    onDateRangeChange(null, null);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Кнопка выбора даты */}
        <button
          onClick={() => setIsFullscreenOpen(true)}
          className="w-full px-4 py-2 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 bg-white/5 text-left flex items-center justify-between hover:bg-white/10 text-white transition-colors"
        >
          <span className={!startDate && !endDate ? 'text-slate-500' : 'text-slate-100'}>
            {formatDateRange()}
          </span>
          <div className="flex items-center space-x-2">
            {(startDate || endDate) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
        </button>

      </div>

      {/* Полноэкранный календарь */}
      <FullscreenCalendar
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
        title="Выберите период для журнала работ"
      />
    </>
  );
};

export default DateRangePicker;
