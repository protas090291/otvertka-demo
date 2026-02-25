import { supabase } from './supabase';
import { SupabaseDefect } from '../types';

// Гибридный API для дефектов - пытается использовать Supabase, при ошибке переключается на localStorage

const STORAGE_KEY = 'defects_data';
let useSupabase = true; // Флаг для переключения между Supabase и localStorage

// Функция для проверки доступности Supabase (только чтение — не требует прав на INSERT)
const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('defects')
      .select('id')
      .limit(1);

    if (error) {
      console.warn('❌ Supabase таблица defects недоступна:', error.message);
      console.warn('💡 Выполните SQL из файла supabase-defects-setup.sql в Supabase Dashboard');
      return false;
    }
    console.log('✅ Supabase таблица defects доступна');
    return true;
  } catch (error) {
    console.warn('❌ Supabase недоступен:', error);
    console.warn('💡 Проверьте подключение к интернету и настройки Supabase');
    return false;
  }
};

// Инициализация - проверяем доступность Supabase
const initializeApi = async () => {
  const isSupabaseAvailable = await checkSupabaseConnection();
  useSupabase = isSupabaseAvailable;
  
  if (useSupabase) {
    console.log('✅ Используем Supabase для хранения дефектов');
  } else {
    console.log('📦 Используем localStorage для хранения дефектов');
  }
};

// Вызываем инициализацию при импорте модуля
initializeApi();

// === ФУНКЦИИ ДЛЯ SUPABASE ===

const supabaseGetAllDefects = async (): Promise<SupabaseDefect[]> => {
  const { data, error } = await supabase
    .from('defects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Ошибка получения дефектов из Supabase:', error);
    throw error;
  }

  return data || [];
};

const supabaseGetDefectsByApartment = async (apartmentId: string): Promise<SupabaseDefect[]> => {
  const { data, error } = await supabase
    .from('defects')
    .select('*')
    .eq('apartment_id', apartmentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Ошибка получения дефектов по квартире из Supabase:', error);
    throw error;
  }

  return data || [];
};

const supabaseCreateDefect = async (defect: Omit<SupabaseDefect, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseDefect | null> => {
  // Убеждаемся, что status_detail установлен
  const defectWithStatusDetail = {
    ...defect,
    status_detail: defect.status_detail || 'open'
  };
  
  const { data, error } = await supabase
    .from('defects')
    .insert([defectWithStatusDetail])
    .select()
    .single();

  if (error) {
    console.error('Ошибка создания дефекта в Supabase:', error);
    throw error;
  }

  return data;
};

const supabaseUpdateDefect = async (defectId: string, updates: Partial<Omit<SupabaseDefect, 'id' | 'created_at' | 'updated_at'>>): Promise<SupabaseDefect | null> => {
  const { data, error } = await supabase
    .from('defects')
    .update(updates)
    .eq('id', defectId)
    .select()
    .single();

  if (error) {
    console.error('Ошибка обновления дефекта в Supabase:', error);
    throw error;
  }

  return data;
};

const supabaseUpdateDefectStatus = async (defectId: string, status: 'active' | 'fixed' | 'open' | 'in-progress' | 'resolved' | 'closed'): Promise<SupabaseDefect | null> => {
  // Маппинг статусов для совместимости с Supabase
  const statusMapping: { [key: string]: 'active' | 'fixed' } = {
    'open': 'active',
    'in-progress': 'active', 
    'resolved': 'fixed',
    'closed': 'fixed',
    'active': 'active',
    'fixed': 'fixed'
  };
  
  const mappedStatus = statusMapping[status] || 'active';
  
  // Обновляем и status, и status_detail
  return supabaseUpdateDefect(defectId, { 
    status: mappedStatus,
    status_detail: status as 'open' | 'in-progress' | 'resolved' | 'closed'
  });
};

const supabaseDeleteDefect = async (defectId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('defects')
    .delete()
    .eq('id', defectId);

  if (error) {
    console.error('Ошибка удаления дефекта из Supabase:', error);
    throw error;
  }

  return true;
};

const supabaseUploadDefectPhoto = async (file: File, defectId: string): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${defectId}-${Date.now()}.${fileExt}`;
  const filePath = `defect-photos/${fileName}`;

  const { data, error } = await supabase.storage
    .from('defect-photos')
    .upload(filePath, file);

  if (error) {
    console.error('Ошибка загрузки фото в Supabase Storage:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('defect-photos')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

// === ФУНКЦИИ ДЛЯ LOCALSTORAGE ===

const localStorageGetAllDefects = async (): Promise<SupabaseDefect[]> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Ошибка получения дефектов из localStorage:', error);
    return [];
  }
};

const localStorageGetDefectsByApartment = async (apartmentId: string): Promise<SupabaseDefect[]> => {
  try {
    const allDefects = await localStorageGetAllDefects();
    return allDefects.filter(defect => defect.apartment_id === apartmentId);
  } catch (error) {
    console.error('Ошибка получения дефектов по квартире из localStorage:', error);
    return [];
  }
};

const localStorageCreateDefect = async (defect: Omit<SupabaseDefect, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseDefect | null> => {
  try {
    const allDefects = await localStorageGetAllDefects();
    
    const newDefect: SupabaseDefect = {
      id: `defect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...defect,
      status_detail: defect.status_detail || 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    allDefects.push(newDefect);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allDefects));
    
    return newDefect;
  } catch (error) {
    console.error('Ошибка создания дефекта в localStorage:', error);
    return null;
  }
};

