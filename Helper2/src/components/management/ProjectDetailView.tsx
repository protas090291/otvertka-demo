import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { getProjectDetail } from '../../lib/managementApi';
import ChartCard from './ChartCard';
import { axisTickProps, chartColors, gridProps } from '../../lib/charts/theme';
import { DonutRing, NeonTooltip, TrendBadge } from './ChartPrimitives';
import { FileText } from 'lucide-react';

const ProjectDetailView: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState('1');
  const project = getProjectDetail(selectedProject);

  const donutSegments = [
    { label: 'В работе', value: project.contracts.inProgress, color: chartColors.primary[0] },
    { label: 'Подписано', value: project.contracts.signed, color: chartColors.mint[0] },
    { label: 'Аннулировано', value: project.contracts.cancelled, color: '#ef4444' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[150px]" />
      </div>
      <div className="relative space-y-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">проекты</p>
            <h2 className="text-2xl font-semibold text-white">Детали проекта</h2>
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:outline-none"
          >
            <option value="1">ЖК 1</option>
            <option value="2">ЖК 2</option>
            <option value="3">ЖК 3</option>
          </select>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ChartCard title="Освоение бюджета" subtitle="млн ₽">
            <div className="flex items-center gap-6">
              <DonutRing
                size={220}
                segments={[
                  { value: project.budgetUtilized.percent, color: chartColors.primary[0] },
                  { value: 100 - project.budgetUtilized.percent, color: 'rgba(255,255,255,0.08)' },
                ]}
              >
                <span className="text-4xl font-semibold text-white">{project.budgetUtilized.percent}%</span>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">готово</span>
              </DonutRing>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Использовано</span>
                  <span className="text-white">{project.budgetUtilized.used} / {project.budgetUtilized.total}</span>
                </div>
                <TrendBadge label={`+${project.realization.change}%`} tone="positive" />
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Продажи" subtitle="шт." className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-300">
              {Object.entries(project.sales).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">{key}</span>
                  <span className="text-white">{value.sold} / {value.total}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ChartCard title="EBITDA" subtitle="млн ₽" className="lg:col-span-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={project.ebitda} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTickProps} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTickProps} />
                  <Tooltip content={<NeonTooltip />} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                  <Bar dataKey="value" fill={chartColors.primary[0]} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Договоры" subtitle="по статусам">
            <DonutRing segments={donutSegments} size={200}>
              <span className="text-3xl font-semibold text-white">{project.contracts.total}</span>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">шт.</span>
            </DonutRing>
          </ChartCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="CashFlow" subtitle="млн ₽" className="space-y-3">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={project.cashFlow} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTickProps} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTickProps} />
                  <Tooltip content={<NeonTooltip />} cursor={{ stroke: chartColors.primary[0] }} />
                  <Line type="monotone" dataKey="value" stroke={chartColors.primary[0]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Документы" subtitle="последние">
            <div className="space-y-2">
              {project.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-white">
                  <FileText className="h-4 w-4 text-blue-400" />
                  {doc.name}
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailView;
