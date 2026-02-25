import React from 'react';
import {
  Target,
  TrendingUp,
  AlertCircle,
  Map,
  Building2,
  Users,
  ChevronRight,
  Mail,
  MapPin,
  Calendar,
  Shield,
  BarChart3,
} from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen">
      {/* Шапка */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
              <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full" />
              </div>
            </div>
            <span className="text-lg font-semibold text-slate-900">Отвёртка</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#strategy" className="hover:text-slate-900 transition-colors">Стратегия</a>
            <a href="#roadmap" className="hover:text-slate-900 transition-colors">План на год</a>
            <a href="#risks" className="hover:text-slate-900 transition-colors">Риски</a>
            <a href="#growth" className="hover:text-slate-900 transition-colors">Рост</a>
            <a href="#product" className="hover:text-slate-900 transition-colors">Продукт</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Контакты</a>
          </nav>
        </div>
      </header>

      {/* Герой — стратегическая позиция */}
      <section className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Стратегия развития продукта и компании
          </h1>
          <p className="text-xl text-slate-200 mb-10 max-w-2xl mx-auto">
            Платформа «Отвёртка» — не только продукт, но и основа масштабирования бизнеса: планирование на год, риски, рост команды и выручки.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#strategy" className="btn-accent inline-flex items-center gap-2">
              Стратегия и цели
              <ChevronRight className="w-5 h-5" />
            </a>
            <a href="#growth" className="btn-primary inline-flex items-center gap-2 text-white">
              Рост и метрики
            </a>
          </div>
        </div>
      </section>

      {/* Стратегическое планирование на год */}
      <section id="strategy" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Стратегическое планирование на год</h2>
          <p className="text-slate-300 text-center mb-12 max-w-2xl mx-auto">
            Цели компании и продукта, привязка к кварталам и ключевым результатам.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Цель года', desc: 'Укрепить позицию единой платформы для заказчиков и подрядчиков: стабилизация продукта, первые платящие клиенты, масштабируемая команда.' },
              { icon: BarChart3, title: 'Ключевые результаты', desc: 'KPI: количество активных проектов, пользователей по ролям, конверсия в платящих. Рост выручки и повторных внедрений.' },
              { icon: Calendar, title: 'Горизонт планирования', desc: 'Квартальные вехи: Q1 — стабилизация и документация, Q2 — продажи и онбординг, Q3–Q4 — масштабирование и новые модули.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-glass rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* План на год / Дорожная карта */}
      <section id="roadmap" className="py-16 px-4 sm:px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">План на год</h2>
          <p className="text-slate-300 text-center mb-12 max-w-2xl mx-auto">
            Этапы развития продукта и компании (данные для заполнения).
          </p>
          <div className="card-glass rounded-2xl p-8 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <Map className="w-8 h-8 text-blue-500 shrink-0 mt-1" />
              <div className="space-y-4 text-slate-700">
                <div>
                  <h3 className="font-semibold text-slate-900">Q1</h3>
                  <p className="text-sm">Стабилизация продукта, тесты, документация. Формирование команды (2 fullstack). Завершение ключевых сценариев сметы и задач.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Q2</h3>
                  <p className="text-sm">Запуск продаж и онбординга первых клиентов. Маркетинг, демо, пилотные внедрения. Сбор обратной связи и приоритизация доработок.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Q3–Q4</h3>
                  <p className="text-sm">Масштабирование: новые модули по обратной связи, интеграции, мобильное приложение (при необходимости). Рост выручки и доли рынка.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Риски в развитии */}
      <section id="risks" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Риски в развитии</h2>
          <p className="text-slate-300 text-center mb-12 max-w-2xl mx-auto">
            Основные риски и меры по их снижению.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: AlertCircle, title: 'Технические риски', desc: 'Зависимость от стека (Supabase, React). Снижение: документация, тесты, возможность миграции ключевых частей при необходимости.' },
              { icon: Users, title: 'Команда и ключевые люди', desc: 'Риск ухода ключевых разработчиков. Снижение: найм 2 fullstack, документирование архитектуры и процессов.' },
              { icon: Shield, title: 'Рыночные и операционные', desc: 'Конкуренция, скорость принятия решений клиентами. Снижение: фокус на нише, быстрый онбординг и поддержка.' },
              { icon: TrendingUp, title: 'Финансовые', desc: 'Окупаемость и cash flow. Снижение: поэтапное масштабирование, привязка затрат к этапам и выручке.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-glass rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-amber-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Рост программы и компании */}
      <section id="growth" className="py-16 px-4 sm:px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Рост программы и компании</h2>
          <p className="text-slate-300 text-center mb-12 max-w-2xl mx-auto">
            Как рост продукта связан с развитием компании: метрики, команда, рынок.
          </p>
          <div className="card-glass rounded-2xl p-8 max-w-3xl mx-auto space-y-6">
            <div className="flex items-start gap-4">
              <TrendingUp className="w-8 h-8 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Рост продукта</h3>
                <p className="text-slate-600 text-sm">Расширение функционала (смета, задачи, дефекты, отчёты), стабильность, UX. Продукт как основа монетизации и привлечения клиентов.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <BarChart3 className="w-8 h-8 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Метрики роста компании</h3>
                <p className="text-slate-600 text-sm">Активные проекты, платящие организации, MRR/ARR, удержание. Рост команды (разработка, поддержка, продажи) в привязке к выручке.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Building2 className="w-8 h-8 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Связь продукта и компании</h3>
                <p className="text-slate-600 text-sm">Платформа — ядро предложения. Успех продукта напрямую влияет на выручку, репутацию и возможность масштабировать команду и охват рынка.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Продукт — кратко */}
      <section id="product" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Продукт «Отвёртка»</h2>
          <p className="text-slate-300 text-center mb-10 max-w-2xl mx-auto">
            Единая платформа для управления строительными проектами: проекты, сметы, задачи, дефекты, отчёты, роли (Заказчик, Подрядчик, Прораб, Рабочий, Складчик, ТехНадзор).
          </p>
          <div className="card-glass rounded-2xl p-6 max-w-2xl mx-auto text-slate-700 text-sm">
            <p>Стек: React, TypeScript, Vite, Tailwind; FastAPI; Supabase. Импорт смет из Excel/CSV, интеграции, генерация документов. Данный блок можно сократить или расширить под презентацию продукта.</p>
          </div>
        </div>
      </section>

      {/* Команда и вакансии */}
      <section id="team" className="py-16 px-4 sm:px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Команда и вакансии</h2>
          <p className="text-slate-300 text-center mb-10 max-w-2xl mx-auto">
            Рост команды — часть стратегии на год.
          </p>
          <div className="card-glass rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Набор в команду</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Планируем найм 2 fullstack-разработчиков (React/TypeScript, FastAPI, Supabase) для поддержки и развития платформы в рамках годового плана.
                </p>
                <p className="text-slate-500 text-sm">
                  Напишите нам в блоке «Контакты», если хотите присоединиться к проекту.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Контакты */}
      <section id="contact" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Контакты</h2>
          <p className="text-slate-300 text-center mb-12 max-w-2xl mx-auto">
            Вопросы по стратегии, партнёрству, вакансиям или демо продукта — напишите нам.
          </p>
          <div className="card-glass rounded-2xl p-8 max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-4 text-slate-700">
              <Mail className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</p>
                <p className="font-medium">contact@example.com</p>
                <p className="text-sm text-slate-500">(замените на ваш контакт)</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Адрес</p>
                <p className="font-medium">Город, улица, офис</p>
                <p className="text-sm text-slate-500">(замените на ваш адрес)</p>
              </div>
            </div>
            <p className="text-center text-slate-500 text-sm pt-4">
              Тексты и данные можно править в <code className="bg-slate-100 px-1 rounded">Helper2/landing/src/App.tsx</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Подвал */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full" />
            <span>Отвёртка</span>
          </div>
          <p>© {new Date().getFullYear()} Стратегическая презентация. Продукт и развитие компании.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
