import { supabase } from './supabase';

// Получаем URL и ключи из переменных окружения (те же, что используются в supabase.ts)
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim() || 'https://yytqmdanfcwfqfqruvta.supabase.co';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dHFtZGFuZmN3ZnFmcXJ1dnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MzMzNDEsImV4cCI6MjA3MzEwOTM0MX0.vCgOY0MVZ6oGlZuK8SRhD8YhNyEsjP65ebJuWjy8HPw';

/** Смета по проекту (без денег: только работы/материалы, объёмы, назначения). */
export interface Estimate {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/** Позиция сметы: наименование, ед. изм., количество, квартира, раздел работ (опц.), ответственный, объём в работе. Без цен. */
export interface EstimateItem {
  id: string;
  estimate_id: string;
  name: string;
  unit: string;
  quantity: number;
  apartment_number: string | null;
  section?: string | null;
  assigned_to: string | null;
  quantity_assigned: number;
  status: 'not_started' | 'in_progress' | 'completed';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EstimateItemInput {
  estimate_id: string;
  name: string;
  unit: string;
  quantity: number;
  apartment_number?: string | null;
  section?: string | null;
  sort_order?: number;
}

export interface EstimateItemUpdate {
  name?: string;
  unit?: string;
  quantity?: number;
  apartment_number?: string | null;
  section?: string | null;
  assigned_to?: string | null;
  quantity_assigned?: number;
  status?: EstimateItem['status'];
  sort_order?: number;
}

/** Результат: смета или текст ошибки. */
export type GetEstimateResult = { estimate: Estimate; error?: undefined } | { estimate: null; error: string };

/** Получить или создать смету по проекту (одна смета на проект). */
export const getOrCreateEstimateForProject = async (projectId: string, projectName: string): Promise<GetEstimateResult> => {
  try {
    const { data: existing, error: selectError } = await supabase
      .from('estimates')
      .select('*')
      .eq('project_id', projectId)
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error('Ошибка загрузки сметы:', selectError);
      const msg = selectError.code === '42P01' || selectError.message?.includes('relation')
        ? 'Таблицы сметы не созданы. Выполните в Supabase (SQL Editor) скрипт supabase_estimate_tables.sql из папки Helper2.'
        : selectError.message || 'Ошибка Supabase';
      return { estimate: null, error: msg };
    }
    if (existing) return { estimate: existing };

    const { data: created, error } = await supabase
      .from('estimates')
      .insert([{ project_id: projectId, name: `Смета: ${projectName}` }])
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания сметы:', error);
      const msg = error.code === '42P01' || error.message?.includes('relation')
        ? 'Таблицы сметы не созданы. Выполните в Supabase (SQL Editor) скрипт supabase_estimate_tables.sql из папки Helper2.'
        : error.message || 'Ошибка создания сметы';
      return { estimate: null, error: msg };
    }
    return { estimate: created };
  } catch (e: any) {
    console.error('getOrCreateEstimateForProject:', e);
    const msg = e?.message || (e?.code === '42P01' ? 'Таблицы сметы не созданы. Выполните скрипт supabase_estimate_tables.sql в Supabase.' : 'Не удалось загрузить или создать смету.');
    return { estimate: null, error: msg };
  }
};

/** Размер страницы при загрузке (некоторые проекты Supabase отдают макс. 100 за запрос — берём 50 и дозапрашиваем). */
const ESTIMATE_ITEMS_PAGE_SIZE = 50;

/** Список позиций сметы (постраничная загрузка — все квартиры и позиции, без ограничения 100). */
export const getEstimateItems = async (estimateId: string): Promise<EstimateItem[]> => {
  try {
    const all: EstimateItem[] = [];
    let offset = 0;
    let hasMore = true;
    let pageNum = 0;

    while (hasMore) {
      const { data, error } = await supabase
        .from('estimate_items')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .range(offset, offset + ESTIMATE_ITEMS_PAGE_SIZE - 1);

      if (error) throw error;
      const page = data || [];
      all.push(...page);
      pageNum++;
      console.log(`📄 getEstimateItems: страница ${pageNum}, загружено ${page.length} строк (всего: ${all.length})`);
      hasMore = page.length === ESTIMATE_ITEMS_PAGE_SIZE;
      offset += ESTIMATE_ITEMS_PAGE_SIZE;
    }

    console.log(`✅ getEstimateItems: всего загружено ${all.length} позиций для сметы ${estimateId}`);
    return all;
  } catch (e) {
    console.error('getEstimateItems:', e);
    return [];
  }
};

