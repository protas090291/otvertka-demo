import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Clock, AlertCircle, X } from 'lucide-react';
import { UserRole } from '../types';

interface DefectStatusChangerProps {
  currentStatus: 'open' | 'in-progress' | 'resolved' | 'closed';
  userRole: UserRole;
  onStatusChange: (newStatus: 'open' | 'in-progress' | 'resolved' | 'closed') => void;
  disabled?: boolean;
}

const DefectStatusChanger: React.FC<DefectStatusChangerProps> = ({
  currentStatus,
  userRole,
  onStatusChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Проверяем, может ли пользователь изменять статус
  const canChangeStatus = (userRole === 'technadzor' || userRole === 'contractor') && !disabled;

  const statusOptions = [
    {
      value: 'open' as const,
      label: 'Открыт',
      icon: AlertCircle,
      color: 'text-red-200',
      bgColor: 'bg-red-500/25 border border-red-500/40',
      description: 'Дефект создан, ожидает назначения'
    },
    {
      value: 'in-progress' as const,
      label: 'В работе',
      icon: Clock,
      color: 'text-amber-200',
      bgColor: 'bg-amber-500/25 border border-amber-500/40',
      description: 'Дефект назначен, работа ведется'
    },
    {
      value: 'resolved' as const,
      label: 'Решен',
      icon: Check,
      color: 'text-emerald-200',
      bgColor: 'bg-emerald-500/25 border border-emerald-500/40',
      description: 'Дефект исправлен, ожидает проверки'
    },
    {
      value: 'closed' as const,
      label: 'Закрыт',
      icon: X,
      color: 'text-slate-300',
      bgColor: 'bg-white/10 border border-white/20',
      description: 'Дефект проверен и закрыт'
    }
  ];

  const currentStatusOption = statusOptions.find(option => option.value === currentStatus);

  const handleStatusSelect = (newStatus: 'open' | 'in-progress' | 'resolved' | 'closed') => {
    if (newStatus !== currentStatus) {
      onStatusChange(newStatus);
    }
    setIsOpen(false);
  };

  // Вычисляем направление открытия dropdown при открытии
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 250; // Примерная высота dropdown
      
      // Если не хватает места снизу, открываем вверх
      const shouldOpenUpward = buttonRect.bottom + dropdownHeight > viewportHeight;
      setOpenUpward(shouldOpenUpward);
    }
  }, [isOpen]);

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        buttonRef.current &&
        dropdownRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  if (!canChangeStatus) {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatusOption?.bgColor} ${currentStatusOption?.color}`} title="Изменение статуса доступно только технадзору и подрядчику">
        {currentStatusOption && <currentStatusOption.icon className="w-4 h-4 mr-1" />}
        {currentStatusOption?.label}
      </div>
    );
  }

  // Увеличиваем z-index родительской карточки при открытии меню
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const cardElement = buttonRef.current.closest('.bg-white\\/40');
      if (cardElement) {
        (cardElement as HTMLElement).style.zIndex = '50';
        return () => {
          (cardElement as HTMLElement).style.zIndex = 'auto';
        };
      }
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        data-defect-status-button={currentStatus}
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatusOption?.bgColor} ${currentStatusOption?.color} hover:opacity-90 transition-all cursor-pointer hover:border-blue-500/50`}
        title="Нажмите для изменения статуса дефекта"
      >
        {currentStatusOption && <currentStatusOption.icon className="w-4 h-4 mr-1" />}
        {currentStatusOption?.label}
        <ChevronDown className="w-4 h-4 ml-1" />
      </button>

      {isOpen && (
        <>
          {/* Overlay для закрытия dropdown */}
          <div 
            className="fixed inset-0 z-[99998]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown меню с absolute позиционированием */}
          <div 
            ref={dropdownRef}
            className={`absolute left-0 w-64 rounded-xl shadow-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl z-[99999] max-h-80 overflow-y-auto scrollbar-hide ${
              openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
          >
            <div className="p-2">
              <div className="text-xs font-medium text-slate-400 mb-2 px-2 flex items-center">
                Изменить статус дефекта
                <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-200 border border-blue-500/30 rounded-lg text-xs">
                  {userRole === 'technadzor' ? 'Технадзор' : 'Подрядчик'}
                </span>
              </div>
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = option.value === currentStatus;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusSelect(option.value)}
                    className={`w-full flex items-start p-2 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 mr-3 ${option.color}`} />
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${option.color}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {option.description}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-300 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DefectStatusChanger;
