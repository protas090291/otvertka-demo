import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, User, AlertCircle, Plus, Table, List, Columns, CheckCircle, Play, Pause, GripVertical } from 'lucide-react';
import { UserRole, Task } from '../types';
import ProgressTable from './ProgressTable';
import { useDataSync, startAutoSync, stopAutoSync } from '../lib/dataSync';
import {
  DndContext,
  closestCenter,
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

// Компонент перетаскиваемой карточки задачи
interface SortableTaskCardProps {
  task: Task;
  clientCreatedTasks: Set<string>;
  foremanCreatedTasks: Set<string>;
  onStartEditTask: (task: Task) => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  clientCreatedTasks,
  foremanCreatedTasks,
  onStartEditTask
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
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: 1,
    zIndex: isDragging ? 999999 : 'auto',
    position: isDragging ? 'fixed' as const : 'static' as const,
  };

  const taskCard = (
    <div
      ref={setNodeRef}
      id={task.id}
      style={style}
      data-dragging={isDragging}
      className={`sortable-item bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm hover:shadow-lg hover:bg-white transition-all duration-300 cursor-pointer ${
        isDragging ? '!z-[999999] task-moving' : ''
      }`}
      onClick={() => onStartEditTask(task)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm flex-1">{task.name}</h4>
        <div className="flex items-center space-x-1 ml-2">
          <div
            {...attributes}
            {...listeners}
            className="drag-handle p-1 rounded"
          >
            <GripVertical className="w-3 h-3 text-gray-400" />
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

      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center space-x-1">
          <User className="w-3 h-3" />
          <span>{task.assignee}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>{new Date(task.endDate).toLocaleDateString('ru')}</span>
        </div>
      </div>

      <div className="w-full bg-gray-200/50 rounded-full h-1.5 mb-2 shadow-inner">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
            task.status === 'completed' ? 'bg-green-500' :
            task.status === 'in-progress' ? 'bg-blue-500' :
            task.status === 'delayed' ? 'bg-red-500' :
            'bg-gray-400'
          }`}
          style={{ width: `${task.progress}%` }}
        ></div>
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>Прогресс</span>
        <span>{task.progress}%</span>
      </div>
    </div>
  );

  // Если перетаскиваем, рендерим в portal
  if (isDragging) {
    return createPortal(taskCard, document.body);
  }

  return taskCard;
};

// Компонент droppable колонки
interface DroppableColumnProps {
  column: {
    id: string;
    title: string;
    color: string;
    icon: React.ComponentType<any>;
  };
  tasks: Task[];
  clientCreatedTasks: Set<string>;
  foremanCreatedTasks: Set<string>;
  onStartEditTask: (task: Task) => void;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  tasks,
  clientCreatedTasks,
  foremanCreatedTasks,
  onStartEditTask
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  const columnTasks = tasks
    .filter(task => task.status === column.id)
    .sort((a, b) => (b.order || 0) - (a.order || 0));
  const IconComponent = column.icon;

  return (
    <div className="space-y-4" data-column-id={column.id}>
      <div className={`kanban-column ${column.color} rounded-xl p-4 border border-gray-200/50 shadow-sm backdrop-blur-sm transition-all duration-300 ${
        isOver ? 'column-highlight' : ''
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <IconComponent className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">{column.title}</h3>
          </div>
          <span className="bg-white/80 backdrop-blur-sm text-gray-600 text-xs font-medium px-2 py-1 rounded-full shadow-sm transition-all duration-300">
            {columnTasks.length}
          </span>
        </div>
        
          <div 
            ref={setNodeRef}
            className={`drop-zone space-y-3 min-h-[200px] p-2 rounded-lg transition-all duration-300 ${
              isOver ? 'drag-over' : ''
            }`}
          >
            {columnTasks.map(task => (
              <SortableTaskCard
                key={task.id}
                task={task}
                clientCreatedTasks={clientCreatedTasks}
                foremanCreatedTasks={foremanCreatedTasks}
                onStartEditTask={onStartEditTask}
              />
            ))}
            
            {columnTasks.length === 0 && (
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
  onUpdateTaskStatus: (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed' | 'delayed') => void;
  onUpdateTaskOrder: (taskId: string, newOrder: number, status: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  clientCreatedTasks, 
  foremanCreatedTasks, 
  onStartEditTask,
  onUpdateTaskStatus,
  onUpdateTaskOrder
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
    { id: 'pending', title: 'Ожидание', color: 'bg-gray-100', icon: Pause },
    { id: 'in_progress', title: 'В работе', color: 'bg-blue-100', icon: Play },
    { id: 'delayed', title: 'Просрочено', color: 'bg-red-100', icon: AlertCircle },
    { id: 'completed', title: 'Завершено', color: 'bg-green-100', icon: CheckCircle }
  ];



  const handleDragStart = () => {
    setIsDragging(true);
    // Добавляем анимацию для всех колонок
    document.querySelectorAll('.kanban-column').forEach(column => {
      column.classList.add('column-pulse');
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('Drag end:', { active: active.id, over: over?.id });

    setIsDragging(false);
    
    // Убираем анимацию с колонок
    document.querySelectorAll('.kanban-column').forEach(column => {
      column.classList.remove('column-pulse');
    });
    
    // Добавляем анимацию успешного перемещения
    if (over) {
      const targetColumn = document.querySelector(`[data-column-id="${over.id}"]`);
      if (targetColumn) {
        targetColumn.classList.add('column-highlight');
        setTimeout(() => {
          targetColumn.classList.remove('column-highlight');
        }, 1000);
      }
    }

    if (!over) return;

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask) return;

    console.log('Active task:', activeTask);

    const validStatuses = ['pending', 'in_progress', 'completed', 'delayed'];
    
    // Проверяем, сбросили ли на колонку (изменение статуса)
    if (validStatuses.includes(over.id as string)) {
      const newStatus = over.id as 'pending' | 'in_progress' | 'completed' | 'delayed';
      console.log('Dropped on column:', newStatus);
      
      // Проверяем, что статус действительно изменился
      if (activeTask.status !== newStatus) {
        console.log('Updating status from', activeTask.status, 'to', newStatus);
        
        // Находим максимальный order в целевой колонке
        const targetColumnTasks = tasks.filter(task => task.status === newStatus);
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
      }
    } else {
      // Если сбросили на другую задачу, определяем колонку по родительскому элементу
      const overElement = document.getElementById(over.id as string);
      if (overElement) {
        // Ищем родительскую колонку
        const columnElement = overElement.closest('[data-column-id]');
        if (columnElement) {
          const columnId = columnElement.getAttribute('data-column-id');
          console.log('Found column ID:', columnId);
          if (columnId && validStatuses.includes(columnId)) {
            const newStatus = columnId as 'pending' | 'in_progress' | 'completed' | 'delayed';
            
            // Если статус изменился - обновляем статус
            if (activeTask.status !== newStatus) {
              console.log('Updating status from', activeTask.status, 'to', newStatus);
              
              // Находим максимальный order в целевой колонке
              const targetColumnTasks = tasks.filter(task => task.status === newStatus);
              const maxOrder = targetColumnTasks.length > 0 
                ? Math.max(...targetColumnTasks.map(task => task.order || 0))
                : -1;
              
              // Новая задача становится выше всех (order = maxOrder + 1)
              const newOrder = maxOrder + 1;
              
              console.log('New task order (top of column):', newOrder);
              onUpdateTaskOrder(activeTask.id, newOrder, newStatus);
              onUpdateTaskStatus(activeTask.id, newStatus);
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
              }
            }
          }
        }
      }
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center shadow-md">
          <Columns className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Канбан-доска</h2>
          <p className="text-sm text-gray-600">Перетаскивайте задачи между колонками и внутри колонок для изменения порядка</p>
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
            />
          ))}
        </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

interface ScheduleViewProps {
  userRole: UserRole;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ userRole }) => {
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'kanban'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    project: '',
    name: '',
    description: '',
    assignee: '',
    startDate: '',
    endDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'delayed'
  });
  const [showNotification, setShowNotification] = useState(false);
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
    startDate: '',
    endDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'delayed'
  });
  const [clientCreatedTasks, setClientCreatedTasks] = useState<Set<string>>(new Set());
  const [foremanCreatedTasks, setForemanCreatedTasks] = useState<Set<string>>(new Set());

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
      stopAutoSync();
    };
  }, [viewMode]);

  const [tasks, setTasks] = useState<Task[]>([
    // Завершенные задачи
    {
      id: '1',
      projectId: '1',
      name: 'Заливка фундамента',
      description: 'Подготовка и заливка бетонного фундамента',
      status: 'completed',
      assignee: 'Бригада №1',
      startDate: '2025-01-15',
      endDate: '2025-01-18',
      progress: 100,
      order: 0
    },
    {
      id: '2',
      projectId: '1',
      name: 'Разметка участка',
      description: 'Разметка границ и осей здания',
      status: 'completed',
      assignee: 'Геодезист',
      startDate: '2025-01-10',
      endDate: '2025-01-12',
      progress: 100,
      order: 1
    },
    {
      id: '3',
      projectId: '2',
      name: 'Подготовка стройплощадки',
      description: 'Очистка и подготовка территории',
      status: 'completed',
      assignee: 'Бригада №1',
      startDate: '2025-01-08',
      endDate: '2025-01-14',
      progress: 100,
      order: 2
    },
    {
      id: '4',
      projectId: '1',
      name: 'Установка опалубки',
      description: 'Монтаж опалубки для фундамента',
      status: 'completed',
      assignee: 'Бригада №2',
      startDate: '2025-01-12',
      endDate: '2025-01-15',
      progress: 100,
      order: 3
    },
    {
      id: '5',
      projectId: '3',
      name: 'Доставка материалов',
      description: 'Завоз кирпича и цемента',
      status: 'completed',
      assignee: 'Логист',
      startDate: '2025-01-20',
      endDate: '2025-01-22',
      progress: 100,
      order: 4
    },

    // Задачи в работе
    {
      id: '6',
      projectId: '1',
      name: 'Возведение стен 1 этажа',
      description: 'Кирпичная кладка первого этажа',
      status: 'in-progress',
      assignee: 'Бригада №2',
      startDate: '2025-01-20',
      endDate: '2025-02-05',
      progress: 65,
      order: 0
    },
    {
      id: '7',
      projectId: '2',
      name: 'Установка перекрытий',
      description: 'Монтаж железобетонных плит перекрытия',
      status: 'in-progress',
      assignee: 'Бригада №3',
      startDate: '2025-01-25',
      endDate: '2025-02-08',
      progress: 40,
      order: 1
    },
    {
      id: '8',
      projectId: '1',
      name: 'Установка окон',
      description: 'Монтаж оконных блоков',
      status: 'in-progress',
      assignee: 'Бригада №4',
      startDate: '2025-01-28',
      endDate: '2025-02-12',
      progress: 25,
      order: 2
    },
    {
      id: '9',
      projectId: '3',
      name: 'Прокладка электропроводки',
      description: 'Разводка электрических кабелей',
      status: 'in-progress',
      assignee: 'Электрик',
      startDate: '2025-01-30',
      endDate: '2025-02-15',
      progress: 15,
      order: 3
    },
    {
      id: '10',
      projectId: '2',
      name: 'Утепление стен',
      description: 'Установка теплоизоляции',
      status: 'in-progress',
      assignee: 'Бригада №5',
      startDate: '2025-02-01',
      endDate: '2025-02-18',
      progress: 10,
      order: 4
    },

    // Задачи в ожидании
    {
      id: '11',
      projectId: '1',
      name: 'Установка коммуникаций',
      description: 'Прокладка электричества и водопровода',
      status: 'pending',
      assignee: 'Бригада №3',
      startDate: '2025-02-10',
      endDate: '2025-02-25',
      progress: 0,
      order: 0
    },
    {
      id: '12',
      projectId: '2',
      name: 'Штукатурные работы',
      description: 'Выравнивание стен штукатуркой',
      status: 'pending',
      assignee: 'Бригада №6',
      startDate: '2025-02-15',
      endDate: '2025-03-05',
      progress: 0,
      order: 1
    },
    {
      id: '13',
      projectId: '3',
      name: 'Установка дверей',
      description: 'Монтаж входных и межкомнатных дверей',
      status: 'pending',
      assignee: 'Бригада №7',
      startDate: '2025-02-20',
      endDate: '2025-03-10',
      progress: 0,
      order: 2
    },
    {
      id: '14',
      projectId: '1',
      name: 'Покраска стен',
      description: 'Грунтовка и покраска внутренних стен',
      status: 'pending',
      assignee: 'Бригада №8',
      startDate: '2025-03-01',
      endDate: '2025-03-20',
      progress: 0,
      order: 3
    },
    {
      id: '15',
      projectId: '2',
      name: 'Укладка плитки',
      description: 'Облицовка ванной и кухни плиткой',
      status: 'pending',
      assignee: 'Бригада №9',
      startDate: '2025-03-05',
      endDate: '2025-03-25',
      progress: 0,
      order: 4
    },
    {
      id: '16',
      projectId: '3',
      name: 'Установка сантехники',
      description: 'Монтаж ванны, раковины, унитаза',
      status: 'pending',
      assignee: 'Сантехник',
      startDate: '2025-03-10',
      endDate: '2025-03-30',
      progress: 0,
      order: 5
    },
    {
      id: '17',
      projectId: '1',
      name: 'Установка освещения',
      description: 'Монтаж светильников и выключателей',
      status: 'pending',
      assignee: 'Электрик',
      startDate: '2025-03-15',
      endDate: '2025-04-05',
      progress: 0,
      order: 6
    },

    // Просроченные задачи
    {
      id: '18',
      projectId: '1',
      name: 'Кровельные работы',
      description: 'Установка кровли и водостоков',
      status: 'delayed',
      assignee: 'Бригада №4',
      startDate: '2025-01-22',
      endDate: '2025-01-30',
      progress: 30,
      order: 0
    },
    {
      id: '19',
      projectId: '2',
      name: 'Установка лесов',
      description: 'Монтаж строительных лесов',
      status: 'delayed',
      assignee: 'Бригада №1',
      startDate: '2025-01-18',
      endDate: '2025-01-25',
      progress: 20,
      order: 1
    },
    {
      id: '20',
      projectId: '3',
      name: 'Демонтаж старых конструкций',
      description: 'Разборка старых построек на участке',
      status: 'delayed',
      assignee: 'Бригада №2',
      startDate: '2025-01-15',
      endDate: '2025-01-28',
      progress: 45,
      order: 2
    },
    {
      id: '21',
      projectId: '1',
      name: 'Установка вентиляции',
      description: 'Монтаж системы вентиляции',
      status: 'delayed',
      assignee: 'Вентиляционщик',
      startDate: '2025-01-25',
      endDate: '2025-02-08',
      progress: 15,
      order: 3
    },
    {
      id: '22',
      projectId: '2',
      name: 'Гидроизоляция подвала',
      description: 'Устройство гидроизоляции подвальных помещений',
      status: 'delayed',
      assignee: 'Бригада №3',
      startDate: '2025-01-20',
      endDate: '2025-02-05',
      progress: 25,
      order: 4
    }
  ]);

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    delayed: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    pending: 'Ожидание',
    'in-progress': 'В работе',
    completed: 'Завершено',
    delayed: 'Просрочено'
  };

  // Проверяем, заполнены ли обязательные поля
  const isFormValid = taskForm.project && taskForm.name && taskForm.description && taskForm.assignee && taskForm.startDate && taskForm.endDate;

  // Функция для фильтрации задач по правам доступа
  const filteredTasks = tasks.filter(task => {
    // Задачи, созданные заказчиком, видны только заказчику и подрядчику
    if (clientCreatedTasks.has(task.id) && userRole !== 'client' && userRole !== 'contractor') {
      return false;
    }
    // Задачи, созданные прорабом для рабочих, видны только прорабу и рабочим
    if (foremanCreatedTasks.has(task.id) && userRole !== 'foreman' && userRole !== 'worker') {
      return false;
    }
    return true;
  });

  // Функция для создания новой задачи
  const handleCreateTask = () => {
    if (!isFormValid) return;

    const newTask: Task = {
      id: Date.now().toString(),
      projectId: taskForm.project,
      name: taskForm.name,
      description: taskForm.description,
      status: taskForm.status,
      assignee: taskForm.assignee,
      startDate: taskForm.startDate,
      endDate: taskForm.endDate,
      progress: 0
    };

    // Добавляем новую задачу в начало списка
    setTasks(prevTasks => [newTask, ...prevTasks]);
    
    // Если задача создана прорабом, отмечаем её как созданную прорабом
    if (userRole === 'foreman') {
      setForemanCreatedTasks(prev => new Set([...prev, newTask.id]));
    }
    
    // Сброс формы
    setTaskForm({
      project: '',
      name: '',
      description: '',
      assignee: '',
      startDate: '',
      endDate: '',
      status: 'pending'
    });
    
    // Закрытие формы создания
    setIsCreatingTask(false);
    
    // Показываем уведомление
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Функция для сброса формы
  const handleCancelTask = () => {
    setTaskForm({
      project: '',
      name: '',
      description: '',
      assignee: '',
      startDate: '',
      endDate: '',
      status: 'pending'
    });
    setIsCreatingTask(false);
  };

  // Функция для создания задачи заказчиком для подрядчика
  const handleCreateClientTask = () => {
    if (!clientTaskForm.project || !clientTaskForm.name || !clientTaskForm.description || !clientTaskForm.assignee || !clientTaskForm.startDate || !clientTaskForm.endDate) return;

    const newTask: Task = {
      id: Date.now().toString(),
      projectId: clientTaskForm.project,
      name: clientTaskForm.name,
      description: clientTaskForm.description,
      status: clientTaskForm.status,
      assignee: clientTaskForm.assignee,
      startDate: clientTaskForm.startDate,
      endDate: clientTaskForm.endDate,
      progress: 0
    };

    // Добавляем новую задачу в начало списка
    setTasks(prevTasks => [newTask, ...prevTasks]);
    
    // Отмечаем задачу как созданную заказчиком
    setClientCreatedTasks(prev => new Set([...prev, newTask.id]));

    // Сброс формы
    setClientTaskForm({
      project: '',
      name: '',
      description: '',
      assignee: '',
      startDate: '',
      endDate: '',
      status: 'pending'
    });
    
    // Закрытие формы создания
    setIsCreatingClientTask(false);
    
    // Показываем уведомление об успешном создании
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Функция для сброса формы задачи заказчика
  const handleCancelClientTask = () => {
    setClientTaskForm({
      project: '',
      name: '',
      description: '',
      assignee: '',
      startDate: '',
      endDate: '',
      status: 'pending'
    });
    setIsCreatingClientTask(false);
  };

  // Функция для начала редактирования задачи (для технадзора)
  const handleStartEditTask = (task: Task) => {
    setEditingTask(task.id);
    setEditForm({
      status: task.status,
      progress: task.progress
    });
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed' | 'delayed') => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus }
          : task
      )
    );
  };

  const handleUpdateTaskOrder = (taskId: string, newOrder: number, status: string) => {
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
  const handleSaveEditTask = () => {
    // Определяем статус на основе прогресса
    let newStatus = editForm.status;
    if (editForm.progress === 0) {
      newStatus = 'pending';
    } else if (editForm.progress >= 1 && editForm.progress <= 99) {
      newStatus = 'in_progress'; // Используем подчеркивание вместо дефиса
    } else if (editForm.progress === 100) {
      newStatus = 'completed';
    }

    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === editingTask 
          ? { ...task, status: newStatus, progress: editForm.progress }
          : task
      )
    );

    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    handleCancelEditTask();
  };


  return (
    <div className="space-y-6">
      {showNotification && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center space-x-2">
            <span>✓</span>
            <span>
              {isCreatingClientTask ? 'Задача для подрядчика создана!' : 'Прогресс задачи обновлен!'}
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">График работ</h1>
            <p className="text-gray-600 mt-1">Планирование и контроль выполнения задач</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Список</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>Канбан</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          {(userRole === 'foreman' || userRole === 'contractor' || userRole === 'technadzor' || userRole === 'client') && (
            <div className="flex space-x-2">
              {!isCreatingTask && !isCreatingClientTask ? (
                <>
                  {(userRole === 'foreman' || userRole === 'contractor' || userRole === 'technadzor') && (
                    <button 
                      onClick={() => setIsCreatingTask(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Добавить задачу</span>
                    </button>
                  )}
                  {userRole === 'client' && (
                    <button 
                      onClick={() => setIsCreatingClientTask(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Задача для подрядчика</span>
                    </button>
                  )}
                </>
              ) : (
                <button 
                  onClick={isCreatingClientTask ? handleCancelClientTask : handleCancelTask}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
        />
      ) : (
        <>
          {/* Calendar View */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-3">
              <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-6 hover:shadow-md transition-all duration-300">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Календарь задач</h2>
                
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date(2025, 0, i - 5);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const hasTask = Math.random() > 0.7;
                    
                    return (
                      <div
                        key={i}
                        className={`aspect-square p-2 text-center text-sm border rounded cursor-pointer transition-colors ${
                          isToday ? 'bg-blue-100 border-blue-300 text-blue-700' :
                          hasTask ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' :
                          'hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="font-medium">{date.getDate()}</div>
                        {hasTask && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mx-auto mt-1"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Task Summary */}
            <div className="space-y-4">
              <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-6 hover:shadow-md transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Сегодняшние задачи</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Проверка качества</p>
                      <p className="text-xs text-gray-500">ЖК "Северная звезда"</p>
                    </div>
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Приёмка материалов</p>
                      <p className="text-xs text-gray-500">Офисный центр</p>
                    </div>
                    <Clock className="w-4 h-4 text-green-500" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Совещание</p>
                      <p className="text-xs text-gray-500">15:00</p>
                    </div>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-6 hover:shadow-md transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Выполнено в срок</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Общий прогресс</span>
                      <span className="font-medium">67%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Overview */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center shadow-md">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Временная шкала</h2>
                <p className="text-sm text-gray-600">Хронология выполнения задач</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>
              
              <div className="space-y-6">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="relative flex items-start space-x-4">
                    <div className={`relative z-10 w-3 h-3 rounded-full border-2 ${
                      task.status === 'completed' ? 'bg-green-500 border-green-500' :
                      task.status === 'in-progress' ? 'bg-blue-500 border-blue-500' :
                      task.status === 'delayed' ? 'bg-red-500 border-red-500' :
                      'bg-gray-400 border-gray-400'
                    }`}></div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30 shadow-sm hover:shadow-lg hover:bg-white/60 transition-all duration-200 transform hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
                          <div className="flex items-center space-x-2">
                            {clientCreatedTasks.has(task.id) && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100/80 backdrop-blur-sm text-purple-800 shadow-sm">
                                От заказчика
                              </span>
                            )}
                            {foremanCreatedTasks.has(task.id) && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100/80 backdrop-blur-sm text-blue-800 shadow-sm">
                                От прораба
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm shadow-sm ${statusColors[task.status]}`}>
                              {statusLabels[task.status]}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{task.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
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
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Прогресс</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200/50 rounded-full h-2 shadow-inner">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 shadow-sm ${
                                task.status === 'completed' ? 'bg-green-500' :
                                task.status === 'in-progress' ? 'bg-blue-500' :
                                task.status === 'delayed' ? 'bg-red-500' :
                                'bg-gray-400'
                              }`}
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                        </div>
                  
                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-3">
                          {/* Action Buttons для прораба - только для задач, созданных прорабом для рабочих */}
                          {userRole === 'foreman' && foremanCreatedTasks.has(task.id) && (
                            <button 
                              onClick={() => handleStartEditTask(task)}
                              className="px-3 py-1 text-xs bg-green-50/80 backdrop-blur-sm text-green-700 rounded-lg hover:bg-green-100/80 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              Обновить прогресс
                            </button>
                          )}
                          
                          {/* Action Buttons для подрядчика - только для задач, не созданных прорабом */}
                          {userRole === 'contractor' && !foremanCreatedTasks.has(task.id) && (
                            <button 
                              onClick={() => handleStartEditTask(task)}
                              className="px-3 py-1 text-xs bg-green-50/80 backdrop-blur-sm text-green-700 rounded-lg hover:bg-green-100/80 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              Обновить прогресс
                            </button>
                          )}
                          
                          {/* Action Buttons для технадзора - только для задач прорабов */}
                          {userRole === 'technadzor' && task.assignee.includes('Прораб') && (
                            <button 
                              onClick={() => handleStartEditTask(task)}
                              className="px-3 py-1 text-xs bg-green-50/80 backdrop-blur-sm text-green-700 rounded-lg hover:bg-green-100/80 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              Обновить прогресс
                            </button>
                          )}
                          
                          {/* Action Buttons для заказчика - только для задач, созданных заказчиком */}
                          {userRole === 'client' && clientCreatedTasks.has(task.id) && (
                            <button 
                              onClick={() => handleStartEditTask(task)}
                              className="px-3 py-1 text-xs bg-green-50/80 backdrop-blur-sm text-green-700 rounded-lg hover:bg-green-100/80 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              Обновить прогресс
                            </button>
                          )}
                          
                          {/* Action Buttons для заказчика - только для задач подрядчиков */}
                          {userRole === 'client' && task.assignee.includes('Подрядчик') && (
                            <button 
                              onClick={() => handleStartEditTask(task)}
                              className="px-3 py-1 text-xs bg-green-50/80 backdrop-blur-sm text-green-700 rounded-lg hover:bg-green-100/80 transition-all duration-200 shadow-sm hover:shadow-md"
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

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Задачи не найдены</p>
          <p className="text-gray-400 mt-2">
            {userRole === 'client' || userRole === 'contractor' 
              ? 'Создайте первую задачу для начала работы' 
              : 'Ожидайте создания задач другими участниками'
            }
          </p>
        </div>
      )}

      {/* Форма создания задачи */}
      {isCreatingTask && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Создание новой задачи</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Проект</label>
                <select 
                  value={taskForm.project}
                  onChange={(e) => setTaskForm({...taskForm, project: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите проект</option>
                  <option value="1">ЖК "Северная звезда"</option>
                  <option value="2">Офисный центр "Технопарк"</option>
                  <option value="3">Частный дом Иванова</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название задачи</label>
                <input
                  type="text"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({...taskForm, name: e.target.value})}
                  placeholder="Краткое название задачи"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Исполнитель</label>
                {userRole === 'technadzor' ? (
                  <select 
                    value={taskForm.assignee}
                    onChange={(e) => setTaskForm({...taskForm, assignee: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Выберите прораба</option>
                    <option value="Прораб Иванов">Прораб Иванов</option>
                    <option value="Прораб Петров">Прораб Петров</option>
                    <option value="Прораб Сидоров">Прораб Сидоров</option>
                  </select>
                ) : userRole === 'foreman' ? (
                  <select 
                    value={taskForm.assignee}
                    onChange={(e) => setTaskForm({...taskForm, assignee: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Выберите рабочего</option>
                    <option value="Рабочий Петров">Рабочий Петров</option>
                    <option value="Рабочий Сидоров">Рабочий Сидоров</option>
                    <option value="Рабочий Козлов">Рабочий Козлов</option>
                    <option value="Рабочий Морозов">Рабочий Морозов</option>
                    <option value="Рабочий Волков">Рабочий Волков</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={taskForm.assignee}
                    onChange={(e) => setTaskForm({...taskForm, assignee: e.target.value})}
                    placeholder="Бригада или ответственное лицо"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                <select 
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({...taskForm, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата начала</label>
                <input
                  type="date"
                  value={taskForm.startDate}
                  onChange={(e) => setTaskForm({...taskForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата окончания</label>
                <input
                  type="date"
                  value={taskForm.endDate}
                  onChange={(e) => setTaskForm({...taskForm, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Подробное описание задачи..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button 
                  disabled={!isFormValid}
                  onClick={handleCreateTask}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    isFormValid 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Создать задачу
                </button>
                <button 
                  onClick={handleCancelTask}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Форма редактирования задачи для технадзора */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Редактирование задачи</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                <select 
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Ожидание</option>
                  <option value="in-progress">В работе</option>
                  <option value="completed">Завершено</option>
                  <option value="delayed">Просрочено</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Прогресс (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.progress}
                  onChange={(e) => setEditForm({...editForm, progress: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button 
                  onClick={handleSaveEditTask}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Сохранить
                </button>
                <button 
                  onClick={handleCancelEditTask}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Форма создания задачи заказчиком для подрядчика */}
      {isCreatingClientTask && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Создание задачи для подрядчика</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Проект</label>
                <select 
                  value={clientTaskForm.project}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, project: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите проект</option>
                  <option value="1">ЖК "Северная звезда"</option>
                  <option value="2">Офисный центр "Технопарк"</option>
                  <option value="3">Частный дом Иванова</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название задачи</label>
                <input
                  type="text"
                  value={clientTaskForm.name}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, name: e.target.value})}
                  placeholder="Краткое название задачи"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Подрядчик</label>
                <select 
                  value={clientTaskForm.assignee}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, assignee: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите подрядчика</option>
                  <option value="Подрядчик ООО СтройМонтаж">Подрядчик ООО СтройМонтаж</option>
                  <option value="Подрядчик ИП Петров">Подрядчик ИП Петров</option>
                  <option value="Подрядчик ЗАО СтройГрупп">Подрядчик ЗАО СтройГрупп</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                <select 
                  value={clientTaskForm.status}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата начала</label>
                <input
                  type="date"
                  value={clientTaskForm.startDate}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата окончания</label>
                <input
                  type="date"
                  value={clientTaskForm.endDate}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                <textarea
                  value={clientTaskForm.description}
                  onChange={(e) => setClientTaskForm({...clientTaskForm, description: e.target.value})}
                  placeholder="Подробное описание задачи для подрядчика..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button 
                  disabled={!clientTaskForm.project || !clientTaskForm.name || !clientTaskForm.description || !clientTaskForm.assignee || !clientTaskForm.startDate || !clientTaskForm.endDate}
                  onClick={handleCreateClientTask}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    clientTaskForm.project && clientTaskForm.name && clientTaskForm.description && clientTaskForm.assignee && clientTaskForm.startDate && clientTaskForm.endDate
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Создать задачу
                </button>
                <button 
                  onClick={handleCancelClientTask}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования задачи */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Обновление прогресса задачи</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Автоматическое изменение статуса:</strong><br/>
                  • 0% = Ожидание<br/>
                  • 1-99% = В работе<br/>
                  • 100% = Завершено
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Прогресс (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.progress}
                  onChange={(e) => setEditForm({...editForm, progress: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-2 mt-6">
              <button 
                onClick={handleSaveEditTask}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Сохранить
              </button>
              <button 
                onClick={handleCancelEditTask}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default ScheduleView;