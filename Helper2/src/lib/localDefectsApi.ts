import { SupabaseDefect } from '../types';

// Локальное API для дефектов (работает без Supabase)
// Данные хранятся в localStorage браузера

const STORAGE_KEY = 'defects_data';

// Получить все дефекты из localStorage
export const getAllDefects = async (): Promise<SupabaseDefect[]> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Ошибка получения дефектов из localStorage:', error);
    return [];
  }
};

// Получить дефекты для конкретной квартиры
export const getDefectsByApartment = async (apartmentId: string): Promise<SupabaseDefect[]> => {
  try {
    console.log('Получаем дефекты для квартиры:', apartmentId);
    const allDefects = await getAllDefects();
    console.log('Все дефекты:', allDefects);
    const apartmentDefects = allDefects.filter(defect => defect.apartment_id === apartmentId);
    console.log('Дефекты для квартиры', apartmentId, ':', apartmentDefects);
    return apartmentDefects;
  } catch (error) {
    console.error('Ошибка получения дефектов по квартире:', error);
    return [];
  }
};

// Создать новый дефект
export const createDefect = async (defect: Omit<SupabaseDefect, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseDefect | null> => {
  try {
    console.log('Создаем дефект:', defect);
    const allDefects = await getAllDefects();
    console.log('Текущие дефекты:', allDefects);
    
    const newDefect: SupabaseDefect = {
      id: `defect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...defect,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    allDefects.push(newDefect);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allDefects));
    
    console.log('Дефект создан локально:', newDefect);
    console.log('Все дефекты после создания:', allDefects);
    return newDefect;
  } catch (error) {
    console.error('Ошибка создания дефекта:', error);
    return null;
  }
};

// Обновить статус дефекта
export const updateDefectStatus = async (defectId: string, status: 'active' | 'fixed'): Promise<SupabaseDefect | null> => {
  try {
    const allDefects = await getAllDefects();
    const defectIndex = allDefects.findIndex(d => d.id === defectId);
    
    if (defectIndex === -1) {
      console.error('Дефект не найден:', defectId);
      return null;
    }
    
    allDefects[defectIndex] = {
      ...allDefects[defectIndex],
      status,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allDefects));
    return allDefects[defectIndex];
  } catch (error) {
    console.error('Ошибка обновления статуса дефекта:', error);
    return null;
  }
};

// Обновить дефект
export const updateDefect = async (defectId: string, updates: Partial<Omit<SupabaseDefect, 'id' | 'created_at' | 'updated_at'>>): Promise<SupabaseDefect | null> => {
  try {
    const allDefects = await getAllDefects();
    const defectIndex = allDefects.findIndex(d => d.id === defectId);
    
    if (defectIndex === -1) {
      console.error('Дефект не найден:', defectId);
      return null;
    }
    
    allDefects[defectIndex] = {
      ...allDefects[defectIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allDefects));
    return allDefects[defectIndex];
  } catch (error) {
    console.error('Ошибка обновления дефекта:', error);
    return null;
  }
};

// Удалить дефект
export const deleteDefect = async (defectId: string): Promise<boolean> => {
  try {
    const allDefects = await getAllDefects();
    const filteredDefects = allDefects.filter(d => d.id !== defectId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDefects));
    return true;
  } catch (error) {
    console.error('Ошибка удаления дефекта:', error);
    return false;
  }
};

// Загрузить фото дефекта (локальная версия - возвращает data URL)
export const uploadDefectPhoto = async (file: File, defectId: string): Promise<string | null> => {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Ошибка чтения файла'));
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Ошибка загрузки фото:', error);
    return null;
  }
};

// Получить статистику дефектов
export const getDefectsStats = async (): Promise<{
  total: number;
  active: number;
  fixed: number;
  byApartment: { [apartmentId: string]: number };
}> => {
  try {
    const allDefects = await getAllDefects();
    
    const stats = {
      total: allDefects.length,
      active: allDefects.filter(d => d.status === 'active').length,
      fixed: allDefects.filter(d => d.status === 'fixed').length,
      byApartment: {} as { [apartmentId: string]: number }
    };
    
    // Подсчитываем дефекты по квартирам
    allDefects.forEach(defect => {
      stats.byApartment[defect.apartment_id] = (stats.byApartment[defect.apartment_id] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error('Ошибка получения статистики дефектов:', error);
    return {
      total: 0,
      active: 0,
      fixed: 0,
      byApartment: {}
    };
  }
};

// Инициализация с тестовыми данными
export const initializeWithTestData = async (): Promise<void> => {
  try {
    const existingDefects = await getAllDefects();
    
    // Если уже есть данные, не добавляем тестовые
    if (existingDefects.length > 0) {
      console.log('Дефекты уже существуют, пропускаем инициализацию');
      return;
    }
    
    const testData: Omit<SupabaseDefect, 'id' | 'created_at' | 'updated_at'>[] = [
      {
        apartment_id: '101',
        title: 'Трещина в стене',
        description: 'Обнаружена трещина шириной 2-3 мм в северо-восточном углу',
        status: 'active',
        x_coord: 15.5,
        y_coord: 20.3
      },
      {
        apartment_id: '101',
        title: 'Проблема с проводкой',
        description: 'Отсутствует заземление в розетках кухни',
        status: 'active',
        x_coord: 25.8,
        y_coord: 35.2
      },
      {
        apartment_id: '203',
        title: 'Протечка в ванной',
        description: 'Вода капает из соединения трубы',
        status: 'fixed',
        x_coord: 85.2,
        y_coord: 60.7
      },
      {
        apartment_id: '401',
        title: 'Неровная стена',
        description: 'Стена в спальне имеет неровности',
        status: 'active',
        x_coord: 45.1,
        y_coord: 65.8
      }
    ];
    
    for (const defectData of testData) {
      await createDefect(defectData);
    }
    
    console.log('✅ Тестовые данные дефектов инициализированы');
  } catch (error) {
    console.error('Ошибка инициализации тестовых данных:', error);
  }
};
