/**
 * Система валидации данных
 * Проверяет, что данные правильные перед сохранением
 */

/**
 * Валидация прогресса (0-100)
 */
export const validateProgress = (progress: number, fieldName: string = 'Прогресс'): void => {
  if (typeof progress !== 'number') {
    throw new Error(`${fieldName} должен быть числом`);
  }
  
  if (isNaN(progress)) {
    throw new Error(`${fieldName} не может быть NaN`);
  }
  
  if (!Number.isInteger(progress)) {
    throw new Error(`${fieldName} должен быть целым числом`);
  }
  
  if (progress < 0 || progress > 100) {
    throw new Error(`${fieldName} должен быть от 0 до 100, получено: ${progress}`);
  }
};

/**
 * Валидация даты
 * Проверяет, что дата в формате YYYY-MM-DD и является валидной
 */
export const validateDate = (dateString: string, fieldName: string): void => {
  if (!dateString || dateString.trim() === '') {
    return; // Пустая дата разрешена для опциональных полей
  }
  
  const trimmed = dateString.trim();
  
  // Проверяем формат YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(trimmed)) {
    throw new Error(`${fieldName} должна быть в формате YYYY-MM-DD (например, 2025-11-09)`);
  }
  
  // Проверяем, что дата валидна
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName} содержит недопустимую дату: ${trimmed}`);
  }
  
  // Проверяем, что дата не в будущем (для некоторых полей)
  // Это можно сделать опционально
};

/**
 * Валидация обязательного поля
 */
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === null || value === undefined) {
    throw new Error(`Поле "${fieldName}" обязательно для заполнения`);
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    throw new Error(`Поле "${fieldName}" не может быть пустым`);
  }
  
  if (Array.isArray(value) && value.length === 0) {
    throw new Error(`Поле "${fieldName}" не может быть пустым массивом`);
  }
};

/**
 * Валидация ID квартиры
 * Проверяет формат: T + число (первый корпус) или У + число (второй корпус)
 * 
 * Корпуса:
 * - "T" - первый корпус (например, T101, T202, T202-И)
 * - "У" - второй корпус (например, У501, У704)
 * 
 * Примеры валидных форматов:
 * - T101, T202, T202-И (первый корпус)
 * - У501, У704 (второй корпус)
 */
export const validateApartmentId = (apartmentId: string): void => {
  if (!apartmentId || apartmentId.trim() === '') {
    throw new Error('ID квартиры обязателен');
  }
  
  const trimmed = apartmentId.trim();
  
  // Проверяем формат:
  // - T + число + (опционально -И) - первый корпус
  // - У + число - второй корпус
  // - Y + число - альтернативный формат для второго корпуса
  const validFormat = /^(T|Т|У|Y|у|y)?\d+(-И|-и)?$/i.test(trimmed);
  if (!validFormat) {
    throw new Error(`Неверный формат ID квартиры: "${apartmentId}". Ожидается формат: T101, T202, T202-И (первый корпус) или У501, У704 (второй корпус)`);
  }
};

/**
 * Валидация ID проекта (UUID или строка)
 */
export const validateProjectId = (projectId: string): void => {
  if (!projectId || projectId.trim() === '') {
    throw new Error('ID проекта обязателен');
  }
  
  const trimmed = projectId.trim();
  
  // UUID формат (например: 550e8400-e29b-41d4-a716-446655440004)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  // Строковый формат (например: zhk-vishnevyy-sad)
  const stringRegex = /^[a-z0-9-]+$/i;
  
  if (!uuidRegex.test(trimmed) && !stringRegex.test(trimmed)) {
    throw new Error(`Неверный формат ID проекта: "${projectId}". Ожидается UUID или строковый идентификатор.`);
  }
};

/**
 * Валидация строки (длина, формат)
 */
export const validateString = (
  value: string, 
  fieldName: string, 
  minLength: number = 1, 
  maxLength: number = 1000
): void => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} должен быть строкой`);
  }
  
  const trimmed = value.trim();
  
  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} должен содержать минимум ${minLength} символов`);
  }
  
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} не может содержать более ${maxLength} символов`);
  }
};

/**
 * Валидация числа (диапазон)
 */
export const validateNumber = (
  value: number, 
  fieldName: string, 
  min: number = 0, 
  max: number = Number.MAX_SAFE_INTEGER
): void => {
  if (typeof value !== 'number') {
    throw new Error(`${fieldName} должен быть числом`);
  }
  
  if (isNaN(value)) {
    throw new Error(`${fieldName} не может быть NaN`);
  }
  
  if (value < min || value > max) {
    throw new Error(`${fieldName} должен быть от ${min} до ${max}, получено: ${value}`);
  }
};

/**
 * Валидация email (базовая)
 */
export const validateEmail = (email: string, fieldName: string = 'Email'): void => {
  if (!email || email.trim() === '') {
    return; // Email может быть опциональным
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error(`${fieldName} имеет неверный формат`);
  }
};

/**
 * Валидация URL
 */
export const validateUrl = (url: string, fieldName: string = 'URL'): void => {
  if (!url || url.trim() === '') {
    return; // URL может быть опциональным
  }
  
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`${fieldName} имеет неверный формат URL`);
  }
};

