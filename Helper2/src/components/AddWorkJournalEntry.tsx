import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, Clock, User, Building, FileText } from 'lucide-react';
import { WorkJournalEntryInput } from '../types';
import { createWorkJournalEntry } from '../lib/workJournalApi';
import { getAllProgressData } from '../lib/progressApi';

interface AddWorkJournalEntryProps {
  userRole: string;
  userName?: string;
  onEntryAdded: () => void;
}

const AddWorkJournalEntry: React.FC<AddWorkJournalEntryProps> = ({ 
  userRole, 
  userName,
  onEntryAdded 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Array<{task: string, section: string}>>([]);
  const [availableApartments, setAvailableApartments] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<WorkJournalEntryInput>({
    task_name: '',
    section: '',
    apartment_id: '',
    work_description: '',
    progress_before: 0,
    progress_after: 0,
    work_date: new Date().toISOString().split('T')[0],
    work_time: new Date().toTimeString().split(' ')[0].substring(0, 8),
    worker_name: userName || '',
    worker_role: userRole,
    notes: ''
  });

  useEffect(() => {
    loadAvailableData();
  }, []);

  const loadAvailableData = async () => {
    try {
      const progressData = await getAllProgressData();
      
      // Получаем уникальные задачи и секции
      const taskSectionSet = new Set<string>();
      const apartmentSet = new Set<string>();
      
      progressData.forEach(item => {
        taskSectionSet.add(`${item.task_name}|${item.section}`);
        apartmentSet.add(item.apartment_id);
      });
      
      const tasks = Array.from(taskSectionSet).map(item => {
        const [task, section] = item.split('|');
        return { task, section };
      });
      
      setAvailableTasks(tasks);
      setAvailableApartments(Array.from(apartmentSet).sort());
    } catch (error) {
      console.error('Ошибка загрузки доступных данных:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.task_name || !formData.apartment_id || !formData.work_description) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (formData.progress_after < formData.progress_before) {
      alert('Прогресс после выполнения не может быть меньше прогресса до выполнения');
      return;
    }

    try {
      setLoading(true);
      const result = await createWorkJournalEntry(formData);
      
      if (result) {
        alert('Запись в журнале работ успешно добавлена!');
        setIsOpen(false);
        resetForm();
        onEntryAdded();
      } else {
        alert('Ошибка при добавлении записи');
      }
    } catch (error) {
      console.error('Ошибка при добавлении записи:', error);
      alert('Ошибка при добавлении записи');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      task_name: '',
      section: '',
      apartment_id: '',
      work_description: '',
      progress_before: 0,
      progress_after: 0,
      work_date: new Date().toISOString().split('T')[0],
      work_time: new Date().toTimeString().split(' ')[0].substring(0, 8),
      worker_name: userName || '',
      worker_role: userRole,
      notes: ''
    });
  };

  const handleTaskChange = (taskName: string) => {
    const selectedTask = availableTasks.find(t => t.task === taskName);
    setFormData(prev => ({
      ...prev,
      task_name: taskName,
      section: selectedTask?.section || ''
    }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4 mr-2" />
        Добавить запись в журнал
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Добавить запись в журнал работ</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Задача и секция */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Задача *
                </label>
                <select
                  value={formData.task_name}
                  onChange={(e) => handleTaskChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Выберите задачу</option>
                  {availableTasks.map((task, index) => (
                    <option key={index} value={task.task}>
                      {task.task}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Секция
                </label>
                <input
                  type="text"
                  value={formData.section}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>

            {/* Квартира */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Квартира *
              </label>
              <select
                value={formData.apartment_id}
                onChange={(e) => setFormData(prev => ({ ...prev, apartment_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Выберите квартиру</option>
                {availableApartments.map(apartment => (
                  <option key={apartment} value={apartment}>
                    {apartment}
                  </option>
                ))}
              </select>
            </div>

            {/* Описание работы */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание выполненной работы *
              </label>
              <textarea
                value={formData.work_description}
                onChange={(e) => setFormData(prev => ({ ...prev, work_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Опишите, что именно было выполнено..."
                required
              />
            </div>

            {/* Прогресс */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Прогресс до выполнения (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress_before}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress_before: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Прогресс после выполнения (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress_after}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress_after: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Дата и время */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата выполнения
                </label>
                <input
                  type="date"
                  value={formData.work_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, work_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Время выполнения
                </label>
                <input
                  type="time"
                  value={formData.work_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, work_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Исполнитель */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя исполнителя
                </label>
                <input
                  type="text"
                  value={formData.worker_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, worker_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите имя исполнителя"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Роль исполнителя
                </label>
                <input
                  type="text"
                  value={formData.worker_role}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>

            {/* Заметки */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дополнительные заметки
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Дополнительная информация о выполненной работе..."
              />
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Сохранение...' : 'Добавить запись'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddWorkJournalEntry;
