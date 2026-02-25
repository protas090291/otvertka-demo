/**
 * Единая система нормализации данных
 * Преобразует данные из разных форматов в единый формат
 */

/**
 * Нормализация ID квартиры
 * Преобразует разные форматы в единый формат с сохранением префикса корпуса
 * 
 * Корпуса:
 * - "T" - первый корпус (например, T101, T202)
 * - "У" - второй корпус (например, У501, У704)
 * 
 * Примеры:
 * - "T202-И" → "T202" (убираем суффикс -И)
 * - "T202" → "T202" (оставляем как есть)
 * - "202" → "T202" (добавляем префикс T по умолчанию)
 * - "У501" → "У501" (сохраняем префикс У для второго корпуса)
 * - "У704" → "У704" (сохраняем префикс У для второго корпуса)
 */
export const normalizeApartmentId = (apartmentId: string): string => {
  if (!apartmentId || apartmentId.trim() === '') {
    return apartmentId;
  }
  
  const trimmed = apartmentId.trim();
  
  // Определяем префикс корпуса (T или У)
  const hasTPrefix = trimmed.startsWith('T') || trimmed.startsWith('т');
  const hasUPrefix = trimmed.startsWith('У') || trimmed.startsWith('у') || trimmed.startsWith('Y') || trimmed.startsWith('y');
  
  // Извлекаем номер из строки (убираем префиксы и суффиксы -И)
  const match = trimmed.match(/(\d+)/);
  if (match) {
    const number = match[1];
    
    // Если есть префикс У, сохраняем его (второй корпус)
    if (hasUPrefix) {
      return `У${number}`;
    }
    
    // Если есть префикс T или нет префикса, используем T (первый корпус)
    // Убираем суффикс -И если есть
    return `T${number}`;
  }
  
  // Если не нашли число, возвращаем как есть
  return trimmed;
};

/**
 * Нормализация статуса задачи
 * Преобразует статус из формата формы в формат базы данных
 * 
 * Форма использует: 'pending', 'in-progress', 'completed', 'delayed'
 * База данных использует: 'pending', 'in_progress', 'completed', 'delayed'
 */
export const normalizeStatus = (status: string): 'pending' | 'in_progress' | 'completed' | 'delayed' | 'submitted_for_review' | 'returned_for_revision' => {
  if (!status) {
    return 'pending';
  }
  const normalized = status.toLowerCase().trim();
  if (normalized === 'in-progress' || normalized === 'in_progress') return 'in_progress';
  if (normalized === 'pending') return 'pending';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'delayed') return 'delayed';
  if (normalized === 'submitted_for_review' || normalized === 'submitted-for-review') return 'submitted_for_review';
  if (normalized === 'returned_for_revision' || normalized === 'returned-for-revision') return 'returned_for_revision';
  return 'pending';
};

/**
 * Обратное преобразование статуса (из БД в формат формы)
 */
export const denormalizeStatus = (status: string): 'pending' | 'in-progress' | 'completed' | 'delayed' | 'submitted_for_review' => {
  if (!status) return 'pending';
  const normalized = status.toLowerCase().trim();
  if (normalized === 'in_progress') return 'in-progress';
  if (normalized === 'pending') return 'pending';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'delayed') return 'delayed';
  if (normalized === 'submitted_for_review') return 'submitted_for_review';
  return 'pending';
};

/**
 * Нормализация ID проекта
 * Проверяет и нормализует ID проекта
 */
export const normalizeProjectId = (projectId: string): string => {
  if (!projectId || projectId.trim() === '') {
    throw new Error('ID проекта обязателен');
  }
  
  const trimmed = projectId.trim();
  
  // Если это число (старый формат), нужно найти UUID проекта
  if (/^\d+$/.test(trimmed)) {
    throw new Error('Необходимо использовать UUID проекта, а не номер. Пожалуйста, выберите проект из списка.');
  }
  
  return trimmed;
};

/**
 * Нормализация строки (удаление пробелов)
 */
export const normalizeString = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }
  return value.trim();
};

/**
 * Нормализация числа (проверка и ограничение диапазона)
 */
export const normalizeNumber = (value: number | null | undefined, min: number = 0, max: number = 100): number => {
  if (value === null || value === undefined || isNaN(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
};

