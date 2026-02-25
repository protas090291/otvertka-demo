import React from 'react';
import { getRDCDData } from '../../lib/managementApi';
import ChartCard from './ChartCard';
import { DonutRing, LegendPills, NeonTooltip } from './ChartPrimitives';
import { axisTickProps, chartColors, gridProps } from '../../lib/charts/theme';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const RDCDView: React.FC = () => {
  const rdcd = getRDCDData();

  const statusColors = [
    { key: 'agreed', label: 'Согласовано', color: chartColors.primary[0] },
    { key: 'agreedExpert', label: 'С экспертом', color: '#1e40af' },
    { key: 'approved', label: 'Утверждено', color: '#f97316' },
    { key: 'exported', label: 'Выгружено', color: '#10b981' },
    { key: 'missing', label: 'Отсутствует', color: '#ef4444' },
  ] as const;

  const donutColumns = [
    { title: 'Рабочая документация', data: rdcd.working },
    { title: 'Сметная документация', data: rdcd.estimated },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-green-400/15 blur-[150px]" />
      </div>
      <div className="relative space-y-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">РД / СД</p>
            <h2 className="text-2xl font-semibold text-white">Документация по проекту</h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {donutColumns.map((column) => (
            <ChartCard key={column.title} title={column.title} subtitle="по статусам">
              <div className="flex flex-col items-center gap-6 md:flex-row">
                <DonutRing
                  segments={statusColors.map((status) => ({
                    value: column.data.statuses[status.key] || 0,
                    color: status.color,
                  }))}
                >
                  <span className="text-3xl font-semibold text-white">{column.data.total}</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">шт.</span>
                </DonutRing>
                <div className="space-y-2 text-xs text-slate-300">
                  {statusColors.map((status) => (
                    <div key={status.key} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                      {status.label}
                      <span className="ml-auto text-white">
                        {column.data.statuses[status.key]} шт.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          ))}
        </div>

        <ChartCard title="Динамика выдачи" subtitle="по месяцам">
          <LegendPills
            className="justify-start pb-2"
            payload={statusColors.map((status) => ({
              dataKey: `statuses.${status.key}`,
              name: status.label,
              color: status.color,
            }))}
          />
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rdcd.dynamics} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTickProps} />
                <YAxis tickLine={false} axisLine={false} tick={axisTickProps} />
                <Tooltip content={<NeonTooltip />} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                {statusColors.map((status) => (
                  <Bar
                    key={status.key}
                    dataKey={`statuses.${status.key}`}
                    stackId="rd"
                    fill={status.color}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default RDCDView;
