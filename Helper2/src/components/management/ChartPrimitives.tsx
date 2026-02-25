import React from 'react';
import { TooltipProps } from 'recharts';
import { chartColors, tooltipStyles, trendToneClasses } from '../../lib/charts/theme';

export type ChartTooltipPayload = NonNullable<TooltipProps<number, string>['payload']>[number];

export const NeonTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={tooltipStyles.wrapper}>
      {label && <div className={tooltipStyles.label}>{label}</div>}
      <div className="mt-2 space-y-1.5">
        {payload.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-6 text-sm text-white"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name || item.dataKey}
            </span>
            <span className={tooltipStyles.value}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LegendPillsProps {
  payload?: ChartTooltipPayload[];
  className?: string;
}

export const LegendPills: React.FC<LegendPillsProps> = ({ payload, className = '' }) => {
  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={[
        'flex flex-wrap justify-end gap-2 text-xs font-medium text-slate-200',
        className,
      ].join(' ')}
    >
      {payload.map((entry) => (
        <span
          key={entry.dataKey}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1"
        >
          <span className="h-2 w-6 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name || entry.dataKey}
        </span>
      ))}
    </div>
  );
};

interface DonutRingProps {
  segments: Array<{ value: number; color: string }>;
  size?: number;
  thickness?: number;
  trackColor?: string;
  children?: React.ReactNode;
}

export const DonutRing: React.FC<DonutRingProps> = ({
  segments,
  size = 220,
  thickness = 18,
  trackColor = 'rgba(255,255,255,0.08)',
  children,
}) => {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((acc, seg) => acc + seg.value, 0);

  let offset = 0;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        {segments.map((segment, idx) => {
          const dash = total === 0 ? 0 : (segment.value / total) * circumference;
          const circle = (
            <circle
              key={`${segment.color}-${idx}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              opacity={0.95}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
};

interface TrendBadgeProps {
  label: string;
  tone?: keyof typeof trendToneClasses;
  icon?: React.ReactNode;
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({ label, tone = 'positive', icon }) => (
  <span
    className={[
      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
      trendToneClasses[tone],
    ].join(' ')}
  >
    {icon}
    {label}
  </span>
);

export const gradientFills = {
  primary: 'url(#npvBar)',
  plan: 'url(#planBar)',
  orchid: 'url(#orchidBar)',
  teal: 'url(#tealBar)',
};

export const registerDefaultGradients = () => (
  <defs>
    <linearGradient id="npvBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={chartColors.primary[1]} stopOpacity={0.95} />
      <stop offset="95%" stopColor={chartColors.primary[0]} stopOpacity={0.9} />
    </linearGradient>
    <linearGradient id="planBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(226,232,240,0.7)" />
      <stop offset="100%" stopColor="rgba(148,163,184,0.25)" />
    </linearGradient>
    <linearGradient id="orchidBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={chartColors.orchid[1]} stopOpacity={0.95} />
      <stop offset="95%" stopColor={chartColors.orchid[0]} stopOpacity={0.85} />
    </linearGradient>
    <linearGradient id="tealBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={chartColors.teal[1]} stopOpacity={0.95} />
      <stop offset="95%" stopColor={chartColors.teal[0]} stopOpacity={0.85} />
    </linearGradient>
  </defs>
);

