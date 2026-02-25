// Расчет качества проекта на основе данных из интерфейса

// Данные из интерфейса (статические данные для "Вишневый сад")
const projectData = {
  progress: 3, // Реальный прогресс из progress_data (как отображается в интерфейсе)
  startDate: '2025-06-20',
  endDate: '2026-06-20',
  budget: 180000000,
  spent: 117000000
};

// Расчет времени
const currentDate = new Date();
const startDate = new Date(projectData.startDate).getTime();
const endDate = new Date(projectData.endDate).getTime();
const currentTime = currentDate.getTime();

const timeProgress = (startDate > 0 && endDate > 0 && endDate > startDate)
  ? Math.min(Math.max(((currentTime - startDate) / (endDate - startDate)) * 100, 0), 100)
  : 0;

// Расчет использования бюджета
const budgetUsage = (projectData.budget && projectData.budget > 0 && projectData.spent)
  ? (projectData.spent / projectData.budget) * 100
  : 0;

// Расчет эффективности
const efficiency = timeProgress > 0 
  ? Math.min((projectData.progress / timeProgress) * 100, 200)
  : projectData.progress > 0 ? 100 : 0;

// Нормализация эффективности в 0-100 баллов
const normalizedEfficiency = Math.min(efficiency / 2, 100);

// Соблюдение бюджета
const budgetAdherence = budgetUsage > 0 
  ? Math.max(100 - Math.max(budgetUsage - 100, 0) * 2, 0)
  : 100;

// Расчет качества
const qualityScore = Math.round((normalizedEfficiency * 0.4) + (budgetAdherence * 0.35) + (projectData.progress * 0.25));

// Вывод результатов
console.log('📊 Расчет качества проекта "ЖК Вишневый сад":');
console.log('─────────────────────────────────────────');
console.log('📈 Входные данные:');
console.log(`   Прогресс работ: ${projectData.progress}%`);
console.log(`   Время прошло: ${timeProgress.toFixed(2)}%`);
console.log(`   Использование бюджета: ${budgetUsage.toFixed(2)}%`);
console.log(`   Даты: ${projectData.startDate} — ${projectData.endDate}`);
console.log(`   Бюджет: ${(projectData.budget / 1000000).toFixed(0)} млн руб.`);
console.log(`   Потрачено: ${(projectData.spent / 1000000).toFixed(0)} млн руб.`);
console.log('');
console.log('🧮 Расчет метрик:');
console.log(`   1. Эффективность: (${projectData.progress}% / ${timeProgress.toFixed(2)}%) × 100 = ${efficiency.toFixed(2)}%`);
console.log(`      → Нормализованная эффективность: ${efficiency.toFixed(2)}% / 2 = ${normalizedEfficiency.toFixed(2)} баллов`);
console.log(`   2. Соблюдение бюджета: max(100 - max(${budgetUsage.toFixed(2)} - 100, 0) × 2, 0) = ${budgetAdherence.toFixed(2)} баллов`);
console.log(`   3. Прогресс: ${projectData.progress}%`);
console.log('');
console.log('🎯 Расчет качества:');
console.log(`   Качество = (${normalizedEfficiency.toFixed(2)} × 0.4) + (${budgetAdherence.toFixed(2)} × 0.35) + (${projectData.progress} × 0.25)`);
console.log(`   Качество = ${(normalizedEfficiency * 0.4).toFixed(2)} + ${(budgetAdherence * 0.35).toFixed(2)} + ${(projectData.progress * 0.25).toFixed(2)}`);
console.log(`   Качество = ${qualityScore}%`);
console.log('─────────────────────────────────────────');

















