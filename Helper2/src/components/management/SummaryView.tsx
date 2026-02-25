import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import {
  getFinancialMetrics,
  getNPVData,
  getProjectsData,
} from '../../lib/managementApi';
import ChartCard from './ChartCard';
import {
  axisTickProps,
  chartColors,
  gridProps,
} from '../../lib/charts/theme';
import {
  DonutRing,
  LegendPills,
  NeonTooltip,
  TrendBadge,
  registerDefaultGradients,
} from './ChartPrimitives';
import type { ChartTooltipPayload } from './ChartPrimitives';

const stageDistribution = [
  { label: 'Подписан', value: 7, color: '#5AD8A6' },
  { label: 'На согласовании', value: 5, color: '#4C8DFF' },
  { label: 'Новый', value: 3, color: '#60A5FA' },
  { label: 'Доработка', value: 1, color: '#FB7185' },
];

const SummaryView: React.FC = () => {
  const metrics = getFinancialMetrics();
  const npvData = getNPVData();
  const projects = getProjectsData();
  const donutTotal = stageDistribution.reduce((acc, item) => acc + item.value, 0);

  const formatValue = (value: number, suffix = 'млн ₽') => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} млрд ${suffix}`;
    }
    return `${value.toFixed(2)} ${suffix}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const metricCards = [
    {
      title: 'Выручка',
      value: formatValue(metrics.revenue.value),
      change: `${formatChange(metrics.revenue.change)} vs ${metrics.revenue.period}`,
    },
    {
      title: 'EBITDA',
      value: formatValue(metrics.ebitda.value),
      change: `${formatChange(metrics.ebitda.change)} vs ${metrics.ebitda.period}`,
    },
    {
      title: 'NPV',
      value: formatValue(metrics.npv.value, 'млн ₽'),
      change: `${formatChange(metrics.npv.change)} тыс. ₽ vs ${metrics.npv.period}`,
    },
    {
      title: 'ROI',
      value: `${metrics.roi.value}%`,
      change: `${formatChange(metrics.roi.change)} п.п. vs ${metrics.roi.period}`,
    },
    {
      title: 'ROE',
      value: `${metrics.roe.value}%`,
      change: `${formatChange(metrics.roe.change)} п.п. vs ${metrics.roe.period}`,
    },
    {
      title: 'IRR',
      value: `${metrics.irr.value}%`,
      change: `${formatChange(metrics.irr.change)} п.п. vs ${metrics.irr.period}`,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(120,166,255,0.25),_transparent_55%)]" />
      <div className="relative space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Скрыты плашки "Все проекты" и выбор даты */}
          </div>
          <span className="text-xs uppercase tracking-[0.4em] text-slate-400">
            live feed
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {metricCards.map((metric) => (
                <div
                  key={metric.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 via-white/0 to-transparent p-5 backdrop-blur-md"
                >
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.25),_transparent_60%)]" />
                  </div>
                  <div className="relative space-y-3">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                      {metric.title}
                    </p>
                    <div className="text-3xl font-semibold text-white">{metric.value}</div>
                    <TrendBadge
                      icon={<TrendingUp className="h-3.5 w-3.5" />}
                      label={metric.change}
                      tone="positive"
                    />
                  </div>
                </div>
              ))}
            </div>

            <ChartCard
              title="NPV, млн ₽"
              subtitle="График динамики"
              accent={{ label: '+4.2% к плану', tone: 'positive' }}
              action={
                <button className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-blue-400/50 hover:text-white">
                  Экспорт
                </button>
              }
            >
              <div className="mb-2 flex justify-end">
                <LegendPills
                  payload={[
                    {
                      dataKey: 'value',
                      name: 'Факт',
                      color: chartColors.primary[0],
                    } as ChartTooltipPayload,
                    {
                      dataKey: 'plan',
                      name: 'План',
                      color: 'rgba(148,163,184,0.8)',
                    } as ChartTooltipPayload,
                  ]}
                  className="pr-4"
                />
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={npvData} margin={{ top: 20, right: 16, left: -10, bottom: 0 }}>
                    {registerDefaultGradients()}
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTickProps} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={axisTickProps}
                      tickFormatter={(value) => value.toFixed(2)}
                    />
                    <Tooltip cursor={{ fill: 'rgba(148,163,184,0.05)' }} content={<NeonTooltip />} />
                    <Bar
                      name="План"
                      dataKey="plan"
                      fill="url(#planBar)"
                      barSize={24}
                      radius={[10, 10, 10, 10]}
                    />
                    <Bar
                      name="Факт"
                      dataKey="value"
                      fill="url(#npvBar)"
                      barSize={24}
                      radius={[12, 12, 12, 12]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="space-y-6">
            <ChartCard
              title="Структура контрактов"
              subtitle="Портфель"
              accent={{ label: '+3 новых', tone: 'positive' }}
            >
              <div className="flex flex-col gap-6">
                <DonutRing segments={stageDistribution} size={220}>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400">
                    портфель
                  </span>
                  <span className="text-4xl font-semibold text-white">{donutTotal}</span>
                  <span className="text-sm text-slate-400">контрактов</span>
                </DonutRing>
                <div className="space-y-3">
                  {stageDistribution.map((stage) => (
                    <div
                      key={stage.label}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 text-sm text-white">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.label}
                      </div>
                      <div className="text-white font-semibold">{stage.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Актуальные проекты" subtitle="Обзор" className="space-y-4">
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="overflow-hidden rounded-2xl border border-white/5 bg-white/5"
                  >
                    <img
                      src={project.image}
                      alt={project.name}
                      className="h-36 w-full object-cover"
                    />
                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                          {project.realization}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                        <span>Площадь</span>
                        <span className="text-right text-white">{project.area}</span>
                        <span>Старт</span>
                        <span className="text-right text-white">{project.startDate}</span>
                        <span>Финиш</span>
                        <span className="text-right text-white">{project.endDate}</span>
                        <span>EBITDA</span>
                        <span className="text-right text-white">{project.ebitda}</span>
                      </div>
                      <div className="space-y-1 pt-2 text-xs text-slate-400">
                        <span>Сейчас</span>
                        <div className="space-y-1">
                          {project.currentStatus.map((status, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-white">
                              <span className="h-1.5 w-8 rounded-full bg-blue-400" />
                              {status}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
