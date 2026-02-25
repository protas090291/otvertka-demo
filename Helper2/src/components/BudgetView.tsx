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
  projectId: string;
}

const BudgetView: React.FC<BudgetViewProps> = ({ userRole }) => {
  const [selectedProject, setSelectedProject] = useState('1');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  const [newItem, setNewItem] = useState({
    category: '',
    description: '',
    amount: 0,
    type: 'expense' as 'expense' | 'income'
  });

  const [editingBudget, setEditingBudget] = useState({
    totalBudget: 0,
    categories: [] as Array<{name: string, budgeted: number}>
  });

  // Бюджетные операции подрядчика
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Загружаем данные из API при монтировании компонента
  useEffect(() => {
    loadBudgetItems();
  }, []);

  const loadBudgetItems = async () => {
    try {
      setLoading(true);
      const items = await getAllBudgetItems();
      setBudgetItems(items);
    } catch (error) {
      console.error('Ошибка загрузки бюджетных операций:', error);
      setNotificationMessage('Ошибка загрузки данных');
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const budgetData = {
    '1': {
      name: 'ЖК "Северная звезда"',
      totalBudget: 12500000,
      spent: 9375000,
      categories: [
        { name: 'Материалы', budgeted: 5000000, spent: 4200000, variance: -800000 },
        { name: 'Рабочая сила', budgeted: 3500000, spent: 2800000, variance: -700000 },
        { name: 'Оборудование', budgeted: 2000000, spent: 1500000, variance: -500000 },
        { name: 'Транспорт', budgeted: 800000, spent: 650000, variance: -150000 },
        { name: 'Прочие расходы', budgeted: 1200000, spent: 225000, variance: -975000 }
      ]
    }
  };

  const currentProject = budgetData[selectedProject as keyof typeof budgetData];
  const budgetUsage = (currentProject.spent / currentProject.totalBudget) * 100;
  const remaining = currentProject.totalBudget - currentProject.spent;

  // Функции для управления бюджетом подрядчика
  const handleAddItem = () => {
    if (!newItem.category || !newItem.description || newItem.amount <= 0) return;

    const newBudgetItem: BudgetItem = {
      id: Date.now().toString(),
      category: newItem.category,
      description: newItem.description,
      amount: newItem.amount,
      type: newItem.type,
      date: new Date().toISOString().split('T')[0],
      projectId: selectedProject
    };

    setBudgetItems(prev => [newBudgetItem, ...prev]);
    
    // Сброс формы
    setNewItem({
      category: '',
      description: '',
      amount: 0,
      type: 'expense'
    });
    
    setIsAddingItem(false);
    setNotificationMessage('Операция добавлена!');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleCancelAddItem = () => {
    setNewItem({
      category: '',
      description: '',
      amount: 0,
      type: 'expense'
    });
    setIsAddingItem(false);
  };

  const handleStartEditBudget = () => {
    setEditingBudget({
      totalBudget: currentProject.totalBudget,
      categories: currentProject.categories.map(cat => ({ name: cat.name, budgeted: cat.budgeted }))
    });
    setIsEditingBudget(true);
  };

  const handleSaveBudget = () => {
    // В реальном приложении здесь была бы логика сохранения в базу данных
    setIsEditingBudget(false);
    setNotificationMessage('Бюджет обновлен!');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleCancelEditBudget = () => {
    setIsEditingBudget(false);
  };

  // Расчеты для подрядчика
  const projectItems = budgetItems.filter(item => item.projectId === selectedProject);
  const totalIncome = projectItems.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = projectItems.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Финансовый контроль</h1>
          <p className="text-slate-600 mt-1">Управление доходами и расходами</p>
        </div>

      {/* Форма добавления операции для подрядчика */}
      {isAddingItem && userRole === 'contractor' && (
        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 p-6 max-w-7xl mx-auto hover:shadow-xl transition-all duration-300">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Добавить операцию</h2>
            <p className="text-base text-slate-600">Заполните информацию о финансовой операции</p>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Основная форма */}
            <div className="xl:col-span-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Тип операции</label>
                  <div className="relative">
                    <select 
                      value={newItem.type}
                      onChange={(e) => setNewItem({...newItem, type: e.target.value as 'expense' | 'income'})}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white text-sm"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Категория</label>
                  <div className="relative">
                    <select 
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white text-sm"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Сумма (₽)</label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Описание</label>
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
                  disabled={!newItem.category || !newItem.description || newItem.amount <= 0}
                  onClick={handleAddItem}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 text-sm ${
                    newItem.category && newItem.description && newItem.amount > 0
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
                <h3 className="text-base font-semibold text-gray-900 mb-1">Предварительный расчет</h3>
                <p className="text-xs text-slate-600">Влияние на баланс</p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-blue-200/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-600">Текущий доход</span>
                    <span className="text-xs font-semibold text-green-600">₽{(totalIncome / 1000000).toFixed(1)}М</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min((totalIncome / (totalIncome + totalExpenses)) * 100, 100)}%` }}></div>
                  </div>
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-blue-200/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-600">Текущие расходы</span>
                    <span className="text-xs font-semibold text-red-600">₽{(totalExpenses / 1000000).toFixed(1)}М</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min((totalExpenses / (totalIncome + totalExpenses)) * 100, 100)}%` }}></div>
                  </div>
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-blue-200/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-600">Текущий баланс</span>
                    <span className={`text-xs font-semibold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₽{(Math.abs(netBalance) / 1000000).toFixed(1)}М
                      {netBalance < 0 && ' (убыток)'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${netBalance >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(netBalance) / (totalIncome + totalExpenses) * 100, 100)}%` }}></div>
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
              {!isAddingItem && !isEditingBudget && (
                <>
                  <button 
                    onClick={() => setIsAddingItem(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить операцию</span>
                  </button>
                  <button 
                    onClick={handleStartEditBudget}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Редактировать бюджет</span>
                  </button>
                </>
              )}
              {(isAddingItem || isEditingBudget) && (
                <button 
                  onClick={isAddingItem ? handleCancelAddItem : handleCancelEditBudget}
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

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">
                {userRole === 'contractor' ? 'Общий доход' : 'Общий бюджет'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₽{userRole === 'contractor' ? (totalIncome / 1000000).toFixed(1) : (currentProject.totalBudget / 1000000).toFixed(1)}М
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">
                {userRole === 'contractor' ? 'Общие расходы' : 'Потрачено'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₽{userRole === 'contractor' ? (totalExpenses / 1000000).toFixed(1) : (currentProject.spent / 1000000).toFixed(1)}М
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${userRole === 'contractor' ? (netBalance >= 0 ? 'bg-green-100' : 'bg-red-100') : 'bg-green-100'}`}>
              <TrendingDown className={`w-6 h-6 ${userRole === 'contractor' ? (netBalance >= 0 ? 'text-green-600' : 'text-red-600') : 'text-green-600'}`} />
            </div>
            <div>
              <p className="text-sm text-slate-600">
                {userRole === 'contractor' ? 'Чистый баланс' : 'Остаток'}
              </p>
              <p className={`text-2xl font-bold ${userRole === 'contractor' ? (netBalance >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-900'}`}>
                ₽{userRole === 'contractor' ? (Math.abs(netBalance) / 1000000).toFixed(1) : (remaining / 1000000).toFixed(1)}М
                {userRole === 'contractor' && netBalance < 0 && ' (убыток)'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">
                {userRole === 'contractor' ? 'Рентабельность' : 'Использование'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {userRole === 'contractor' 
                  ? totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : '0.0'
                  : budgetUsage.toFixed(1)
                }%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Детализация по категориям</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Категория</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Запланировано</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Потрачено</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Отклонение</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Прогресс</th>
              </tr>
            </thead>
            <tbody>
              {currentProject.categories.map((category, index) => {
                const usagePercent = (category.spent / category.budgeted) * 100;
                const isOverBudget = category.spent > category.budgeted;
                
                return (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </td>
                    <td className="py-4 px-4 text-right text-gray-900">
                      ₽{(category.budgeted / 1000000).toFixed(2)}М
                    </td>
                    <td className="py-4 px-4 text-right text-gray-900">
                      ₽{(category.spent / 1000000).toFixed(2)}М
                    </td>
                    <td className={`py-4 px-4 text-right font-medium ${
                      category.variance < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₽{(Math.abs(category.variance) / 1000000).toFixed(2)}М
                      {category.variance < 0 ? ' экономия' : ' превышение'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              isOverBudget ? 'bg-red-500' : usagePercent > 80 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-slate-600">
                          {usagePercent.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица операций для подрядчика */}
      {userRole === 'contractor' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">История операций</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Дата</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Тип</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Категория</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Описание</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {projectItems.length > 0 ? (
                  projectItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {new Date(item.date).toLocaleDateString('ru')}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
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
                        item.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.type === 'income' ? '+' : '-'}₽{(item.amount / 1000).toFixed(0)}К
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                      Операции не найдены. Добавьте первую операцию, нажав "Добавить операцию".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget Forecast */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Прогноз расходов</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">₽2.8М</p>
            <p className="text-sm text-slate-600 mt-1">Ожидаемые расходы этот месяц</p>
          </div>
          
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-2xl font-bold text-green-600">₽3.1М</p>
            <p className="text-sm text-slate-600 mt-1">Остаток до завершения</p>
          </div>
          
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">₽125К</p>
            <p className="text-sm text-slate-600 mt-1">Экономия от плана</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetView;