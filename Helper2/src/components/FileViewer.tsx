import React, { useState } from 'react';
import { X, Download, ExternalLink, AlertCircle } from 'lucide-react';

interface FileViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  onClose: () => void;
  onDownload?: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ 
  fileUrl, 
  fileName, 
  fileType, 
  onClose, 
  onDownload 
}) => {
  // Определяем, можно ли просмотреть файл в браузере
  const canViewInBrowser = (type: string): boolean => {
    const lowerType = type.toLowerCase();
    return (
      lowerType.includes('pdf') ||
      lowerType.includes('image') ||
      lowerType.includes('video') ||
      lowerType.includes('text') ||
      lowerType.includes('html')
    );
  };

  // Определяем тип файла для отображения
  const getFileDisplayType = (type: string): 'pdf' | 'image' | 'video' | 'text' | 'office' | 'other' => {
    const lowerType = type.toLowerCase();
    const lowerName = fileName.toLowerCase();
    
    if (lowerType.includes('pdf') || lowerName.endsWith('.pdf')) {
      return 'pdf';
    }
    if (lowerType.includes('image') || 
        lowerName.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/i)) {
      return 'image';
    }
    if (lowerType.includes('video') || 
        lowerName.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)$/i)) {
      return 'video';
    }
    if (lowerType.includes('text') || lowerName.endsWith('.txt')) {
      return 'text';
    }
    if (lowerType.includes('office') || 
        lowerType.includes('word') || 
        lowerType.includes('excel') || 
        lowerType.includes('powerpoint') ||
        lowerName.match(/\.(docx?|xlsx?|pptx?)$/i)) {
      return 'office';
    }
    return 'other';
  };

  const displayType = getFileDisplayType(fileType);
  const canView = canViewInBrowser(fileType) || displayType === 'pdf' || displayType === 'image' || displayType === 'video';

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] m-4 bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {fileName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                title="Скачать файл"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleOpenInNewTab}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              title="Открыть в новой вкладке"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {canView ? (
            <>
              {displayType === 'pdf' && (
                <iframe
                  src={fileUrl}
                  className="w-full h-full border-0"
                  title={fileName}
                />
              )}
              {displayType === 'image' && (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto bg-black relative">
                  <ImageWithError
                    src={fileUrl}
                    alt={fileName}
                    fileName={fileName}
                    onDownload={onDownload}
                  />
                </div>
              )}
              {displayType === 'video' && (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto bg-black">
                  <video
                    src={fileUrl}
                    controls
                    className="max-w-full max-h-full"
                    style={{ maxHeight: 'calc(90vh - 80px)' }}
                  >
                    Ваш браузер не поддерживает воспроизведение видео.
                    <a href={fileUrl} download={fileName}>Скачать видео</a>
                  </video>
                </div>
              )}
              {displayType === 'text' && (
                <iframe
                  src={fileUrl}
                  className="w-full h-full border-0"
                  title={fileName}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-gray-200 rounded-full p-6 mb-4">
                <svg
                  className="w-16 h-16 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Просмотр недоступен
              </h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Этот тип файла не может быть отображен в браузере. 
                Вы можете скачать файл или открыть его в новой вкладке.
              </p>
              <div className="flex gap-3">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Скачать файл
                  </button>
                )}
                <button
                  onClick={handleOpenInNewTab}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Открыть в новой вкладке
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент для отображения изображений с обработкой ошибок
const ImageWithError: React.FC<{
  src: string;
  alt: string;
  fileName: string;
  onDownload?: () => void;
}> = ({ src, alt, fileName, onDownload }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Проверяем, является ли файл HEIC
  const isHeic = fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif');
  
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  if (isHeic) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Формат HEIC не поддерживается браузером
        </h3>
        <p className="text-gray-300 mb-6">
          Файлы HEIC (High Efficiency Image Container) - это формат Apple, 
          который не поддерживается напрямую в браузерах. 
          Пожалуйста, скачайте файл для просмотра.
        </p>
        {onDownload && (
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Скачать файл
          </button>
        )}
      </div>
    );
  }
  
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Ошибка загрузки изображения
        </h3>
        <p className="text-gray-300 mb-6">
          Не удалось загрузить изображение. Возможно, файл поврежден или формат не поддерживается.
        </p>
        <div className="flex gap-3">
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Скачать файл
            </button>
          )}
          <button
            onClick={() => window.open(src, '_blank')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Открыть в новой вкладке
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white">Загрузка изображения...</div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain"
        style={{ maxHeight: 'calc(90vh - 80px)', display: isLoading ? 'none' : 'block' }}
        onError={handleError}
        onLoad={handleLoad}
      />
    </>
  );
};

export default FileViewer;





