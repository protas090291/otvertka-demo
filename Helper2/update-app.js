#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Обновление App.tsx для использования API компонентов...');

const appPath = path.join(__dirname, 'src', 'App.tsx');

try {
  // Читаем файл App.tsx
  let content = fs.readFileSync(appPath, 'utf8');
  
  // Заменяем импорты
  content = content.replace(
    "import BudgetView from './components/BudgetView';",
    "import BudgetViewWithAPI from './components/BudgetViewWithAPI';"
  );
  
  content = content.replace(
    "import MaterialsView from './components/MaterialsView';",
    "import MaterialsViewWithAPI from './components/MaterialsViewWithAPI';"
  );
  
  // Заменяем компоненты в JSX
  content = content.replace(
    /<BudgetView userRole=\{userRole\} \/>/g,
    '<BudgetViewWithAPI userRole={userRole} />'
  );
  
  content = content.replace(
    /<MaterialsView userRole=\{userRole\} \/>/g,
    '<MaterialsViewWithAPI userRole={userRole} />'
  );
  
  // Сохраняем обновленный файл
  fs.writeFileSync(appPath, content);
  
  console.log('✅ App.tsx успешно обновлен!');
  console.log('📝 Изменения:');
  console.log('   - BudgetView → BudgetViewWithAPI');
  console.log('   - MaterialsView → MaterialsViewWithAPI');
  console.log('');
  console.log('🚀 Теперь компоненты будут использовать реальные данные из базы данных!');
  
} catch (error) {
  console.error('❌ Ошибка обновления App.tsx:', error.message);
  process.exit(1);
}
