import React, { useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Truck, 
  Wrench, 
  Hammer, 
  Drill, 
  Saw, 
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye
} from 'lucide-react';
import { UserRole } from '../types';

interface MaterialsViewProps {
  userRole: UserRole;
}

interface WarehouseItem {
  id: string;
  name: string;
  category: 'materials' | 'tools' | 'equipment' | 'consumables';
  subcategory: string;
  quantity: number;
  unit: string;
  volume?: number;
  volumeUnit?: string;
  minQuantity: number;
  maxQuantity: number;
  costPerUnit: number;
  supplier: string;
  location: string;
  lastUpdated: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'reserved';
  condition: 'new' | 'good' | 'fair' | 'needs-repair';
  notes?: string;
}

const MaterialsView: React.FC<MaterialsViewProps> = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    quantity: 0,
    operation: 'add' as 'add' | 'subtract' | 'set',
    notes: ''
  });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Моковые данные складских запасов - используем useState для возможности редактирования
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([
    // Стройматериалы
    {
      id: '1',
      name: 'Цемент М400',
      category: 'materials',
      subcategory: 'Вяжущие материалы',
      quantity: 150,
      unit: 'мешки',
      volume: 7.5,
      volumeUnit: 'м³',
      minQuantity: 20,
      maxQuantity: 200,
      costPerUnit: 450,
      supplier: 'СтройБаза №1',
      location: 'Склад А, секция 1',
      lastUpdated: '2025-08-25',
      status: 'in-stock',
      condition: 'new'
    },
    {
      id: '2',
      name: 'Кирпич красный полнотелый',
      category: 'materials',
      subcategory: 'Стеновые материалы',
      quantity: 5000,
      unit: 'шт',
      volume: 12.5,
      volumeUnit: 'м³',
      minQuantity: 1000,
      maxQuantity: 10000,
      costPerUnit: 15,
      supplier: 'КирпичСтрой',
      location: 'Склад Б, секция 2',
      lastUpdated: '2025-08-24',
      status: 'in-stock',
      condition: 'new'
    },
    {
      id: '3',
      name: 'Арматура А500С 12мм',
      category: 'materials',
      subcategory: 'Металлопрокат',
      quantity: 2.5,
      unit: 'тонны',
      volume: 0.32,
      volumeUnit: 'м³',
      minQuantity: 0.5,
      maxQuantity: 5,
      costPerUnit: 55000,
      supplier: 'МеталлПром',
      location: 'Склад В, секция 3',
      lastUpdated: '2025-08-23',
      status: 'low-stock',
      condition: 'new'
    },
    {
      id: '4',
      name: 'Профнастил С21-1000',
      category: 'materials',
      subcategory: 'Кровельные материалы',
      quantity: 25,
      unit: 'листы',
      volume: 2.5,
      volumeUnit: 'м³',
      minQuantity: 10,
      maxQuantity: 50,
      costPerUnit: 850,
      supplier: 'КровляПрофи',
      location: 'Склад А, секция 4',
      lastUpdated: '2025-08-22',
      status: 'in-stock',
      condition: 'new'
    },
    {
      id: '5',
      name: 'Песок строительный',
      category: 'materials',
      subcategory: 'Инертные материалы',
      quantity: 8,
      unit: 'м³',
      volume: 8,
      volumeUnit: 'м³',
      minQuantity: 2,
      maxQuantity: 20,
      costPerUnit: 1200,
      supplier: 'ПесокСтрой',
      location: 'Склад Б, секция 1',
      lastUpdated: '2025-08-21',
      status: 'in-stock',
      condition: 'new'
    },
    // Инструменты
    {
      id: '6',
      name: 'Перфоратор Bosch GBH 2-26',
      category: 'tools',
      subcategory: 'Электроинструменты',
      quantity: 3,
      unit: 'шт',
      minQuantity: 1,
      maxQuantity: 5,
      costPerUnit: 25000,
      supplier: 'ИнструментПро',
      location: 'Инструментальная, шкаф 1',
      lastUpdated: '2025-08-25',
      status: 'in-stock',
      condition: 'good'
    },
    {
      id: '7',
      name: 'Болгарка Makita 9555HN',
      category: 'tools',
      subcategory: 'Электроинструменты',
      quantity: 2,
      unit: 'шт',
      minQuantity: 1,
      maxQuantity: 4,
      costPerUnit: 8500,
      supplier: 'ИнструментПро',
      location: 'Инструментальная, шкаф 2',
      lastUpdated: '2025-08-24',
      status: 'low-stock',
      condition: 'good'
    },
    {
      id: '8',
      name: 'Молоток слесарный 1кг',
      category: 'tools',
      subcategory: 'Ручные инструменты',
      quantity: 8,
      unit: 'шт',
      minQuantity: 3,
      maxQuantity: 15,
      costPerUnit: 1200,
      supplier: 'ИнструментПро',
      location: 'Инструментальная, шкаф 3',
      lastUpdated: '2025-08-23',
      status: 'in-stock',
      condition: 'good'
    },
    {
      id: '9',
      name: 'Ножовка по дереву 500мм',
      category: 'tools',
      subcategory: 'Ручные инструменты',
      quantity: 5,
      unit: 'шт',
      minQuantity: 2,
      maxQuantity: 10,
      costPerUnit: 800,
      supplier: 'ИнструментПро',
      location: 'Инструментальная, шкаф 3',
      lastUpdated: '2025-08-22',
      status: 'in-stock',
      condition: 'good'
    },
    // Оборудование
    {
      id: '10',
      name: 'Бетономешалка 180л',
      category: 'equipment',
      subcategory: 'Строительное оборудование',
      quantity: 1,
      unit: 'шт',
      minQuantity: 1,
      maxQuantity: 2,
      costPerUnit: 45000,
      supplier: 'ОборудованиеСтрой',
      location: 'Оборудование, площадка 1',
      lastUpdated: '2025-08-20',
      status: 'in-stock',
      condition: 'fair',
      notes: 'Требует профилактики'
    },
    {
      id: '11',
      name: 'Леса строительные 6м',
      category: 'equipment',
      subcategory: 'Строительное оборудование',
      quantity: 4,
      unit: 'секции',
      minQuantity: 2,
      maxQuantity: 8,
      costPerUnit: 15000,
      supplier: 'ОборудованиеСтрой',
      location: 'Оборудование, площадка 2',
      lastUpdated: '2025-08-19',
      status: 'in-stock',
      condition: 'good'
    },
    // Расходники
    {
      id: '12',
      name: 'Сверла по бетону 8мм',
      category: 'consumables',
      subcategory: 'Сверла и буры',
      quantity: 50,
      unit: 'шт',
      minQuantity: 20,
      maxQuantity: 100,
      costPerUnit: 150,
      supplier: 'РасходникиПро',
      location: 'Расходники, ящик 1',
      lastUpdated: '2025-08-25',
      status: 'in-stock',
      condition: 'new'
    },
    {
      id: '13',
      name: 'Диски отрезные 125мм',
      category: 'consumables',
      subcategory: 'Абразивные материалы',
      quantity: 15,
      unit: 'шт',
      minQuantity: 10,
      maxQuantity: 50,
      costPerUnit: 200,
      supplier: 'РасходникиПро',
      location: 'Расходники, ящик 2',
      lastUpdated: '2025-08-24',
      status: 'low-stock',
      condition: 'new'
    }
  ]);

  const categoryLabels = {
    materials: 'Стройматериалы',
    tools: 'Инструменты',
    equipment: 'Оборудование',
    consumables: 'Расходники'
  };

  const statusColors = {
    'in-stock': 'bg-green-100 text-green-800',
    'low-stock': 'bg-yellow-100 text-yellow-800',
    'out-of-stock': 'bg-red-100 text-red-800',
    'reserved': 'bg-blue-100 text-blue-800'
  };

  const statusLabels = {
    'in-stock': 'На складе',
    'low-stock': 'Мало на складе',
    'out-of-stock': 'Нет на складе',
    'reserved': 'Зарезервировано'
  };

  const conditionColors = {
    'new': 'bg-green-100 text-green-800',
    'good': 'bg-blue-100 text-blue-800',
    'fair': 'bg-yellow-100 text-yellow-800',
    'needs-repair': 'bg-red-100 text-red-800'
  };

  const conditionLabels = {
    'new': 'Новое',
    'good': 'Хорошее',
    'fair': 'Удовлетворительное',
    'needs-repair': 'Требует ремонта'
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'materials': return Package;
      case 'tools': return Wrench;
      case 'equipment': return Drill;
      case 'consumables': return Hammer;
      default: return Package;
    }
  };

  const filteredItems = warehouseItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.subcategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockLevel = (item: WarehouseItem) => {
    const percentage = (item.quantity / item.maxQuantity) * 100;
    if (percentage <= 20) return 'critical';
    if (percentage <= 50) return 'low';
    return 'good';
  };

  const stockLevelColors = {
    good: 'bg-green-500',
    low: 'bg-yellow-500',
    critical: 'bg-red-500'
  };

  // Функция для начала редактирования материала
  const handleStartEdit = (item: WarehouseItem) => {
    setEditingItem(item.id);
    setEditForm({
      quantity: 0,
      operation: 'add',
      notes: ''
    });
  };

  // Функция для отмены редактирования
  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm({
      quantity: 0,
      operation: 'add',
      notes: ''
    });
  };

  // Функция для сохранения изменений
  const handleSaveEdit = () => {
    if (editForm.quantity <= 0) return;

    setWarehouseItems(prevItems => 
      prevItems.map(item => {
        if (item.id === editingItem) {
          let newQuantity = item.quantity;
          
          switch (editForm.operation) {
            case 'add':
              newQuantity += editForm.quantity;
              break;
            case 'subtract':
              newQuantity = Math.max(0, newQuantity - editForm.quantity);
              break;
            case 'set':
              newQuantity = editForm.quantity;
              break;
          }

          // Определяем новый статус на основе количества
          let newStatus = item.status;
          if (newQuantity === 0) {
            newStatus = 'out-of-stock';
          } else if (newQuantity <= item.minQuantity) {
            newStatus = 'low-stock';
          } else {
            newStatus = 'in-stock';
          }

          return {
            ...item,
            quantity: newQuantity,
            status: newStatus,
            lastUpdated: new Date().toISOString().split('T')[0],
            notes: editForm.notes ? `${editForm.notes} (${new Date().toLocaleDateString('ru')})` : item.notes
          };
        }
        return item;
      })
    );

    // Показываем уведомление
    const operationText = editForm.operation === 'add' ? 'добавлено' : 
                         editForm.operation === 'subtract' ? 'списано' : 'установлено';
    setNotificationMessage(`${editForm.quantity} ${editForm.operation === 'add' ? 'добавлено' : 'списано'} успешно!`);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      setNotificationMessage('');
    }, 3000);

    // Закрываем форму редактирования
    handleCancelEdit();
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Складские запасы</h1>
          <p className="text-slate-600 mt-1">Управление материалами, инструментами и оборудованием на складе</p>
        </div>
        
                        {userRole === 'contractor' && (
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Plus className="w-4 h-4" />
            <span>Добавить на склад</span>
        </button>
        )}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Всего позиций</p>
              <p className="text-2xl font-bold text-gray-900">{warehouseItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">На складе</p>
              <p className="text-2xl font-bold text-gray-900">
                {warehouseItems.filter(item => item.status === 'in-stock').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Мало на складе</p>
              <p className="text-2xl font-bold text-gray-900">
                {warehouseItems.filter(item => item.status === 'low-stock').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <Truck className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Требует заказа</p>
              <p className="text-2xl font-bold text-gray-900">
                {warehouseItems.filter(item => item.status === 'out-of-stock').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию или категории..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все категории</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все статусы</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Список товаров */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const CategoryIcon = getCategoryIcon(item.category);
          const stockLevel = getStockLevel(item);
          return (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CategoryIcon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.subcategory}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${statusColors[item.status]}`}>
                    {statusLabels[item.status]}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${conditionColors[item.condition]}`}>
                    {conditionLabels[item.condition]}
                  </span>
                </div>
        </div>
        
              {/* Количество и объем */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Количество:</span>
                  <span className="font-semibold text-gray-900">
                    {item.quantity} {item.unit}
                  </span>
                </div>
                {item.volume && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Объем:</span>
                    <span className="font-semibold text-gray-900">
                      {item.volume} {item.volumeUnit}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Стоимость:</span>
                  <span className="font-semibold text-gray-900">
                    ₽{item.costPerUnit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Уровень запасов */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Уровень запасов</span>
                  <span>{Math.round((item.quantity / item.maxQuantity) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${stockLevelColors[stockLevel]}`}
                    style={{ width: `${Math.min((item.quantity / item.maxQuantity) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Мин: {item.minQuantity}</span>
                  <span>Макс: {item.maxQuantity}</span>
                </div>
              </div>

              {/* Дополнительная информация */}
              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex items-center space-x-2">
                  <span>Поставщик:</span>
                  <span className="font-medium">{item.supplier}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Местоположение:</span>
                  <span className="font-medium">{item.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Обновлено:</span>
                  <span className="font-medium">{new Date(item.lastUpdated).toLocaleDateString('ru')}</span>
                </div>
              </div>

              {item.notes && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">{item.notes}</p>
                </div>
              )}

              {/* Действия */}
              <div className="flex space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Просмотр</span>
                </button>
                {userRole === 'contractor' && (
                  <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Пополнить</span>
                  </button>
                )}
                {userRole === 'storekeeper' && (
                  <button 
                    onClick={() => handleStartEdit(item)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <Wrench className="w-4 h-4" />
                    <span className="text-sm">Редактировать</span>
                  </button>
                )}
              </div>

              {/* Форма редактирования для складчика */}
              {userRole === 'storekeeper' && editingItem === item.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Редактирование количества</h4>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Операция</label>
                        <select 
                          value={editForm.operation}
                          onChange={(e) => setEditForm({...editForm, operation: e.target.value as 'add' | 'subtract' | 'set'})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="add">Добавить</option>
                          <option value="subtract">Списать</option>
                          <option value="set">Установить</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Количество ({item.unit})</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({...editForm, quantity: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="0"
                        />
        </div>
      </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Примечание</label>
                      <input
                        type="text"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Причина изменения (необязательно)"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleSaveEdit}
                        disabled={editForm.quantity <= 0}
                        className={`flex-1 py-2 rounded-lg transition-colors ${
                          editForm.quantity > 0 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Сохранить
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Товары не найдены</h3>
          <p className="text-slate-600">Попробуйте изменить фильтры или поисковый запрос</p>
        </div>
      )}
    </div>
  );
};

export default MaterialsView;