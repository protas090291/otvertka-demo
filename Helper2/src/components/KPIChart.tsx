import React, { useState, useEffect } from 'react';
import { getProjectKPIs } from '../lib/projectsApi';

const KPIChart: React.FC = () => {
  const [kpis, setKpis] = useState([
    { name: 'Сроки', value: 0, color: 'bg-blue-500', loading: true },
    { name: 'Качество', value: 0, color: 'bg-purple-500', loading: true },
    { name: 'Эффективность', value: 0, color: 'bg-orange-500', loading: true }
  ]);

  useEffect(() => {
    const loadKPIs = async () => {
      try {
        const kpiData = await getProjectKPIs();
        
        setKpis([
          { 
            name: 'Сроки', 
            value: Math.round(Math.min(kpiData.timelineAdherence, 100)), 
            color: 'bg-blue-500',
            loading: false
          },
          { 
            name: 'Качество', 
            value: kpiData.qualityScore, // qualityScore уже округлен в getProjectKPIs через единую функцию calculateQuality
            color: 'bg-purple-500',
            loading: false
          },
          { 
            name: 'Эффективность', 
            value: Math.round(Math.min(kpiData.efficiencyScore, 100)), 
            color: 'bg-orange-500',
            loading: false
          }
        ]);
      } catch (error) {
        console.error('Ошибка загрузки KPI:', error);
        setKpis(prev => prev.map(kpi => ({ ...kpi, loading: false })));
      }
    };

    loadKPIs();
  }, []);

  return (
    <div className="space-y-4">
      {kpis.map((kpi, index) => (
        <div key={index}>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-400">{kpi.name}</span>
            <span className="text-white font-semibold">
              {kpi.loading ? '...' : `${kpi.value}%`}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className={`${kpi.color} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${kpi.loading ? 0 : kpi.value}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPIChart;