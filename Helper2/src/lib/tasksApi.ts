import { supabase, supabaseAdmin } from './supabase';
import { Task } from '../types';
import { normalizeStatus, normalizeProjectId, normalizeString, normalizeNumber } from './dataNormalizer';
import { validateRequired, validateProgress, validateDate, validateProjectId, validateString } from './dataValidator';

// API функции для работы с задачами

/**
 * Получить все задачи
 */
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    console.log('🔄 Запрос всех задач из базы данных...');
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Ошибка получения задач:', error);
      throw error;
    }

    console.log('✅ Данные получены из базы:', data);
    const mappedTasks = (data || []).map(mapToTask);
    console.log('✅ Задачи преобразованы:', mappedTasks);
    return mappedTasks;
  } catch (error) {
    console.error('❌ Ошибка в getAllTasks:', error);
    return [];
  }
};

/**
 * Получить задачу по ID
 */
export const getTaskById = async (id: string): Promise<Task | null> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Ошибка получения задачи:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в getTaskById:', error);
    return null;
  }
};

/**
 * Получить задачи по проекту
 */
export const getTasksByProject = async (projectId: string): Promise<Task[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения задач по проекту:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getTasksByProject:', error);
    return [];
  }
};

/**
 * Получить задачи по статусу
 */
export const getTasksByStatus = async (status: string): Promise<Task[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения задач по статусу:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getTasksByStatus:', error);
    return [];
  }
};

/**
 * Получить задачи по исполнителю
 */
export const getTasksByAssignee = async (assignee: string): Promise<Task[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assignee', assignee)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения задач по исполнителю:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getTasksByAssignee:', error);
    return [];
  }
};

/**
 * Задачи для текущего пользователя: свои (где я исполнитель) + выданные мной (где я создатель).
 * Использует user_id (исполнитель) и created_by_user_id (кто создал).
 */
