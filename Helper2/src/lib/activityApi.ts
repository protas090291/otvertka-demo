import { supabase } from './supabase';

// Тип для активности
export interface Activity {
  id: string;
  type: 'task' | 'defect' | 'progress' | 'report';
  title: string;
  description: string;
  timestamp: string;
  color: string;
  iconName: 'CheckSquare' | 'AlertCircle' | 'CheckCircle' | 'BarChart3' | 'FileText';
  gradientFrom: string;
  gradientTo: string;
}

/**
 * Получить последние обновления из всех таблиц
 */
export const getRecentActivities = async (limit: number = 10): Promise<Activity[]> => {
  try {
    const activities: Activity[] = [];

    // 1. Получаем последние задачи (берем больше, чтобы после объединения было достаточно)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status, updated_at, created_at')
      .order('updated_at', { ascending: false })
      .limit(limit * 2);

    if (!tasksError && tasks) {
      tasks.forEach(task => {
        const isNew = new Date(task.created_at).getTime() === new Date(task.updated_at).getTime();
        activities.push({
          id: task.id,
          type: 'task',
          title: isNew ? 'Создана новая задача' : 'Обновлена задача',
          description: `${task.title}${task.status ? ` (${getStatusText(task.status)})` : ''}`,
          timestamp: task.updated_at,
          color: 'bg-blue-500',
          iconName: 'CheckSquare',
          gradientFrom: 'from-blue-500',
          gradientTo: 'to-blue-600'
        });
      });
    }

    // 2. Получаем последние дефекты
    const { data: defects, error: defectsError } = await supabase
      .from('defects')
      .select('id, title, status, updated_at, created_at')
      .order('updated_at', { ascending: false })
      .limit(limit * 2);

    if (!defectsError && defects) {
      defects.forEach(defect => {
        const isNew = new Date(defect.created_at).getTime() === new Date(defect.updated_at).getTime();
        const statusText = defect.status === 'active' ? 'активный' : 'исправлен';
        activities.push({
          id: defect.id,
          type: 'defect',
          title: isNew ? 'Добавлен новый дефект' : `Дефект ${statusText}`,
          description: defect.title,
          timestamp: defect.updated_at,
          color: defect.status === 'active' ? 'bg-red-500' : 'bg-green-500',
          iconName: defect.status === 'active' ? 'AlertCircle' : 'CheckCircle',
          gradientFrom: defect.status === 'active' ? 'from-red-500' : 'from-green-500',
          gradientTo: defect.status === 'active' ? 'to-red-600' : 'to-green-600'
        });
      });
    }

    // 3. Получаем последние обновления прогресса
    // Фильтруем только те записи, где updated_at не равен created_at (т.е. были обновления)
    const { data: progressData, error: progressError } = await supabase
      .from('progress_data')
      .select('id, task_name, section, apartment_id, fact_progress, updated_at, created_at')
      .order('updated_at', { ascending: false })
      .limit(limit * 2);

    if (!progressError && progressData) {
      progressData.forEach(progress => {
        // Показываем только реальные обновления (не первое создание)
        const isUpdate = progress.updated_at && progress.created_at && 
          new Date(progress.updated_at).getTime() > new Date(progress.created_at).getTime() + 1000; // +1 секунда для учета задержек
        
        if (isUpdate || !progress.created_at) {
          // Логируем для отладки
          const timeAgo = formatTimeAgo(progress.updated_at);
          console.log('📊 Активность прогресса:', {
            task: progress.task_name,
            apartment: progress.apartment_id,
            updated_at: progress.updated_at,
            created_at: progress.created_at,
            timeAgo: timeAgo,
            isUpdate: isUpdate
          });
          
          activities.push({
            id: progress.id,
            type: 'progress',
            title: 'Обновлен прогресс работ',
            description: `${progress.task_name} | ${progress.section} | Квартира ${progress.apartment_id} - ${progress.fact_progress}%`,
            timestamp: progress.updated_at,
            color: 'bg-emerald-500',
            iconName: 'BarChart3',
            gradientFrom: 'from-emerald-500',
            gradientTo: 'to-emerald-600'
          });
        }
      });
    }

    // 4. Получаем последние отчеты
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('id, title, type, created_by, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    if (!reportsError && reports) {
      reports.forEach(report => {
        const isNew = new Date(report.created_at).getTime() === new Date(report.updated_at).getTime();
        const typeText = getReportTypeText(report.type);
        activities.push({
          id: report.id,
          type: 'report',
          title: isNew ? 'Создан новый отчет' : 'Обновлен отчет',
          description: `${report.title} (${typeText})${report.created_by ? ` - ${report.created_by}` : ''}`,
          timestamp: report.created_at,
          color: 'bg-purple-500',
          iconName: 'FileText',
          gradientFrom: 'from-purple-500',
          gradientTo: 'to-purple-600'
        });
      });
    }

    // Сортируем по дате (самые новые первыми)
    activities.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    // Возвращаем только последние N записей
    return activities.slice(0, limit);
  } catch (error) {
    console.error('Ошибка получения последних обновлений:', error);
    return [];
  }
};

/**
 * Форматировать время в "сколько времени назад"
 */
export const formatTimeAgo = (timestamp: string): string => {
  try {
    const now = new Date();
    const time = new Date(timestamp);
    
    // Проверяем, что дата валидна
    if (isNaN(time.getTime())) {
      console.error('Невалидная дата:', timestamp);
      return 'недавно';
    }
    
    // Вычисляем разницу в миллисекундах
    const diffInMs = now.getTime() - time.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);

    // Если разница отрицательная (будущее), значит проблема с часовым поясом
    if (diffInSeconds < 0) {
      console.warn('Время в будущем, возможно проблема с часовым поясом:', {
        now: now.toISOString(),
        timestamp: time.toISOString(),
        diff: diffInSeconds
      });
      return 'только что';
    }

    if (diffInSeconds < 60) {
      return 'только что';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${getMinutesText(diffInMinutes)} назад`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${getHoursText(diffInHours)} назад`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${getDaysText(diffInDays)} назад`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} ${getWeeksText(diffInWeeks)} назад`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${getMonthsText(diffInMonths)} назад`;
  } catch (error) {
    console.error('Ошибка форматирования времени:', error, timestamp);
    return 'недавно';
  }
};

// Вспомогательные функции для форматирования
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'ожидает',
    'in_progress': 'в работе',
    'completed': 'завершена',
    'delayed': 'просрочена'
  };
  return statusMap[status] || status;
};

const getReportTypeText = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'work_report': 'Отчет о работах',
    'defect_report': 'Отчет о дефектах',
    'progress_report': 'Отчет о прогрессе',
    'quality_report': 'Отчет о качестве',
    'handover_act': 'Акт приёмки'
  };
  return typeMap[type] || type;
};

const getMinutesText = (n: number): string => {
  if (n === 1) return 'минуту';
  if (n >= 2 && n <= 4) return 'минуты';
  return 'минут';
};

const getHoursText = (n: number): string => {
  if (n === 1) return 'час';
  if (n >= 2 && n <= 4) return 'часа';
  return 'часов';
};

const getDaysText = (n: number): string => {
  if (n === 1) return 'день';
  if (n >= 2 && n <= 4) return 'дня';
  return 'дней';
};

const getWeeksText = (n: number): string => {
  if (n === 1) return 'неделю';
  if (n >= 2 && n <= 4) return 'недели';
  return 'недель';
};

const getMonthsText = (n: number): string => {
  if (n === 1) return 'месяц';
  if (n >= 2 && n <= 4) return 'месяца';
  return 'месяцев';
};

