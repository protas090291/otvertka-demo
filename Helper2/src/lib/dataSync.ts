// Система синхронизации данных между AI помощником и основными компонентами
import { supabase } from './supabase';

// Типы событий для синхронизации
export type DataSyncEvent = 
  | 'task_created'
  | 'task_updated'
  | 'defect_created'
  | 'defect_updated'
  | 'system_data_changed';

export interface DataSyncMessage {
  type: DataSyncEvent;
  data: any;
  timestamp: number;
}

// Система событий для уведомления компонентов об изменениях
class DataSyncManager {
  private listeners: Map<DataSyncEvent, Function[]> = new Map();
  private localStorageKey = 'ai_sync_events';

  // Подписка на события
  subscribe(event: DataSyncEvent, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    
    // Возвращаем функцию отписки
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Отправка события
  emit(event: DataSyncEvent, data: any) {
    console.log(`📡 Синхронизация данных: ${event}`, data);
    
    // Уведомляем всех подписчиков
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Ошибка в callback синхронизации:', error);
        }
      });
    }

    // Сохраняем событие в localStorage для персистентности
    this.saveEventToStorage(event, data);
  }

  // Сохранение события в localStorage
  private saveEventToStorage(event: DataSyncEvent, data: any) {
    try {
      const events = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
      events.push({
        type: event,
        data,
        timestamp: Date.now()
      });
      
      // Оставляем только последние 100 событий
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(events));
    } catch (error) {
      console.error('Ошибка сохранения события в localStorage:', error);
    }
  }

  // Получение последних событий
  getRecentEvents(eventType?: DataSyncEvent, limit: number = 10) {
    try {
      const events = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
      let filteredEvents = events;
      
      if (eventType) {
        filteredEvents = events.filter((e: DataSyncMessage) => e.type === eventType);
      }
      
      return filteredEvents
        .sort((a: DataSyncMessage, b: DataSyncMessage) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Ошибка получения событий:', error);
      return [];
    }
  }

  // Очистка старых событий
  clearOldEvents(olderThanHours: number = 24) {
    try {
      const events = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      
      const recentEvents = events.filter((e: DataSyncMessage) => e.timestamp > cutoffTime);
      localStorage.setItem(this.localStorageKey, JSON.stringify(recentEvents));
      
      console.log(`Очищено ${events.length - recentEvents.length} старых событий`);
    } catch (error) {
      console.error('Ошибка очистки событий:', error);
    }
  }
}

// Создаем глобальный экземпляр менеджера синхронизации
export const dataSyncManager = new DataSyncManager();

// Функции для уведомления о изменениях данных
export const notifyTaskCreated = (task: any) => {
  dataSyncManager.emit('task_created', task);
};

export const notifyTaskUpdated = (task: any) => {
  dataSyncManager.emit('task_updated', task);
};

export const notifyDefectCreated = (defect: any) => {
  dataSyncManager.emit('defect_created', defect);
};

export const notifyDefectUpdated = (defect: any) => {
  dataSyncManager.emit('defect_updated', defect);
};

export const notifySystemDataChanged = (data: any) => {
  dataSyncManager.emit('system_data_changed', data);
};

// React хук для подписки на события синхронизации
import { useEffect } from 'react';

export const useDataSync = (event: DataSyncEvent, callback: Function, deps: any[] = []) => {
  useEffect(() => {
    const unsubscribe = dataSyncManager.subscribe(event, callback);
    return unsubscribe;
  }, deps);
};

// Функция для принудительного обновления данных компонентов
export const triggerDataRefresh = () => {
  console.log('🔄 Принудительное обновление данных компонентов');
  dataSyncManager.emit('system_data_changed', { 
    action: 'refresh_all',
    timestamp: Date.now() 
  });
};

// Функция для проверки новых данных в localStorage
export const checkForNewData = () => {
  try {
    // Проверяем новые задачи
    const aiTasks = JSON.parse(localStorage.getItem('ai_tasks') || '[]');
    const lastSync = localStorage.getItem('last_ai_sync') || '0';
    const lastSyncTime = parseInt(lastSync);
    
    const newTasks = aiTasks.filter((task: any) => 
      new Date(task.created_at).getTime() > lastSyncTime
    );
    
    if (newTasks.length > 0) {
      console.log(`Найдено ${newTasks.length} новых задач от AI`);
      newTasks.forEach((task: any) => {
        notifyTaskCreated(task);
      });
    }
    
    // Обновляем время последней синхронизации
    localStorage.setItem('last_ai_sync', Date.now().toString());
    
    return newTasks.length;
  } catch (error) {
    console.error('Ошибка проверки новых данных:', error);
    return 0;
  }
};

// Автоматическая проверка новых данных каждые 5 секунд
let syncInterval: NodeJS.Timeout | null = null;

export const startAutoSync = () => {
  if (syncInterval) return; // Уже запущено
  
  console.log('🔄 Запуск автоматической синхронизации данных');
  syncInterval = setInterval(() => {
    checkForNewData();
  }, 5000);
};

export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('⏹️ Остановка автоматической синхронизации данных');
  }
};

// Очистка старых событий при загрузке
dataSyncManager.clearOldEvents(24);
