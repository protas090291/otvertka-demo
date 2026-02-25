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
import { getCashFlowData, getAdvancePaymentsData } from '../../lib/managementApi';
import ChartCard from './ChartCard';
import { axisTickProps, chartColors, gridProps } from '../../lib/charts/theme';
import {
  LegendPills,
  NeonTooltip,
  TrendBadge,
  registerDefaultGradients,
} from './ChartPrimitives';
import type { ChartTooltipPayload } from './ChartPrimitives';

const CashFlowView: React.FC = () => {
  const cashFlow = getCashFlowData();
  const advancePayments = getAdvancePaymentsData();

  const flowCards = [
    {
      title: 'Операционная деятельность',
      value: cashFlow.operational.total.forecast,
      info: `${cashFlow.operational.total.vsPlan.toFixed(2)} (${cashFlow.operational.total.delta.toFixed(2)}%)`,
      tone: cashFlow.operational.total.vsPlan >= 0 ? 'positive' : 'negative',
    },
    {
      title: 'Инвестиционная деятельность',
      value: cashFlow.investment.total.forecast,
      info: `${cashFlow.investment.total.vsPlan.toFixed(2)} (${cashFlow.investment.total.delta.toFixed(2)}%)`,
      tone: cashFlow.investment.total.vsPlan >= 0 ? 'positive' : 'negative',
    },
    {
      title: 'Финансовая деятельность',
      value: cashFlow.financial.total.forecast,
      info: `${cashFlow.financial.total.vsPlan.toFixed(2)} (${cashFlow.financial.total.delta.toFixed(2)}%)`,
      tone: cashFlow.financial.total.vsPlan >= 0 ? 'positive' : 'negative',
    },
    {
      title: 'Денежный остаток',
      value: cashFlow.cashBalance.value / 1000,
      suffix: 'млрд',
      info: `${(cashFlow.cashBalance.vsPlan / 1000).toFixed(2)} (${cashFlow.cashBalance.delta.toFixed(2)}%)`,
      tone: cashFlow.cashBalance.vsPlan >= 0 ? 'positive' : 'negative',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 right-0 h-64 w-64 rounded-full bg-purple-400/15 blur-[140px]" />
      </div>
      <div className="relative space-y-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">денежные потоки</p>
            <h2 className="text-2xl font-semibold text-white">Cash Flow</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">vs план</span>
            12M&apos;24
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <ChartCard title="Структура потоков" subtitle="Прогноз">
              <div className="space-y-4">
                {flowCards.map((card) => (
                  <div key={card.title} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.title}</p>
                      <div className="text-2xl font-semibold text-white">
                        {card.value.toFixed(1)} {card.suffix ?? 'млрд'}
                      </div>
                    </div>
                    <TrendBadge label={card.info} tone={card.tone as 'positive' | 'negative'} />
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Распределение расходов" subtitle="Операционный блок">
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Доходы</span>
                  <span className="text-white">{cashFlow.operational.receipts.forecast.toFixed(1)} млрд</span>
                </div>
                <div className="flex justify-between">
                  <span>Расходы</span>
                  <span className="text-white">{cashFlow.operational.expenses.forecast.toFixed(1)} млрд</span>
                </div>
                <div className="flex justify-between">
                  <span>Налоги</span>
                  <span className="text-white">{cashFlow.operational.taxes.forecast.toFixed(1)} млрд</span>
                </div>
              </div>
            </ChartCard>
          </div>

          <ChartCard className="lg:col-span-2" title="Авансовые платежи" subtitle="дольщики / покупатели">
            <LegendPills
              className="justify-start pb-2"
              payload={[
                { dataKey: 'plan', name: 'План', color: chartColors.primary[0] } as ChartTooltipPayload,
                { dataKey: 'forecast', name: 'Прогноз', color: chartColors.orchid[0] } as ChartTooltipPayload,
                { dataKey: 'fact', name: 'Факт', color: chartColors.teal[0] } as ChartTooltipPayload,
              ]}
            />
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={advancePayments} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                  {registerDefaultGradients()}
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTickProps} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTickProps} />
                  <Tooltip content={<NeonTooltip />} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                  <Bar dataKey="plan" fill="url(#planBar)" barSize={18} radius={[8, 8, 8, 8]} />
                  <Bar dataKey="forecast" fill="url(#orchidBar)" barSize={18} radius={[8, 8, 8, 8]} />
                  <Bar dataKey="fact" fill="url(#tealBar)" barSize={18} radius={[8, 8, 8, 8]} />
                  <Line type="monotone" dataKey="growth" stroke={chartColors.accent[0]} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default CashFlowView;
