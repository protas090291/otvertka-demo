import React, { useState, useEffect } from 'react';
import { FileText, Camera, Calendar, Download, Filter, Plus } from 'lucide-react';
import { UserRole, Report } from '../types';
import { getAllReports, createReport } from '../lib/reportsApi';

interface ReportsViewProps {
  userRole: UserRole;
}

const ReportsViewWithAPI: React.FC<ReportsViewProps> = ({ userRole }) => {
  const [selectedType, setSelectedType] = useState('all');
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Загружаем данные из API при монтировании компонента
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsData = await getAllReports();
      setReports(reportsData);
    } catch (error) {
      console.error('Ошибка загрузки отчетов:', error);
      setNotificationMessage('Ошибка загрузки данных');
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const [reportForm, setReportForm] = useState({
    project: '',
    description: '',
    type: 'daily'
  });
  const [warehouseReportForm, setWarehouseReportForm] = useState({
    title: '',
    description: '',
    criticalItems: '',
    recommendations: ''
  });
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<{[reportId: string]: string[]}>({});
  const [isCreatingWarehouseReport, setIsCreatingWarehouseReport] = useState(false);
  const [isCreatingTechnadzorReport, setIsCreatingTechnadzorReport] = useState(false);
  const [technadzorReportForm, setTechnadzorReportForm] = useState({
    project: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly' | 'milestone',
    contractor: ''
  });
  const [isCreatingContractorReport, setIsCreatingContractorReport] = useState(false);
  const [contractorReportForm, setContractorReportForm] = useState({
    project: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly' | 'milestone',
    client: ''
  });
  const [foremanCreatedReports, setForemanCreatedReports] = useState<Set<string>>(new Set());
  const [workerCreatedReports, setWorkerCreatedReports] = useState<Set<string>>(new Set());

  // Проверяем, заполнены ли обязательные поля
  const isFormValid = reportForm.project && reportForm.description.trim();

  // Функция для создания нового отчета
  const handleCreateReport = async () => {
    if (!isFormValid) return;

    try {
      const projectNames = {
        '1': 'ЖК "Северная звезда"',
        '2': 'Офисный центр "Технопарк"',
        '3': 'Частный дом Иванова'
      };

      const newReport = {
        project_id: reportForm.project,
        title: `${typeLabels[reportForm.type as keyof typeof typeLabels]} отчёт - ${projectNames[reportForm.project as keyof typeof projectNames]}`,
        description: reportForm.description,
        type: reportForm.type as 'daily' | 'weekly' | 'milestone',
        author: userRole === 'worker' ? 'Рабочий' : userRole === 'storekeeper' ? 'Складчик' : userRole === 'technadzor' ? 'ТехНадзор' : userRole === 'foreman' ? 'Прораб' : 'Пользователь',
        photos: photoPreviewUrls,
        attachments: []
      };

      const createdReport = await createReport(newReport);
      if (createdReport) {
        await loadReports(); // Перезагружаем данные
        
        // Если отчет создан прорабом, отмечаем его как созданный прорабом
        if (userRole === 'foreman') {
          setForemanCreatedReports(prev => new Set([...prev, createdReport.id]));
        }
        // Если отчет создан рабочим, отмечаем его как созданный рабочим
        if (userRole === 'worker') {
          setWorkerCreatedReports(prev => new Set([...prev, createdReport.id]));
        }
        
        // Сохраняем фотографии для этого отчета
        setUploadedPhotos(prev => ({
          ...prev,
          [createdReport.id]: photoPreviewUrls
        }));
        
        // Сброс формы
        setReportForm({
          project: '',
          description: '',
          type: 'daily'
        });
        setSelectedPhotos([]);
        setPhotoPreviewUrls([]);
        
        // Закрытие формы создания
        setIsCreatingReport(false);
        
        // Показ уведомления
        setNotificationMessage('Отчёт успешно создан!');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error('Ошибка создания отчета:', error);
      setNotificationMessage('Ошибка создания отчета');
      setShowNotification(true);
    }
  };

  // Функция для создания складского отчета
  const handleCreateWarehouseReport = async () => {
    if (!warehouseReportForm.title.trim() || !warehouseReportForm.description.trim()) return;

    try {
      const newWarehouseReport = {
        project_id: 'warehouse', // Специальный ID для складских отчетов
        title: warehouseReportForm.title,
        description: warehouseReportForm.description,
        type: 'warehouse' as any,
        author: 'Складчик',
        photos: photoPreviewUrls,
        attachments: []
      };

      const createdReport = await createReport(newWarehouseReport);
      if (createdReport) {
        await loadReports(); // Перезагружаем данные
        
        // Сброс формы
        setWarehouseReportForm({
          title: '',
          description: '',
          criticalItems: '',
          recommendations: ''
        });
        setSelectedPhotos([]);
        setPhotoPreviewUrls([]);
        
        // Закрытие формы создания
        setIsCreatingWarehouseReport(false);
        
        // Показываем уведомление
        setNotificationMessage('Складской отчёт создан!');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error('Ошибка создания складского отчета:', error);
      setNotificationMessage('Ошибка создания складского отчета');
      setShowNotification(true);
    }
  };

  // Функция для отмены создания складского отчета
  const handleCancelWarehouseReport = () => {
    setWarehouseReportForm({
      title: '',
      description: '',
      criticalItems: '',
      recommendations: ''
    });
    setSelectedPhotos([]);
    setPhotoPreviewUrls([]);
    setIsCreatingWarehouseReport(false);
  };

  // Функция для сброса формы
  const handleCancelReport = () => {
    setReportForm({
      project: '',
      description: '',
      type: 'daily'
    });
    setSelectedPhotos([]);
    setPhotoPreviewUrls([]);
    setIsCreatingReport(false);
  };

  // Функция для создания отчета технадзора для подрядчика
  const handleCreateTechnadzorReport = async () => {
    if (!technadzorReportForm.project || !technadzorReportForm.description.trim() || !technadzorReportForm.contractor) return;

    try {
      const projectNames = {
        '1': 'ЖК "Северная звезда"',
        '2': 'Офисный центр "Технопарк"',
        '3': 'Частный дом Иванова'
      };

      const newReport = {
        project_id: technadzorReportForm.project,
        title: `Отчет технадзора для ${technadzorReportForm.contractor} - ${projectNames[technadzorReportForm.project as keyof typeof projectNames]}`,
        description: technadzorReportForm.description,
        type: 'technadzor' as any, // Специальный тип для отчетов технадзора
        author: 'ТехНадзор',
        photos: photoPreviewUrls,
        attachments: []
      };

      const createdReport = await createReport(newReport);
      if (createdReport) {
        await loadReports(); // Перезагружаем данные
        
        // Сохраняем фотографии для отображения
        setUploadedPhotos(prev => ({
          ...prev,
          [createdReport.id]: photoPreviewUrls
        }));

        // Сброс формы
        setTechnadzorReportForm({
          project: '',
          description: '',
          type: 'daily',
          contractor: ''
        });
        setSelectedPhotos([]);
        setPhotoPreviewUrls([]);
        
        // Закрытие формы создания
        setIsCreatingTechnadzorReport(false);
        
        // Показываем уведомление об успешном создании
        setNotificationMessage('Отчёт технадзора создан!');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error('Ошибка создания отчета технадзора:', error);
      setNotificationMessage('Ошибка создания отчета технадзора');
      setShowNotification(true);
    }
  };

  // Функция для сброса формы отчета технадзора
  const handleCancelTechnadzorReport = () => {
    setTechnadzorReportForm({
      project: '',
      description: '',
      type: 'daily',
      contractor: ''
    });
    setSelectedPhotos([]);
    setPhotoPreviewUrls([]);
    setIsCreatingTechnadzorReport(false);
  };

  // Функция для создания отчета подрядчика для заказчика
  const handleCreateContractorReport = async () => {
    if (!contractorReportForm.project || !contractorReportForm.description.trim() || !contractorReportForm.client) return;

    try {
      const projectNames = {
        '1': 'ЖК "Северная звезда"',
        '2': 'Офисный центр "Технопарк"',
        '3': 'Частный дом Иванова'
      };

      const newReport = {
        project_id: contractorReportForm.project,
        title: `Отчет подрядчика для ${contractorReportForm.client} - ${projectNames[contractorReportForm.project as keyof typeof projectNames]}`,
        description: contractorReportForm.description,
        type: 'contractor' as any, // Специальный тип для отчетов подрядчика
        author: 'Подрядчик',
        photos: photoPreviewUrls,
        attachments: []
      };

      const createdReport = await createReport(newReport);
      if (createdReport) {
        await loadReports(); // Перезагружаем данные
        
        // Сохраняем фотографии для отображения
        setUploadedPhotos(prev => ({
          ...prev,
          [createdReport.id]: photoPreviewUrls
        }));

        // Сброс формы
        setContractorReportForm({
          project: '',
          description: '',
          type: 'daily',
          client: ''
        });
        setSelectedPhotos([]);
        setPhotoPreviewUrls([]);
        
        // Закрытие формы создания
        setIsCreatingContractorReport(false);
        
        // Показываем уведомление
        setNotificationMessage('Отчёт подрядчика создан!');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error('Ошибка создания отчета подрядчика:', error);
      setNotificationMessage('Ошибка создания отчета подрядчика');
      setShowNotification(true);
    }
  };

  // Функция для отмены создания отчета подрядчика
  const handleCancelContractorReport = () => {
    setContractorReportForm({
      project: '',
      description: '',
      type: 'daily',
      client: ''
    });
    setSelectedPhotos([]);
    setPhotoPreviewUrls([]);
    setIsCreatingContractorReport(false);
  };

  // Функция для выбора фотографий
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files);
      setSelectedPhotos(prev => [...prev, ...newPhotos]);
      
      // Создаем превью для новых фотографий
      newPhotos.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPhotoPreviewUrls(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Функция для удаления фотографии
  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const typeColors = {
    daily: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
    weekly: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
    milestone: 'bg-purple-500/20 text-purple-200 border border-purple-500/30',
    warehouse: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
    technadzor: 'bg-purple-500/20 text-purple-200 border border-purple-500/30',
    contractor: 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30'
  };

  const typeLabels = {
    daily: 'Ежедневный',
    weekly: 'Еженедельный',
    milestone: 'Этап',
    warehouse: 'Складской',
    technadzor: 'Технадзор',
    contractor: 'Подрядчик'
  };

  const filteredReports = reports.filter(report => {
    // Складские отчеты видны только складчику и подрядчику
    if (report.type === 'warehouse' && userRole !== 'storekeeper' && userRole !== 'contractor') {
      return false;
    }
    // Отчеты технадзора видны только технадзору и подрядчикам
    if (report.type === 'technadzor' && userRole !== 'technadzor' && userRole !== 'contractor') {
      return false;
    }
    // Отчеты подрядчика видны только подрядчику и заказчику
    if (report.type === 'contractor' && userRole !== 'contractor' && userRole !== 'client') {
      return false;
    }
    // Отчеты прораба видны только прорабу и подрядчику
    if (foremanCreatedReports.has(report.id) && userRole !== 'foreman' && userRole !== 'contractor') {
      return false;
    }
    // Отчеты рабочих видны только рабочим и прорабу
    if (workerCreatedReports.has(report.id) && userRole !== 'worker' && userRole !== 'foreman') {
      return false;
    }
    return selectedType === 'all' || report.type === selectedType || (selectedType === 'foreman' && foremanCreatedReports.has(report.id)) || (selectedType === 'worker' && workerCreatedReports.has(report.id));
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Загрузка отчетов...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Уведомление об успешном создании отчета */}
      {showNotification && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center space-x-2">
            <span>✓</span>
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      {/* Форма создания отчета подрядчика для заказчика */}
      {isCreatingContractorReport && (
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Создание отчёта для заказчика</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Проект</label>
                <select 
                  value={contractorReportForm.project}
                  onChange={(e) => setContractorReportForm({...contractorReportForm, project: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите проект</option>
                  <option value="1">ЖК "Северная звезда"</option>
                  <option value="2">Офисный центр "Технопарк"</option>
                  <option value="3">Частный дом Иванова</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Заказчик</label>
                <select 
                  value={contractorReportForm.client}
                  onChange={(e) => setContractorReportForm({...contractorReportForm, client: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите заказчика</option>
                  <option value="ООО Застройщик">ООО Застройщик</option>
                  <option value="ИП Иванов">ИП Иванов</option>
                  <option value="ЗАО ИнвестГрупп">ЗАО ИнвестГрупп</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип отчёта</label>
                <select 
                  value={contractorReportForm.type}
                  onChange={(e) => setContractorReportForm({...contractorReportForm, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Ежедневный</option>
                  <option value="weekly">Еженедельный</option>
                  <option value="milestone">Этап</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание отчёта</label>
                <textarea
                  value={contractorReportForm.description}
                  onChange={(e) => setContractorReportForm({...contractorReportForm, description: e.target.value})}
                  placeholder="Опишите выполненные работы, прогресс, качество, планы на следующий период..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              
              <div className="flex space-x-2">
                <label 
                  className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                    contractorReportForm.project && contractorReportForm.description.trim() && contractorReportForm.client
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Добавить фото</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    disabled={!contractorReportForm.project || !contractorReportForm.description.trim() || !contractorReportForm.client}
                    className="hidden"
                  />
                </label>
                <button 
                  disabled={!contractorReportForm.project || !contractorReportForm.description.trim() || !contractorReportForm.client}
                  onClick={handleCreateContractorReport}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    contractorReportForm.project && contractorReportForm.description.trim() && contractorReportForm.client
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Создать отчёт
                </button>
              </div>
            </div>
            
            <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              contractorReportForm.project && contractorReportForm.description.trim() && contractorReportForm.client
                ? 'border-blue-400 hover:border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-gray-50'
            }`}>
              {selectedPhotos.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Выбранные фотографии ({selectedPhotos.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={photoPreviewUrls[index]} 
                          alt={`Фото ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="mt-3 block text-center">
                    <span className="text-blue-600 hover:text-blue-700 text-sm cursor-pointer">
                      Добавить ещё фото
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className={`w-12 h-12 mx-auto mb-2 ${
                    contractorReportForm.project && contractorReportForm.description.trim() && contractorReportForm.client ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  {contractorReportForm.project && contractorReportForm.description.trim() && contractorReportForm.client ? (
                    <>
                      <p className="text-blue-600 font-medium">Нажмите "Добавить фото" для выбора</p>
                      <p className="text-xs text-blue-500 mt-1">PNG, JPG до 10MB</p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-600">Область загрузки файлов</p>
                      <p className="text-xs text-gray-400 mt-1">Сначала заполните информацию об отчёте</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Отчёты и документация</h1>
          <p className="text-slate-400 mt-1">Фото-отчёты и документооборот по проектам</p>
        </div>
        
        {(userRole === 'worker' || userRole === 'foreman' || userRole === 'storekeeper' || userRole === 'technadzor' || userRole === 'contractor') ? (
          <div className="flex space-x-2">
            {!isCreatingReport && !isCreatingWarehouseReport && !isCreatingTechnadzorReport && !isCreatingContractorReport ? (
              <>
                {userRole !== 'storekeeper' && userRole !== 'technadzor' && userRole !== 'contractor' && (
                  <button 
                    onClick={() => setIsCreatingReport(true)}
                    className="border border-emerald-500/30 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{userRole === 'foreman' ? 'Отчёт для подрядчика' : userRole === 'worker' ? 'Отчёт для прораба' : 'Создать отчёт'}</span>
                  </button>
                )}
                {userRole === 'storekeeper' && (
                  <button 
                    onClick={() => setIsCreatingWarehouseReport(true)}
                    className="border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Отчёт склада</span>
                  </button>
                )}
                {userRole === 'technadzor' && (
                  <button 
                    onClick={() => setIsCreatingTechnadzorReport(true)}
                    className="border border-purple-500/30 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Отчёт для подрядчика</span>
                  </button>
                )}
                {userRole === 'contractor' && (
                  <button 
                    onClick={() => setIsCreatingContractorReport(true)}
                    className="border border-indigo-500/30 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Отчёт для заказчика</span>
                  </button>
                )}
              </>
            ) : (
              <button 
                onClick={
                  isCreatingWarehouseReport ? handleCancelWarehouseReport : 
                  isCreatingTechnadzorReport ? handleCancelTechnadzorReport : 
                  isCreatingContractorReport ? handleCancelContractorReport :
                  handleCancelReport
                }
                className="border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <span>Отменить</span>
              </button>
            )}
          </div>
        ) : (
        <button className="border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Создать отчёт</span>
        </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-4">
        <div className="flex space-x-1">
          {[
            { value: 'all', label: 'Все отчёты' },
            { value: 'daily', label: 'Ежедневные' },
            { value: 'weekly', label: 'Еженедельные' },
            { value: 'milestone', label: 'Этапы' },
            ...(userRole === 'storekeeper' || userRole === 'contractor' ? [{ value: 'warehouse', label: 'Складские' }] : []),
            ...(userRole === 'technadzor' || userRole === 'contractor' ? [{ value: 'technadzor', label: 'Технадзор' }] : []),
            ...(userRole === 'contractor' || userRole === 'client' ? [{ value: 'contractor', label: 'Подрядчик' }] : []),
            ...(userRole === 'foreman' || userRole === 'contractor' ? [{ value: 'foreman', label: 'Прораб' }] : []),
            ...(userRole === 'worker' || userRole === 'foreman' ? [{ value: 'worker', label: 'Рабочий' }] : [])
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedType(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                selectedType === tab.value
                  ? 'bg-blue-500/30 text-white border border-blue-500/40'
                  : 'text-slate-300 border border-transparent hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div key={report.id} className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                  {foremanCreatedReports.has(report.id) && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30">
                      От прораба
                    </span>
                  )}
                  {workerCreatedReports.has(report.id) && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                      От рабочего
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[report.type]}`}>
                    {typeLabels[report.type]}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm font-medium text-slate-300 mb-3">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{new Date(report.date).toLocaleDateString('ru')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Автор: {report.author}</span>
                  </div>
                </div>
                
                <p className="text-base text-slate-200 leading-snug">{report.description}</p>
              </div>
              
              <button className="text-blue-300 hover:text-blue-200 p-2 rounded-xl hover:bg-blue-500/20 border border-transparent hover:border-blue-500/30 transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>

            {/* Photos and Attachments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {report.photos && report.photos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span>Фотографии ({report.photos.length})</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {report.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-white/10 border border-white/10 rounded-xl cursor-pointer hover:bg-white/15 transition-colors overflow-hidden"
                      >
                        {photo.startsWith('data:') ? (
                          <img 
                            src={photo} 
                            alt={`Фото ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="w-8 h-8 text-slate-500" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {report.attachments && report.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Документы ({report.attachments.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {report.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 border border-white/10 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <FileText className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-200">{attachment}</span>
                        <Download className="w-4 h-4 text-slate-400 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Upload Widget - для рабочего и прораба */}
      {(userRole === 'worker' || userRole === 'foreman' || userRole === 'storekeeper' || userRole === 'technadzor') && isCreatingReport && (
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Создание отчёта</h2>
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Проект</label>
                <select 
                  value={reportForm.project}
                  onChange={(e) => setReportForm({...reportForm, project: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите проект</option>
                  <option value="1">ЖК "Северная звезда"</option>
                  <option value="2">Офисный центр "Технопарк"</option>
                  <option value="3">Частный дом Иванова</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип отчёта</label>
                <select 
                  value={reportForm.type}
                  onChange={(e) => setReportForm({...reportForm, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Ежедневный</option>
                  <option value="weekly">Еженедельный</option>
                  <option value="milestone">Этап</option>
                </select>
              </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание работ</label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                  placeholder="Опишите выполненные работы..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              
              <div className="flex space-x-2">
                <label 
                  className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                    isFormValid 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Добавить фото</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    disabled={!isFormValid}
                    className="hidden"
                  />
                </label>
                <button 
                  disabled={!isFormValid}
                  onClick={handleCreateReport}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    isFormValid 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Сохранить отчёт
                </button>
              </div>
            </div>
            
            <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              isFormValid 
                ? 'border-blue-400 hover:border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-gray-50'
            }`}>
              {selectedPhotos.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Выбранные фотографии ({selectedPhotos.length})</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={url} 
                          alt={`Фото ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="mt-3 block text-center">
                    <span className="text-blue-600 hover:text-blue-700 text-sm cursor-pointer">
                      Добавить ещё фото
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className={`w-12 h-12 mx-auto mb-2 ${
                    isFormValid ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  {isFormValid ? (
                    <>
                      <p className="text-blue-600 font-medium">Нажмите "Добавить фото" для выбора</p>
                      <p className="text-xs text-blue-500 mt-1">PNG, JPG до 10MB</p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-600">Область загрузки файлов</p>
                      <p className="text-xs text-gray-400 mt-1">Сначала заполните информацию об отчёте</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Форма создания складского отчета */}
      {isCreatingWarehouseReport && (
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Создание отчёта о состоянии склада</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название отчёта</label>
                <input
                  type="text"
                  value={warehouseReportForm.title}
                  onChange={(e) => setWarehouseReportForm({...warehouseReportForm, title: e.target.value})}
                  placeholder="Например: Отчёт о состоянии склада на 25.08.2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Общее описание состояния склада</label>
                <textarea
                  value={warehouseReportForm.description}
                  onChange={(e) => setWarehouseReportForm({...warehouseReportForm, description: e.target.value})}
                  placeholder="Опишите общее состояние склада, основные изменения..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Критически важные позиции</label>
                <textarea
                  value={warehouseReportForm.criticalItems}
                  onChange={(e) => setWarehouseReportForm({...warehouseReportForm, criticalItems: e.target.value})}
                  placeholder="Укажите материалы с критически низким запасом..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Рекомендации для подрядчиков</label>
                <textarea
                  value={warehouseReportForm.recommendations}
                  onChange={(e) => setWarehouseReportForm({...warehouseReportForm, recommendations: e.target.value})}
                  placeholder="Рекомендации по закупкам, планированию..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              
              <div className="flex space-x-2">
                <label className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                  warehouseReportForm.title.trim() && warehouseReportForm.description.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}>
                  <Camera className="w-4 h-4" />
                  <span>Добавить фото</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    disabled={!warehouseReportForm.title.trim() || !warehouseReportForm.description.trim()}
                    className="hidden"
                  />
                </label>
                <button 
                  disabled={!warehouseReportForm.title.trim() || !warehouseReportForm.description.trim()}
                  onClick={handleCreateWarehouseReport}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    warehouseReportForm.title.trim() && warehouseReportForm.description.trim()
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Создать отчёт
                </button>
              </div>
              
              {selectedPhotos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Выбранные фотографии ({selectedPhotos.length})</h4>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={url} 
                          alt={`Фото ${index + 1}`}
                          className="w-full h-16 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Форма создания отчета технадзора для подрядчика */}
      {isCreatingTechnadzorReport && (
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Создание отчёта для подрядчика</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Проект</label>
                <select 
                  value={technadzorReportForm.project}
                  onChange={(e) => setTechnadzorReportForm({...technadzorReportForm, project: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите проект</option>
                  <option value="1">ЖК "Северная звезда"</option>
                  <option value="2">Офисный центр "Технопарк"</option>
                  <option value="3">Частный дом Иванова</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Подрядчик</label>
                <select 
                  value={technadzorReportForm.contractor}
                  onChange={(e) => setTechnadzorReportForm({...technadzorReportForm, contractor: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите подрядчика</option>
                  <option value="ООО СтройМонтаж">ООО СтройМонтаж</option>
                  <option value="ИП Петров">ИП Петров</option>
                  <option value="ЗАО СтройГрупп">ЗАО СтройГрупп</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип отчёта</label>
                <select 
                  value={technadzorReportForm.type}
                  onChange={(e) => setTechnadzorReportForm({...technadzorReportForm, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Ежедневный</option>
                  <option value="weekly">Еженедельный</option>
                  <option value="milestone">Этап</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание отчёта</label>
                <textarea
                  value={technadzorReportForm.description}
                  onChange={(e) => setTechnadzorReportForm({...technadzorReportForm, description: e.target.value})}
                  placeholder="Опишите результаты проверки, выявленные проблемы, рекомендации..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              
              <div className="flex space-x-2">
                <label 
                  className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                    technadzorReportForm.project && technadzorReportForm.description.trim() && technadzorReportForm.contractor
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Добавить фото</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    disabled={!technadzorReportForm.project || !technadzorReportForm.description.trim() || !technadzorReportForm.contractor}
                    className="hidden"
                  />
                </label>
                <button 
                  disabled={!technadzorReportForm.project || !technadzorReportForm.description.trim() || !technadzorReportForm.contractor}
                  onClick={handleCreateTechnadzorReport}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    technadzorReportForm.project && technadzorReportForm.description.trim() && technadzorReportForm.contractor
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Создать отчёт
                </button>
              </div>
            </div>
            
            <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              technadzorReportForm.project && technadzorReportForm.description.trim() && technadzorReportForm.contractor
                ? 'border-blue-400 hover:border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-gray-50'
            }`}>
              {selectedPhotos.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Выбранные фотографии ({selectedPhotos.length})</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={url} 
                          alt={`Фото ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="mt-3 block text-center">
                    <span className="text-blue-600 hover:text-blue-700 text-sm cursor-pointer">
                      Добавить ещё фото
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className={`w-12 h-12 mx-auto mb-2 ${
                    technadzorReportForm.project && technadzorReportForm.description.trim() && technadzorReportForm.contractor ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                  {technadzorReportForm.project && technadzorReportForm.description.trim() && technadzorReportForm.contractor ? (
                    <>
                      <p className="text-blue-600 font-medium">Нажмите "Добавить фото" для выбора</p>
                      <p className="text-xs text-blue-500 mt-1">PNG, JPG до 10MB</p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-600">Область загрузки файлов</p>
                      <p className="text-xs text-gray-400 mt-1">Сначала заполните информацию об отчёте</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Отчёты не найдены</p>
          <p className="text-slate-500 mt-2">Создайте первый отчёт для отслеживания прогресса</p>
        </div>
      )}
    </div>
  );
};

export default ReportsViewWithAPI;
