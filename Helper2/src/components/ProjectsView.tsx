import React, { useState } from 'react';
import { Plus, Filter, Search, FileImage } from 'lucide-react';
import { UserRole, Project } from '../types';
import ProjectCard from './ProjectCard';

interface ProjectsViewProps {
  userRole: UserRole;
  onNavigateToPlans?: () => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ userRole, onNavigateToPlans }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const projects: Project[] = [
    {
      id: 'zhk-vishnevyy-sad',
      name: 'ЖК "Вишневый сад"',
      status: 'in-progress',
      progress: 65,
      startDate: '2025-06-20',
      endDate: '2026-06-20',
      budget: 180000000,
      spent: 117000000,
      client: 'ООО "АБ ДЕВЕЛОПМЕНТ ЦЕНТР"',
      foreman: 'Иванов И.И.',
      architect: 'Петров П.П.',
      description: 'Строительство жилого комплекса'
    }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
          <p className="text-slate-600 mt-1">Управление строительными проектами</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Кнопка архитектурных планов */}
          <button 
            onClick={onNavigateToPlans}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FileImage className="w-4 h-4" />
            <span>Архитектурные планы</span>
          </button>
          
          {(userRole === 'foreman' || userRole === 'client' || userRole === 'storekeeper') && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Новый проект</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск проектов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все статусы</option>
              <option value="planning">Планирование</option>
              <option value="in-progress">В работе</option>
              <option value="completed">Завершён</option>
              <option value="on-hold">Приостановлен</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Проекты не найдены</p>
          <p className="text-gray-400 mt-2">Попробуйте изменить параметры поиска</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsView;