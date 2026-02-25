import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, User, AlertCircle, Plus, Table, List, Columns, CheckCircle, Play, Pause, GripVertical, X, Search, History } from 'lucide-react';
import { UserRole, Task } from '../types';
import ProgressTable from './ProgressTable';
import { useDataSync, startAutoSync, stopAutoSync } from '../lib/dataSync';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getAllTasks, getTasksForCurrentUser, createTask, updateTask, updateTaskOrder, submitTaskForReview, confirmTaskCompleted, returnTaskForRevision, TaskInput, TaskUpdate } from '../lib/tasksApi';
import { getAllProjects } from '../lib/projectsApi';
import { normalizeStatus } from '../lib/dataNormalizer';
import { getCurrentUser, getAssignableUserProfiles } from '../lib/authApi';
import type { UserProfile } from '../lib/authApi';

// Компонент перетаскиваемой карточки задачи
interface SortableTaskCardProps {
  task: Task;
  clientCreatedTasks: Set<string>;
  foremanCreatedTasks: Set<string>;
  onStartEditTask: (task: Task) => void;
  currentUserId?: string | null;
  onReviewTask?: (task: Task) => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  clientCreatedTasks,
  foremanCreatedTasks,
  onStartEditTask,
  currentUserId,
  onReviewTask
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: isDragging ? 'scale(0)' : CSS.Transform.toString(transform), // Полностью скрываем через scale при перетаскивании
    transition: isDragging ? 'opacity 0.1s ease-out, visibility 0.1s ease-out, transform 0.1s ease-out' : transition,
    opacity: isDragging ? 0 : 1, // Скрываем исходную задачу при перетаскивании
    visibility: isDragging ? 'hidden' as const : 'visible' as const, // Полностью скрываем
    zIndex: isDragging ? -1 : 'auto', // Убираем на задний план
    position: isDragging ? 'absolute' as const : 'static' as const,
    pointerEvents: isDragging ? 'none' : 'auto',
    willChange: isDragging ? 'opacity, visibility, transform' : 'transform',
  };

  const taskCard = (
    <div
      ref={setNodeRef}
      id={task.id}
      style={style}
      data-dragging={isDragging}
      className={`sortable-item rounded-xl p-4 border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 ease-out cursor-pointer ${
        isDragging ? '!z-[999999] task-moving' : ''
      }`}
      onClick={(e) => {
        if (isDragging) return;
        const target = (e.target as HTMLElement).closest('[data-review-task]');
        if (target) return;
        onStartEditTask(task);
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-white text-sm flex-1">{task.name}</h4>
        <div className="flex items-center space-x-1 ml-2">
          <div
            {...attributes}
            {...listeners}
            className="drag-handle p-1 rounded"
          >
            <GripVertical className="w-3 h-3 text-slate-400" />
          </div>
          <div className="flex space-x-1">
            {clientCreatedTasks.has(task.id) && (
              <span className="w-2 h-2 bg-purple-500 rounded-full" title="От заказчика"></span>
            )}
            {foremanCreatedTasks.has(task.id) && (
              <span className="w-2 h-2 bg-blue-500 rounded-full" title="От прораба"></span>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
        <div className="flex items-center space-x-1">
          <User className="w-3 h-3" />
          <span>{task.assignee}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>{new Date(task.endDate).toLocaleDateString('ru')}</span>
        </div>
      </div>

      <div className="w-full bg-white/15 rounded-full h-1.5 mb-2">
        <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                task.status === 'completed' || task.status === 'completed' ? 'bg-green-500' :
                task.status === 'in-progress' || task.status === 'in_progress' ? 'bg-blue-500' :
                task.status === 'delayed' ? 'bg-red-500' :
                task.status === 'returned_for_revision' ? 'bg-orange-500' :
                task.status === 'submitted_for_review' ? 'bg-amber-500' :
                'bg-gray-400'
              }`}
          style={{ width: `${task.progress}%` }}
        ></div>
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>Прогресс</span>
        <span>{task.progress}%</span>
      </div>
    </div>
  );
  if (isDragging) {
    const draggingCard = (
      <div
        style={{
          position: 'fixed',
          zIndex: 999999,
          pointerEvents: 'none',
          opacity: 1,
          transform: CSS.Transform.toString(transform),
          willChange: 'transform',
          transition: 'transform 0.1s ease-out',
        }}
        className="task-moving"
      >
        <div className="rounded-xl p-4 border border-white/10 bg-slate-900/90 shadow-lg">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-white text-sm flex-1">{task.name}</h4>
            <div className="flex items-center space-x-1 ml-2">
              <div className="flex space-x-1">
                {clientCreatedTasks.has(task.id) && (
                  <span className="w-2 h-2 bg-purple-500 rounded-full" title="От заказчика"></span>
                )}
                {foremanCreatedTasks.has(task.id) && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full" title="От прораба"></span>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{task.assignee}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.endDate).toLocaleDateString('ru')}</span>
            </div>
          </div>
          <div className="w-full bg-white/15 rounded-full h-1.5 mb-2">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                task.status === 'completed' || task.status === 'completed' ? 'bg-green-500' :
                task.status === 'in-progress' || task.status === 'in_progress' ? 'bg-blue-500' :
                task.status === 'delayed' ? 'bg-red-500' :
                task.status === 'returned_for_revision' ? 'bg-orange-500' :
                task.status === 'submitted_for_review' ? 'bg-amber-500' :
                'bg-gray-400'
              }`}
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
      <div className="flex justify-between text-xs text-gray-500 items-center">
        <span>Прогресс {task.progress}%</span>
        {currentUserId && task.createdByUserId === currentUserId && task.status === 'submitted_for_review' && onReviewTask && (
          <button
            data-review-task
            onClick={(e) => { e.stopPropagation(); onReviewTask(task); }}
            className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
          >
            Проверить
          </button>
        )}
      </div>
    </div>
  </div>
    );
    return (
      <>
        {taskCard} {/* Исходная задача скрыта через opacity: 0 */}
        {createPortal(draggingCard, document.body)} {/* Видимая копия в portal */}
      </>
    );
  }

  return taskCard;
};

