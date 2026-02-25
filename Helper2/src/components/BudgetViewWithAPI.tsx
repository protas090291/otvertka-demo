import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Plus, Minus, Edit, Save, X } from 'lucide-react';
import { UserRole } from '../types';
import { getAllBudgetItems, createBudgetItem, updateBudgetItem, deleteBudgetItem } from '../lib/budgetApi';

interface BudgetViewProps {
  userRole: UserRole;
}

interface BudgetItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  project_id: string;
}

const BudgetViewWithAPI: React.FC<BudgetViewProps> = ({ userRole }) => {
  const [selectedProject, setSelectedProject] = useState('all');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newItem, setNewItem] = useState({
    category: '',
    description: '',
    amount: 0,
    type: 'expense' as 'expense' | 'income',
    project_id: ''
  });

  // Бюджетные операции подрядчика
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);

  // Загружаем данные из API при монтировании компонента
  useEffect(() => {
    loadBudgetItems();
  }, []);

  const loadBudgetItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await getAllBudgetItems();
      setBudgetItems(items);

      if (!items || items.length === 0) {
        setError('В Supabase нет бюджетных операций. Добавьте первую запись, чтобы увидеть аналитику.');
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки бюджетных операций:', error);
      setError('Не удалось загрузить бюджетные операции из Supabase. Проверьте подключение и попробуйте снова.');
      setNotificationMessage('Ошибка загрузки данных');
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };


  // Функции для управления бюджетом подрядчика
  const handleAddItem = async () => {
    if (!newItem.category || !newItem.description || newItem.amount <= 0) return;
    const targetProject = newItem.project_id || (selectedProject !== 'all' ? selectedProject : '');
    if (!targetProject) {
      alert('Выберите проект для операции');
      return;
    }

    try {
      const newBudgetItem = {
        category: newItem.category,
        description: newItem.description,
        amount: newItem.amount,
        type: newItem.type,
        date: new Date().toISOString().split('T')[0],
        project_id: targetProject
      };

      const createdItem = await createBudgetItem(newBudgetItem);
      if (createdItem) {
        await loadBudgetItems(); // Перезагружаем данные
        setNewItem({ category: '', description: '', amount: 0, type: 'expense', project_id: '' });
        setIsAddingItem(false);
        setNotificationMessage('Бюджетная операция добавлена');
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Ошибка добавления бюджетной операции:', error);
      setNotificationMessage('Ошибка добавления операции');
      setShowNotification(true);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const success = await deleteBudgetItem(id);
      if (success) {
        await loadBudgetItems(); // Перезагружаем данные
        setNotificationMessage('Бюджетная операция удалена');
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Ошибка удаления бюджетной операции:', error);
      setNotificationMessage('Ошибка удаления операции');
      setShowNotification(true);
    }
  };

  const handleCancelAddItem = () => {
    setNewItem({
      category: '',
      description: '',
      amount: 0,
      type: 'expense',
      project_id: ''
    });
    setIsAddingItem(false);
  };

  // Фильтруем по project_id, если выбран проект, иначе показываем все
  const filteredItems = selectedProject && selectedProject !== 'all' 
    ? budgetItems.filter(item => item.project_id === selectedProject)
    : budgetItems;
  const projectOptions = Array.from(new Set(budgetItems.map(item => item.project_id).filter(Boolean)));

  const totalIncome = filteredItems
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses = filteredItems
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const balance = totalIncome - totalExpenses;
  const usagePercent = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-3 rounded-3xl border border-white/10 bg-white/5 text-center text-white">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-lg font-medium">Загружаем данные бюджета из Supabase…</p>
          <p className="text-sm text-slate-300">Это может занять несколько секунд</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Финансовый контроль</h1>
          <p className="text-slate-400 mt-1">Управление доходами и расходами</p>
        </div>
        <div className="flex items-center gap-3">
          {projectOptions.length > 0 && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.2em]">Проект</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-transparent focus:outline-none text-sm"
              >
                <option value="all">Все</option>
                {projectOptions.map((projectId) => (
                  <option key={projectId} value={projectId}>
                    {projectId || 'Без ID'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-2xl flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Ошибка загрузки бюджета</p>
            <p className="text-sm text-red-100">{error}</p>
          </div>
          <button
            onClick={loadBudgetItems}
            className="px-3 py-1.5 rounded-xl border border-red-300/50 text-sm hover:bg-red-500/20 transition"
          >
            Повторить попытку
          </button>
        </div>
      )}

      {/* Форма добавления операции для подрядчика */}
      {isAddingItem && userRole === 'contractor' && (
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6 max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <Plus className="w-8 h-8 text-emerald-200" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Добавить операцию</h2>
            <p className="text-base text-slate-400">Заполните информацию о финансовой операции</p>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Основная форма */}
            <div className="xl:col-span-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Тип операции</label>
                  <div className="relative">
                    <select 
                      value={newItem.type}
                      onChange={(e) => setNewItem({...newItem, type: e.target.value as 'expense' | 'income'})}
                      className="w-full px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none text-sm"
                    >
                      <option value="expense">Расход</option>
                      <option value="income">Доход</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Проект *</label>
                  <div className="relative">
                    <select
                      value={newItem.project_id || (selectedProject !== 'all' ? selectedProject : '')}
                      onChange={(e) => setNewItem({...newItem, project_id: e.target.value})}
                      className="w-full px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none text-sm"
                    >
                      <option value="" disabled={projectOptions.length > 0}>Выберите проект</option>
                      {projectOptions.map((projectId) => (
                        <option key={projectId} value={projectId}>{projectId || 'Без ID'}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Категория</label>
                  <div className="relative">
                    <select 
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      className="w-full px-3 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none text-sm"
                    >
                      <option value="">Выберите категорию</option>
                      <option value="Материалы">Материалы</option>
                      <option value="Рабочая сила">Рабочая сила</option>
                      <option value="Оборудование">Оборудование</option>
                      <option value="Транспорт">Транспорт</option>
                      <option value="Финансирование">Финансирование</option>
                      <option value="Прочие расходы">Прочие расходы</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Сумма (₽)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">₽</span>
                    <input
                      type="number"
                      value={newItem.amount}
                      onChange={(e) => setNewItem({...newItem, amount: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base font-medium"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Описание</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  placeholder="Опишите детали операции..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm"
                ></textarea>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button 
                  disabled={!newItem.category || !newItem.description || newItem.amount <= 0 || (selectedProject === 'all' && !newItem.project_id)}
                  onClick={handleAddItem}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 text-sm ${
                    newItem.category && newItem.description && newItem.amount > 0 && (selectedProject !== 'all' || newItem.project_id)
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Добавить операцию</span>
                  </div>
                </button>
                <button 
                  onClick={handleCancelAddItem}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
            
            {/* Предварительный расчет */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="text-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Предварительный расчет</h3>
                <p className="text-xs text-slate-400">Влияние на баланс</p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-400">Текущий доход</span>
                    <span className="text-xs font-semibold text-green-600">₽{(totalIncome / 1000000).toFixed(1)}М</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min((totalIncome / (totalIncome + totalExpenses)) * 100, 100)}%` }}></div>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-400">Текущие расходы</span>
                    <span className="text-xs font-semibold text-red-600">₽{(totalExpenses / 1000000).toFixed(1)}М</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min((totalExpenses / (totalIncome + totalExpenses)) * 100, 100)}%` }}></div>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-400">Текущий баланс</span>
                    <span className={`text-xs font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₽{(Math.abs(balance) / 1000000).toFixed(1)}М
                      {balance < 0 && ' (убыток)'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(balance) / (totalIncome + totalExpenses) * 100, 100)}%` }}></div>
                  </div>
                </div>
                
                {newItem.amount > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-700">После операции</span>
                      <span className={`text-xs font-semibold ${newItem.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        ₽{((newItem.type === 'income' ? totalIncome + newItem.amount : totalIncome) - 
                           (newItem.type === 'expense' ? totalExpenses + newItem.amount : totalExpenses)) / 1000000}М
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {newItem.type === 'income' ? 'Доход увеличится' : 'Расход увеличится'} на ₽{(newItem.amount / 1000).toFixed(0)}К
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        
        <div className="flex items-center space-x-3">
          {userRole === 'contractor' && (
            <div className="flex space-x-2">
              {!isAddingItem && (
                <>
                  <button 
                    onClick={() => setIsAddingItem(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить операцию</span>
                  </button>
                </>
              )}
              {isAddingItem && (
                <button 
                  onClick={handleCancelAddItem}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Отмена</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Уведомление */}
      {showNotification && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center space-x-2">
            <span>✓</span>
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Бюджет</h1>
          <p className="text-slate-400 mt-1">
            {userRole === 'contractor' ? 'Управление доходами и расходами' : 'Контроль бюджета проекта'}
          </p>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-400 mb-2">
                {userRole === 'contractor' ? 'Общий доход' : 'Общий бюджет'}
              </p>
              <p className="text-2xl font-bold text-white mb-2">
                ₽{(totalIncome / 1000000).toFixed(1)}М
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="text-emerald-500 mr-1">↗</span>
                <span>+12% с прошлой недели</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-400 mb-2">
                {userRole === 'contractor' ? 'Общие расходы' : 'Потрачено'}
              </p>
              <p className="text-2xl font-bold text-white mb-2">
                ₽{(totalExpenses / 1000000).toFixed(1)}М
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="text-red-500 mr-1">↗</span>
                <span>+8% с прошлой недели</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-400 mb-2">
                {userRole === 'contractor' ? 'Чистый баланс' : 'Остаток'}
              </p>
              <p className={`text-2xl font-bold mb-2 ${userRole === 'contractor' ? (balance >= 0 ? 'text-emerald-600' : 'text-red-600') : 'text-white'}`}>
                ₽{(Math.abs(balance) / 1000000).toFixed(1)}М
                {balance < 0 && ' (убыток)'}
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <span className={`mr-1 ${userRole === 'contractor' ? (balance >= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-emerald-500'}`}>
                  {userRole === 'contractor' ? (balance >= 0 ? '↗' : '↘') : '↗'}
                </span>
                <span>{userRole === 'contractor' ? (balance >= 0 ? '+5%' : '-3%') : '+5%'} с прошлой недели</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              userRole === 'contractor' 
                ? (balance >= 0 ? 'bg-gradient-to-br from-emerald-100 to-emerald-200' : 'bg-gradient-to-br from-red-100 to-red-200')
                : 'bg-gradient-to-br from-emerald-100 to-emerald-200'
            }`}>
              <TrendingDown className={`w-6 h-6 ${
                userRole === 'contractor' 
                  ? (balance >= 0 ? 'text-emerald-600' : 'text-red-600')
                  : 'text-emerald-600'
              }`} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-400 mb-2">
                {userRole === 'contractor' ? 'Рентабельность' : 'Использование'}
              </p>
              <p className="text-2xl font-bold text-white mb-2">
                {userRole === 'contractor' 
                  ? totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0.0'
                  : currentBudget ? ((currentBudget.spent / currentBudget.totalBudget) * 100).toFixed(1) : '0.0'
                }%
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="text-purple-500 mr-1">↗</span>
                <span>+2% с прошлой недели</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Таблица операций для подрядчика */}
      {userRole === 'contractor' && (
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">История операций</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Дата</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Тип</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Категория</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Описание</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-white/10 hover:bg-white/20 transition-all duration-300">
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {new Date(item.date).toLocaleDateString('ru')}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          item.type === 'income' 
                            ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200/50' 
                            : 'bg-red-100/80 text-red-800 border border-red-200/50'
                        }`}>
                          {item.type === 'income' ? 'Доход' : 'Расход'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">{item.category}</span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {item.description}
                      </td>
                      <td className={`py-4 px-4 text-right font-medium ${
                        item.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {item.type === 'income' ? '+' : '-'}₽{(item.amount / 1000).toFixed(0)}К
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-100/50 rounded-full flex items-center justify-center mb-3">
                          <DollarSign className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm">Операции не найдены. Добавьте первую операцию, нажав "Добавить операцию".</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetViewWithAPI;
