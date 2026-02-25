import React, { useState, useRef } from 'react';
import { 
  testImageForDefects, 
  getModelInfo, 
  testSampleImages,
  formatDefectResult,
  getDefectResultColor,
  checkModelApiHealth,
  type DefectTestResult,
  type ModelInfo,
  type SampleTestResult
} from '../lib/modelTestingApi';

interface DefectTesterProps {
  onResult?: (result: DefectTestResult) => void;
}

const DefectTester: React.FC<DefectTesterProps> = ({ onResult }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DefectTestResult | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [sampleResults, setSampleResults] = useState<SampleTestResult | null>(null);
  const [threshold, setThreshold] = useState(0.3);
  const [apiHealth, setApiHealth] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Проверка здоровья API
  const checkHealth = async () => {
    const health = await checkModelApiHealth();
    setApiHealth(health);
    return health;
  };

  // Загрузка информации о модели
  const loadModelInfo = async () => {
    const info = await getModelInfo();
    setModelInfo(info);
  };

  // Тестирование изображения
  const handleImageTest = async (file: File) => {
    setIsLoading(true);
    try {
      const testResult = await testImageForDefects(file, threshold);
      setResult(testResult);
      if (onResult) {
        onResult(testResult);
      }
    } catch (error) {
      console.error('Ошибка тестирования:', error);
      setResult({
        success: false,
        error: 'Ошибка при тестировании изображения'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка выбора файла
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageTest(file);
    }
  };

  // Тестирование примеров
  const handleSampleTest = async () => {
    setIsLoading(true);
    try {
      const sampleResult = await testSampleImages();
      setSampleResults(sampleResult);
    } catch (error) {
      console.error('Ошибка тестирования примеров:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка перетаскивания файлов
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageTest(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="defect-tester p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🔍 Тестер модели обнаружения дефектов
      </h2>

      {/* Проверка API */}
      <div className="mb-6">
        <button
          onClick={checkHealth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
        >
          Проверить API
        </button>
        <button
          onClick={loadModelInfo}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
        >
          Информация о модели
        </button>
        <button
          onClick={handleSampleTest}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {isLoading ? 'Тестируем...' : 'Тест примеров'}
        </button>
      </div>

      {/* Статус API */}
      {apiHealth !== null && (
        <div className={`mb-4 p-3 rounded ${apiHealth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {apiHealth ? '✅ API модели работает' : '❌ API модели недоступен'}
        </div>
      )}

      {/* Информация о модели */}
      {modelInfo && (
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">📊 Информация о модели:</h3>
          <p><strong>Точность:</strong> {modelInfo.capabilities.accuracy}</p>
          <p><strong>Типы дефектов:</strong> {modelInfo.capabilities.defect_types.join(', ')}</p>
          <div className="mt-2">
            <strong>Рекомендуемые пороги:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>Предварительная проверка: {(modelInfo.capabilities.recommended_thresholds.preliminary_check * 100).toFixed(0)}%</li>
              <li>Обычная работа: {(modelInfo.capabilities.recommended_thresholds.normal_work * 100).toFixed(0)}%</li>
              <li>Критическая проверка: {(modelInfo.capabilities.recommended_thresholds.critical_check * 100).toFixed(0)}%</li>
            </ul>
          </div>
        </div>
      )}

      {/* Настройка порога */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Порог классификации: {(threshold * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.1"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10%</span>
          <span>50%</span>
          <span>90%</span>
        </div>
      </div>

      {/* Область загрузки файлов */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="text-gray-500">
          <div className="text-4xl mb-4">📷</div>
          <p className="text-lg mb-2">Перетащите изображение сюда или нажмите для выбора</p>
          <p className="text-sm">Поддерживаются: JPG, PNG, GIF</p>
        </div>
      </div>

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Анализируем изображение...</p>
        </div>
      )}

      {/* Результат тестирования */}
      {result && (
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: getDefectResultColor(result) + '20' }}>
          <h3 className="font-bold mb-2">📊 Результат анализа:</h3>
          <div className="whitespace-pre-line text-sm">
            {formatDefectResult(result)}
          </div>
        </div>
      )}

      {/* Результаты тестирования примеров */}
      {sampleResults && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold mb-2">📈 Результаты тестирования примеров:</h3>
          <p><strong>Всего тестов:</strong> {sampleResults.total_tests}</p>
          <p><strong>Правильных предсказаний:</strong> {sampleResults.correct_predictions}</p>
          <p><strong>Точность:</strong> {sampleResults.accuracy?.toFixed(1)}%</p>
          
          {sampleResults.results && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Детальные результаты:</h4>
              <div className="max-h-40 overflow-y-auto">
                {sampleResults.results.map((res, index) => (
                  <div key={index} className="text-xs p-2 border-b">
                    <span className={res.correct ? 'text-green-600' : 'text-red-600'}>
                      {res.correct ? '✅' : '❌'}
                    </span>
                    <span className="ml-2">{res.filename}</span>
                    <span className="ml-2">({res.expected} → {res.predicted}, {res.confidence.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DefectTester;