// Компонент droppable колонки
interface DroppableColumnProps {
  column: { id: string; title: string; color: string; icon: React.ComponentType<any> };
  tasks: Task[];
  clientCreatedTasks: Set<string>;
  foremanCreatedTasks: Set<string>;
  onStartEditTask: (task: Task) => void;
  currentUserId?: string | null;
  onReviewTask?: (task: Task) => void;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  tasks,
  clientCreatedTasks,
  foremanCreatedTasks,
  onStartEditTask,
  currentUserId,
  onReviewTask
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  const columnTasks = tasks
    .filter(task => {
      // Нормализуем статусы для сравнения (поддержка и 'in-progress' и 'in_progress')
      const taskStatus = (task.status || 'pending').replace(/-/g, '_');
      const columnStatus = (column.id || 'pending').replace(/-/g, '_');
      return taskStatus === columnStatus;
    })
    .sort((a, b) => (b.order || 0) - (a.order || 0));
  
  // Отладочный вывод
  console.log(`📊 Колонка "${column.title}" (${column.id}): ${columnTasks.length} задач из ${tasks.length} общих`);
  if (tasks.length > 0 && columnTasks.length === 0) {
    console.log(`⚠️ Статусы задач:`, [...new Set(tasks.map(t => t.status))]);
  }
  
  const IconComponent = column.icon;

  return (
    <div className="space-y-4" data-column-id={column.id}>
      <div 
        className={`kanban-column ${column.color} rounded-xl p-4 border border-white/10 shadow-sm backdrop-blur-sm transition-all duration-200 ease-out`}
        style={isOver ? {
          position: 'relative',
          zIndex: 10
        } : undefined}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <IconComponent className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-white">{column.title}</h3>
          </div>
          <span className="bg-white/10 text-slate-200 text-xs font-medium px-2 py-1 rounded-full border border-white/10">
            {columnTasks.length}
          </span>
        </div>
        
          <div 
            ref={setNodeRef}
            className={`drop-zone space-y-3 min-h-[200px] p-2 rounded-lg transition-all duration-200 ease-out ${
              isOver ? 'drag-over' : ''
            }`}
          >
            {columnTasks.length > 0 ? (
              columnTasks.map(task => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  clientCreatedTasks={clientCreatedTasks}
                  foremanCreatedTasks={foremanCreatedTasks}
                  onStartEditTask={onStartEditTask}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="w-12 h-12 bg-gray-100/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <IconComponent className="w-6 h-6 opacity-60" />
                </div>
                <p className="text-sm font-medium">Нет задач</p>
                <p className="text-xs text-gray-400 mt-1">Перетащите задачу сюда</p>
              </div>
            )}
            
          </div>
      </div>
    </div>
  );
};

// Компонент канбан-доски
interface KanbanBoardProps {
  tasks: Task[];
  clientCreatedTasks: Set<string>;
  foremanCreatedTasks: Set<string>;
  onStartEditTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: Task['status']) => void;
  onUpdateTaskOrder: (taskId: string, newOrder: number, status: string) => void;
  currentUserId?: string | null;
  onReviewTask?: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  clientCreatedTasks,
  foremanCreatedTasks,
  onStartEditTask,
  onUpdateTaskStatus,
  onUpdateTaskOrder,
  currentUserId,
  onReviewTask
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = [
    { id: 'pending', title: 'Ожидание', color: 'bg-slate-500/15 border-white/10', icon: Pause },
    { id: 'in_progress', title: 'В работе', color: 'bg-blue-500/15 border-white/10', icon: Play },
    { id: 'delayed', title: 'Просрочено', color: 'bg-red-500/15 border-white/10', icon: AlertCircle },
    { id: 'submitted_for_review', title: 'На проверке', color: 'bg-amber-500/15 border-white/10', icon: AlertCircle },
    { id: 'completed', title: 'Завершено', color: 'bg-emerald-500/15 border-white/10', icon: CheckCircle }
  ];

  const handleDragStart = () => {
    setIsDragging(true);
    // НЕ добавляем анимацию для всех колонок - только для той, над которой находится задача
    // Анимация будет применяться через класс drag-over-column при наведении
  };

const handleDragEnd =  (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('🔵 Drag end:', { active: active.id, over: over?.id, overType: typeof over?.id });

    setIsDragging(false);

    if (!over) {
      console.log('⚠️ No over element, canceling drag');
      return;
    }

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask) {
      console.log('⚠️ Active task not found');
      return;
    }

    console.log('📋 Active task:', activeTask, 'status:', activeTask.status);

    const validStatuses = ['pending', 'in_progress', 'completed', 'delayed', 'submitted_for_review'];
    
    // Нормализуем over.id для сравнения (поддержка и 'in-progress' и 'in_progress')
    const overIdStr = String(over.id || '');
    const overIdNormalized = overIdStr.replace(/-/g, '_');
    
    console.log('🔍 Over ID normalized:', overIdNormalized, 'from:', over.id);
    