/** Добавить позицию сметы. */
export const createEstimateItem = async (item: EstimateItemInput): Promise<EstimateItem | null> => {
  try {
    const { data, error } = await supabase
      .from('estimate_items')
      .insert([{
        estimate_id: item.estimate_id,
        name: item.name,
        unit: item.unit,
        quantity: Number(item.quantity) || 0,
        apartment_number: item.apartment_number ?? null,
        section: item.section ?? null,
        sort_order: item.sort_order ?? 0,
        quantity_assigned: 0,
        status: 'not_started'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('createEstimateItem:', e);
    return null;
  }
};

/** Обновить позицию (в т.ч. назначение и объём в работе). */
export const updateEstimateItem = async (id: string, updates: EstimateItemUpdate): Promise<EstimateItem | null> => {
  try {
    const { data, error } = await supabase
      .from('estimate_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('updateEstimateItem:', e);
    return null;
  }
};

/** Удалить позицию. */
export const deleteEstimateItem = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('estimate_items').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('deleteEstimateItem:', e);
    return false;
  }
};

/** Удалить все позиции текущей сметы. */
export const deleteAllEstimateItems = async (estimateId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('estimate_items').delete().eq('estimate_id', estimateId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('deleteAllEstimateItems:', e);
    return false;
  }
};

/** Удалить смету из системы: все позиции и запись сметы. */
export const deleteEstimate = async (estimateId: string): Promise<boolean> => {
  try {
    const { error: errItems } = await supabase.from('estimate_items').delete().eq('estimate_id', estimateId);
    if (errItems) throw errItems;
    const { error: errEst } = await supabase.from('estimates').delete().eq('id', estimateId);
    if (errEst) throw errEst;
    return true;
  } catch (e) {
    console.error('deleteEstimate:', e);
    return false;
  }
};

const BATCH_SIZE = 100;

/** Массовое добавление позиций: пачки по квартирам (от одной квартиры до следующей), внутри квартиры — по BATCH_SIZE. */
export const createEstimateItemsBatch = async (
  estimateId: string,
  items: { name: string; unit: string; quantity: number; apartment_number?: string | null; section?: string | null; subsection?: string | null; category?: string | null }[],
  _onProgress?: (current: number, total: number) => void
): Promise<number> => {
  const toInsert = items
    .map((item, idx) => ({
      estimate_id: estimateId,
      name: (item.name || '').trim(),
      unit: (item.unit || '').trim() || 'шт.',
      quantity: Number(item.quantity) || 0,
      apartment_number: item.apartment_number ?? null,
      section: item.section ?? null,
      subsection: item.subsection ?? null,
      category: item.category ?? null,
      sort_order: idx,
      quantity_assigned: 0,
      status: 'not_started'
    }))
    .filter((row) => row.name.length > 0);

  let added = 0;
  let chunk: typeof toInsert = [];
  let prevApartment: string | null = null;

  const flush = async (aptLabel?: string) => {
    if (chunk.length === 0) return;
    const aptInfo = aptLabel ? ` (квартира: ${aptLabel})` : '';
    console.log(`💾 createEstimateItemsBatch: вставляю ${chunk.length} строк${aptInfo}`);
    const { data, error } = await supabase
      .from('estimate_items')
      .insert(chunk)
      .select('id');
    if (error) {
      console.error('createEstimateItemsBatch chunk error:', error);
      throw error;
    }
    const inserted = data?.length ?? 0;
    added += inserted;
    console.log(`✅ createEstimateItemsBatch: вставлено ${inserted} строк (всего: ${added})`);
    chunk = [];
  };

  console.log(`📥 createEstimateItemsBatch: начинаю импорт ${toInsert.length} позиций для сметы ${estimateId}`);
  for (const row of toInsert) {
    const apt = row.apartment_number ?? '__none__';
    if (chunk.length >= BATCH_SIZE) await flush(prevApartment || undefined);
    if (chunk.length > 0 && apt !== prevApartment) await flush(prevApartment || undefined);
    chunk.push(row);
    prevApartment = apt;
  }
  await flush(prevApartment || undefined);

  console.log(`✅ createEstimateItemsBatch: импорт завершён, всего вставлено ${added} позиций`);
  return added;
}

/**
 * Импорт сметы из файла через Edge Function (рекомендуемый способ)
 */
export const importEstimateFromFile = async (
  estimateId: string,
  file: File,
  onProgress?: (message: string) => void
): Promise<{ added: number; total: number; importedFromSheet?: string | null; error?: string }> => {
  try {
    onProgress?.('Загрузка файла на сервер...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('estimate_id', estimateId);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/import-estimate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return {
      added: result.added || 0,
      total: result.total || 0,
      importedFromSheet: result.importedFromSheet || null
    };
  } catch (error: any) {
    console.error('Ошибка импорта через Edge Function:', error);
    return {
      added: 0,
      total: 0,
      error: error.message || 'Ошибка импорта сметы'
    };
  }
}
