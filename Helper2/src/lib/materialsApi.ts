import { supabase } from './supabase';

// Типы для материалов и склада
export interface WarehouseItem {
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
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface WarehouseItemInput {
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
  status?: 'in-stock' | 'low-stock' | 'out-of-stock' | 'reserved';
  condition?: 'new' | 'good' | 'fair' | 'needs-repair';
  notes?: string;
}

export interface WarehouseItemUpdate {
  name?: string;
  category?: 'materials' | 'tools' | 'equipment' | 'consumables';
  subcategory?: string;
  quantity?: number;
  unit?: string;
  volume?: number;
  volume_unit?: string;
  min_quantity?: number;
  max_quantity?: number;
  cost_per_unit?: number;
  supplier?: string;
  location?: string;
  status?: 'in-stock' | 'low-stock' | 'out-of-stock' | 'reserved';
  condition?: 'new' | 'good' | 'fair' | 'needs-repair';
  notes?: string;
}

export interface WarehouseStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categoryBreakdown: {
    [category: string]: {
      count: number;
      totalValue: number;
      lowStock: number;
    };
  };
}

// API функции для работы с материалами/складом

/**
 * Получить все позиции склада
 */
export const getAllWarehouseItems = async (): Promise<WarehouseItem[]> => {
  try {
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Ошибка получения позиций склада:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getAllWarehouseItems:', error);
    return [];
  }
};

/**
 * Получить позиции склада по категории
 */
export const getWarehouseItemsByCategory = async (category: string): Promise<WarehouseItem[]> => {
  try {
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) {
      console.error('Ошибка получения позиций склада по категории:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getWarehouseItemsByCategory:', error);
    return [];
  }
};

/**
 * Получить позиции склада по статусу
 */
export const getWarehouseItemsByStatus = async (status: string): Promise<WarehouseItem[]> => {
  try {
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('*')
      .eq('status', status)
      .order('name', { ascending: true });

    if (error) {
      console.error('Ошибка получения позиций склада по статусу:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getWarehouseItemsByStatus:', error);
    return [];
  }
};

/**
 * Поиск позиций склада
 */
export const searchWarehouseItems = async (searchTerm: string): Promise<WarehouseItem[]> => {
  try {
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,subcategory.ilike.%${searchTerm}%,supplier.ilike.%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Ошибка поиска позиций склада:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в searchWarehouseItems:', error);
    return [];
  }
};

/**
 * Создать новую позицию склада
 */
export const createWarehouseItem = async (item: WarehouseItemInput): Promise<WarehouseItem | null> => {
  try {
    // Валидация обязательных полей
    if (!item.name || !item.name.trim()) {
      throw new Error('Название позиции обязательно');
    }
    if (!item.subcategory || !item.subcategory.trim()) {
      throw new Error('Подкатегория обязательна');
    }
    if (!item.unit || !item.unit.trim()) {
      throw new Error('Единица измерения обязательна');
    }
    if (!item.supplier || !item.supplier.trim()) {
      throw new Error('Поставщик обязателен');
    }
    if (!item.location || !item.location.trim()) {
      throw new Error('Местоположение обязательно');
    }

    // Подготовка данных для вставки
    const insertData: any = {
      name: item.name.trim(),
      category: item.category,
      subcategory: item.subcategory.trim(),
      quantity: item.quantity || 0,
      unit: item.unit.trim(),
      min_quantity: item.min_quantity || 0,
      max_quantity: item.max_quantity || 0,
      cost_per_unit: item.cost_per_unit || 0,
      supplier: item.supplier.trim(),
      location: item.location.trim(),
      status: item.status || 'in-stock',
      condition: item.condition || 'new',
      last_updated: new Date().toISOString().split('T')[0]
    };

    // Добавляем опциональные поля, если они есть
    if (item.volume !== undefined && item.volume !== null) {
      insertData.volume = item.volume;
    }
    if (item.volume_unit) {
      insertData.volume_unit = item.volume_unit;
    }
    if (item.notes) {
      insertData.notes = item.notes;
    }

    console.log('📤 Отправка данных в Supabase:', insertData);

    const { data, error } = await supabase
      .from('warehouse_items')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка создания позиции склада:', error);
      console.error('❌ Детали ошибки:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('✅ Позиция создана успешно:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Ошибка в createWarehouseItem:', error);
    // Пробрасываем ошибку дальше, чтобы компонент мог её обработать
    throw error;
  }
};

/**
 * Обновить позицию склада
 */
export const updateWarehouseItem = async (id: string, updates: WarehouseItemUpdate): Promise<WarehouseItem | null> => {
  try {
    const { data, error } = await supabase
      .from('warehouse_items')
      .update({
        ...updates,
        last_updated: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления позиции склада:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в updateWarehouseItem:', error);
    return null;
  }
};

/**
 * Обновить количество позиции склада
 */
export const updateWarehouseItemQuantity = async (
  id: string, 
  operation: 'add' | 'subtract' | 'set', 
  amount: number,
  notes?: string
): Promise<WarehouseItem | null> => {
  try {
    // Получаем текущую позицию
    const { data: currentItem, error: fetchError } = await supabase
      .from('warehouse_items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentItem) {
      console.error('Ошибка получения позиции склада:', fetchError);
      throw fetchError;
    }

    let newQuantity = currentItem.quantity;
    
    switch (operation) {
      case 'add':
        newQuantity += amount;
        break;
      case 'subtract':
        newQuantity = Math.max(0, newQuantity - amount);
        break;
      case 'set':
        newQuantity = amount;
        break;
    }

    // Определяем новый статус на основе количества
    let newStatus = currentItem.status;
    if (newQuantity === 0) {
      newStatus = 'out-of-stock';
    } else if (newQuantity <= currentItem.min_quantity) {
      newStatus = 'low-stock';
    } else {
      newStatus = 'in-stock';
    }

    // Обновляем позицию
    const { data, error } = await supabase
      .from('warehouse_items')
      .update({
        quantity: newQuantity,
        status: newStatus,
        last_updated: new Date().toISOString().split('T')[0],
        notes: notes ? `${currentItem.notes || ''}\n${new Date().toLocaleString()}: ${operation} ${amount} (${notes})`.trim() : currentItem.notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления количества позиции склада:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Ошибка в updateWarehouseItemQuantity:', error);
    return null;
  }
};

/**
 * Удалить позицию склада
 */
export const deleteWarehouseItem = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('warehouse_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Ошибка удаления позиции склада:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Ошибка в deleteWarehouseItem:', error);
    return false;
  }
};

/**
 * Получить статистику склада
 */
export const getWarehouseStats = async (): Promise<WarehouseStats> => {
  try {
    const items = await getAllWarehouseItems();
    
    let totalItems = items.length;
    let totalValue = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    const categoryBreakdown: { [category: string]: { count: number; totalValue: number; lowStock: number } } = {};

    items.forEach(item => {
      const itemValue = item.quantity * item.cost_per_unit;
      totalValue += itemValue;

      if (item.status === 'low-stock') {
        lowStockItems++;
      } else if (item.status === 'out-of-stock') {
        outOfStockItems++;
      }

      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { count: 0, totalValue: 0, lowStock: 0 };
      }

      categoryBreakdown[item.category].count++;
      categoryBreakdown[item.category].totalValue += itemValue;
      
      if (item.status === 'low-stock' || item.status === 'out-of-stock') {
        categoryBreakdown[item.category].lowStock++;
      }
    });

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      categoryBreakdown
    };
  } catch (error) {
    console.error('Ошибка в getWarehouseStats:', error);
    return {
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      categoryBreakdown: {}
    };
  }
};

/**
 * Получить позиции с низким запасом
 */
export const getLowStockItems = async (): Promise<WarehouseItem[]> => {
  try {
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('*')
      .in('status', ['low-stock', 'out-of-stock'])
      .order('quantity', { ascending: true });

    if (error) {
      console.error('Ошибка получения позиций с низким запасом:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Ошибка в getLowStockItems:', error);
    return [];
  }
};

/**
 * Экспорт данных склада в CSV
 */
export const exportWarehouseToCSV = async (): Promise<string> => {
  try {
    const items = await getAllWarehouseItems();

    const headers = [
      'Название',
      'Категория',
      'Подкатегория',
      'Количество',
      'Единица',
      'Объем',
      'Мин. количество',
      'Макс. количество',
      'Цена за единицу',
      'Поставщик',
      'Местоположение',
      'Статус',
      'Состояние',
      'Последнее обновление',
      'Заметки'
    ];

    const csvRows = [headers.join(',')];

    items.forEach(item => {
      const row = [
        `"${item.name}"`,
        item.category,
        `"${item.subcategory}"`,
        item.quantity,
        item.unit,
        item.volume || '',
        item.min_quantity,
        item.max_quantity,
        item.cost_per_unit,
        `"${item.supplier}"`,
        `"${item.location}"`,
        item.status,
        item.condition,
        item.last_updated,
        `"${item.notes || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  } catch (error) {
    console.error('Ошибка экспорта склада в CSV:', error);
    return '';
  }
};
