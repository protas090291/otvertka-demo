// Расчет оставшихся дней до конца проекта "ЖК Вишневый сад"

// Данные проекта
const projectData = {
  name: 'ЖК "Вишневый сад"',
  startDate: '2025-06-20',
  endDate: '2026-06-20'
};

// Текущая дата
const currentDate = new Date();
const startDate = new Date(projectData.startDate);
const endDate = new Date(projectData.endDate);

// Расчеты
const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
const daysFromStart = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
const daysRemaining = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));

// Процент времени
const timeProgress = totalDays > 0 
  ? Math.min(Math.max(((currentDate - startDate) / (endDate - startDate)) * 100, 0), 100)
  : 0;

// Вывод результатов
console.log('═══════════════════════════════════════════════════════════');
console.log(`📅 Расчет оставшихся дней для проекта "${projectData.name}"`);
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('📊 Данные проекта:');
console.log(`   Дата начала:     ${projectData.startDate}`);
console.log(`   Дата окончания:  ${projectData.endDate}`);
console.log(`   Текущая дата:    ${currentDate.toISOString().split('T')[0]}`);
console.log('');
console.log('📈 Расчет:');
console.log(`   Всего дней проекта:  ${totalDays} дней`);
console.log(`   Дней прошло:        ${daysFromStart} дней`);
console.log(`   Осталось дней:     ${daysRemaining} дней`);
console.log(`   Процент времени:   ${timeProgress.toFixed(2)}%`);
console.log('');
console.log('═══════════════════════════════════════════════════════════');

// Дополнительная информация
if (daysRemaining < 0) {
  console.log('⚠️  ПРОЕКТ ПРОСРОЧЕН!');
  console.log(`   Просрочено на: ${Math.abs(daysRemaining)} дней`);
} else if (daysRemaining <= 30) {
  console.log('⚠️  БЛИЗКО К ДЕДЛАЙНУ!');
  console.log(`   Осталось менее 30 дней`);
} else {
  console.log('✅ Проект в норме');
  console.log(`   Осталось ${daysRemaining} дней до завершения`);
}

console.log('═══════════════════════════════════════════════════════════');