const localStorageUpdateDefect = async (defectId: string, updates: Partial<Omit<SupabaseDefect, 'id' | 'created_at' | 'updated_at'>>): Promise<SupabaseDefect | null> => {
  try {
    const allDefects = await localStorageGetAllDefects();
    const defectIndex = allDefects.findIndex(d => d.id === defectId);
    
    if (defectIndex === -1) {
      console.error('Дефект не найден в localStorage:', defectId);
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
    console.error('Ошибка обновления дефекта в localStorage:', error);
    return null;
  }
};

const localStorageUpdateDefectStatus = async (defectId: string, status: 'active' | 'fixed' | 'open' | 'in-progress' | 'resolved' | 'closed'): Promise<SupabaseDefect | null> => {
  // Маппинг статусов для совместимости с localStorage
  const statusMapping: { [key: string]: 'active' | 'fixed' } = {
    'open': 'active',
    'in-progress': 'active', 
    'resolved': 'fixed',
    'closed': 'fixed',
    'active': 'active',
    'fixed': 'fixed'
  };
  
  const mappedStatus = statusMapping[status] || 'active';
  
  return localStorageUpdateDefect(defectId, { 
    status: mappedStatus,
    status_detail: status as 'open' | 'in-progress' | 'resolved' | 'closed'
  });
};

const localStorageDeleteDefect = async (defectId: string): Promise<boolean> => {
  try {
    const allDefects = await localStorageGetAllDefects();
    const filteredDefects = allDefects.filter(d => d.id !== defectId);
    
    if (filteredDefects.length === allDefects.length) {
      console.error('Дефект не найден в localStorage:', defectId);
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDefects));
    return true;
  } catch (error) {
    console.error('Ошибка удаления дефекта из localStorage:', error);
    return false;
  }
};

const localStorageUploadDefectPhoto = async (file: File, defectId: string): Promise<string | null> => {
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
    console.error('Ошибка загрузки фото в localStorage:', error);
    return null;
  }
};

// === ОСНОВНЫЕ ФУНКЦИИ API ===

export const getAllDefects = async (): Promise<SupabaseDefect[]> => {
  try {
    if (useSupabase) {
      return await supabaseGetAllDefects();
    } else {
      return await localStorageGetAllDefects();
    }
  } catch (error) {
    console.warn('Ошибка в Supabase, временно используем localStorage для этого запроса:', error);
    return await localStorageGetAllDefects();
  }
};

