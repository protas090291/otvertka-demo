export const chartColors = {
  primary: ['#4C8DFF', '#66F5FF'],
  accent: ['#F6C945', '#FFEA8A'],
  mint: ['#5AD8A6', '#7EFFD8'],
  orchid: ['#C084FC', '#F0ABFC'],
  coral: ['#FF7E82', '#FFB199'],
  teal: ['#2DD4BF', '#5EEAD4'],
  warning: '#FCA311',
  positive: '#52D273',
  negative: '#FB7185',
  axis: 'rgba(226,232,240,0.75)',
  grid: 'rgba(148,163,184,0.2)',
  panel: '#0b1323',
};

export const tooltipStyles = {
  wrapper:
    'rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-[0_20px_45px_rgba(15,23,42,0.55)] backdrop-blur',
  label: 'text-[11px] uppercase tracking-[0.2em] text-slate-400',
  value: 'text-sm font-semibold text-white',
};

export const axisTickProps = {
  fill: chartColors.axis,
  fontSize: 14,
  fontWeight: 500,
};

export const gridProps = {
  strokeDasharray: '4 8',
  stroke: chartColors.grid,
  vertical: false,
};

export const trendToneClasses = {
  positive: 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/40',
  warning: 'bg-amber-500/15 text-amber-100 border border-amber-400/40',
  negative: 'bg-rose-500/15 text-rose-100 border border-rose-400/35',
  neutral: 'bg-slate-500/10 text-slate-200 border border-white/10',
} as const;

