/**
 * API функции для работы с Яндекс Диском
 * Только чтение и скачивание файлов
 */

const YANDEX_DISK_API_URL = 'http://localhost:8000/api/yandex-disk';

export interface YandexDiskFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  size_formatted: string;
  modified: string;
  modified_formatted: string;
  created: string;
  created_formatted: string;
  mime_type: string;
  preview?: string;
  public_url?: string;
  public_key?: string;  // Публичный ключ для скачивания из публичной папки
}

export interface YandexDiskFilesResponse {
  files: YandexDiskFile[];
  total: number;
  folder_path: string;
  is_public?: boolean;  // Флаг публичной папки
  public_key?: string;  // Публичный ключ папки
}

/**
 * Получить список файлов из папки на Яндекс Диске
 * С автоматическими повторными попытками при временных ошибках
 */
export const getYandexDiskFiles = async (folderPath?: string, retries: number = 2): Promise<YandexDiskFilesResponse> => {
  const url = folderPath 
    ? `${YANDEX_DISK_API_URL}/files?folder_path=${encodeURIComponent(folderPath)}`
    : `${YANDEX_DISK_API_URL}/files`;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Добавляем timeout для запроса (увеличено до 60 секунд для больших папок)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 секунд
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ detail: 'Ошибка получения файлов' }));
          throw new Error(error.detail || `Ошибка ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          if (attempt < retries) {
            // Ждем перед повторной попыткой
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          throw new Error('Превышено время ожидания ответа от сервера. Попробуйте обновить страницу или проверить подключение к интернету.');
        }
        // Для других ошибок тоже делаем повторную попытку, если это не последняя
        if (attempt < retries && (fetchError.message?.includes('network') || fetchError.message?.includes('Failed to fetch'))) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw fetchError;
      }
    } catch (error) {
      if (attempt === retries) {
        console.error('Ошибка получения файлов из Яндекс Диска:', error);
        throw error;
      }
    }
  }
  
  throw new Error('Не удалось загрузить файлы после нескольких попыток');
};

/**
 * Скачать файл с Яндекс Диска
 */
export const downloadFromYandexDisk = async (filePath: string, fileName?: string): Promise<void> => {
  try {
    const url = `${YANDEX_DISK_API_URL}/download?file_path=${encodeURIComponent(filePath)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Ошибка скачивания файла' }));
      throw new Error(error.detail || `Ошибка ${response.status}`);
    }
    
    // Получаем имя файла из заголовка или используем переданное
    const contentDisposition = response.headers.get('Content-Disposition');
    let downloadFileName = fileName;
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
      if (fileNameMatch) {
        downloadFileName = fileNameMatch[1];
      }
    }
    
    if (!downloadFileName) {
      downloadFileName = filePath.split('/').pop() || 'file';
    }
    
    // Создаем blob и скачиваем
    const blob = await response.blob();
    const url_blob = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url_blob;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url_blob);
  } catch (error) {
    console.error('Ошибка скачивания файла из Яндекс Диска:', error);
    throw error;
  }
};

/**
 * Получить прямую ссылку для скачивания файла
 */
export const getYandexDiskDownloadLink = async (filePath: string): Promise<string> => {
  try {
    const url = `${YANDEX_DISK_API_URL}/download-link?file_path=${encodeURIComponent(filePath)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Ошибка получения ссылки' }));
      throw new Error(error.detail || `Ошибка ${response.status}`);
    }
    
    const data = await response.json();
    return data.download_url;
  } catch (error) {
    console.error('Ошибка получения ссылки для скачивания:', error);
    throw error;
  }
};

/**
 * Обновить список файлов (алиас для getYandexDiskFiles)
 */
export const refreshYandexDiskFiles = async (folderPath?: string): Promise<YandexDiskFilesResponse> => {
  return getYandexDiskFiles(folderPath);
};

/**
 * Получить ссылку для просмотра файла (открытие в браузере вместо скачивания)
 */
export const getYandexDiskViewLink = async (filePath: string): Promise<string> => {
  try {
    const url = `${YANDEX_DISK_API_URL}/view-link?file_path=${encodeURIComponent(filePath)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Ошибка получения ссылки для просмотра' }));
      throw new Error(error.detail || `Ошибка ${response.status}`);
    }
    
    const data = await response.json();
    // Возвращаем полный URL от backend
    return data.view_url;
  } catch (error) {
    console.error('Ошибка получения ссылки для просмотра:', error);
    throw error;
  }
};