export const getDefectsByApartment = async (apartmentId: string): Promise<SupabaseDefect[]> => {
  try {
    if (useSupabase) {
      return await supabaseGetDefectsByApartment(apartmentId);
    } else {
      return await localStorageGetDefectsByApartment(apartmentId);
    }
  } catch (error) {
    console.warn('Ошибка в Supabase, переключаемся на localStorage');
    useSupabase = false;
    return await localStorageGetDefectsByApartment(apartmentId);
  }
};

export const createDefect = async (defect: Omit<SupabaseDefect, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseDefect | null> => {
  try {
    if (useSupabase) {
      const result = await supabaseCreateDefect(defect);
      if (result) {
        return result;
      } else {
        throw new Error('Supabase create failed');
      }
    } else {
      return await localStorageCreateDefect(defect);
    }
  } catch (error) {
    console.warn('Ошибка в Supabase, переключаемся на localStorage:', error);
    useSupabase = false;
    return await localStorageCreateDefect(defect);
  }
};

export const updateDefect = async (defectId: string, updates: Partial<Omit<SupabaseDefect, 'id' | 'created_at' | 'updated_at'>>): Promise<SupabaseDefect | null> => {
  try {
    if (useSupabase) {
      return await supabaseUpdateDefect(defectId, updates);
    } else {
      return await localStorageUpdateDefect(defectId, updates);
    }
  } catch (error) {
    console.warn('Ошибка в Supabase, временно используем localStorage для этого запроса:', error);
    return await localStorageUpdateDefect(defectId, updates);
  }
};

export const updateDefectStatus = async (defectId: string, status: 'active' | 'fixed' | 'open' | 'in-progress' | 'resolved' | 'closed'): Promise<SupabaseDefect | null> => {
  try {
    if (useSupabase) {
      return await supabaseUpdateDefectStatus(defectId, status);
    } else {
      return await localStorageUpdateDefectStatus(defectId, status);
    }
  } catch (error) {
    console.warn('Ошибка в Supabase, временно используем localStorage для этого запроса:', error);
    return await localStorageUpdateDefectStatus(defectId, status);
  }
};

export const deleteDefect = async (defectId: string): Promise<boolean> => {
  try {
    if (useSupabase) {
      return await supabaseDeleteDefect(defectId);
    } else {
      return await localStorageDeleteDefect(defectId);
    }
  } catch (error) {
    console.warn('Ошибка в Supabase, переключаемся на localStorage');
    useSupabase = false;
    return await localStorageDeleteDefect(defectId);
  }
};

export const uploadDefectPhoto = async (file: File, defectId: string): Promise<string | null> => {
  try {
    if (useSupabase) {
      return await supabaseUploadDefectPhoto(file, defectId);
    } else {
      return await localStorageUploadDefectPhoto(file, defectId);
    }
  } catch (error) {
    console.warn('Ошибка в Supabase, временно используем localStorage для этого запроса:', error);
    return await localStorageUploadDefectPhoto(file, defectId);
  }
};

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

// Функция для принудительного переключения на localStorage
export const forceLocalStorage = () => {
  useSupabase = false;
  console.log('🔄 Принудительно переключились на localStorage');
};

// Принудительно использовать базу данных (Supabase)
export const forceUseSupabase = () => {
  useSupabase = true;
  console.log('🔄 Принудительно переключились на Supabase (база данных)');
};

// Функция для проверки текущего режима
export const getCurrentMode = () => {
  return useSupabase ? 'Supabase' : 'localStorage';
};

// Функция для принудительной проверки Supabase (для отладки и кнопки «Использовать БД»)
export const forceCheckSupabase = async () => {
  console.log('🔄 Проверка подключения к Supabase...');
  const isAvailable = await checkSupabaseConnection();
  useSupabase = isAvailable;
  console.log(`📊 Режим: ${useSupabase ? 'Supabase (база данных)' : 'localStorage'}`);
  return isAvailable;
};
