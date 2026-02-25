import React, { useState, useEffect } from 'react';
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
  Eye,
  Edit
} from 'lucide-react';
import { UserRole } from '../types';
import { getAllWarehouseItems, createWarehouseItem, updateWarehouseItem, deleteWarehouseItem } from '../lib/materialsApi';

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
  volume_unit?: string;
  min_quantity: number;
  max_quantity: number;
  cost_per_unit: number;
  supplier: string;
  location: string;
  last_updated: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'reserved';
  condition: 'new' | 'good' | 'fair' | 'needs-repair';
  notes?: string;
}

const MaterialsViewWithAPI: React.FC<MaterialsViewProps> = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    quantity: 0,
    location: '',
    notes: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'materials' as 'materials' | 'tools' | 'equipment' | 'consumables',
    subcategory: '',
    quantity: 0,
    unit: '',
    volume: 0,
    volume_unit: '',
    min_quantity: 0,
    max_quantity: 0,
    cost_per_unit: 0,
    supplier: '',
    location: '',
    status: 'in-stock' as 'in-stock' | 'low-stock' | 'out-of-stock' | 'reserved',
    condition: 'new' as 'new' | 'good' | 'fair' | 'needs-repair',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);

  // Загружаем данные из API при монтировании компонента
  useEffect(() => {
    loadWarehouseItems();
  }, []);

  const loadWarehouseItems = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('📦 Загрузка складских позиций...');
      const items = await getAllWarehouseItems();
      console.log('✅ Загружено складских позиций:', items ? items.length : 0);
      console.log('📋 Данные:', items);
      
      // Безопасная установка данных с проверкой
      if (Array.isArray(items)) {
        setWarehouseItems(items);
      } else {
        console.warn('⚠️ Получены некорректные данные, устанавливаем пустой массив');
        setWarehouseItems([]);
      }
      
      if (!items || items.length === 0) {
        console.warn('⚠️ Нет данных в таблице warehouse_items');
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки складских позиций:', error);
      setError('Не удалось загрузить складские позиции из Supabase. Проверьте подключение и попробуйте снова.');
      setWarehouseItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    // Валидация обязательных полей
    if (!newItem.name || !newItem.name.trim()) {
      alert('Пожалуйста, укажите название позиции');
      return;
    }
    if (!newItem.subcategory || !newItem.subcategory.trim()) {
      alert('Пожалуйста, укажите подкатегорию');
      return;
    }
    if (!newItem.unit || !newItem.unit.trim()) {
      alert('Пожалуйста, укажите единицу измерения');
      return;
    }
    if (!newItem.supplier || !newItem.supplier.trim()) {
      alert('Пожалуйста, укажите поставщика');
      return;
    }
    if (!newItem.location || !newItem.location.trim()) {
      alert('Пожалуйста, укажите местоположение');
      return;
    }
    if (newItem.quantity < 0) {
      alert('Количество не может быть отрицательным');
      return;
    }
    if (newItem.cost_per_unit < 0) {
      alert('Стоимость не может быть отрицательной');
      return;
    }

    try {
      console.log('📦 Создание новой позиции:', newItem);
      const createdItem = await createWarehouseItem(newItem);
      if (createdItem) {
        console.log('✅ Позиция создана успешно:', createdItem);
        await loadWarehouseItems(); // Перезагружаем данные
        setNewItem({
          name: '',
          category: 'materials',
          subcategory: '',
          quantity: 0,
          unit: '',
          volume: 0,
          volume_unit: '',
          min_quantity: 0,
          max_quantity: 0,
          cost_per_unit: 0,
          supplier: '',
          location: '',
          status: 'in-stock',
          condition: 'new',
          notes: ''
        });
        setShowAddForm(false);
        // Показываем уведомление об успехе
        alert('Позиция успешно добавлена!');
      } else {
        console.error('❌ Позиция не была создана');
        alert('Ошибка: не удалось создать позицию. Проверьте консоль браузера для подробностей.');
      }
    } catch (error: any) {
      console.error('❌ Ошибка добавления складской позиции:', error);
      const errorMessage = error?.message || error?.toString() || 'Неизвестная ошибка';
      alert(`Ошибка при создании позиции: ${errorMessage}`);
    }
  };

  const handleUpdateItem = async (id: string) => {
    try {
      const success = await updateWarehouseItem(id, editForm);
      if (success) {
        await loadWarehouseItems(); // Перезагружаем данные
        setEditingItem(null);
        setEditForm({ quantity: 0, location: '', notes: '' });
      }
    } catch (error) {
      console.error('Ошибка обновления складской позиции:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const success = await deleteWarehouseItem(id);
      if (success) {
        await loadWarehouseItems(); // Перезагружаем данные
      }
    } catch (error) {
      console.error('Ошибка удаления складской позиции:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'materials': return <Package className="h-5 w-5" />;
      case 'tools': return <Wrench className="h-5 w-5" />;
      case 'equipment': return <Drill className="h-5 w-5" />;
      case 'consumables': return <Hammer className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'needs-repair': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Безопасная фильтрация с проверкой на null/undefined
  const filteredItems = (warehouseItems || []).filter(item => {
    if (!item) return false;
    
    const itemName = item.name || '';
    const itemSupplier = item.supplier || '';
    const itemLocation = item.location || '';
    
    const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         itemSupplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         itemLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Безопасные вычисления статистики
  const totalItems = (warehouseItems || []).length;
  const lowStockItems = (warehouseItems || []).filter(item => item && item.status === 'low-stock').length;
  const outOfStockItems = (warehouseItems || []).filter(item => item && item.status === 'out-of-stock').length;
  const totalValue = (warehouseItems || []).reduce((sum, item) => {
    if (!item) return sum;
    const quantity = item.quantity || 0;
    const costPerUnit = item.cost_per_unit || 0;
    return sum + (quantity * costPerUnit);
  }, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-3 rounded-3xl border border-white/10 bg-white/5 text-center text-white">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-lg font-medium">Загружаем данные склада из Supabase…</p>
          <p className="text-sm text-slate-300">Это может занять несколько секунд</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Склад и материалы</h1>
          <p className="text-slate-600 mt-1">Управление складскими запасами и поставками</p>
        </div>
        {(userRole === 'contractor' || userRole === 'storekeeper') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Добавить позицию</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-2xl flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Ошибка загрузки данных склада</p>
            <p className="text-sm text-red-100">{error}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadWarehouseItems}
              className="px-3 py-1.5 rounded-xl border border-red-300/50 text-sm hover:bg-red-500/20 transition"
            >
              Повторить
            </button>
          </div>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-2">Всего позиций</p>
              <p className="text-2xl font-bold text-white mb-2">{totalItems}</p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="text-blue-500 mr-1">↗</span>
                <span>+3% с прошлой недели</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-2">Заканчивается</p>
              <p className="text-2xl font-bold text-white mb-2">{lowStockItems}</p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="text-amber-500 mr-1">↗</span>
                <span>+1% с прошлой недели</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-2">Нет в наличии</p>
              <p className="text-2xl font-bold text-white mb-2">{outOfStockItems}</p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="text-red-500 mr-1">↘</span>
                <span>-2% с прошлой недели</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 mb-2">Общая стоимость</p>
              <p className="text-2xl font-bold text-white mb-2">₽{(totalValue / 1000000).toFixed(1)}М</p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="text-emerald-500 mr-1">↗</span>
                <span>+8% с прошлой недели</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по названию, поставщику или местоположению..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-white/10 rounded-xl bg-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">Все категории</option>
              <option value="materials">Материалы</option>
              <option value="tools">Инструменты</option>
              <option value="equipment">Оборудование</option>
              <option value="consumables">Расходники</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">Все статусы</option>
              <option value="in-stock">В наличии</option>
              <option value="low-stock">Заканчивается</option>
              <option value="out-of-stock">Нет в наличии</option>
              <option value="reserved">Зарезервировано</option>
            </select>
          </div>
        </div>
      </div>

      {/* Таблица складских позиций */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Количество
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Состояние
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Местоположение
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Стоимость
                </th>
                {(userRole === 'contractor' || userRole === 'storekeeper') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Действия
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={(userRole === 'contractor' || userRole === 'storekeeper') ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100/50 rounded-full flex items-center justify-center mb-3">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm">Складские позиции не найдены</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  if (!item) return null;
                  
                  return (
                  <tr key={item.id} className="border-b border-white/10 hover:bg-white/5 transition-all duration-300">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100/80 rounded-full flex items-center justify-center mr-3">
                          {getCategoryIcon(item.category || 'materials')}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name || 'Без названия'}</div>
                          <div className="text-sm text-slate-600">{item.supplier || 'Не указан'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.subcategory || 'Не указана'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity || 0} {item.unit || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                        (item.status || 'in-stock') === 'in-stock' ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200/50' :
                        (item.status || 'in-stock') === 'low-stock' ? 'bg-amber-100/80 text-amber-800 border-amber-200/50' :
                        (item.status || 'in-stock') === 'out-of-stock' ? 'bg-red-100/80 text-red-800 border-red-200/50' : 
                        'bg-blue-100/80 text-blue-800 border-blue-200/50'
                      }`}>
                        {(item.status || 'in-stock') === 'in-stock' ? 'В наличии' :
                         (item.status || 'in-stock') === 'low-stock' ? 'Заканчивается' :
                         (item.status || 'in-stock') === 'out-of-stock' ? 'Нет в наличии' : 'Зарезервировано'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                        (item.condition || 'new') === 'new' ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200/50' :
                        (item.condition || 'new') === 'good' ? 'bg-blue-100/80 text-blue-800 border-blue-200/50' :
                        (item.condition || 'new') === 'fair' ? 'bg-amber-100/80 text-amber-800 border-amber-200/50' : 
                        'bg-red-100/80 text-red-800 border-red-200/50'
                      }`}>
                        {(item.condition || 'new') === 'new' ? 'Новое' :
                         (item.condition || 'new') === 'good' ? 'Хорошее' :
                         (item.condition || 'new') === 'fair' ? 'Удовлетворительное' : 'Требует ремонта'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.location || 'Не указано'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(item.cost_per_unit || 0).toLocaleString()} ₽
                    </td>
                    {(userRole === 'contractor' || userRole === 'storekeeper') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(item.id);
                              setEditForm({
                                quantity: item.quantity || 0,
                                location: item.location || '',
                                notes: item.notes || ''
                              });
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50/50 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50/50 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Форма добавления новой позиции */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Добавить складскую позицию</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="materials">Материалы</option>
                <option value="tools">Инструменты</option>
                <option value="equipment">Оборудование</option>
                <option value="consumables">Расходники</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Подкатегория</label>
              <input
                type="text"
                value={newItem.subcategory}
                onChange={(e) => setNewItem({...newItem, subcategory: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Единица измерения</label>
              <input
                type="text"
                value={newItem.unit}
                onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость за единицу</label>
              <input
                type="number"
                value={newItem.cost_per_unit}
                onChange={(e) => setNewItem({...newItem, cost_per_unit: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Поставщик</label>
              <input
                type="text"
                value={newItem.supplier}
                onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Местоположение</label>
              <input
                type="text"
                value={newItem.location}
                onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Добавить
            </button>
          </div>
        </div>
      )}

      {/* Форма редактирования */}
      {editingItem && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Редактировать позицию</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
              <input
                type="number"
                value={editForm.quantity}
                onChange={(e) => setEditForm({...editForm, quantity: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Местоположение</label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
              <input
                type="text"
                value={editForm.notes}
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={() => handleUpdateItem(editingItem)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsViewWithAPI;
