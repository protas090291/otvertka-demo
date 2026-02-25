import React from 'react';
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
import { getPLData, getPLCards, getEBITData } from '../../lib/managementApi';
import ChartCard from './ChartCard';
import { axisTickProps, chartColors, gridProps } from '../../lib/charts/theme';
import {
  LegendPills,
  NeonTooltip,
  TrendBadge,
  registerDefaultGradients,
} from './ChartPrimitives';
import type { ChartTooltipPayload } from './ChartPrimitives';

const PLView: React.FC = () => {
  const plData = getPLData();
  const cards = getPLCards();
  const ebitData = getEBITData();

  const plRows = [
    { label: 'Выручка', data: plData.revenue },
    { label: 'Себестоимость', data: plData.costOfSales },
    { label: 'Операционные расходы', data: plData.operatingExpenses },
    { label: 'Валовая прибыль', data: plData.grossProfit },
    { label: 'EBITDA', data: plData.ebitda },
  ];

  const summaryCards = [
    { title: 'Выручка', value: cards.revenue, tone: cards.revenue >= 0 ? 'positive' : 'negative' },
    { title: 'Себестоимость', value: cards.costOfSales, tone: cards.costOfSales >= 0 ? 'positive' : 'negative' },
    { title: 'OPEX', value: cards.operatingExpenses, tone: cards.operatingExpenses >= 0 ? 'positive' : 'negative' },
    { title: 'Чистая прибыль', value: cards.netProfit, tone: cards.netProfit >= 0 ? 'positive' : 'negative' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-24 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-[140px]" />
      </div>
      <div className="relative space-y-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">прибыли и убытки</p>
            <h2 className="text-2xl font-semibold text-white">P&L 12M&apos;24</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">режим</span>
            vs План
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ChartCard className="lg:col-span-2" title="Основные показатели" subtitle="План vs прогноз">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-3">Показатель</th>
                    <th className="py-3 text-right">Прогноз</th>
                    <th className="py-3 text-right">План</th>
                    <th className="py-3 text-right">vs План</th>
                    <th className="py-3 text-right">Δ %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {plRows.map((row) => (
                    <tr key={row.label} className="text-slate-300">
                      <td className="py-2">{row.label}</td>
                      <td className="py-2 text-right text-white">{row.data.forecast.toFixed(1)}</td>
                      <td className="py-2 text-right text-white">{row.data.plan.toFixed(1)}</td>
                      <td className="py-2 text-right">
                        <TrendBadge
                          label={`${row.data.vsPlan.toFixed(1)}`}
                          tone={row.data.vsPlan >= 0 ? 'positive' : 'negative'}
                        />
                      </td>
                      <td className="py-2 text-right">
                        <TrendBadge
                          label={`${row.data.delta.toFixed(1)}%`}
                          tone={row.data.delta >= 0 ? 'positive' : 'negative'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <div className="space-y-6">
            <ChartCard title="Итоги" subtitle="млн ₽">
              <div className="space-y-3">
                {summaryCards.map((card) => (
                  <div key={card.title} className="flex items-center justify-between text-sm text-slate-300">
                    <span>{card.title}</span>
                    <TrendBadge label={card.value.toFixed(1)} tone={card.tone as 'positive' | 'negative'} />
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="EBIT динамика" subtitle="млн ₽">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={ebitData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    {registerDefaultGradients()}
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTickProps} />
                    <YAxis tickLine={false} axisLine={false} tick={axisTickProps} />
                    <Tooltip content={<NeonTooltip />} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                    <Bar dataKey="plan" fill="url(#planBar)" barSize={16} radius={[8, 8, 8, 8]} />
                    <Bar dataKey="forecast" fill="url(#orchidBar)" barSize={16} radius={[8, 8, 8, 8]} />
                    <Bar dataKey="fact" fill="url(#tealBar)" barSize={16} radius={[8, 8, 8, 8]} />
                    <Line type="monotone" dataKey="growth" stroke={chartColors.accent[0]} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PLView;