export const getTasksForCurrentUser = async (userId: string): Promise<Task[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`user_id.eq.${userId},created_by_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка getTasksForCurrentUser:', error);
      return [];
    }
    return (data || []).map(mapToTask);
  } catch (error) {
    console.error('Ошибка в getTasksForCurrentUser:', error);
    return [];
  }
};

// Интерфейс для создания задачи
export interface TaskInput {
  projectId: string;
  name: string;
  description: string;
  status: Task['status'];
  assignee: string;
  startDate: string;
  endDate: string;
  progress: number;
  dependencies?: string[];
  order?: number;
  /** ID пользователя-исполнителя (auth.users.id) — для привязки к реальному пользователю */
  assignedToUserId?: string | null;
  /** ID пользователя-создателя (auth.users.id) — кто выдал задачу */
  createdByUserId?: string | null;
}

// Интерфейс для обновления задачи
export interface TaskUpdate {
  projectId?: string;
  name?: string;
  description?: string;
  status?: Task['status'];
  assignee?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  dependencies?: string[];
  order?: number;
}

// Функции нормализации импортированы выше

// Функция для преобразования данных из Supabase в формат Task
const mapToTask = (data: any): Task => ({
  id: data.id,
  projectId: data.project_id,
  name: data.title || data.name,
  description: data.description,
  status: (data.status || 'pending') as Task['status'],
  assignee: data.assigned_to || data.assignee,
  startDate: data.start_date,
  endDate: data.end_date,
  progress: data.progress_percentage ?? data.progress_perc ?? data.progress ?? 0,
  dependencies: data.dependencies || [],
  order: data.order ?? data.order_index ?? 0,
  assigneeUserId: data.user_id ?? undefined,
  createdByUserId: data.created_by_user_id ?? undefined,
  review_feedback: data.review_feedback ?? null
});

/**
 * Создать новую задачу
 */
export const createTask = async (task: TaskInput): Promise<Task | null> => {
  try {
    // 1. ВАЛИДАЦИЯ - проверяем, что данные правильные
    validateRequired(task.projectId, 'ID проекта');
    validateRequired(task.name, 'Название задачи');
    validateProjectId(task.projectId);
    validateString(task.name, 'Название задачи', 1, 500);
    validateProgress(task.progress || 0, 'Прогресс');
    
    if (task.description) {
      validateString(task.description, 'Описание', 0, 2000);
    }
    
    if (task.startDate) {
      validateDate(task.startDate, 'Дата начала');
    }
    
    if (task.endDate) {
      validateDate(task.endDate, 'Дата окончания');
    }
    
    // 2. НОРМАЛИЗАЦИЯ - преобразуем в единый формат
    const normalizedProjectId = normalizeProjectId(task.projectId);
    const normalizedStatus = normalizeStatus(task.status || 'pending');
    const normalizedProgress = normalizeNumber(task.progress || 0, 0, 100);
    
    // 3. СОЗДАНИЕ - используем нормализованные данные
    const insertData: any = {
      project_id: normalizedProjectId,
      title: normalizeString(task.name), // Используем title вместо name, обязательное поле
      status: normalizedStatus, // Статус в формате базы данных
      progress_percentage: normalizedProgress
    };
    
    // Добавляем опциональные поля только если они есть
    if (task.description) {
      insertData.description = normalizeString(task.description);
    }
    
    if (task.assignee) {
      insertData.assigned_to = normalizeString(task.assignee);
    }
    if (task.assignedToUserId) {
      insertData.user_id = task.assignedToUserId;
    }
    if (task.createdByUserId) {
      insertData.created_by_user_id = task.createdByUserId;
    }
    if (task.startDate) {
      insertData.start_date = normalizeString(task.startDate);
    }
    if (task.endDate) {
      insertData.end_date = normalizeString(task.endDate);
    }

    // Колонки order в таблице tasks нет — не отправляем
    console.log('📝 Создание задачи с данными:', insertData);
    console.log('📝 project_id:', insertData.project_id, 'тип:', typeof insertData.project_id);

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([insertData])
      .select('id, project_id, title, description, status, assigned_to, start_date, end_date, progress_percentage, created_at, updated_at, user_id, created_by_user_id')
      .single();

    if (error) {
      console.error('❌ Ошибка создания задачи:', error);
      console.error('❌ Детали ошибки:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      console.error('❌ Данные, которые вызвали ошибку:', insertData);
      throw error;
    }

    console.log('✅ Задача успешно создана:', data);
    return mapToTask(data);
  } catch (error: any) {
    console.error('❌ Ошибка в createTask:', error);
    if (error?.message) {
      console.error('❌ Сообщение об ошибке:', error.message);
    }
    return null;
  }
};

/**
 * Проверка прав: только исполнитель может редактировать прогресс/статус (кроме «Проверить задачу»).
 * currentUserId опционален — если не передан, проверка не выполняется (обратная совместимость).
 */
const ensureAssigneeOrCreator = async (
  id: string,
  currentUserId: string | undefined,
  action: 'edit' | 'confirm'
): Promise<{ task: Task | null; allowed: boolean }> => {
  if (!currentUserId) return { task: null, allowed: true };
  const { data: row, error } = await supabaseAdmin.from('tasks').select('*').eq('id', id).single();
  if (error || !row) return { task: null, allowed: false };
  const task = mapToTask(row);
  if (action === 'confirm') {
    return { task, allowed: task.createdByUserId === currentUserId && task.status === 'submitted_for_review' };
  }
  return { task, allowed: task.assigneeUserId === currentUserId };
};

/**
 * Обновить задачу
 * @param currentUserId — если передан, правка разрешена только исполнителю (assignee)
 */
export const updateTask = async (id: string, updates: TaskUpdate, currentUserId?: string): Promise<Task | null> => {
  try {
    const { task: existing, allowed } = await ensureAssigneeOrCreator(id, currentUserId, 'edit');
    if (currentUserId && !allowed) {
      console.warn('❌ API: Обновление задачи разрешено только исполнителю');
      return null;
    }
    if (currentUserId && existing && updates.status === 'completed' && existing.status === 'submitted_for_review') {
      console.warn('❌ API: Завершение задачи с проверки только через confirmTaskCompleted');
      return null;
    }

    const { data: _existingTask, error: checkError } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('❌ API: Ошибка проверки существования задачи:', checkError);
      throw checkError;
    }
    
    // 1. ВАЛИДАЦИЯ - проверяем данные перед обновлением
    if (updates.projectId !== undefined) {
      validateProjectId(updates.projectId);
    }
    if (updates.name !== undefined) {
      validateString(updates.name, 'Название задачи', 1, 500);
    }
    if (updates.description !== undefined) {
      validateString(updates.description, 'Описание', 0, 2000);
    }
    if (updates.progress !== undefined) {
      validateProgress(updates.progress, 'Прогресс');
    }
    if (updates.startDate !== undefined) {
      validateDate(updates.startDate, 'Дата начала');
    }
    if (updates.endDate !== undefined) {
      validateDate(updates.endDate, 'Дата окончания');
    }
    
    // 2. НОРМАЛИЗАЦИЯ - преобразуем в единый формат
    const updateData: any = {};
    
    if (updates.projectId !== undefined) {
      updateData.project_id = normalizeProjectId(updates.projectId);
    }
    if (updates.name !== undefined) {
      updateData.title = normalizeString(updates.name); // Используем title вместо name
    }
    if (updates.description !== undefined) {
      updateData.description = normalizeString(updates.description);
    }
    if (updates.status !== undefined) {
      updateData.status = normalizeStatus(updates.status);
    }
    if (updates.assignee !== undefined) {
      updateData.assigned_to = normalizeString(updates.assignee); // Используем assigned_to вместо assignee
    }
    if (updates.startDate !== undefined) {
      updateData.start_date = normalizeString(updates.startDate);
    }
    if (updates.endDate !== undefined) {
      updateData.end_date = normalizeString(updates.endDate);
    }
    if (updates.progress !== undefined) {
      updateData.progress_percentage = normalizeNumber(updates.progress, 0, 100); // Используем progress_percentage (реальная колонка)
    }
    // dependencies и order_index не существуют в таблице tasks, поэтому не добавляем их

    console.log('📊 API: Подготовленные данные для Supabase:', updateData);

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ API: Ошибка обновления задачи:', error);
      console.error('❌ API: Детали ошибки:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      console.error('❌ API: Данные, которые вызвали ошибку:', updateData);
      console.error('❌ API: ID задачи:', id);
      throw error;
    }

    if (!data) {
      console.error('❌ API: Нет данных в ответе от Supabase');
      return null;
    }

    console.log('✅ API: Данные получены из Supabase:', data);
    const mappedTask = mapToTask(data);
    console.log('✅ API: Преобразованная задача:', mappedTask);
    
    return mappedTask;
  } catch (error) {
    console.error('❌ API: Ошибка в updateTask:', error);
    return null;
  }
};

/**
 * Обновить статус задачи.
 * Только исполнитель может менять статус; переход в completed с «на проверке» — только через confirmTaskCompleted.
 */
export const updateTaskStatus = async (id: string, status: Task['status'], currentUserId?: string): Promise<Task | null> => {
  try {
    if (currentUserId) {
      const { task: existing, allowed } = await ensureAssigneeOrCreator(id, currentUserId, status === 'completed' ? 'confirm' : 'edit');
      if (!allowed) {
        if (status === 'completed' && existing?.status === 'submitted_for_review') {
          console.warn('❌ API: Подтвердить выполнение может только постановщик задачи');
        } else {
          console.warn('❌ API: Менять статус может только исполнитель');
        }
        return null;
      }
    }
    const dbStatus = normalizeStatus(status);
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ status: dbStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapToTask(data);
  } catch (error) {
    console.error('❌ API: Ошибка в updateTaskStatus:', error);
    return null;
  }
};

/**
 * Обновить прогресс задачи. Только исполнитель может менять прогресс.
 */
export const updateTaskProgress = async (id: string, progress: number, currentUserId?: string): Promise<Task | null> => {
  try {
    if (currentUserId) {
      const { allowed } = await ensureAssigneeOrCreator(id, currentUserId, 'edit');
      if (!allowed) {
        console.warn('❌ API: Менять прогресс может только исполнитель');
        return null;
      }
    }
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ progress_percentage: normalizeNumber(progress, 0, 100) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapToTask(data);
  } catch (error) {
    console.error('Ошибка в updateTaskProgress:', error);
    return null;
  }
};

/**
 * Сдать задачу на проверку (только исполнитель). Статус → submitted_for_review, прогресс 100%.
 */
export const submitTaskForReview = async (id: string, currentUserId: string): Promise<Task | null> => {
  try {
    const { allowed } = await ensureAssigneeOrCreator(id, currentUserId, 'edit');
    if (!allowed) {
      console.warn('❌ API: Сдать на проверку может только исполнитель');
      return null;
    }
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ status: 'submitted_for_review', progress_percentage: 100 })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapToTask(data);
  } catch (error) {
    console.error('Ошибка в submitTaskForReview:', error);
    return null;
  }
};

/**
 * Подтвердить выполнение задачи (только постановщик). Статус → completed.
 */
export const confirmTaskCompleted = async (id: string, currentUserId: string): Promise<Task | null> => {
  try {
    const { allowed } = await ensureAssigneeOrCreator(id, currentUserId, 'confirm');
    if (!allowed) {
      console.warn('❌ API: Подтвердить выполнение может только постановщик задачи');
      return null;
    }
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapToTask(data);
  } catch (error) {
    console.error('Ошибка в confirmTaskCompleted:', error);
    return null;
  }
};

/**
 * Вернуть задачу на доработку (только постановщик). Статус → in_progress, сохраняется комментарий.
 */
export const returnTaskForRevision = async (id: string, currentUserId: string, comment: string): Promise<Task | null> => {
  try {
    const { allowed } = await ensureAssigneeOrCreator(id, currentUserId, 'confirm');
    if (!allowed) {
      console.warn('❌ API: Вернуть на доработку может только постановщик задачи');
      return null;
    }
    if (!comment || !comment.trim()) {
      console.warn('❌ API: Комментарий обязателен при возврате на доработку');
      return null;
    }
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ 
        status: 'returned_for_revision',
        review_feedback: comment.trim()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapToTask(data);
  } catch (error) {
    console.error('Ошибка в returnTaskForRevision:', error);
    return null;
  }
};

/**
 * Обновить порядок задачи (в таблице нет колонки order — обновляем только status)
 */
export const updateTaskOrder = async (id: string, order: number, status: string): Promise<Task | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления порядка задачи:', error);
      throw error;
    }

    return mapToTask(data);
  } catch (error) {
    console.error('Ошибка в updateTaskOrder:', error);
    return null;
  }
};

/**
 * Получить общий прогресс проекта на основе таблицы progress_data
 */
export const getProjectProgress = async (projectId: string): Promise<{
  totalProgress: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  delayedTasks: number;
  averageProgress: number;
}> => {
  try {
    console.log('🔄 API: Получение прогресса проекта из progress_data:', projectId);
    
    // Получаем данные из таблицы progress_data
    const { data, error } = await supabase
      .from('progress_data')
      .select('task_name, section, apartment_id, fact_progress, plan_progress');

    if (error) {
      console.error('❌ API: Ошибка получения данных прогресса:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ API: Нет данных прогресса для проекта:', projectId);
      return {
        totalProgress: 0,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        delayedTasks: 0,
        averageProgress: 0
      };
    }

    // Группируем по работам (task_name + section)
    const workGroups: { [key: string]: number[] } = {};
    const apartments = new Set<string>();

    data.forEach((item: any) => {
      const workKey = `${item.task_name}|${item.section}`;
      if (!workGroups[workKey]) {
        workGroups[workKey] = [];
      }
      workGroups[workKey].push(item.fact_progress || 0);
      apartments.add(item.apartment_id);
    });

    // Рассчитываем общий прогресс каждой работы
    const workProgresses = Object.values(workGroups).map(progresses => 
      progresses.reduce((sum, progress) => sum + progress, 0) / progresses.length
    );

    const totalWorks = Object.keys(workGroups).length;
    const totalApartments = apartments.size;
    // Защита от деления на ноль
    const averageProgress = totalWorks > 0 
      ? workProgresses.reduce((sum, progress) => sum + progress, 0) / workProgresses.length
      : 0;
    
    // Подсчитываем работы по статусам
    const completedTasks = workProgresses.filter(progress => progress === 100).length;
    const inProgressTasks = workProgresses.filter(progress => progress > 0 && progress < 100).length;
    const notStartedTasks = workProgresses.filter(progress => progress === 0).length;

    // Детальное логирование для отладки
    console.log('🔍 API: Детальный расчет прогресса из progress_data:', {
      projectId,
      rawData: data.slice(0, 5), // Показываем первые 5 записей из базы
      workGroups: Object.keys(workGroups).map(key => ({
        workKey: key,
        progresses: workGroups[key],
        average: workGroups[key].reduce((sum, p) => sum + p, 0) / workGroups[key].length
      })),
      totalWorks,
      workProgresses,
      averageProgress: Math.round(averageProgress),
      calculation: `${workProgresses.reduce((sum, p) => sum + p, 0).toFixed(1)} ÷ ${workProgresses.length} = ${Math.round(averageProgress)}%`,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      totalApartments
    });

    console.log('✅ API: Прогресс проекта рассчитан из progress_data:', {
      projectId,
      totalWorks,
      totalApartments,
      averageProgress: Math.round(averageProgress),
      completedTasks,
      inProgressTasks,
      notStartedTasks
    });

    // Округляем averageProgress, но гарантируем число
    const finalAverageProgress = isNaN(averageProgress) ? 0 : Math.round(averageProgress);
    
    return {
      totalProgress: totalWorks > 0 ? Math.round(workProgresses.reduce((sum, p) => sum + p, 0)) : 0,
      totalTasks: totalWorks,
      completedTasks,
      inProgressTasks,
      pendingTasks: notStartedTasks,
      delayedTasks: 0, // В progress_data нет статуса delayed
      averageProgress: finalAverageProgress
    };
  } catch (error) {
    console.error('❌ API: Ошибка в getProjectProgress:', error);
    return {
      totalProgress: 0,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      delayedTasks: 0,
      averageProgress: 0
    };
  }
};

/**
 * Удалить задачу
 */
export const deleteTask = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Ошибка удаления задачи:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Ошибка в deleteTask:', error);
    return false;
  }
};

/**
 * Поиск задач
 */
export const searchTasks = async (searchTerm: string): Promise<Task[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,assigned_to.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка поиска задач:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в searchTasks:', error);
    return [];
  }
};

/**
 * Получить просроченные задачи
 */
export const getOverdueTasks = async (): Promise<Task[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .lt('end_date', today)
      .in('status', ['pending', 'in-progress'])
      .order('end_date', { ascending: true });

    if (error) {
      console.error('Ошибка получения просроченных задач:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getOverdueTasks:', error);
    return [];
  }
};

/**
 * Получить задачи на сегодня
 */
export const getTodayTasks = async (): Promise<Task[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('start_date', today)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Ошибка получения задач на сегодня:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getTodayTasks:', error);
    return [];
  }
};

/**
 * Получить предстоящие задачи
 */
export const getUpcomingTasks = async (days: number = 7): Promise<Task[]> => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .gte('start_date', todayStr)
      .lte('start_date', futureStr)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Ошибка получения предстоящих задач:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getUpcomingTasks:', error);
    return [];
  }
};
