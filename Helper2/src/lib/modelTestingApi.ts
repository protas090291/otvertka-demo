/**
 * API клиент для тестирования модели обнаружения дефектов
 */

export interface DefectTestResult {
  success: boolean;
  filename?: string;
  result?: {
    has_defect: boolean;
    confidence: number;
    defect_probability: number;
    normal_probability: number;
    threshold: number;
  };
  defect_type?: {
    code: string;
    name: string;
    confidence: number;
  };
  recommendations?: string[];
  model_info?: {
    threshold_used: number;
    model_loaded: boolean;
  };
  error?: string;
}

export interface ModelInfo {
  success: boolean;
  model_loaded: boolean;
  capabilities: {
    defect_types: string[];
    accuracy: string;
    recommended_thresholds: {
      preliminary_check: number;
      normal_work: number;
      critical_check: number;
    };
  };
  usage: {
    upload_image: string;
    parameters: {
      file: string;
      threshold: string;
    };
  };
}

export interface SampleTestResult {
  success: boolean;
  total_tests?: number;
  correct_predictions?: number;
  accuracy?: number;
  results?: Array<{
    filename: string;
    expected: string;
    predicted: string;
    confidence: number;
    correct: boolean;
  }>;
  error?: string;
}

const API_BASE_URL = 'http://localhost:8008';

/**
 * Проверяет здоровье API
 */
export async function checkModelApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Ошибка проверки здоровья API модели:', error);
    return false;
  }
}

/**
 * Тестирует изображение на наличие дефектов
 */
export async function testImageForDefects(
  file: File,
  threshold: number = 0.3
): Promise<DefectTestResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('threshold', threshold.toString());

    const response = await fetch(`${API_BASE_URL}/test-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Ошибка при тестировании изображения'
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка тестирования изображения:', error);
    return {
      success: false,
      error: 'Ошибка сети при тестировании изображения'
    };
  }
}

/**
 * Получает информацию о модели
 */
export async function getModelInfo(): Promise<ModelInfo> {
  try {
    const response = await fetch(`${API_BASE_URL}/model-info`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка получения информации о модели:', error);
    return {
      success: false,
      model_loaded: false,
      capabilities: {
        defect_types: [],
        accuracy: 'Неизвестно',
        recommended_thresholds: {
          preliminary_check: 0.3,
          normal_work: 0.5,
          critical_check: 0.7
        }
      },
      usage: {
        upload_image: '',
        parameters: {
          file: '',
          threshold: ''
        }
      }
    };
  }
}

/**
 * Тестирует примеры изображений
 */
export async function testSampleImages(): Promise<SampleTestResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/test-sample`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка тестирования примеров:', error);
    return {
      success: false,
      error: 'Ошибка сети при тестировании примеров'
    };
  }
}

/**
 * Форматирует результат тестирования для отображения
 */
export function formatDefectResult(result: DefectTestResult): string {
  if (!result.success || !result.result) {
    return `❌ Ошибка: ${result.error || 'Неизвестная ошибка'}`;
  }

  const { result: testResult, defect_type, recommendations } = result;
  
  let message = `📊 Анализ изображения: ${result.filename}\n\n`;
  
  if (defect_type && defect_type.code !== 'normal') {
    message += `🚨 ОБНАРУЖЕН ДЕФЕКТ\n`;
    message += `🔍 Тип дефекта: ${defect_type.name}\n`;
    message += `📈 Уверенность: ${(defect_type.confidence * 100).toFixed(1)}%\n\n`;
  } else {
    message += `✅ НОРМА - дефект не обнаружен\n\n`;
  }
  
  message += `📊 Статистика модели:\n`;
  message += `• Вероятность дефекта: ${testResult.defect_probability.toFixed(1)}%\n`;
  message += `• Порог классификации: ${(testResult.threshold * 100).toFixed(0)}%\n\n`;

  if (recommendations && recommendations.length > 0) {
    message += `💡 Рекомендации:\n`;
    recommendations.forEach(rec => {
      message += `• ${rec}\n`;
    });
  }

  return message;
}

/**
 * Получает цвет для отображения результата
 */
export function getDefectResultColor(result: DefectTestResult): string {
  if (!result.success || !result.result) {
    return '#ff4444'; // Красный для ошибок
  }

  // Используем тип дефекта для определения цвета
  if (result.defect_type && result.defect_type.code !== 'normal') {
    const confidence = result.defect_type.confidence;
    
    if (confidence > 0.7) {
      return '#ff4444'; // Красный для высокого риска
    } else if (confidence > 0.5) {
      return '#ff8800'; // Оранжевый для среднего риска
    } else {
      return '#ffaa00'; // Желтый для низкого риска
    }
  } else {
    return '#44ff44'; // Зеленый для нормы
  }
}