    // Проверяем, сбросили ли на колонку (изменение статуса)
    if (validStatuses.includes(overIdNormalized)) {
      const newStatus = overIdNormalized as Task['status'];
      console.log('Dropped on column:', newStatus);
      console.log('Valid statuses:', validStatuses);
      console.log('Over ID:', over.id);
      
      // Нормализуем статусы для сравнения
      const normalizedActiveStatus = (activeTask.status || 'pending').replace(/-/g, '_');
      const normalizedNewStatus = (newStatus || 'pending').replace(/-/g, '_');
      
      // Проверяем, что статус действительно изменился
      if (normalizedActiveStatus !== normalizedNewStatus) {
        console.log('Updating status from', activeTask.status, 'to', newStatus);
        console.log('Status change will be applied for:', newStatus);
        
        // Находим максимальный order в целевой колонке (используем нормализованный статус для фильтрации)
        const targetColumnTasks = tasks.filter(task => {
          const taskStatus = (task.status || 'pending').replace(/-/g, '_');
          return taskStatus === normalizedNewStatus;
        });
        const maxOrder = targetColumnTasks.length > 0 
          ? Math.max(...targetColumnTasks.map(task => task.order || 0))
          : -1;
        
        // Новая задача становится выше всех (order = maxOrder + 1)
        const newOrder = maxOrder + 1;
        
        console.log('New task order (top of column):', newOrder);
        onUpdateTaskOrder(activeTask.id, newOrder, newStatus);
        onUpdateTaskStatus(activeTask.id, newStatus);
      }
    } else {
      // Если сбросили на другую задачу, определяем колонку по родительскому элементу
      const overElement = document.getElementById(over.id as string);
      if (overElement) {
        // Ищем родительскую колонку
        const columnElement = overElement.closest('[data-column-id]');
        if (columnElement) {
          const columnId = columnElement.getAttribute('data-column-id');
          console.log('📍 Found column ID:', columnId);
          if (columnId) {
            // Нормализуем columnId для сравнения
            const normalizedColumnId = columnId.replace(/-/g, '_');
            if (validStatuses.includes(normalizedColumnId)) {
              const newStatus = normalizedColumnId as Task['status'];
              console.log('✅ Using column status:', newStatus);
              
              // Нормализуем статусы для сравнения
              const normalizedActiveStatus = (activeTask.status || 'pending').replace(/-/g, '_');
              const normalizedNewStatus = (newStatus || 'pending').replace(/-/g, '_');
              
              // Если статус изменился - обновляем статус
              if (normalizedActiveStatus !== normalizedNewStatus) {
                console.log('Updating status from', activeTask.status, 'to', newStatus);
                
                // Находим максимальный order в целевой колонке (используем нормализованный статус для фильтрации)
                const targetColumnTasks = tasks.filter(task => {
                  const taskStatus = (task.status || 'pending').replace(/-/g, '_');
                  return taskStatus === normalizedNewStatus;
                });
                const maxOrder = targetColumnTasks.length > 0 
                  ? Math.max(...targetColumnTasks.map(task => task.order || 0))
                  : -1;
                
                // Новая задача становится выше всех (order = maxOrder + 1)
                const newOrder = maxOrder + 1;
                
                console.log('New task order (top of column):', newOrder);
                onUpdateTaskOrder(activeTask.id, newOrder, newStatus);
                onUpdateTaskStatus(activeTask.id, newStatus);
                
                // Добавляем анимацию успешного перемещения
                setTimeout(() => {
                  const movedTask = document.querySelector(`[id="${activeTask.id}"]`);
                  if (movedTask) {
                    movedTask.classList.add('task-just-moved');
                    setTimeout(() => {
                      movedTask.classList.remove('task-just-moved');
                    }, 1000);
                  }
                }, 100);
              } else {
                // Если статус не изменился, но задача перемещена - это сортировка внутри колонки
                console.log('Reordering tasks within column:', newStatus);
                
                // Получаем задачи в этой колонке, отсортированные по order
                const columnTasks = tasks
                  .filter(task => task.status === newStatus)
                  .sort((a, b) => (b.order || 0) - (a.order || 0));
                
                // Находим индекс задачи, на которую сбросили
                const overTaskIndex = columnTasks.findIndex(task => task.id === over.id);
                
                if (overTaskIndex !== -1) {
                  // Устанавливаем новый порядок для перемещенной задачи
                  // Если сбрасываем на первую задачу (индекс 0), новая задача становится сверху
                  // Если сбрасываем на вторую задачу (индекс 1), новая задача становится между первой и второй
                  const newOrder = overTaskIndex === 0 
                    ? (columnTasks[0].order || 0) + 1  // Становится выше первой
                    : overTaskIndex;  // Становится на позицию overTaskIndex
                  
                  console.log('Updating task order to:', newOrder);
                  onUpdateTaskOrder(activeTask.id, newOrder, newStatus);
                  
                  // Добавляем анимацию успешного перемещения
                  setTimeout(() => {
                    const movedTask = document.querySelector(`[id="${activeTask.id}"]`);
                    if (movedTask) {
                      movedTask.classList.add('task-just-moved');
                      setTimeout(() => {
                        movedTask.classList.remove('task-just-moved');
                      }, 1000);
                    }
                  }, 100);
                }
              }
            }
          }
        }
      }
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-white/10 border border-white/10 rounded-lg flex items-center justify-center">
          <Columns className="w-4 h-4 text-slate-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Канбан-доска</h2>
          <p className="text-sm text-slate-400">Перетаскивайте задачи между колонками и внутри колонок для изменения порядка</p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${isDragging ? 'dnd-context-dragging' : ''}`}>
          {columns.map(column => (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={tasks}
              clientCreatedTasks={clientCreatedTasks}
              foremanCreatedTasks={foremanCreatedTasks}
              onStartEditTask={onStartEditTask}
              currentUserId={currentUserId}
              onReviewTask={onReviewTask}
            />
          ))}
        </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

interface ScheduleViewWithAPIProps {
  userRole: UserRole;
}

const ScheduleViewWithAPI: React.FC<ScheduleViewWithAPIProps> = ({ userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'kanban'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<UserProfile[]>([]);
  const [taskForm, setTaskForm] = useState({
    project: '',
    name: '',
    description: '',
    assignee: '',
    assigneeUserId: '' as string,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'delayed'
  });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'delayed',
    progress: 0
  });
  const [isCreatingClientTask, setIsCreatingClientTask] = useState(false);
  const [clientTaskForm, setClientTaskForm] = useState({
    project: '',
    name: '',
    description: '',
    assignee: '',
    assigneeUserId: '' as string,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'delayed'
  });
  const [clientCreatedTasks, setClientCreatedTasks] = useState<Set<string>>(new Set());
  const [foremanCreatedTasks, setForemanCreatedTasks] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  /** Задача, которую постановщик проверяет (модальное окно с деталями) */
  const [taskToReview, setTaskToReview] = useState<Task | null>(null);
  /** Комментарий для возврата задачи на доработку */
  const [reviewComment, setReviewComment] = useState('');
  /** Модальное окно «История задач» (все задачи для руководства/админа) */
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Подписка на события синхронизации данных
  useDataSync('task_created', (newTask: any) => {
    console.log('📥 Получена новая задача от AI:', newTask);
    
    // Преобразуем задачу AI в формат Task
    const task: Task = {
      id: newTask.id,
      projectId: '1', // По умолчанию
      name: newTask.name,
      description: newTask.description,
      status: newTask.status === 'pending' ? 'pending' : 
              newTask.status === 'in-progress' ? 'in-progress' : 
              newTask.status === 'completed' ? 'completed' : 'pending',
      assignee: newTask.assignee || 'Не назначен',
      startDate: new Date().toISOString().split('T')[0],
      endDate: newTask.due_date ? newTask.due_date.split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: newTask.progress || 0
    };
    
    // Добавляем задачу в список
    setTasks(prevTasks => [task, ...prevTasks]);
    
    // Показываем уведомление
    console.log('✅ Задача добавлена в ScheduleView:', task.name);
  });

  // Управление авто-синком: выключаем в режиме таблицы, включаем в остальных
  useEffect(() => {
    if (viewMode === 'table') {
      stopAutoSync();
    } else {
      startAutoSync();
    }
    return () => {
      // при размонтировании останавливаем, чтобы не плодить интервалы
      stopAutoSync();
    };
  }, [viewMode]);

  // Загрузка всех задач для модалки «История задач» при открытии
  useEffect(() => {
    if (!showHistoryModal) return;
    setHistoryLoading(true);
    getAllTasks()
      .then((data) => {
        setHistoryTasks(data || []);
      })
      .finally(() => setHistoryLoading(false));
  }, [showHistoryModal]);

  // Загрузка текущего пользователя и списка для назначения
  useEffect(() => {
    (async () => {
      const { user } = await getCurrentUser();
      setCurrentUser(user ?? null);
      const { profiles } = await getAssignableUserProfiles();
      setAssignableUsers(profiles);
    })();
  }, []);

  // Загрузка задач и проектов при монтировании и при смене пользователя
  useEffect(() => {
    loadTasks();
    loadProjects();
  }, [currentUser?.id]);

  const loadTasks = async () => {
    setLoading(true);
    console.log('🔄 Загрузка задач...');
    try {
      const fetchedTasks = currentUser?.id
        ? await getTasksForCurrentUser(currentUser.id)
        : await getAllTasks();
      console.log('✅ Задачи загружены:', fetchedTasks);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('❌ Ошибка загрузки задач:', error);
      setNotificationMessage('Ошибка загрузки задач');
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const fetchedProjects = await getAllProjects();
      console.log('✅ Проекты загружены из базы:', fetchedProjects);
      
      // Если в базе нет проектов или только тестовые, добавляем статический проект "ЖК Вишневый сад"
      // Проверяем, есть ли проект "Вишневый сад" в базе
      const hasVishnevyySad = fetchedProjects.some((p: any) => {
        const id = (p.id || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return id === 'zhk-vishnevyy-sad' || 
               name.includes('вишневый сад') || 
               name.includes('вишнёвый сад');
      });
      
      // Если проекта "Вишневый сад" нет, добавляем статический
      if (!hasVishnevyySad || fetchedProjects.length === 0) {
        const staticVishnevyySad = {
          id: 'zhk-vishnevyy-sad', // Используем строковый ID, если в базе project_id - TEXT
          name: 'ЖК "Вишневый сад"',
          description: 'Строительство жилого комплекса',
          status: 'construction',
          progress: 65,
          start_date: '2025-06-20',
          end_date: '2026-06-20',
          total_budget: 180000000,
          spent: 117000000,
          client: 'ООО "АБ ДЕВЕЛОПМЕНТ ЦЕНТР"',
          foreman: 'Саидов Ю.Н.',
          architect: 'Петров П.П.',
          address: 'ул. Вишневая, 15'
        };
        
        // Фильтруем тестовые проекты и добавляем статический
        const filteredProjects = fetchedProjects.filter((p: any) => {
          const id = (p.id || '').toLowerCase();
          const name = (p.name || '').toLowerCase();
          // Исключаем тестовые проекты
          return !id.includes('test') && 
                 !name.includes('тест') &&
                 !name.includes('test') &&
                 id !== '1' && id !== '2' && id !== '3';
        });
        
        setProjects([staticVishnevyySad, ...filteredProjects]);
        console.log('✅ Проекты обработаны, добавлен статический "ЖК Вишневый сад"');
      } else {
        // Фильтруем только тестовые проекты
        const filteredProjects = fetchedProjects.filter((p: any) => {
          const id = (p.id || '').toLowerCase();
          const name = (p.name || '').toLowerCase();
          return !id.includes('test') && 
                 !name.includes('тест') &&
                 !name.includes('test') &&
                 id !== '1' && id !== '2' && id !== '3';
        });
        setProjects(filteredProjects);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки проектов:', error);
      // В случае ошибки добавляем статический проект
      const staticVishnevyySad = {
        id: 'zhk-vishnevyy-sad',
        name: 'ЖК "Вишневый сад"',
        description: 'Строительство жилого комплекса',
        status: 'construction',
        progress: 65,
        start_date: '2025-06-20',
        end_date: '2026-06-20',
        total_budget: 180000000,
        spent: 117000000,
        client: 'ООО "АБ ДЕВЕЛОПМЕНТ ЦЕНТР"',
        foreman: 'Саидов Ю.Н.',
        architect: 'Петров П.П.',
        address: 'ул. Вишневая, 15'
      };
      setProjects([staticVishnevyySad]);
    }
  };

  // Функции для навигации по месяцам
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-slate-500/20 text-slate-200 border border-slate-500/30',
    'in-progress': 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
    in_progress: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
    completed: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
    delayed: 'bg-red-500/20 text-red-200 border border-red-500/30',
    submitted_for_review: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
    returned_for_revision: 'bg-orange-500/20 text-orange-200 border border-orange-500/30'
  };

  const statusLabels: Record<string, string> = {
    pending: 'Ожидание',
    'in-progress': 'В работе',
    in_progress: 'В работе',
    completed: 'Завершено',
    delayed: 'Просрочено',
    submitted_for_review: 'На проверке',
    returned_for_revision: 'Возвращена на доработку'
  };

  // Проверяем, заполнены ли обязательные поля
  const isFormValid = taskForm.project && taskForm.name && taskForm.description && (taskForm.assigneeUserId || taskForm.assignee) && taskForm.startDate && taskForm.endDate;

  // Функция для фильтрации задач по правам доступа и поиску
  const filteredTasks = tasks.filter(task => {
    // Задачи, созданные заказчиком, видны только заказчику и подрядчику
    if (clientCreatedTasks.has(task.id) && userRole !== 'client' && userRole !== 'contractor') {
      return false;
    }
    // Задачи, созданные прорабом для рабочих, видны только прорабу и рабочим
    if (foremanCreatedTasks.has(task.id) && userRole !== 'foreman' && userRole !== 'worker') {
      return false;
    }
    // Поиск по названию и описанию (без учёта регистра)
    const q = taskSearchQuery.trim().toLowerCase();
    if (q) {
      const nameMatch = (task.name || '').toLowerCase().includes(q);
      const descMatch = (task.description || '').toLowerCase().includes(q);
      if (!nameMatch && !descMatch) return false;
    }
    return true;
  });

  // Функция для создания новой задачи
  const handleCreateTask = async () => {
    if (!isFormValid) return;

    try {
      const newTaskData: TaskInput = {
        projectId: taskForm.project,
        name: taskForm.name,
        description: taskForm.description,
        status: taskForm.status,
        assignee: taskForm.assignee || assignableUsers.find(u => u.id === taskForm.assigneeUserId)?.full_name || assignableUsers.find(u => u.id === taskForm.assigneeUserId)?.email || '',
        startDate: taskForm.startDate,
        endDate: taskForm.endDate,
        progress: 0,
        order: 0,
        createdByUserId: currentUser?.id ?? undefined,
        assignedToUserId: taskForm.assigneeUserId || undefined
      };

      const createdTask = await createTask(newTaskData);
      if (createdTask) {
        setTasks(prevTasks => [createdTask, ...prevTasks]);
        if (userRole === 'foreman') {
          setForemanCreatedTasks(prev => new Set([...prev, createdTask.id]));
        }
        setTaskForm({
          project: '',
          name: '',
          description: '',
          assignee: '',
          assigneeUserId: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          status: 'pending'
        });
        
        // Закрытие формы создания
        setIsCreatingTask(false);
        
        // Показываем уведомление
        setNotificationMessage('Задача успешно создана!');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setNotificationMessage('Ошибка создания задачи');
      setShowNotification(true);
    }
  };

  // Функция для сброса формы
  const handleCancelTask = () => {
    setTaskForm({
      project: '',
      name: '',
      description: '',
      assignee: '',
      assigneeUserId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'pending'
    });
    setIsCreatingTask(false);
  };

  // Функция для создания задачи заказчиком для подрядчика
  const handleCreateClientTask = async () => {
    if (!clientTaskForm.project || !clientTaskForm.name || !clientTaskForm.description || (!clientTaskForm.assigneeUserId && !clientTaskForm.assignee) || !clientTaskForm.startDate || !clientTaskForm.endDate) return;

    try {
      const newTaskData: TaskInput = {
        projectId: clientTaskForm.project,
        name: clientTaskForm.name,
        description: clientTaskForm.description,
        status: clientTaskForm.status,
        assignee: clientTaskForm.assignee || assignableUsers.find(u => u.id === clientTaskForm.assigneeUserId)?.full_name || assignableUsers.find(u => u.id === clientTaskForm.assigneeUserId)?.email || '',
        startDate: clientTaskForm.startDate,
        endDate: clientTaskForm.endDate,
        progress: 0,
        order: 0,
        createdByUserId: currentUser?.id ?? undefined,
        assignedToUserId: clientTaskForm.assigneeUserId || undefined
      };

      const createdTask = await createTask(newTaskData);
      if (createdTask) {
        setTasks(prevTasks => [createdTask, ...prevTasks]);
        setClientCreatedTasks(prev => new Set([...prev, createdTask.id]));
        setClientTaskForm({
          project: '',
          name: '',
          description: '',
          assignee: '',
          assigneeUserId: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          status: 'pending'
        });
        
        // Закрытие формы создания
        setIsCreatingClientTask(false);
        
        // Показываем уведомление об успешном создании
        setNotificationMessage('Задача для подрядчика создана!');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error('Error creating client task:', error);
      setNotificationMessage('Ошибка создания задачи');
      setShowNotification(true);
    }
  };

  // Функция для сброса формы задачи заказчика
  const handleCancelClientTask = () => {
    setClientTaskForm({
      project: '',
      name: '',
      description: '',
      assignee: '',
      assigneeUserId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'pending'
    });
    setIsCreatingClientTask(false);
  };

  // Редактировать прогресс может только исполнитель
  const canEditTaskProgress = (task: Task) => Boolean(currentUser?.id && task.assigneeUserId === currentUser.id);

  const handleStartEditTask = (task: Task) => {
    if (!canEditTaskProgress(task)) return;
    setEditingTask(task.id);
    setEditForm({
      status: task.status,
      progress: task.progress
    });
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const normalizedStatus = normalizeStatus(newStatus);
      const updatedTask = await updateTask(taskId, { status: normalizedStatus as Task['status'] }, currentUser?.id);
      if (updatedTask) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: updatedTask.status } : t));
      }
    } catch (error) {
      setNotificationMessage('Ошибка обновления статуса задачи');
      setShowNotification(true);
    }
  };

  const handleSubmitForReview = async (taskId: string) => {
    if (!currentUser?.id) return;
    setSaving(true);
    try {
      const updated = await submitTaskForReview(taskId, currentUser.id);
      if (updated) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'submitted_for_review' as const, progress: 100 } : t));
        setNotificationMessage('Задача сдана на проверку');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        setEditingTask(null);
      } else {
        setNotificationMessage('Сдать на проверку может только исполнитель');
        setShowNotification(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmTaskCompleted = async (taskId: string) => {
    if (!currentUser?.id) return;
    setSaving(true);
    try {
      const updated = await confirmTaskCompleted(taskId, currentUser.id);
      if (updated) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' as const } : t));
        setNotificationMessage('Задача подтверждена как выполненная');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        setNotificationMessage('Подтвердить выполнение может только постановщик задачи');
        setShowNotification(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTaskOrder = async (taskId: string, newOrder: number, status: string) => {
    try {
      const updatedTask = await updateTaskOrder(taskId, newOrder, status);
      if (updatedTask) {
        setTasks(prevTasks => {
          const updatedTasks = [...prevTasks];
          const taskIndex = updatedTasks.findIndex(task => task.id === taskId);
          
          if (taskIndex !== -1) {
            // Обновляем порядок для перемещенной задачи
            updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], order: newOrder };
            
            // Обновляем порядок для остальных задач в той же колонке
            const columnTasks = updatedTasks.filter(task => task.status === status);
            columnTasks.forEach((task, index) => {
              if (task.id !== taskId) {
                const taskIdx = updatedTasks.findIndex(t => t.id === task.id);
                if (taskIdx !== -1) {
                  updatedTasks[taskIdx] = { ...updatedTasks[taskIdx], order: index };
                }
              }
            });
          }
          
          return updatedTasks;
        });
      }
    } catch (error) {
      console.error('Error updating task order:', error);
      setNotificationMessage('Ошибка обновления порядка задачи');
      setShowNotification(true);
    }
  };

  // Функция для отмены редактирования задачи
  const handleCancelEditTask = () => {
    setEditingTask(null);
    setEditForm({
      status: 'pending',
      progress: 0
    });
  };

  // Функция для сохранения изменений задачи (для технадзора)
  const handleSaveEditTask = async () => {
    if (!editingTask) {
      console.error('❌ Нет задачи для редактирования');
      return;
    }

    if (saving) {
      console.log('⏳ Уже идет сохранение...');
      return;
    }

    setSaving(true);
    console.log('🔄 Сохранение изменений задачи:', editingTask);
    console.log('📊 Данные формы:', editForm);

    try {
      // 100% — сдать на проверку (постановщик потом нажмёт «Проверить задачу» и подтвердит)
      if (editForm.progress === 100 && currentUser?.id) {
        const updated = await submitTaskForReview(editingTask, currentUser.id);
        if (updated) {
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task.id === editingTask
                ? { ...task, status: 'submitted_for_review' as const, progress: 100 }
                : task
            )
          );
          setNotificationMessage('Задача сдана на проверку. Постановщик подтвердит выполнение.');
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
          handleCancelEditTask();
        } else {
          setNotificationMessage('Не удалось сдать задачу на проверку');
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        }
        setSaving(false);
        return;
      }

      // 0–99%: обычное обновление прогресса и статуса
      let newStatus = editForm.status;
      if (editForm.progress === 0) {
        newStatus = 'pending';
      } else if (editForm.progress >= 1 && editForm.progress <= 99) {
        newStatus = 'in_progress';
      }

      const updateData: TaskUpdate = {
        status: newStatus,
        progress: editForm.progress
      };

      console.log('📝 Данные для обновления:', updateData);

      const updatedTask = await updateTask(editingTask, updateData);
      console.log('✅ Результат обновления:', updatedTask);

      if (updatedTask) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === editingTask
              ? { ...task, status: newStatus, progress: editForm.progress }
              : task
          )
        );

        setNotificationMessage('Прогресс задачи обновлен!');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        handleCancelEditTask();
      } else {
        console.error('❌ Задача не была обновлена');
        setNotificationMessage('Ошибка: задача не была обновлена');
        setShowNotification(true);
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения изменений:', error);
      setNotificationMessage('Ошибка сохранения изменений');
      setShowNotification(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">График работ</h1>
            <p className="text-slate-600 mt-1">Планирование и контроль выполнения задач</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка задач...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showNotification && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center space-x-2">
            <span>✓</span>
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">График работ</h1>
          <p className="text-slate-400 mt-1">Планирование и контроль выполнения задач</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-white/10 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Список</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>Канбан</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Таблица прогресса</span>
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 [color-scheme:dark]"
          />
          
          {(userRole === 'foreman' || userRole === 'contractor' || userRole === 'technadzor' || userRole === 'client') && (
            <div className="flex space-x-2">
              {!isCreatingTask && !isCreatingClientTask ? (
                <>
                  {(userRole === 'foreman' || userRole === 'contractor' || userRole === 'technadzor') && (
                    <button 
                      onClick={() => {
                      setTaskForm(prev => ({ ...prev, startDate: new Date().toISOString().split('T')[0] }));
                      setIsCreatingTask(true);
                    }}
                      className="border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Добавить задачу</span>
                    </button>
                  )}
                  {userRole === 'client' && (
                    <button 
                      onClick={() => {
                      setClientTaskForm(prev => ({ ...prev, startDate: new Date().toISOString().split('T')[0] }));
                      setIsCreatingClientTask(true);
                    }}
                      className="border border-emerald-500/30 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Задача для подрядчика</span>
                    </button>
                  )}
                </>
              ) : (
                <button 
                  onClick={isCreatingClientTask ? handleCancelClientTask : handleCancelTask}
                  className="border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
                >
                  <span>Отменить</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Основной контент в зависимости от режима просмотра */}
      {viewMode === 'table' ? (
        <ProgressTable userRole={userRole} />
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          clientCreatedTasks={clientCreatedTasks}
          foremanCreatedTasks={foremanCreatedTasks}
          onStartEditTask={handleStartEditTask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onUpdateTaskOrder={handleUpdateTaskOrder}
          currentUserId={currentUser?.id ?? null}
          onReviewTask={(task) => setTaskToReview(task)}
        />
      ) : (
        <>
          {/* Calendar View */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Календарь задач</h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-300"
                      title="Предыдущий месяц"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="text-sm font-medium text-slate-200 min-w-[120px] text-center">
                      {currentMonth.toLocaleDateString('ru', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                      onClick={goToNextMonth}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-300"
                      title="Следующий месяц"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={goToCurrentMonth}
                      className="px-3 py-1 text-xs border border-blue-500/30 bg-blue-500/20 text-blue-200 rounded-lg hover:bg-blue-500/30 transition-colors"
                      title="Текущий месяц"
                    >
                      Сегодня
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }, (_, i) => {
                    const today = new Date();
                    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                    const firstDayWeekday = firstDayOfMonth.getDay();
                    const daysInMonth = lastDayOfMonth.getDate();
                    
                    // Вычисляем дату для каждой ячейки
                    let date;
                    if (i < firstDayWeekday) {
                      // Дни предыдущего месяца
                      const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0);
                      date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - (firstDayWeekday - i - 1));
                    } else if (i < firstDayWeekday + daysInMonth) {
                      // Дни текущего месяца
                      date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i - firstDayWeekday + 1);
                    } else {
                      // Дни следующего месяца
                      date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i - firstDayWeekday - daysInMonth + 1);
                    }
                    
                    const isToday = date.toDateString() === today.toDateString();
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                    const hasTask = filteredTasks.some(task => {
                      const taskDate = new Date(task.startDate);
                      return taskDate.toDateString() === date.toDateString();
                    });
                    
                    return (
                      <div
                        key={i}
                        className={`aspect-square p-2 text-center text-sm border rounded-lg cursor-pointer transition-colors ${
                          isToday ? 'bg-blue-500/25 border-blue-500/40 text-blue-200' :
                          hasTask ? 'bg-amber-500/20 border-amber-500/30 text-amber-200 hover:bg-amber-500/30' :
                          isCurrentMonth ? 'border-white/10 text-slate-200 hover:bg-white/5' :
                          'border-white/5 text-slate-500'
                        }`}
                      >
                        <div className="font-medium">{date.getDate()}</div>
                        {hasTask && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mx-auto mt-1"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Поиск задач + Task Summary */}
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Поиск задач</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    placeholder="Название или описание"
                    className="w-full pl-9 pr-3 py-2 border border-white/10 rounded-xl bg-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
                  />
                </div>
              </div>
              <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Сегодняшние задачи</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-blue-500/15">
                    <div>
                      <p className="text-sm font-medium text-white">Проверка качества</p>
                      <p className="text-xs text-slate-400">ЖК "Северная звезда"</p>
                    </div>
                    <Clock className="w-4 h-4 text-blue-300" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-emerald-500/15">
                    <div>
                      <p className="text-sm font-medium text-white">Приёмка материалов</p>
                      <p className="text-xs text-slate-400">Офисный центр</p>
                    </div>
                    <Clock className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-red-500/15">
                    <div>
                      <p className="text-sm font-medium text-white">Совещание</p>
                      <p className="text-xs text-slate-400">15:00</p>
                    </div>
                    <AlertCircle className="w-4 h-4 text-red-300" />
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Статистика</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1 text-slate-300">
                      <span>Выполнено в срок</span>
                      <span className="font-medium text-white">85%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1 text-slate-300">
                      <span>Общий прогресс</span>
                      <span className="font-medium text-white">67%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                </div>
                {(currentUser?.role === 'admin' || currentUser?.role === 'management') && (
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl font-medium transition-colors"
                  >
                    <History className="w-4 h-4" />
                    История задач
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Overview */}
          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                <Clock className="w-4 h-4 text-slate-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Временная шкала</h2>
                <p className="text-sm text-slate-400">Хронология выполнения задач</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10"></div>
              
              <div className="space-y-6">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="relative flex items-start space-x-4">
                    <div className={`relative z-10 w-3 h-3 rounded-full border-2 ${
                      task.status === 'completed' ? 'bg-green-500 border-green-500' :
                      task.status === 'in-progress' || task.status === 'in_progress' ? 'bg-blue-500 border-blue-500' :
                      task.status === 'delayed' ? 'bg-red-500 border-red-500' :
                      task.status === 'returned_for_revision' ? 'bg-orange-500 border-orange-500' :
                      task.status === 'submitted_for_review' ? 'bg-amber-500 border-amber-500' :
                      'bg-gray-400 border-gray-400'
                    }`}></div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="rounded-xl p-4 border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 transform hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white">{task.name}</h3>
                          <div className="flex items-center space-x-2">
                            {clientCreatedTasks.has(task.id) && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
                                От заказчика
                              </span>
                            )}
                            {foremanCreatedTasks.has(task.id) && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30">
                                От прораба
                              </span>
                            )}
                            {currentUser?.id && task.createdByUserId === currentUser.id && task.status === 'submitted_for_review' ? (
                              <button
                                onClick={() => setTaskToReview(task)}
                                className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 transition-all duration-200"
                              >
                                Проверить задачу
                              </button>
                            ) : (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status] || 'bg-white/10 text-slate-200 border border-white/10'}`}>
                                {statusLabels[task.status] || task.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-400 mb-3">{task.description}</p>
                        
                        {/* Комментарий при возврате на доработку */}
                        {task.review_feedback && (
                          <div className="mb-3 p-3 bg-amber-500/15 border border-amber-500/30 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-amber-200 mb-1">Комментарий постановщика:</p>
                                <p className="text-sm text-amber-100/90 whitespace-pre-wrap">{task.review_feedback}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(task.startDate).toLocaleDateString('ru')} - {new Date(task.endDate).toLocaleDateString('ru')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{task.assignee}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Прогресс</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 shadow-sm ${
                                task.status === 'completed' ? 'bg-green-500' :
                                task.status === 'in-progress' || task.status === 'in_progress' ? 'bg-blue-500' :
                                task.status === 'delayed' ? 'bg-red-500' :
                                task.status === 'returned_for_revision' ? 'bg-orange-500' :
                                task.status === 'submitted_for_review' ? 'bg-amber-500' :
                                'bg-gray-400'
                              }`}
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                        </div>
                  
                        {/* Action Buttons: исполнитель — обновить прогресс (проверить задачу — в блоке статуса справа) */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {canEditTaskProgress(task) && task.status !== 'submitted_for_review' && task.status !== 'completed' && (
                            <button
                              onClick={() => handleStartEditTask(task)}
                              className="px-3 py-1 text-xs border border-emerald-500/30 bg-emerald-500/20 text-emerald-200 rounded-lg hover:bg-emerald-500/30 transition-all duration-200"
                            >
                              Обновить прогресс
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Задачи не найдены</p>
          <p className="text-gray-400 mt-2">
            {userRole === 'client' || userRole === 'contractor' 
              ? 'Создайте первую задачу для начала работы' 
              : 'Ожидайте создания задач другими участниками'
            }
          </p>
        </div>
      )}

      {/* Модальное окно: создание задачи */}
      {isCreatingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={handleCancelTask}>
          <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Создание новой задачи</h2>
              <button type="button" onClick={handleCancelTask} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" aria-label="Закрыть">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Проект</label>
                <select 
                  value={taskForm.project}
                  onChange={(e) => setTaskForm({...taskForm, project: e.target.value})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                >
                  <option value="">Выберите проект</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Название задачи</label>
                <input
                  type="text"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({...taskForm, name: e.target.value})}
                  placeholder="Краткое название задачи"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Исполнитель</label>
                <select
                  value={taskForm.assigneeUserId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const profile = assignableUsers.find(u => u.id === id);
                    setTaskForm({
                      ...taskForm,
                      assigneeUserId: id,
                      assignee: profile ? (profile.full_name || profile.email) : ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                >
                  <option value="">Выберите пользователя</option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email} {u.email ? `(${u.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Статус</label>
                <select 
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({...taskForm, status: e.target.value as any})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                >
                  <option value="pending">Ожидание</option>
                  <option value="in-progress">В работе</option>
                  <option value="completed">Завершено</option>
                  <option value="delayed">Просрочено</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Дата начала</label>
                <input
                  type="date"
                  value={taskForm.startDate}
                  onChange={(e) => setTaskForm({...taskForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Дата окончания</label>
                <input
                  type="date"
                  value={taskForm.endDate}
                  onChange={(e) => setTaskForm({...taskForm, endDate: e.target.value})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Описание</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Подробное описание задачи..."
                  rows={4}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 resize-none"
                ></textarea>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button 
                  disabled={!isFormValid}
                  onClick={handleCreateTask}
                  className={`flex-1 py-2 rounded-xl transition-colors ${
                    isFormValid 
                      ? 'border border-emerald-500/30 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200' 
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Создать задачу
                </button>
                <button 
                  onClick={handleCancelTask}
                  className="flex-1 py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      )}


      {/* Модальное окно: задача заказчика для подрядчика */}
      {isCreatingClientTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={handleCancelClientTask}>
          <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Создание задачи для подрядчика</h2>
              <button type="button" onClick={handleCancelClientTask} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" aria-label="Закрыть">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Проект</label>
                <select 
                  value={clientTaskForm.project}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, project: e.target.value})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                >
                  <option value="">Выберите проект</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Название задачи</label>
                <input
                  type="text"
                  value={clientTaskForm.name}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, name: e.target.value})}
                  placeholder="Краткое название задачи"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Подрядчик / Исполнитель</label>
                <select
                  value={clientTaskForm.assigneeUserId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const profile = assignableUsers.find(u => u.id === id);
                    setClientTaskForm({
                      ...clientTaskForm,
                      assigneeUserId: id,
                      assignee: profile ? (profile.full_name || profile.email) : ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                >
                  <option value="">Выберите пользователя</option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email} {u.email ? `(${u.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Статус</label>
                <select 
                  value={clientTaskForm.status}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, status: e.target.value as any})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                >
                  <option value="pending">Ожидание</option>
                  <option value="in-progress">В работе</option>
                  <option value="completed">Завершено</option>
                  <option value="delayed">Просрочено</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Дата начала</label>
                <input
                  type="date"
                  value={clientTaskForm.startDate}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Дата окончания</label>
                <input
                  type="date"
                  value={clientTaskForm.endDate}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, endDate: e.target.value})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Описание</label>
                <textarea
                  value={clientTaskForm.description}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, description: e.target.value})}
                  placeholder="Подробное описание задачи для подрядчика..."
                  rows={4}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 resize-none"
                ></textarea>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button 
                  disabled={!clientTaskForm.project || !clientTaskForm.name || !clientTaskForm.description || (!clientTaskForm.assigneeUserId && !clientTaskForm.assignee) || !clientTaskForm.startDate || !clientTaskForm.endDate}
                  onClick={handleCreateClientTask}
                  className={`flex-1 py-2 rounded-xl transition-colors ${
                    clientTaskForm.project && clientTaskForm.name && clientTaskForm.description && (clientTaskForm.assigneeUserId || clientTaskForm.assignee) && clientTaskForm.startDate && clientTaskForm.endDate
                      ? 'border border-emerald-500/30 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200' 
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Создать задачу
                </button>
                <button 
                  onClick={handleCancelClientTask}
                  className="flex-1 py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования задачи */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Обновление прогресса задачи</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-500/15 border border-blue-500/30 rounded-xl p-3 mb-4">
                <p className="text-sm text-blue-200">
                  <strong className="text-blue-100">Изменение статуса:</strong><br/>
                  • 0% = Ожидание<br/>
                  • 1-99% = В работе<br/>
                  • 100% = Сдать на проверку (постановщик затем подтвердит выполнение)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Прогресс (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.progress}
                  onChange={(e) => setEditForm({...editForm, progress: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                />
              </div>
            </div>
            
            <div className="flex space-x-2 mt-6">
              <button 
                onClick={handleSaveEditTask}
                disabled={saving}
                className={`flex-1 py-2 rounded-xl transition-colors flex items-center justify-center space-x-2 ${
                  saving 
                    ? 'bg-white/10 text-slate-500 cursor-not-allowed' 
                    : 'border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200'
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-slate-300"></div>
                    <span>Сохранение...</span>
                  </>
                ) : (
                  <span>Сохранить</span>
                )}
              </button>
              <button 
                onClick={handleCancelEditTask}
                disabled={saving}
                className={`flex-1 py-2 rounded-xl transition-colors border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно «Проверить задачу» — детали и подтверждение выполнения */}
      {taskToReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl relative">
            {/* Крестик для закрытия */}
            <button
              onClick={() => {
                setTaskToReview(null);
                setReviewComment('');
              }}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pr-8">Проверить задачу</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Название:</span>
                <p className="font-medium text-gray-900">{taskToReview.name}</p>
              </div>
              {taskToReview.description && (
                <div>
                  <span className="text-gray-500">Описание:</span>
                  <p className="text-gray-700 mt-0.5">{taskToReview.description}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Исполнитель:</span>
                <p className="font-medium text-gray-900">{taskToReview.assignee}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="text-gray-500">Начало:</span>
                  <p className="text-gray-700">{new Date(taskToReview.startDate).toLocaleDateString('ru')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Окончание:</span>
                  <p className="text-gray-700">{new Date(taskToReview.endDate).toLocaleDateString('ru')}</p>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Прогресс:</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${taskToReview.progress}%` }} />
                  </div>
                  <span className="font-medium text-gray-900">{taskToReview.progress}%</span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Статус:</span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">На проверке</span>
              </div>
            </div>
            
            {/* Поле для комментария при возврате на доработку */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий (обязательно при возврате на доработку):
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Укажите, что необходимо доработать..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none text-sm"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={async () => {
                  if (!currentUser?.id) return;
                  setSaving(true);
                  const updated = await confirmTaskCompleted(taskToReview.id, currentUser.id);
                  if (updated) {
                    setTasks(prev => prev.map(t => t.id === taskToReview.id ? { ...t, status: 'completed' as const } : t));
                    setNotificationMessage('Задача подтверждена как выполненная');
                    setShowNotification(true);
                    setTimeout(() => setShowNotification(false), 3000);
                    setTaskToReview(null);
                    setReviewComment('');
                  } else {
                    setNotificationMessage('Не удалось подтвердить выполнение');
                    setShowNotification(true);
                  }
                  setSaving(false);
                }}
                disabled={saving}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {saving ? 'Сохранение...' : 'Подтвердить выполнение'}
              </button>
              <button
                onClick={async () => {
                  if (!currentUser?.id) return;
                  if (!reviewComment.trim()) {
                    setNotificationMessage('Пожалуйста, укажите комментарий');
                    setShowNotification(true);
                    setTimeout(() => setShowNotification(false), 3000);
                    return;
                  }
                  setSaving(true);
                  const updated = await returnTaskForRevision(taskToReview.id, currentUser.id, reviewComment);
                  if (updated) {
                    setTasks(prev => prev.map(t => t.id === taskToReview.id ? { ...t, status: 'returned_for_revision' as const, review_feedback: reviewComment } : t));
                    setNotificationMessage('Задача возвращена на доработку');
                    setShowNotification(true);
                    setTimeout(() => setShowNotification(false), 3000);
                    setTaskToReview(null);
                    setReviewComment('');
                  } else {
                    setNotificationMessage('Не удалось вернуть задачу на доработку');
                    setShowNotification(true);
                  }
                  setSaving(false);
                }}
                disabled={saving || !reviewComment.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {saving ? 'Сохранение...' : 'Вернуть на доработку'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно «История задач» — все задачи для руководства и админа */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">История задач</h2>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-slate-300" />
                </div>
              ) : historyTasks.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Нет задач</p>
              ) : (
                <ul className="space-y-3">
                  {historyTasks.map((task) => (
                    <li key={task.id} className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">{task.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(task.startDate).toLocaleDateString('ru')} – {new Date(task.endDate).toLocaleDateString('ru')} · {task.assignee}
                          </p>
                        </div>
                        <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status] || 'bg-white/10 text-slate-200 border border-white/10'}`}>
                          {statusLabels[task.status] || task.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleViewWithAPI;