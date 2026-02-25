import React, { useState } from 'react';
import { 
  Building2, 
  Home, 
  FileImage, 
  Download, 
  Upload, 
  Eye, 
  Search,
  Filter,
  Plus,
  X,
  MapPin,
  Ruler,
  Users,
  Calendar,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { UserRole } from '../types';
import { useProjects, useApartments, useArchitecturalPlans, usePlanUpload } from '../hooks/useSupabase';
import PlanWithSupabaseDefects from './PlanWithSupabaseDefects';
import CreateDefectForm from './CreateDefectForm';
import { getCurrentMode, forceCheckSupabase } from '../lib/hybridDefectsApi';
import { useDefectsCount } from '../hooks/useDefectsCount';

interface ArchitecturalPlansViewProps {
  userRole: UserRole;
  onNavigateBack?: () => void;
}

const ArchitecturalPlansView: React.FC<ArchitecturalPlansViewProps> = ({ userRole, onNavigateBack }) => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedApartment, setSelectedApartment] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>('floor_plan');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showDefectsMode, setShowDefectsMode] = useState(false);
  const [showCreateDefectForm, setShowCreateDefectForm] = useState(false);
  const [defectCoordinates, setDefectCoordinates] = useState<{x: number, y: number} | null>(null);
  const [defectsUpdateKey, setDefectsUpdateKey] = useState(0);
  const [defectsModeKey, setDefectsModeKey] = useState(0);
  const [showDefectsViewer, setShowDefectsViewer] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);

  const { projects, loading: projectsLoading } = useProjects();
  const { apartments, loading: apartmentsLoading } = useApartments(selectedProject);
  const { plans, loading: plansLoading } = useArchitecturalPlans(selectedApartment);
  const { uploadPlan, uploading } = usePlanUpload();
  const { defectsCount, refreshDefectsCount } = useDefectsCount();

  // Функции для работы с дефектами
  const handlePlanClick = (event: React.MouseEvent<HTMLDivElement>) => {
    console.log('Клик по плану! showDefectsMode:', showDefectsMode);
    
    if (!showDefectsMode) {
      console.log('Режим дефектов не активен, игнорируем клик');
      return;
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    console.log('Координаты клика:', { x, y });
    
    setDefectCoordinates({ x, y });
    setShowCreateDefectForm(true);
  };

  const handleDefectCreated = () => {
    console.log('Дефект создан! Обновляем интерфейс...');
    setShowCreateDefectForm(false);
    setDefectCoordinates(null);
    setShowDefectsMode(false); // Возвращаемся в обычный режим просмотра
    setDefectsUpdateKey(prev => prev + 1); // Принудительно обновляем компонент дефектов
    // Обновляем счетчик дефектов
    refreshDefectsCount();
  };


  const planTypeLabels = {
    floor_plan: 'Планировка',
    elevation: 'Фасад',
    section: 'Разрез',
    '3d_model': '3D модель'
  };

  const planTypeColors = {
    floor_plan: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
    elevation: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
    section: 'bg-purple-500/20 text-purple-200 border border-purple-500/30',
    '3d_model': 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    // Пока убираем фильтр по типу, так как в Supabase нет поля plan_type
    const matchesType = filterType === 'all' || true;
    return matchesSearch && matchesType;
  });

  const handleFileUpload = async () => {
    if (!uploadFile || !selectedApartment) return;

    setIsUploading(true);
    const result = await uploadPlan(uploadFile, selectedApartment, uploadType);
    
    if (result) {
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadType('floor_plan');
    }
    
    setIsUploading(false);
  };

  const downloadPlan = async (plan: any) => {
    try {
      if (!plan.file_url) {
        alert('URL файла недоступен');
        return;
      }

      const response = await fetch(plan.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = plan.file_name || 'plan.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
      alert('Ошибка скачивания файла');
    }
  };

  const openPdfViewer = (plan: any) => {
    setSelectedPlan(plan);
    setShowPdfViewer(true);
  };

  const closePdfViewer = () => {
    setShowPdfViewer(false);
    setSelectedPlan(null);
  };

  const openDefectsViewer = (plan: any) => {
    setSelectedPlan(plan);
    setShowDefectsViewer(true);
  };

  const closeDefectsViewer = () => {
    setShowDefectsViewer(false);
    setSelectedPlan(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-all duration-200 hover:bg-white/10 px-3 py-2 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Назад к проектам</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">Архитектурные планы</h1>
            <p className="text-slate-400 mt-1">Просмотр и управление планами квартир</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                getCurrentMode() === 'Supabase'
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-200 border-amber-500/30'
              }`} key={defectsModeKey}>
                Дефекты: {getCurrentMode() === 'Supabase' ? '🗄️ Supabase' : '💾 localStorage'}
              </span>
              {getCurrentMode() === 'localStorage' && (
                <button
                  type="button"
                  onClick={async () => {
                    await forceCheckSupabase();
                    setDefectsModeKey(k => k + 1);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Подключиться к базе данных
                </button>
              )}
            </div>
          </div>
        </div>
        
        {(userRole === 'foreman' || userRole === 'contractor' || userRole === 'technadzor') && selectedApartment && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
          >
            <Upload className="w-5 h-5" />
            <span>Загрузить план</span>
          </button>
        )}
      </div>

      {/* Выбор проекта */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Выбор проекта</h2>
            <p className="text-sm text-slate-400">Выберите проект для просмотра планов</p>
          </div>
        </div>
        
        {projectsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-400 mt-3 font-medium">Загрузка проектов...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(projects.length > 0 ? projects : [{
              id: 'zhk-vishnevyy-sad',
              name: 'ЖК "Вишневый сад"',
              description: 'Современный жилой комплекс',
              address: 'ул. Вишневая, 15',
              status: 'construction' as const,
              total_apartments: 46,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]).map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  setSelectedProject(project.id);
                  setSelectedApartment('');
                }}
                className={`group relative p-6 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedProject === project.id
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl shadow-blue-500/25'
                    : 'border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/30'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedProject === project.id
                      ? 'bg-white/20 backdrop-blur-sm'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    <Building2 className={`w-7 h-7 ${
                      selectedProject === project.id ? 'text-white' : 'text-white'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-1 ${
                      selectedProject === project.id ? 'text-white' : 'text-white'
                    }`}>
                      {project.name}
                    </h3>
                    <p className={`text-sm mb-2 ${
                      selectedProject === project.id ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                      {project.address}
                    </p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                      selectedProject === project.id
                        ? 'bg-white/20 text-white border-white/20'
                        : 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                    }`}>
                      <Home className="w-3 h-3 mr-1" />
                      {project.total_apartments} квартир
                    </div>
                  </div>
                </div>
                
                {/* Декоративный элемент */}
                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                  selectedProject === project.id ? 'bg-white/40' : 'bg-blue-400'
                }`}></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Выбор квартиры */}
      {selectedProject && (
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Выбор квартиры</h2>
              <p className="text-sm text-slate-400">Выберите квартиру для просмотра планов</p>
            </div>
          </div>
          
          {apartmentsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500 mt-3 font-medium">Загрузка квартир...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Группируем квартиры по этажам */}
              {(() => {
                const apartmentsByFloor = apartments.reduce((acc, apartment) => {
                  const floor = apartment.floor;
                  if (!acc[floor]) {
                    acc[floor] = [];
                  }
                  acc[floor].push(apartment);
                  return acc;
                }, {} as Record<number, typeof apartments>);

                // Сортируем этажи по убыванию (сверху вниз)
                const sortedFloors = Object.keys(apartmentsByFloor)
                  .map(Number)
                  .sort((a, b) => b - a);

                return sortedFloors.map((floor) => (
                  <div key={floor} className="border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                          <span className="text-white font-bold text-sm">{floor}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {floor} этаж
                          </h3>
                          <p className="text-sm text-slate-400">
                            {apartmentsByFloor[floor].length} квартир
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Квартиры этажа */}
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {apartmentsByFloor[floor]
                          .sort((a, b) => parseInt(a.apartment_number) - parseInt(b.apartment_number))
                          .map((apartment) => (
                          <div
                            key={apartment.id}
                            className={`group relative p-4 border rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                              selectedApartment === apartment.id
                                ? 'border-emerald-500/50 bg-emerald-500/25 text-white shadow-xl shadow-emerald-500/20'
                                : 'border-white/10 hover:border-emerald-500/30 bg-white/5 hover:bg-white/10'
                            }`}
                            onClick={() => {
                              setSelectedApartment(apartment.id);
                              setShowPlansModal(true);
                            }}
                          >
                            <div className="text-center">
                              <div className={`text-2xl font-bold mb-2 ${
                                selectedApartment === apartment.id ? 'text-white' : 'text-white'
                              }`}>
                                {apartment.apartment_number}
                              </div>
                              <div className={`text-xs space-y-1 ${
                                selectedApartment === apartment.id ? 'text-green-100' : 'text-slate-300'
                              }`}>
                                <p className="font-medium">{apartment.area} м²</p>
                                <p>{apartment.rooms} комн.</p>
                                <p className={`font-bold ${
                                  selectedApartment === apartment.id ? 'text-white' : 'text-emerald-300'
                                }`}>
                                  {(apartment.price / 1000000).toFixed(1)}М ₽
                                </p>
                                
                                {/* Отображение количества дефектов */}
                                {(() => {
                                  const apartmentId = apartment.apartment_number;
                                  const count = defectsCount[apartmentId];
                                  if (count && count.total > 0) {
                                    return (
                                      <div className={`mt-3 pt-2 border-t ${
                                        selectedApartment === apartment.id ? 'border-white/30' : 'border-white/10'
                                      }`}>
                                        <div className="flex items-center justify-center space-x-1">
                                          <AlertTriangle className={`w-3 h-3 ${
                                            selectedApartment === apartment.id ? 'text-yellow-300' : 'text-amber-400'
                                          }`} />
                                          <span className={`text-xs font-medium ${
                                            selectedApartment === apartment.id ? 'text-yellow-200' : 'text-amber-200'
                                          }`}>
                                            {count.active} активных
                                          </span>
                                        </div>
                                        {count.fixed > 0 && (
                                          <div className="flex items-center justify-center space-x-1 mt-1">
                                            <div className={`w-2 h-2 rounded-full ${
                                              selectedApartment === apartment.id ? 'bg-green-300' : 'bg-emerald-400/80'
                                            }`}></div>
                                            <span className={`text-xs ${
                                              selectedApartment === apartment.id ? 'text-green-200' : 'text-emerald-300'
                                            }`}>
                                              {count.fixed} исправлено
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                            
                            {/* Декоративный элемент */}
                            <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                              selectedApartment === apartment.id ? 'bg-white/30' : 'bg-emerald-400'
                            }`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно: планы квартиры (открывается по клику на квартиру) */}
      {showPlansModal && selectedApartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPlansModal(false)}>
          <div className="rounded-2xl shadow-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                  <FileImage className="w-6 h-6 text-purple-200" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Планы квартиры № {apartments.find((a) => a.id === selectedApartment)?.apartment_number ?? '—'}
                  </h2>
                  <p className="text-sm text-slate-400">Просмотр и управление планами</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPlansModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-wrap items-center justify-end gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск планов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-white/10 rounded-xl bg-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="all">Все типы</option>
                <option value="floor_plan">Планировка</option>
                <option value="elevation">Фасад</option>
                <option value="section">Разрез</option>
                <option value="3d_model">3D модель</option>
              </select>
              </div>

          {plansLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-white mx-auto"></div>
              <p className="text-slate-400 mt-4">Загрузка планов...</p>
            </div>
          ) : null}
          
          {filteredPlans.length > 0 ? (
            <div>
              {/* Информация о типе планировки */}
              <div className="mb-4 p-3 rounded-xl border border-white/10 bg-white/5">
                <p className="text-sm text-slate-300">
                  {filteredPlans.length} планов найдено
                  {filteredPlans[0].is_typical && (
                    <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-200 border border-blue-500/30 text-xs rounded-full">
                      Типовая планировка (группа {filteredPlans[0].typical_group})
                    </span>
                  )}
                  {!filteredPlans[0].is_typical && (
                    <span className="ml-2 px-2 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 text-xs rounded-full">
                      Индивидуальная планировка
                    </span>
                  )}
                </p>
                {filteredPlans[0].is_typical && (
                  <p className="text-xs text-slate-500 mt-1">
                    План взят из квартиры {filteredPlans[0].plan_source_apartment}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <div key={plan.id} className="group rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="min-h-[200px] py-6 px-4 flex items-center justify-center relative overflow-visible">
                    {plan.file_name?.includes('3d') ? (
                      <div className="text-center">
                        <div className="w-20 h-20 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-500/30">
                          <FileImage className="w-10 h-10 text-purple-200" />
                        </div>
                        <p className="text-sm font-medium text-white">3D модель</p>
                        <p className="text-xs text-slate-400 mt-1">Интерактивная модель</p>
                      </div>
                    ) : plan.file_url ? (
                      <div className="w-full flex items-center justify-center py-2">
                        <div className="text-center scale-90 origin-center">
                          <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-2 border border-blue-500/30">
                            <FileImage className="w-8 h-8 text-blue-200" />
                          </div>
                          <p className="text-sm font-bold text-white">PDF чертеж</p>
                          <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px] mx-auto">
                            {plan.file_name?.replace('.pdf', '')}
                          </p>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm whitespace-nowrap">
                              ✓ Готов к просмотру
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/10">
                          <FileImage className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-300">Файл</p>
                        <p className="text-xs text-slate-500">{plan.file_name}</p>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400/60 rounded-full"></div>
                    <div className="absolute bottom-4 left-4 w-1 h-1 bg-purple-400 rounded-full opacity-40"></div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30">
                        {plan.file_name?.includes('планировка') ? 'Планировка' : 
                         plan.file_name?.includes('фасад') ? 'Фасад' : 
                         plan.file_name?.includes('разрез') ? 'Разрез' : 'План'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {plan.file_size ? (plan.file_size / 1024 / 1024).toFixed(1) + ' MB' : 'N/A'}
                      </span>
                    </div>
                    <h3 className="font-bold text-white mb-3 truncate text-lg">{plan.file_name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(plan.created_at).toLocaleDateString('ru')}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => plan.file_url ? openPdfViewer(plan) : alert('URL файла недоступен')}
                          className="p-2 text-slate-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                          title="Просмотр плана"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => plan.file_url ? openDefectsViewer(plan) : alert('URL файла недоступен')}
                          className="p-2 text-slate-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                          title="Просмотр дефектов"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => plan.file_url ? downloadPlan(plan) : alert('URL файла недоступен')}
                          className="p-2 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-all duration-200"
                          title="Скачать"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                <FileImage className="w-12 h-12 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Планы не найдены</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                {searchTerm || filterType !== 'all' 
                  ? 'Попробуйте изменить фильтры поиска или очистить их'
                  : 'Для этой квартиры пока нет загруженных планов'
                }
              </p>
              {(userRole === 'foreman' || userRole === 'contractor' || userRole === 'technadzor') && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Загрузить первый план
                </button>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно загрузки */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Загрузка плана</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Тип плана</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="floor_plan">Планировка</option>
                  <option value="elevation">Фасад</option>
                  <option value="section">Разрез</option>
                  <option value="3d_model">3D модель</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Файл</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.dwg,.obj,.fbx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-white/10 rounded-xl bg-white/5 text-white file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-sm"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleFileUpload}
                  disabled={!uploadFile || uploading}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    uploadFile && !uploading
                      ? 'border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200'
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {uploading ? 'Загрузка...' : 'Загрузить'}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfViewer && selectedPlan && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-2xl border border-white/10 bg-slate-900/98 shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                {selectedPlan.file_name}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowDefectsMode(!showDefectsMode);
                  }}
                  className={`px-3 py-1 rounded-xl transition-colors ${
                    showDefectsMode
                      ? 'bg-red-500/30 text-red-200 border border-red-500/30'
                      : 'bg-white/10 text-slate-200 border border-white/10 hover:bg-white/15'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  {showDefectsMode ? 'Режим дефектов' : 'Добавить дефект'}
                </button>
                <button
                  onClick={() => downloadPlan(selectedPlan)}
                  className="px-3 py-1 border border-blue-500/30 bg-blue-500/20 text-blue-200 rounded-xl hover:bg-blue-500/30 transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Скачать
                </button>
                <button
                  onClick={closePdfViewer}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
             {/* PDF Content */}
             <div className="flex-1 relative">
               <div className="w-full h-full relative" onClick={handlePlanClick}>
                 <div style={{ 
                   transform: 'scale(1.15)', 
                   transformOrigin: 'top left',
                   width: '87%',
                   height: '87%'
                 }}>
                   <iframe
                     src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedPlan.file_url)}&embedded=true&toolbar=0`}
                     className="w-full h-full border-0"
                    style={{ 
                      margin: 0, 
                      padding: 0,
                      pointerEvents: showDefectsMode ? 'none' : 'auto',
                      userSelect: showDefectsMode ? 'none' : 'auto',
                      touchAction: showDefectsMode ? 'none' : 'auto'
                    }}
                     title={selectedPlan.file_name}
                   />
                 </div>
                 
                 {/* Overlay для режима создания дефектов */}
                 {showDefectsMode && (
                   <div className="absolute inset-0 cursor-crosshair bg-blue-500 bg-opacity-10" style={{ zIndex: 10, transform: 'scale(1.15)', transformOrigin: 'top left', width: '87%', height: '87%' }}>
                     <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
                       Кликните на план, чтобы добавить дефект
                     </div>
                   </div>
                 )}
                 
                 {/* Обычный просмотр плана без дефектов */}
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания дефекта */}
      {showCreateDefectForm && defectCoordinates && selectedApartment && (
        <CreateDefectForm
          apartmentId={selectedApartment.replace('apartment-', '')}
          xCoord={defectCoordinates.x}
          yCoord={defectCoordinates.y}
          onClose={() => {
            setShowCreateDefectForm(false);
            setDefectCoordinates(null);
          }}
          onSuccess={handleDefectCreated}
        />
      )}

      {/* Модальное окно просмотра дефектов */}
      {showDefectsViewer && selectedPlan && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-2xl border border-white/10 bg-slate-900/98 shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                Дефекты на плане: {selectedPlan.file_name}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadPlan(selectedPlan)}
                  className="px-3 py-1 border border-blue-500/30 bg-blue-500/20 text-blue-200 rounded-xl hover:bg-blue-500/30 transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Скачать план
                </button>
                <button
                  onClick={closeDefectsViewer}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 relative">
              <PlanWithSupabaseDefects
                key={defectsUpdateKey}
                planUrl={selectedPlan.file_url}
                apartmentId={selectedApartment.replace('apartment-', '')}
                className="w-full h-full"
                userRole={userRole}
                onDefectClick={(defect) => {
                  console.log('Дефект выбран:', defect);
                }}
                onStatusChange={(defectId, newStatus) => {
                  console.log('Статус дефекта изменен:', defectId, newStatus);
                  // Обновляем ключ для перезагрузки компонента
                  setDefectsUpdateKey(prev => prev + 1);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitecturalPlansView;
