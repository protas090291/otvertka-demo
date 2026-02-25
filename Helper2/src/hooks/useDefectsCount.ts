import { useState, useEffect } from 'react';
import { getAllDefects } from '../lib/hybridDefectsApi';
import { SupabaseDefect } from '../types';

interface DefectsCount {
  [apartmentId: string]: {
    total: number;
    active: number;
    fixed: number;
  };
}

export const useDefectsCount = () => {
  const [defectsCount, setDefectsCount] = useState<DefectsCount>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefectsCount = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const allDefects = await getAllDefects();
        
        // Группируем дефекты по квартирам
        const countByApartment: DefectsCount = {};
        
        allDefects.forEach((defect: SupabaseDefect) => {
          const apartmentId = defect.apartment_id;
          
          if (!countByApartment[apartmentId]) {
            countByApartment[apartmentId] = {
              total: 0,
              active: 0,
              fixed: 0
            };
          }
          
          countByApartment[apartmentId].total++;
          
          if (defect.status === 'active') {
            countByApartment[apartmentId].active++;
          } else if (defect.status === 'fixed') {
            countByApartment[apartmentId].fixed++;
          }
        });
        
        setDefectsCount(countByApartment);
        console.log('Загружено количество дефектов по квартирам:', countByApartment);
        
      } catch (err) {
        console.error('Ошибка загрузки количества дефектов:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    loadDefectsCount();
  }, []);

  // Функция для обновления счетчика (вызывается после создания/изменения дефекта)
  const refreshDefectsCount = async () => {
    try {
      const allDefects = await getAllDefects();
      
      const countByApartment: DefectsCount = {};
      
      allDefects.forEach((defect: SupabaseDefect) => {
        const apartmentId = defect.apartment_id;
        
        if (!countByApartment[apartmentId]) {
          countByApartment[apartmentId] = {
            total: 0,
            active: 0,
            fixed: 0
          };
        }
        
        countByApartment[apartmentId].total++;
        
        if (defect.status === 'active') {
          countByApartment[apartmentId].active++;
        } else if (defect.status === 'fixed') {
          countByApartment[apartmentId].fixed++;
        }
      });
      
      setDefectsCount(countByApartment);
      console.log('Обновлено количество дефектов по квартирам:', countByApartment);
      
    } catch (err) {
      console.error('Ошибка обновления количества дефектов:', err);
    }
  };

  return {
    defectsCount,
    loading,
    error,
    refreshDefectsCount
  };
};
