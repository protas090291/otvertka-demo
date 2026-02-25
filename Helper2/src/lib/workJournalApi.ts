import { supabase } from './supabase';
import { WorkJournalEntry, WorkJournalEntryInput, WorkJournalEntryUpdate, WorkJournalStats } from '../types';

// Получение всех записей журнала работ
export const getAllWorkJournalEntries = async (): Promise<WorkJournalEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('work_journal')
      .select('*')
      .order('work_date', { ascending: false })
      .order('work_time', { ascending: false });

    if (error) {
      console.error('Ошибка получения записей журнала работ:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getAllWorkJournalEntries:', error);
    return [];
  }
};

// Получение записей журнала за определенный период
export const getWorkJournalEntriesByDateRange = async (
  startDate: string,
  endDate: string
): Promise<WorkJournalEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('work_journal')
      .select('*')
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .order('work_date', { ascending: false })
      .order('work_time', { ascending: false });

    if (error) {
      console.error('Ошибка получения записей журнала по датам:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getWorkJournalEntriesByDateRange:', error);
    return [];
  }
};

// Получение записей журнала для конкретной задачи
export const getWorkJournalEntriesByTask = async (
  taskName: string,
  section: string
): Promise<WorkJournalEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('work_journal')
      .select('*')
      .eq('task_name', taskName)
      .eq('section', section)
      .order('work_date', { ascending: false })
      .order('work_time', { ascending: false });

    if (error) {
      console.error('Ошибка получения записей журнала по задаче:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getWorkJournalEntriesByTask:', error);
    return [];
  }
};

// Получение записей журнала для конкретной квартиры
export const getWorkJournalEntriesByApartment = async (
  apartmentId: string
): Promise<WorkJournalEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('work_journal')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('work_date', { ascending: false })
      .order('work_time', { ascending: false });

    if (error) {
      console.error('Ошибка получения записей журнала по квартире:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getWorkJournalEntriesByApartment:', error);
    return [];
  }
};

// Создание новой записи в журнале работ
export const createWorkJournalEntry = async (
  entry: WorkJournalEntryInput
): Promise<WorkJournalEntry | null> => {
  try {
    const { data, error } = await supabase
      .from('work_journal')
      .insert([{
        ...entry,
        work_date: entry.work_date || new Date().toISOString().split('T')[0],
        work_time: entry.work_time || new Date().toTimeString().split(' ')[0].substring(0, 8)
      }])
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания записи в журнале работ:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в createWorkJournalEntry:', error);
    return null;
  }
};

// Обновление записи в журнале работ
export const updateWorkJournalEntry = async (
  id: string,
  updates: WorkJournalEntryUpdate
): Promise<WorkJournalEntry | null> => {
  try {
    const { data, error } = await supabase
      .from('work_journal')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления записи в журнале работ:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в updateWorkJournalEntry:', error);
    return null;
  }
};

// Удаление записи из журнала работ
export const deleteWorkJournalEntry = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('work_journal')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Ошибка удаления записи из журнала работ:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Ошибка в deleteWorkJournalEntry:', error);
    return false;
  }
};

// Получение статистики журнала работ
export const getWorkJournalStats = async (
  startDate?: string,
  endDate?: string,
  workerRole?: string
): Promise<WorkJournalStats> => {
  try {
    const { data, error } = await supabase
      .rpc('get_work_journal_stats', {
        start_date: startDate || null,
        end_date: endDate || null,
        worker_role_filter: workerRole || null
      });

    if (error) {
      console.error('Ошибка получения статистики журнала работ:', error);
      throw error;
    }

    return data?.[0] || {
      total_works: 0,
      total_progress_gained: 0,
      unique_workers: 0,
      unique_tasks: 0,
      unique_apartments: 0
    };
  } catch (error) {
    console.error('Ошибка в getWorkJournalStats:', error);
    return {
      total_works: 0,
      total_progress_gained: 0,
      unique_workers: 0,
      unique_tasks: 0,
      unique_apartments: 0
    };
  }
};

// Получение записей журнала за сегодня
export const getTodayWorkJournalEntries = async (): Promise<WorkJournalEntry[]> => {
  const today = new Date().toISOString().split('T')[0];
  return getWorkJournalEntriesByDateRange(today, today);
};

// Получение записей журнала за вчера
export const getYesterdayWorkJournalEntries = async (): Promise<WorkJournalEntry[]> => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  return getWorkJournalEntriesByDateRange(yesterdayStr, yesterdayStr);
};

// Получение записей журнала за текущую неделю
export const getThisWeekWorkJournalEntries = async (): Promise<WorkJournalEntry[]> => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  return getWorkJournalEntriesByDateRange(startOfWeekStr, todayStr);
};

// Экспорт журнала работ в CSV
export const exportWorkJournalToCSV = async (
  startDate?: string,
  endDate?: string
): Promise<string> => {
  try {
    const entries = startDate && endDate 
      ? await getWorkJournalEntriesByDateRange(startDate, endDate)
      : await getAllWorkJournalEntries();

    const headers = [
      'Дата',
      'Время',
      'Задача',
      'Секция',
      'Квартира',
      'Описание работы',
      'Прогресс до',
      'Прогресс после',
      'Исполнитель',
      'Роль',
      'Заметки'
    ];

    const csvRows = [headers.join(',')];

    entries.forEach(entry => {
      const row = [
        entry.work_date,
        entry.work_time,
        `"${entry.task_name}"`,
        `"${entry.section}"`,
        entry.apartment_id,
        `"${entry.work_description}"`,
        entry.progress_before,
        entry.progress_after,
        `"${entry.worker_name || ''}"`,
        `"${entry.worker_role || ''}"`,
        `"${entry.notes || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  } catch (error) {
    console.error('Ошибка экспорта журнала работ в CSV:', error);
    return '';
  }
};
