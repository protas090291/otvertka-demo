import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface FullscreenCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string | null;
  endDate: string | null;
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
  title?: string;
}

const FullscreenCalendar: React.FC<FullscreenCalendarProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  onDateRangeChange,
  title = "Выберите период"
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState<string | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<string | null>(endDate);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Сброс временных значений при открытии
  useEffect(() => {
    if (isOpen) {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      if (startDate) {
        setCurrentMonth(new Date(startDate));
      } else if (endDate) {
        setCurrentMonth(new Date(endDate));
      }
    }
  }, [isOpen, startDate, endDate]);

  // Закрытие по Escape и блокировка прокрутки
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('wheel', handleScroll, { passive: false });
      document.addEventListener('touchmove', handleScroll, { passive: false });
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('wheel', handleScroll);
      document.removeEventListener('touchmove', handleScroll);
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
    };
  }, [isOpen, onClose]);

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Добавляем пустые ячейки для начала месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Добавляем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDateClick = (date: Date) => {
    // Используем локальную дату без конвертации в UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Начинаем новый выбор
      setTempStartDate(dateStr);
      setTempEndDate(null);
    } else if (tempStartDate && !tempEndDate) {
      // Завершаем выбор
      if (dateStr < tempStartDate) {
        setTempStartDate(dateStr);
        setTempEndDate(tempStartDate);
      } else {
        setTempEndDate(dateStr);
      }
    }
  };

  const isDateInRange = (date: Date) => {
    // Используем локальную дату без конвертации в UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    if (tempStartDate && tempEndDate) {
      return dateStr >= tempStartDate && dateStr <= tempEndDate;
    }
    
    if (tempStartDate && !tempEndDate && hoveredDate) {
      const start = tempStartDate < hoveredDate ? tempStartDate : hoveredDate;
      const end = tempStartDate < hoveredDate ? hoveredDate : tempStartDate;
      return dateStr >= start && dateStr <= end;
    }
    
    return false;
  };

  const isDateSelected = (date: Date) => {
    // Используем локальную дату без конвертации в UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return dateStr === tempStartDate || dateStr === tempEndDate;
  };

  const isDateStart = (date: Date) => {
    // Используем локальную дату без конвертации в UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return dateStr === tempStartDate;
  };

  const isDateEnd = (date: Date) => {
    // Используем локальную дату без конвертации в UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return dateStr === tempEndDate;
  };

  const handleApply = () => {
    onDateRangeChange(tempStartDate, tempEndDate);
    onClose();
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
  };

  const formatDateRange = () => {
    if (!tempStartDate && !tempEndDate) return "Период не выбран";
    if (tempStartDate && tempEndDate) {
      const start = new Date(tempStartDate).toLocaleDateString('ru-RU');
      const end = new Date(tempEndDate).toLocaleDateString('ru-RU');
      return `${start} - ${end}`;
    }
    if (tempStartDate) {
      return `с ${new Date(tempStartDate).toLocaleDateString('ru-RU')}`;
    }
    if (tempEndDate) {
      return `до ${new Date(tempEndDate).toLocaleDateString('ru-RU')}`;
    }
    return "Период не выбран";
  };

  if (!isOpen) return null;

  const days = getDaysInMonth(currentMonth);

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center animate-fade-in" 
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-lg animate-fade-in"
        onClick={onClose}
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
        style={{ 
          zIndex: 999998,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden animate-scale-in"
        style={{ 
          zIndex: 999999,
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Selected Range Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Выбранный период</h3>
                <p className="text-slate-600">{formatDateRange()}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Очистить
                </button>
                <button
                  onClick={handleApply}
                  disabled={!tempStartDate && !tempEndDate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Применить</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-3 hover:bg-gray-100 rounded-full transition-colors group"
            >
              <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            
            <div className="flex items-center space-x-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors font-medium"
              >
                Сегодня
              </button>
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-3 hover:bg-gray-100 rounded-full transition-colors group"
            >
              <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gray-50">
              {dayNames.map(day => (
                <div key={day} className="p-4 text-center text-sm font-semibold text-slate-600 border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-20 border-r border-b border-gray-200 last:border-r-0" />;
                }

                // Используем локальную дату без конвертации в UTC
                const year = day.getFullYear();
                const month = String(day.getMonth() + 1).padStart(2, '0');
                const dayNum = String(day.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${dayNum}`;
                
                // Для сравнения с сегодняшней датой
                const today = new Date();
                const todayYear = today.getFullYear();
                const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
                const todayDay = String(today.getDate()).padStart(2, '0');
                const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
                const isToday = dateStr === todayStr;
                const isInRange = isDateInRange(day);
                const isSelected = isDateSelected(day);
                const isStart = isDateStart(day);
                const isEnd = isDateEnd(day);

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateClick(day)}
                    onMouseEnter={() => setHoveredDate(dateStr)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={`
                      h-20 border-r border-b border-gray-200 last:border-r-0 flex flex-col items-center justify-center relative
                      transition-all duration-200 hover:scale-105 transform
                      ${isToday ? 'font-bold' : ''}
                      ${isSelected 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg' 
                        : isInRange 
                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                      ${isStart ? 'rounded-l-lg' : ''}
                      ${isEnd ? 'rounded-r-lg' : ''}
                      ${isStart && isEnd ? 'rounded-lg' : ''}
                    `}
                  >
                    <span className="text-lg font-medium">{day.getDate()}</span>
                    {isToday && !isSelected && (
                      <div className="absolute bottom-2 w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    )}
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {!tempStartDate && !tempEndDate && "Нажмите на дату, чтобы начать выбор периода"}
            {tempStartDate && !tempEndDate && "Нажмите на дату, чтобы завершить выбор периода"}
            {tempStartDate && tempEndDate && "Период выбран. Нажмите 'Применить' для подтверждения"}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FullscreenCalendar;
