import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onMenuToggle: () => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, onLogout }) => {

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Левый блок - логотип */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-full hover:bg-gray-100/80 transition-all duration-300 group"
          >
            <Menu className="w-5 h-5 text-slate-600 group-hover:text-gray-900" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
              <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Отвёртка</h1>
            </div>
          </div>
        </div>


        {/* Правый блок - уведомления, профиль */}
        <div className="flex items-center space-x-4">
          {/* Уведомления */}
          <button className="relative p-2 rounded-full hover:bg-gray-100/80 transition-all duration-300 group">
            <Bell className="w-5 h-5 text-slate-600 group-hover:text-gray-900" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* Профиль */}
          <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100/80 px-3 py-2 rounded-full transition-all duration-300 group">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-sm">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Выход */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-red-50 transition-all duration-300 group text-red-600 hover:text-red-700"
              title="Выход"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Выход</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;