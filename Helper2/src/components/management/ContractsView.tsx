import React, { useState } from 'react';
import { getContractsData } from '../../lib/managementApi';
import ChartCard from './ChartCard';
import { DonutRing, LegendPills, NeonTooltip, TrendBadge } from './ChartPrimitives';
import type { ChartTooltipPayload } from './ChartPrimitives';
import { axisTickProps, chartColors, gridProps } from '../../lib/charts/theme';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const ContractsView: React.FC = () => {
  const contracts = getContractsData();
  const [viewMode, setViewMode] = useState<'count' | 'percent'>('count');

  const donutColumns = [
    { title: 'Все договоры', data: contracts.all },
    { title: 'Внутренний контур', data: contracts.internal },
    { title: 'Внешний контур', data: contracts.external },
  ];

  const statusColors = [
    { key: 'new', label: 'Новый', color: chartColors.primary[0] },
    { key: 'approval', label: 'На согласовании', color: '#1e40af' },
    { key: 'revision', label: 'Требует доработки', color: '#f97316' },
    { key: 'revised', label: 'Доработан', color: '#f43f5e' },
    { key: 'approved', label: 'Согласован', color: chartColors.mint[0] },
    { key: 'signed', label: 'Подписан', color: '#059669' },
    { key: 'cancelled', label: 'Аннулирован', color: '#06b6d4' },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-12 h-64 w-64 rounded-full bg-blue-400/15 blur-[140px]" />
      </div>
      <div className="relative space-y-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">договоры</p>
            <h2 className="text-2xl font-semibold text-white">Портфель контрактов</h2>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">режим</span>
            <button
              onClick={() => setViewMode('count')}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${viewMode === 'count' ? 'bg-white/20 text-white' : 'text-slate-400'}`}
            >
              Шт.
            </button>
            <button
              onClick={() => setViewMode('percent')}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${viewMode === 'percent' ? 'bg-white/20 text-white' : 'text-slate-400'}`}
            >
              %
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {donutColumns.map((column) => {
            const total = column.data.total || 1;
            const segments = statusColors.map((status) => ({
              value: column.data.statuses[status.key as keyof typeof column.data.statuses] || 0,
              color: status.color,
            }));
            return (
              <ChartCard key={column.title} title={column.title} subtitle="по статусам">
                <div className="flex flex-col items-center gap-6">
                  <DonutRing segments={segments} size={200}>
                    <span className="text-3xl font-semibold text-white">{column.data.total}</span>
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">шт.</span>
                  </DonutRing>
                  <div className="grid w-full grid-cols-2 gap-2 text-xs text-slate-300">
                    {statusColors.map((status) => (
                      <div key={status.key} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                        {status.label}
                        <span className="ml-auto text-white">
                          {viewMode === 'count'
                            ? column.data.statuses[status.key as keyof typeof column.data.statuses] || 0
                            : `${(
                                ((column.data.statuses[status.key as keyof typeof column.data.statuses] || 0) /
                                  total) *
                                100
                              ).toFixed(1)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            );
          })}
        </div>

        <ChartCard title="Динамика договоров" subtitle="по месяцам">
          <LegendPills
            className="justify-start pb-2"
            payload={statusColors.map((status) => ({
              dataKey: `statuses.${status.key}`,
              name: status.label,
              color: status.color,
            })) as ChartTooltipPayload[]}
          />
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contracts.dynamics} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTickProps} />
                <YAxis tickLine={false} axisLine={false} tick={axisTickProps} />
                <Tooltip content={<NeonTooltip />} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                {statusColors.map((status) => (
                  <Bar
                    key={status.key}
                    dataKey={`statuses.${status.key}`}
                    stackId="contracts"
                    fill={status.color}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Резюме" subtitle="млн ₽" className="lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Подписано</p>
              <div className="text-2xl font-semibold text-white">{contracts.all.statuses.signed}</div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">На согласовании</p>
              <div className="text-2xl font-semibold text-white">{contracts.all.statuses.approval}</div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Доработка</p>
              <div className="text-2xl font-semibold text-white">{contracts.all.statuses.revision}</div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default ContractsView;
