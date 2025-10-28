// Адаптивный API для работы с задачами
// Этот код автоматически определяет правильные названия колонок

import { supabase, supabaseAdmin } from './supabase';
import { Task } from '../types';

// Кэш для названий колонок
let columnMapping: {
  name?: string;
  assignee?: string;
  progress?: string;
} = {};

// Функция для определения названий колонок
const detectColumnNames = async (): Promise<void> => {
  try {
    // Получаем структуру таблицы
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);

    if (error || !data || data.length === 0) {
      console.warn('Не удалось определить структуру таблицы, используем значения по умолчанию');
      columnMapping = {
        name: 'name',
        assignee: 'assignee', 
        progress: 'progress'
      };
      return;
    }

    const sample = data[0];
    
    // Определяем названия колонок по содержимому
    if (sample.title) columnMapping.name = 'title';
    else if (sample.name) columnMapping.name = 'name';
    
    if (sample.assigned_to) columnMapping.assignee = 'assigned_to';
    else if (sample.assignee) columnMapping.assignee = 'assignee';
    
    if (sample.progress_perc !== undefined) columnMapping.progress = 'progress_perc';
    else if (sample.progress !== undefined) columnMapping.progress = 'progress';
    
    console.log('🔍 Обнаружены колонки:', columnMapping);
  } catch (error) {
    console.error('Ошибка определения колонок:', error);
    columnMapping = {
      name: 'name',
      assignee: 'assignee',
      progress: 'progress'
    };
  }
};

// Функция для преобразования данных из Supabase в формат Task
const mapToTask = (data: any): Task => ({
  id: data.id,
  projectId: data.project_id,
  name: data[columnMapping.name || 'name'] || data.title || data.name,
  description: data.description,
  status: data.status,
  assignee: data[columnMapping.assignee || 'assignee'] || data.assigned_to || data.assignee,
  startDate: data.start_date,
  endDate: data.end_date,
  progress: data[columnMapping.progress || 'progress'] || data.progress_perc || data.progress || 0,
  dependencies: data.dependencies || [],
  order: data.order_index || 0
});

// Инициализация при загрузке модуля
detectColumnNames();

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

export const updateTaskProgress = async (id: string, progress: number): Promise<Task | null> => {
  try {
    const progressColumn = columnMapping.progress || 'progress';
    console.log(`🔄 Обновление прогресса в колонке: ${progressColumn}`);
    
    const updateData: any = {};
    updateData[progressColumn] = progress;
    
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления прогресса задачи:', error);
      throw error;
    }

    return mapToTask(data);
  } catch (error) {
    console.error('Ошибка в updateTaskProgress:', error);
    return null;
  }
};
