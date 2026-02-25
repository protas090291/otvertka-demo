import { supabase } from './supabase';

// Типы для проектов
export interface Project {
  id: string;
  name: string;
  description: string;
  address: string;
  status: 'planning' | 'construction' | 'completed' | 'on-hold' | 'cancelled';
  progress: number;
  start_date: string;
  end_date: string;
  total_budget: number;
  spent: number;
  client: string;
  foreman: string;
  architect: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProjectInput {
  name: string;
  description: string;
  address: string;
  status: 'planning' | 'construction' | 'completed' | 'on-hold' | 'cancelled';
  start_date: string;
  end_date: string;
  total_budget: number;
  client: string;
  foreman: string;
  architect: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  address?: string;
  status?: 'planning' | 'construction' | 'completed' | 'on-hold' | 'cancelled';
  progress?: number;
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  spent?: number;
  client?: string;
  foreman?: string;
  architect?: string;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalSpent: number;
  averageProgress: number;
  statusBreakdown: {
    [status: string]: number;
  };
}

// API функции для работы с проектами

/**
 * Получить все проекты
 * Примечание: Таблица projects уже существует в системе
 */
export const getAllProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения проектов:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getAllProjects:', error);
    return [];
  }
};

/**
 * Получить проект по ID
 */
export const getProjectById = async (id: string): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Ошибка получения проекта:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в getProjectById:', error);
    return null;
  }
};

/**
 * Получить проекты по статусу
 */
export const getProjectsByStatus = async (status: string): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения проектов по статусу:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getProjectsByStatus:', error);
    return [];
  }
};

/**
 * Поиск проектов
 */
export const searchProjects = async (searchTerm: string): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,client.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка поиска проектов:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в searchProjects:', error);
    return [];
  }
};

/**
 * Создать новый проект
 */
export const createProject = async (project: ProjectInput): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        ...project,
        progress: 0,
        spent: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания проекта:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в createProject:', error);
    return null;
  }
};

/**
 * Обновить проект
 */
export const updateProject = async (id: string, updates: ProjectUpdate): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления проекта:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в updateProject:', error);
    return null;
  }
};

/**
 * Обновить прогресс проекта
 */
export const updateProjectProgress = async (id: string, progress: number): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({ 
        progress: Math.max(0, Math.min(100, progress))
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления прогресса проекта:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в updateProjectProgress:', error);
    return null;
  }
};

/**
 * Обновить потраченную сумму проекта
 */
export const updateProjectSpent = async (id: string, spent: number): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({ spent })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления потраченной суммы проекта:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в updateProjectSpent:', error);
    return null;
  }
};

/**
 * Удалить проект
 */
export const deleteProject = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Ошибка удаления проекта:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Ошибка в deleteProject:', error);
    return false;
  }
};

/**
 * Получить статистику проектов
 */
export const getProjectStats = async (): Promise<ProjectStats> => {
  try {
    const projects = await getAllProjects();
    
    let totalProjects = projects.length;
    let activeProjects = 0;
    let completedProjects = 0;
    let totalBudget = 0;
    let totalSpent = 0;
    let totalProgress = 0;
    const statusBreakdown: { [status: string]: number } = {};

    projects.forEach(project => {
      totalBudget += project.total_budget || 0;
      totalSpent += project.spent || 0;
      totalProgress += project.progress || 0;

      if (project.status === 'construction') {
        activeProjects++;
      } else if (project.status === 'completed') {
        completedProjects++;
      }

      statusBreakdown[project.status] = (statusBreakdown[project.status] || 0) + 1;
    });

    const averageProgress = totalProjects > 0 ? totalProgress / totalProjects : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalBudget,
      totalSpent,
      averageProgress: Math.round(averageProgress * 100) / 100,
      statusBreakdown
    };
  } catch (error) {
    console.error('Ошибка в getProjectStats:', error);
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalBudget: 0,
      totalSpent: 0,
      averageProgress: 0,
      statusBreakdown: {}
    };
  }
};

/**
 * Получить активные проекты
 */
export const getActiveProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .in('status', ['planning', 'construction'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения активных проектов:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getActiveProjects:', error);
    return [];
  }
};

/**
 * Получить завершенные проекты
 */
export const getCompletedProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'completed')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения завершенных проектов:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getCompletedProjects:', error);
    return [];
  }
};

/**
 * Получить средние KPI по всем проектам
 */
export interface ProjectKPI {
  timelineAdherence: number;
  qualityScore: number;
  efficiencyScore: number;
  overallProgress: number;
}

