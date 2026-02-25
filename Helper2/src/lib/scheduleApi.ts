import { supabase } from './supabase';

// Типы для расписания
export interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  type: 'meeting' | 'task' | 'deadline' | 'inspection' | 'delivery' | 'other';
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  all_day: boolean;
  project_id?: string;
  apartment_id?: string;
  assigned_to?: string;
  assigned_by?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'postponed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ScheduleEventInput {
  title: string;
  description: string;
  type: 'meeting' | 'task' | 'deadline' | 'inspection' | 'delivery' | 'other';
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  project_id?: string;
  apartment_id?: string;
  assigned_to?: string;
  assigned_by?: string;
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'postponed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  notes?: string;
}

export interface ScheduleEventUpdate {
  title?: string;
  description?: string;
  type?: 'meeting' | 'task' | 'deadline' | 'inspection' | 'delivery' | 'other';
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  project_id?: string;
  apartment_id?: string;
  assigned_to?: string;
  assigned_by?: string;
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'postponed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  notes?: string;
}

export interface ScheduleStats {
  totalEvents: number;
  todayEvents: number;
  upcomingEvents: number;
  overdueEvents: number;
  completedEvents: number;
  typeBreakdown: {
    [type: string]: number;
  };
  statusBreakdown: {
    [status: string]: number;
  };
}

// API функции для работы с расписанием

/**
 * Получить все события расписания
 */
export const getAllScheduleEvents = async (): Promise<ScheduleEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Ошибка получения событий расписания:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getAllScheduleEvents:', error);
    return [];
  }
};

/**
 * Получить событие по ID
 */
export const getScheduleEventById = async (id: string): Promise<ScheduleEvent | null> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Ошибка получения события расписания:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в getScheduleEventById:', error);
    return null;
  }
};

/**
 * Получить события за определенный период
 */
export const getScheduleEventsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<ScheduleEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Ошибка получения событий по датам:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getScheduleEventsByDateRange:', error);
    return [];
  }
};

/**
 * Получить события на сегодня
 */
export const getTodayScheduleEvents = async (): Promise<ScheduleEvent[]> => {
  const today = new Date().toISOString().split('T')[0];
  return getScheduleEventsByDateRange(today, today);
};

/**
 * Получить события на завтра
 */
export const getTomorrowScheduleEvents = async (): Promise<ScheduleEvent[]> => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  return getScheduleEventsByDateRange(tomorrowStr, tomorrowStr);
};

/**
 * Получить события на текущую неделю
 */
export const getThisWeekScheduleEvents = async (): Promise<ScheduleEvent[]> => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
  
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
  
  return getScheduleEventsByDateRange(startOfWeekStr, endOfWeekStr);
};

/**
 * Получить события по проекту
 */
export const getScheduleEventsByProject = async (projectId: string): Promise<ScheduleEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('project_id', projectId)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Ошибка получения событий по проекту:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getScheduleEventsByProject:', error);
    return [];
  }
};

/**
 * Получить события по квартире
 */
export const getScheduleEventsByApartment = async (apartmentId: string): Promise<ScheduleEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Ошибка получения событий по квартире:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getScheduleEventsByApartment:', error);
    return [];
  }
};

/**
 * Получить события по типу
 */
export const getScheduleEventsByType = async (type: string): Promise<ScheduleEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('type', type)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Ошибка получения событий по типу:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getScheduleEventsByType:', error);
    return [];
  }
};

/**
 * Получить события по статусу
 */
export const getScheduleEventsByStatus = async (status: string): Promise<ScheduleEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('status', status)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Ошибка получения событий по статусу:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getScheduleEventsByStatus:', error);
    return [];
  }
};

/**
 * Поиск событий
 */
export const searchScheduleEvents = async (searchTerm: string): Promise<ScheduleEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Ошибка поиска событий:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в searchScheduleEvents:', error);
    return [];
  }
};

/**
 * Создать новое событие
 */
export const createScheduleEvent = async (event: ScheduleEventInput): Promise<ScheduleEvent | null> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .insert([{
        ...event,
        all_day: event.all_day || false,
        status: event.status || 'scheduled',
        priority: event.priority || 'medium'
      }])
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания события:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в createScheduleEvent:', error);
    return null;
  }
};

/**
 * Обновить событие
 */
export const updateScheduleEvent = async (id: string, updates: ScheduleEventUpdate): Promise<ScheduleEvent | null> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления события:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в updateScheduleEvent:', error);
    return null;
  }
};

