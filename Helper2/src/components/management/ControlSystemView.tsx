import React, { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getControlSystemData } from '../../lib/managementApi';
import ChartCard from './ChartCard';
import { axisTickProps, chartColors, gridProps } from '../../lib/charts/theme';
import { LegendPills, NeonTooltip, TrendBadge } from './ChartPrimitives';

const ControlSystemView: React.FC = () => {
  const data = getControlSystemData();
  const [selectedBrigade, setSelectedBrigade] = useState('1');
  type Tone = 'positive' | 'negative' | 'neutral';

  const workforceCards: Array<{ title: string; value: number; info: string; tone: Tone }> = [
    {
      title: 'Рабочих на объекте',
      value: data.workersOnSite.fact,
      info: `План ${data.workersOnSite.plan}`,
      tone: data.workersOnSite.fact >= data.workersOnSite.plan ? 'positive' : 'negative',
    },
    {
      title: 'Среднее время',
      value: data.avgTimeOnSite.fact,
      info: `План ${data.avgTimeOnSite.plan}`,
      tone: data.avgTimeOnSite.fact >= data.avgTimeOnSite.plan ? 'positive' : 'negative',
    },
    {
      title: 'Бригад в работе',
      value: data.brigadeDistribution.length,
      info: 'по графику',
      tone: 'neutral',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-16 h-72 w-72 rounded-full bg-cyan-400/15 blur-[140px]" />
      </div>
      <div className="relative space-y-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">контроль</p>
            <h2 className="text-2xl font-semibold text-white">Система контроля</h2>
          </div>
          <select
            value={selectedBrigade}
            onChange={(e) => setSelectedBrigade(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:outline-none"
          >
            <option value="1">ЖК 1</option>
            <option value="2">ЖК 2</option>
            <option value="3">ЖК 3</option>
          </select>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ChartCard className="lg:col-span-2" title="Бригады" subtitle="факт / план">
            <div className="grid gap-4 sm:grid-cols-2">
              {data.brigadeDistribution.map((brigade) => (
                <div key={brigade.brigade} className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white">
                  <div className="flex items-center justify-between">
                    <span>Бригада {brigade.brigade}</span>
                    <TrendBadge
                      label={`${brigade.fact}/${brigade.plan}`}
                      tone={brigade.fact >= brigade.plan ? 'positive' : 'negative'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Сводка" subtitle="люди / часы">
            <div className="space-y-3">
              {workforceCards.map((card) => (
                <div key={card.title} className="flex items-center justify-between text-sm text-slate-300">
                  <span>{card.title}</span>
                  <TrendBadge label={`${card.value}`} tone={card.tone} />
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Проходы / время" subtitle="последние дни">
          <LegendPills
            className="justify-start pb-2"
            payload={[
              { dataKey: 'fact', name: 'Факт', color: chartColors.primary[0] },
              { dataKey: 'plan', name: 'План', color: chartColors.mint[0] },
            ]}
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.avgTime} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={axisTickProps} />
                <YAxis tickLine={false} axisLine={false} tick={axisTickProps} />
                <Tooltip content={<NeonTooltip />} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                <Bar dataKey="fact" barSize={18} radius={[8, 8, 8, 8]} fill={chartColors.primary[0]} />
                <Line type="monotone" dataKey="plan" stroke={chartColors.mint[0]} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default ControlSystemView;
