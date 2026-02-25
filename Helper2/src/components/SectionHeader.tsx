import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  actions?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon: Icon,
  iconColor = 'text-blue-600',
  actions
}) => {
  try {
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {Icon && typeof Icon !== 'undefined' && (
            <div className={`${iconColor} flex items-center justify-center`}>
              <Icon className="w-8 h-8" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in SectionHeader:', error);
    // Fallback на простой заголовок без иконки
    return (
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    );
  }
};

export default SectionHeader;