/**
 * Отметить событие как выполненное
 */
export const completeScheduleEvent = async (id: string): Promise<ScheduleEvent | null> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка завершения события:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в completeScheduleEvent:', error);
    return null;
  }
};

/**
 * Отменить событие
 */
export const cancelScheduleEvent = async (id: string, notes?: string): Promise<ScheduleEvent | null> => {
  try {
    const { data, error } = await supabase
      .from('schedule_events')
      .update({ 
        status: 'cancelled',
        notes: notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка отмены события:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в cancelScheduleEvent:', error);
    return null;
  }
};

/**
 * Удалить событие
 */
export const deleteScheduleEvent = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('schedule_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Ошибка удаления события:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Ошибка в deleteScheduleEvent:', error);
    return false;
  }
};

/**
 * Получить просроченные события
 */
export const getOverdueScheduleEvents = async (): Promise<ScheduleEvent[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .lt('start_date', today)
      .in('status', ['scheduled', 'in-progress'])
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Ошибка получения просроченных событий:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getOverdueScheduleEvents:', error);
    return [];
  }
};

/**
 * Получить предстоящие события
 */
export const getUpcomingScheduleEvents = async (days: number = 7): Promise<ScheduleEvent[]> => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];
    
    return getScheduleEventsByDateRange(todayStr, futureStr);
  } catch (error) {
    console.error('Ошибка в getUpcomingScheduleEvents:', error);
    return [];
  }
};

/**
 * Получить статистику расписания
 */
export const getScheduleStats = async (): Promise<ScheduleStats> => {
  try {
    const events = await getAllScheduleEvents();
    
    let totalEvents = events.length;
    let todayEvents = 0;
    let upcomingEvents = 0;
    let overdueEvents = 0;
    let completedEvents = 0;
    const typeBreakdown: { [type: string]: number } = {};
    const statusBreakdown: { [status: string]: number } = {};

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const nextWeek = tomorrow.toISOString().split('T')[0];

    events.forEach(event => {
      // Подсчет по типам
      typeBreakdown[event.type] = (typeBreakdown[event.type] || 0) + 1;
      
      // Подсчет по статусам
      statusBreakdown[event.status] = (statusBreakdown[event.status] || 0) + 1;

      // Подсчет событий на сегодня
      if (event.start_date === today) {
        todayEvents++;
      }

      // Подсчет предстоящих событий
      if (event.start_date > today && event.start_date <= nextWeek) {
        upcomingEvents++;
      }

      // Подсчет просроченных событий
      if (event.start_date < today && ['scheduled', 'in-progress'].includes(event.status)) {
        overdueEvents++;
      }

      // Подсчет завершенных событий
      if (event.status === 'completed') {
        completedEvents++;
      }
    });

    return {
      totalEvents,
      todayEvents,
      upcomingEvents,
      overdueEvents,
      completedEvents,
      typeBreakdown,
      statusBreakdown
    };
  } catch (error) {
    console.error('Ошибка в getScheduleStats:', error);
    return {
      totalEvents: 0,
      todayEvents: 0,
      upcomingEvents: 0,
      overdueEvents: 0,
      completedEvents: 0,
      typeBreakdown: {},
      statusBreakdown: {}
    };
  }
};

/**
 * Экспорт расписания в CSV
 */
export const exportScheduleToCSV = async (): Promise<string> => {
  try {
    const events = await getAllScheduleEvents();

    const headers = [
      'Название',
      'Описание',
      'Тип',
      'Дата начала',
      'Время начала',
      'Дата окончания',
      'Время окончания',
      'Весь день',
      'Проект',
      'Квартира',
      'Назначено',
      'Статус',
      'Приоритет',
      'Место',
      'Заметки',
      'Создано'
    ];

    const csvRows = [headers.join(',')];

    events.forEach(event => {
      const row = [
        `"${event.title}"`,
        `"${event.description}"`,
        event.type,
        event.start_date,
        event.start_time || '',
        event.end_date,
        event.end_time || '',
        event.all_day ? 'Да' : 'Нет',
        event.project_id || '',
        event.apartment_id || '',
        event.assigned_to || '',
        event.status,
        event.priority,
        event.location || '',
        `"${event.notes || ''}"`,
        new Date(event.created_at).toLocaleDateString('ru')
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  } catch (error) {
    console.error('Ошибка экспорта расписания в CSV:', error);
    return '';
  }
};
