import React from 'react';
import { Star, Upload, Heart, Grid, Calendar, LogOut } from 'lucide-react';

interface ManagementHeaderProps {
  onLogout: () => void;
  /** Подпись модуля (по умолчанию УПРАВЛЕНИЕ) */
  badge?: string;
}

const ManagementHeader: React.FC<ManagementHeaderProps> = ({ onLogout, badge = 'УПРАВЛЕНИЕ' }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="rounded-2xl bg-gradient-to-r from-blue-500/30 to-indigo-400/30 px-3 py-1 text-[11px] uppercase tracking-[0.4em] text-blue-100 font-semibold">
            {badge}
          </div>
          <h1 className="text-xl font-semibold text-white">Отвёртка</h1>
        </div>

        <div className="flex items-center space-x-2 text-slate-200">
          {[Star, Upload, Heart, Grid].map((Icon, idx) => (
            <button
              key={idx}
              className="rounded-2xl border border-white/5 bg-white/5 p-2 transition hover:border-white/15 hover:bg-white/10"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200">
            <Calendar className="h-4 w-4" />
            8M&apos;24
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
          >
            <LogOut className="h-4 w-4" />
            Выход
          </button>
        </div>
      </div>
    </header>
  );
};

export default ManagementHeader;