export const getProjectKPIs = async (): Promise<ProjectKPI> => {
  try {
    const { getProjectProgress } = await import('./tasksApi');
    const projects = await getAllProjects();
    
    // ДЛЯ "Вишневый сад" - используем статический проект вместо данных из базы
    // Убираем ВСЕ проекты "Вишневый сад" из базы (по любому ID и названию) и добавляем статический
    const filteredProjects = projects.filter((project: any) => {
      const projectId = (project.id || '').toLowerCase();
      const projectName = (project.name || '').toLowerCase();
      // Исключаем все варианты Вишневый сад (по любому ID и названию)
      return projectId !== 'zhk-vishnevyy-sad' && 
             !projectName.includes('вишневый сад') &&
             !projectName.includes('вишнёвый сад') &&
             !projectName.includes('вишневы');
    });
    
    // Добавляем статический проект "Вишневый сад"
    const staticVishnevyySad = {
      id: 'zhk-vishnevyy-sad',
      name: 'ЖК "Вишневый сад"',
      start_date: '2025-06-20',
      end_date: '2026-06-20',
      total_budget: 180000000,
      spent: 117000000
    };
    
    const allProjects = [staticVishnevyySad, ...filteredProjects];
    
    if (allProjects.length === 0) {
      return {
        timelineAdherence: 0,
        qualityScore: 0,
        efficiencyScore: 0,
        overallProgress: 0
      };
    }

    const currentTime = new Date().getTime();
    let totalTimelineAdherence = 0;
    let totalQualityScore = 0;
    let totalEfficiencyScore = 0;
    let totalOverallProgress = 0;
    let validProjects = 0;

    // Обрабатываем каждый проект
    for (const project of allProjects) {
      try {
        // Для "Вишневый сад" используем статические данные (как в дашборде и ProjectCard)
        let actualProgress = 0;
        let startDate = 0;
        let endDate = 0;
        let projectBudget = project.total_budget || 0;
        let projectSpent = project.spent || 0;
        
        let projectProgressData;
        if (project.id === 'zhk-vishnevyy-sad') {
          // Статические данные для "Вишневый сад"
          projectProgressData = await getProjectProgress(project.id);
          actualProgress = projectProgressData.averageProgress || 0; // Реальный прогресс из progress_data (3%)
          startDate = new Date('2025-06-20').getTime();
          endDate = new Date('2026-06-20').getTime();
          projectBudget = 180000000;
          projectSpent = 117000000;
        } else {
          // Для остальных проектов используем данные из базы
          projectProgressData = await getProjectProgress(project.id);
          actualProgress = projectProgressData.averageProgress || 0;
          startDate = project.start_date ? new Date(project.start_date).getTime() : 0;
          endDate = project.end_date ? new Date(project.end_date).getTime() : 0;
          projectBudget = project.total_budget || 0;
          projectSpent = project.spent || 0;
        }
        const daysFromStart = startDate > 0 ? Math.ceil((currentTime - startDate) / (1000 * 60 * 60 * 24)) : 0;
        const totalDays = endDate > 0 && startDate > 0 ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : 0;
        
        const timeProgress = (startDate > 0 && endDate > 0 && endDate > startDate)
          ? Math.min(Math.max(((currentTime - startDate) / (endDate - startDate)) * 100, 0), 100)
          : 0;

        // Логируем ПЕРВОСТЕПЕННЫЕ ДАННЫЕ
        const logStartDate = project.id === 'zhk-vishnevyy-sad' ? '2025-06-20' : project.start_date;
        const logEndDate = project.id === 'zhk-vishnevyy-sad' ? '2026-06-20' : project.end_date;
        console.log(`📋 ПЕРВОСТЕПЕННЫЕ ДАННЫЕ для проекта ${project.name} (${project.id}):`, {
          '1. Прогресс работ (actualProgress)': `${actualProgress.toFixed(2)}%`,
          '2. Время которое прошло (timeProgress)': `${timeProgress.toFixed(2)}%`,
          'Детали времени': {
            startDate: logStartDate,
            endDate: logEndDate,
            currentDate: new Date().toISOString().split('T')[0],
            daysFromStart,
            totalDays,
            daysRemaining: totalDays > 0 ? totalDays - daysFromStart : 0
          }
        });

        // Соблюдение сроков: насколько прогресс соответствует времени
        // 100% если прогресс = времени, >100% если опережаем
        const timelineAdherence = timeProgress > 0 
          ? Math.min((actualProgress / timeProgress) * 100, 200) // Ограничиваем до 200%
          : actualProgress > 0 ? 100 : 0;

        // Качество (используем единую функцию для синхронизации с ProjectCard)
        const { calculateQuality } = await import('./qualityCalculator');
        const qualityCalculation = calculateQuality({
          actualProgress,
          timeProgress
        });
        
        const { efficiency, normalizedEfficiency, qualityScore } = qualityCalculation;
        
        // ДЛЯ ОТЛАДКИ: логируем расчет качества для "Вишневый сад"
        if (project.id === 'zhk-vishnevyy-sad') {
          console.log(`🔍 DEBUG: Расчет качества для "Вишневый сад" в getProjectKPIs:`, {
            actualProgress,
            timeProgress: timeProgress.toFixed(4),
            efficiency: efficiency.toFixed(4),
            normalizedEfficiency: normalizedEfficiency.toFixed(4),
            qualityScore,
            formula: `(${normalizedEfficiency.toFixed(4)} × 0.5) + (${actualProgress} × 0.5)`,
            result: qualityScore
          });
        }

        // РАСЧЕТ ЭФФЕКТИВНОСТИ от первостепенных данных
        // Эффективность = (Прогресс работ / Время которое прошло) * 100%
        const efficiencyScore = timeProgress > 0 
          ? Math.min((actualProgress / timeProgress) * 100, 200) // Ограничиваем до 200%
          : actualProgress > 0 ? 100 : 0;

        // Логируем РАСЧЕТ эффективности и качества
        console.log(`🧮 РАСЧЕТ ЭФФЕКТИВНОСТИ И КАЧЕСТВА для проекта ${project.name}:`, {
          'Формула': `(Прогресс работ / Время которое прошло) * 100%`,
          'Подстановка': `(${actualProgress.toFixed(2)}% / ${timeProgress.toFixed(2)}%) * 100`,
          'Результат (efficiencyScore)': `${efficiencyScore.toFixed(2)}%`,
          'Интерпретация': efficiencyScore >= 100 
            ? 'Опережаем график ✅' 
            : efficiencyScore >= 50 
              ? 'Идем по графику ⚠️' 
              : 'Отстаем от графика ❌',
          'Качество (до округления)': `${qualityScore.toFixed(2)}%`,
          'Компоненты качества': {
            'Эффективность × 50%': `${(normalizedEfficiency * 0.5).toFixed(2)}`,
            'Прогресс × 50%': `${(actualProgress * 0.5).toFixed(2)}`
          }
        });

        totalTimelineAdherence += timelineAdherence;
        // qualityScore уже округлен в calculateQuality, используем его напрямую
        totalQualityScore += qualityScore;
        totalEfficiencyScore += efficiencyScore;
        totalOverallProgress += actualProgress;
        validProjects++;
      } catch (error) {
        console.error(`Ошибка обработки проекта ${project.id}:`, error);
        // Продолжаем обработку других проектов
      }
    }

    // Усредняем по всем проектам
    if (validProjects === 0) {
      return {
        timelineAdherence: 0,
        qualityScore: 0,
        efficiencyScore: 0,
        overallProgress: 0
      };
    }

    const finalEfficiency = Math.round((totalEfficiencyScore / validProjects) * 100) / 100;
    
    console.log(`🎯 Итоговый расчет KPI по всем проектам:`, {
      validProjects,
      totalQualityScore: `${totalQualityScore.toFixed(2)}`,
      averageQualityScore: `${(totalQualityScore / validProjects).toFixed(2)}%`,
      qualityFormula: `(${totalQualityScore.toFixed(2)} / ${validProjects}) = ${Math.round(totalQualityScore / validProjects)}%`,
      totalEfficiencyScore: `${totalEfficiencyScore.toFixed(2)}`,
      averageEfficiencyScore: `${finalEfficiency}%`,
      formula: `(${totalEfficiencyScore.toFixed(2)} / ${validProjects}) = ${finalEfficiency}%`,
      totalOverallProgress: `${(totalOverallProgress / validProjects).toFixed(2)}%`
    });

    return {
      timelineAdherence: Math.round((totalTimelineAdherence / validProjects) * 100) / 100,
      // qualityScore уже округлен для каждого проекта в calculateQuality
      // Если проект один, просто возвращаем его без усреднения
      qualityScore: validProjects > 0 
        ? (validProjects === 1 ? totalQualityScore : Math.round(totalQualityScore / validProjects))
        : 0,
      efficiencyScore: finalEfficiency,
      overallProgress: Math.round((totalOverallProgress / validProjects) * 100) / 100
    };
  } catch (error) {
    console.error('Ошибка расчета KPI:', error);
    return {
      timelineAdherence: 0,
      qualityScore: 0,
      efficiencyScore: 0,
      overallProgress: 0
    };
  }
};

/**
 * Экспорт проектов в CSV
 */
export const exportProjectsToCSV = async (): Promise<string> => {
  try {
    const projects = await getAllProjects();

    const headers = [
      'Название',
      'Описание',
      'Адрес',
      'Статус',
      'Прогресс (%)',
      'Дата начала',
      'Дата окончания',
      'Бюджет',
      'Потрачено',
      'Клиент',
      'Прораб',
      'Архитектор',
      'Создан'
    ];

    const csvRows = [headers.join(',')];

    projects.forEach(project => {
      const row = [
        `"${project.name}"`,
        `"${project.description}"`,
        `"${project.address}"`,
        project.status,
        project.progress,
        project.start_date,
        project.end_date,
        project.total_budget,
        project.spent,
        `"${project.client}"`,
        `"${project.foreman}"`,
        `"${project.architect}"`,
        new Date(project.created_at).toLocaleDateString('ru')
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  } catch (error) {
    console.error('Ошибка экспорта проектов в CSV:', error);
    return '';
  }
};
