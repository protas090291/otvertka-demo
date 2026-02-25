import React, { useState } from 'react';
import { Camera, Upload, X, MapPin } from 'lucide-react';
import { createDefect, uploadDefectPhoto, updateDefect } from '../lib/hybridDefectsApi';

interface CreateDefectFormProps {
  apartmentId: string;
  xCoord: number;
  yCoord: number;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateDefectForm: React.FC<CreateDefectFormProps> = ({
  apartmentId,
  xCoord,
  yCoord,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'active' as 'active' | 'fixed'
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Название дефекта обязательно');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Создаем дефект
      const defectData = {
        apartment_id: apartmentId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        photo_url: null,
        status: formData.status,
        x_coord: xCoord,
        y_coord: yCoord
      };

      const newDefect = await createDefect(defectData);

      if (!newDefect) {
        throw new Error('Не удалось создать дефект');
      }

      // Если есть фото, загружаем его
      if (selectedPhoto && newDefect.id) {
        const photoUrl = await uploadDefectPhoto(selectedPhoto, newDefect.id);
        if (photoUrl) {
          // Обновляем дефект с URL фото
          await updateDefect(newDefect.id, {
            photo_url: photoUrl
          });
        }
      }

      console.log('Дефект успешно создан:', newDefect);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка создания дефекта:', error);
      setError(error instanceof Error ? error.message : 'Не удалось создать дефект');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Создание дефекта
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Информация о местоположении */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4" />
              <span>Квартира {apartmentId}</span>
              <span>•</span>
              <span>Координаты: {xCoord.toFixed(1)}%, {yCoord.toFixed(1)}%</span>
            </div>
          </div>

          {/* Название дефекта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название дефекта *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Краткое описание проблемы"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Подробное описание дефекта..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Статус */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Активный</option>
              <option value="fixed">Исправлен</option>
            </select>
          </div>

          {/* Загрузка фото */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фотография
            </label>
            
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Предпросмотр"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Нажмите для загрузки</span> или перетащите фото
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG до 10MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Ошибка */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                isSubmitting || !formData.title.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Создание...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Создать дефект
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDefectForm;
