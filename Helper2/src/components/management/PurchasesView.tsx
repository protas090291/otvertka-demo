import React from 'react';
import { getPurchasesData } from '../../lib/managementApi';
import ChartCard from './ChartCard';
import { DonutRing, TrendBadge } from './ChartPrimitives';
import { Mail } from 'lucide-react';

const PurchasesView: React.FC = () => {
  const purchases = getPurchasesData();

  const structureSegments = [
    { label: 'Материалы', value: purchases.structure.materials.percent, color: '#60a5fa' },
    { label: 'Инженерные системы', value: purchases.structure.systems.percent, color: '#34d399' },
    { label: 'Благоустройство', value: purchases.structure.landscaping.percent, color: '#fbbf24' },
  ];

  const summaryCards = [
    { title: 'Активных закупок', value: purchases.active, tone: 'positive' },
    { title: 'Просрочено', value: purchases.overdue, tone: 'negative' },
    { title: 'Рейтинг поставщиков', value: purchases.suppliers.length, tone: 'neutral' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-12 h-80 w-80 rounded-full bg-amber-400/20 blur-[150px]" />
      </div>
      <div className="relative space-y-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">затраты</p>
            <h2 className="text-2xl font-semibold text-white">Закупки и поставщики</h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ChartCard title="Структура закупок" subtitle="млн ₽">
            <DonutRing
              segments={structureSegments.map((segment) => ({ value: segment.value, color: segment.color }))}
              size={220}
            >
              <span className="text-3xl font-semibold text-white">100%</span>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">портфель</span>
            </DonutRing>
            <div className="mt-6 space-y-2 text-sm text-slate-300">
              {structureSegments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span>{segment.label}</span>
                  <span className="ml-auto text-white">{segment.value}%</span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Статус закупок" subtitle="шт.">
            <div className="space-y-4">
              {summaryCards.map((card) => (
                <div key={card.title} className="flex items-center justify-between text-sm text-slate-300">
                  <span>{card.title}</span>
                  <TrendBadge label={card.value.toString()} tone={card.tone as any} />
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Поставщики" subtitle="рейтинг">
            <div className="space-y-3 text-sm text-slate-300">
              {purchases.suppliers.slice(0, 4).map((supplier) => (
                <div key={supplier.name} className="flex items-center justify-between">
                  <span>{supplier.name}</span>
                  <span className="text-white">{supplier.avgAmount.toFixed(1)} млн ₽</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Необходимо закупить" subtitle="очередь" className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-3">Поставщик</th>
                  <th className="py-3">Тип</th>
                  <th className="py-3">Закупка</th>
                  <th className="py-3">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {purchases.upcomingList.map((item, idx) => (
                  <tr key={`${item.supplier}-${idx}`}>
                    <td className="py-3">
                      <div className="flex items-center gap-2 text-white">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {item.supplier}
                      </div>
                    </td>
                    <td>{item.type}</td>
                    <td>{item.purchase}</td>
                    <td>{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default PurchasesView;
