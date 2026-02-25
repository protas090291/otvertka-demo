import React from 'react';

interface ChartCardProps {
  title?: string;
  subtitle?: string;
  accent?: {
    label: string;
    tone?: 'positive' | 'warning' | 'neutral';
  };
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const toneClasses: Record<NonNullable<ChartCardProps['accent']>['tone'], string> = {
  positive: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-100 border border-amber-500/30',
  neutral: 'bg-slate-500/10 text-slate-200 border border-white/10',
};

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  accent,
  action,
  className = '',
  children,
}) => {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-3xl border border-white/5',
        'bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20',
        'shadow-[0_25px_80px_rgba(8,15,40,0.65)]',
        'before:absolute before:inset-0 before:-z-10 before:rounded-[inherit]',
        'before:bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.25),_transparent_55%)]',
        className,
      ].join(' ')}
    >
      <div className="relative p-6 space-y-5">
        {(title || action || accent || subtitle) && (
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              {subtitle && (
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {subtitle}
                </p>
              )}
              {title && <h3 className="text-2xl font-semibold text-white">{title}</h3>}
            </div>
            <div className="flex items-center gap-3">
              {accent && (
                <span
                  className={[
                    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                    toneClasses[accent.tone ?? 'neutral'],
                  ].join(' ')}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {accent.label}
                </span>
              )}
              {action}
            </div>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default ChartCard;

