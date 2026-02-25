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
import { getBalanceData, getBalanceCards, getAssetsChartData } from '../../lib/managementApi';
import ChartCard from './ChartCard';
import { axisTickProps, chartColors, gridProps } from '../../lib/charts/theme';
import {
  LegendPills,
  NeonTooltip,
  TrendBadge,
  registerDefaultGradients,
} from './ChartPrimitives';
import type { ChartTooltipPayload } from './ChartPrimitives';

type TrendTone = 'positive' | 'negative';

const getTone = (value: number): TrendTone => (value >= 0 ? 'positive' : 'negative');
const renderTrend = (value?: number, suffix = '') => {
  if (typeof value !== 'number') {
    return <span className="text-slate-600">—</span>;
  }
  return <TrendBadge label={`${value.toFixed(1)}${suffix}`} tone={getTone(value)} />;
};

const BalanceView: React.FC = () => {
  const balanceData = getBalanceData();
  const cards = getBalanceCards();
  const chartData = getAssetsChartData();

  const tableGroups = [
    {
      title: 'Активы',
      rows: [
        { label: 'Всего активы', ...balanceData.assets.total },
        { label: 'Внеоборотные активы', ...balanceData.assets.nonCurrent },
        { label: 'Оборотные активы', ...balanceData.assets.current },
      ],
    },
    {
      title: 'Пассивы',
      rows: [
        { label: 'Всего пассивы', ...balanceData.liabilities.total },
        { label: 'Долгосрочные обязательства', ...balanceData.liabilities.longTerm },
        { label: 'Краткосрочные обязательства', ...balanceData.liabilities.shortTerm },
      ],
    },
    {
      title: 'Собственный капитал',
      rows: [
        { label: 'Всего капитал', ...balanceData.equity.total },
        { label: 'Нераспределённая прибыль', ...balanceData.equity.retained },
        { label: 'Резервный капитал', ...balanceData.equity.reserve },
      ],
    },
  ];

  const liquidityCards = [
    {
      title: 'Денежные средства',
      value: cards.cash.value,
      info: `${cards.cash.vsPlan.toFixed(2)} (${cards.cash.delta.toFixed(2)}%)`,
      tone: getTone(cards.cash.vsPlan),
    },
    {
      title: 'Дебиторская задолженность',
      value: cards.receivables.value,
      info: `${cards.receivables.vsPlan.toFixed(2)} (${cards.receivables.delta.toFixed(2)}%)`,
      tone: getTone(cards.receivables.vsPlan),
    },
    {
      title: 'Кредиторская задолженность',
      value: cards.payables.value,
      info: `${cards.payables.vsPlan.toFixed(2)} (${cards.payables.delta.toFixed(2)}%)`,
      tone: getTone(cards.payables.vsPlan),
    },
    {
      title: 'Собственный капитал',
      value: cards.equity.value,
      info: `${cards.equity.vsPlan.toFixed(2)} (${cards.equity.delta.toFixed(2)}%)`,
      tone: getTone(cards.equity.vsPlan),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-0 h-72 w-72 rounded-full bg-blue-400/20 blur-[140px]" />
        <div className="absolute top-60 right-0 h-60 w-60 rounded-full bg-emerald-400/10 blur-[140px]" />
      </div>
      <div className="relative space-y-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">финансы</p>
            <h2 className="text-2xl font-semibold text-white">Баланс компании</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">период</span>
            12M&apos;24
        </div>
      </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ChartCard className="lg:col-span-2" subtitle="Баланс" title="Активы / Пассивы">
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
                  {tableGroups.map((group) => (
                    <React.Fragment key={group.title}>
                      <tr className="text-white">
                        <td className="py-3 font-semibold">{group.title}</td>
                        <td colSpan={4}></td>
                  </tr>
                      {group.rows.map((row) => (
                        <tr key={row.label} className="text-slate-300">
                          <td className="py-2 pl-4">{row.label}</td>
                          <td className="py-2 text-right text-white">{row.forecast.toFixed(1)}</td>
                          <td className="py-2 text-right text-white">{row.plan.toFixed(1)}</td>
                          <td className="py-2 text-right">{renderTrend(row.vsPlan)}</td>
                          <td className="py-2 text-right">{renderTrend(row.delta, '%')}</td>
                  </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <div className="space-y-6">
            <ChartCard title="Ликвидность" subtitle="Ключевые метрики">
          <div className="grid grid-cols-2 gap-4">
                {liquidityCards.map((card) => (
                  <div key={card.title} className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.title}</p>
                    <div className="text-2xl font-semibold text-white">{card.value.toFixed(1)}</div>
                    <TrendBadge label={card.info} tone={card.tone} />
              </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Динамика активов" subtitle="План vs факт">
              <LegendPills
                className="justify-start pb-2"
                payload={[
                  { dataKey: 'plan', name: 'План', color: chartColors.primary[0] } as ChartTooltipPayload,
                  { dataKey: 'forecast', name: 'Прогноз', color: chartColors.orchid[0] } as ChartTooltipPayload,
                  { dataKey: 'fact', name: 'Факт', color: chartColors.teal[0] } as ChartTooltipPayload,
                ]}
              />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                    {registerDefaultGradients()}
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTickProps} />
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={axisTickProps} />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={axisTickProps} />
                    <Tooltip content={<NeonTooltip />} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                    <Bar yAxisId="left" dataKey="plan" fill="url(#planBar)" barSize={18} radius={[8, 8, 8, 8]} />
                    <Bar yAxisId="left" dataKey="forecast" fill="url(#orchidBar)" barSize={18} radius={[8, 8, 8, 8]} />
                    <Bar yAxisId="left" dataKey="fact" fill="url(#tealBar)" barSize={18} radius={[8, 8, 8, 8]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="growth"
                      stroke={chartColors.accent[0]}
                strokeWidth={2}
                      dot={false}
              />
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

export default BalanceView;
