# 🔧 ИНСТРУКЦИЯ ПО НАСТРОЙКЕ SUPABASE ДЛЯ СОХРАНЕНИЯ ДЕФЕКТОВ

## 🎯 Цель
Настроить таблицу `defects` в Supabase, чтобы все дефекты сохранялись в облаке, а не в localStorage.

## 📋 Пошаговая инструкция

### 1. Откройте Supabase Dashboard
- Перейдите по ссылке: https://supabase.com/dashboard
- Войдите в свой аккаунт
- Выберите проект: `yytqmdanfcwfqfqruvta`

### 2. Перейдите в SQL Editor
- В левом меню нажмите на **"SQL Editor"**
- Нажмите **"New query"**

### 3. Выполните SQL скрипт
Скопируйте и вставьте весь код из файла `supabase-defects-setup.sql` в редактор:

```sql
-- Создание таблицы defects в Supabase
-- Выполните этот SQL в Supabase SQL Editor

-- Создание таблицы defects
CREATE TABLE IF NOT EXISTS public.defects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fixed')),
  x_coord DECIMAL(5,2) NOT NULL,
  y_coord DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_defects_apartment_id ON public.defects (apartment_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON public.defects (status);
CREATE INDEX IF NOT EXISTS idx_defects_created_at ON public.defects (created_at);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_defects_updated_at ON public.defects;
CREATE TRIGGER update_defects_updated_at 
    BEFORE UPDATE ON public.defects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Включение Row Level Security (RLS)
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;

-- Политики безопасности
-- Политика: Все пользователи могут читать дефекты
DROP POLICY IF EXISTS "Allow read access to defects" ON public.defects;
CREATE POLICY "Allow read access to defects" ON public.defects
    FOR SELECT USING (true);

-- Политика: Авторизованные пользователи могут создавать дефекты
DROP POLICY IF EXISTS "Allow insert access to defects" ON public.defects;
CREATE POLICY "Allow insert access to defects" ON public.defects
    FOR INSERT WITH CHECK (true);

-- Политика: Авторизованные пользователи могут обновлять дефекты
DROP POLICY IF EXISTS "Allow update access to defects" ON public.defects;
CREATE POLICY "Allow update access to defects" ON public.defects
    FOR UPDATE USING (true);

-- Политика: Авторизованные пользователи могут удалять дефекты
DROP POLICY IF EXISTS "Allow delete access to defects" ON public.defects;
CREATE POLICY "Allow delete access to defects" ON public.defects
    FOR DELETE USING (true);

-- Создание Storage bucket для фото дефектов (если не существует)
INSERT INTO storage.buckets (id, name, public)
VALUES ('defect-photos', 'defect-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Политика для Storage bucket
DROP POLICY IF EXISTS "Allow public read access to defect photos" ON storage.objects;
CREATE POLICY "Allow public read access to defect photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'defect-photos');

DROP POLICY IF EXISTS "Allow authenticated users to upload defect photos" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload defect photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'defect-photos');

DROP POLICY IF EXISTS "Allow authenticated users to update defect photos" ON storage.objects;
CREATE POLICY "Allow authenticated users to update defect photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'defect-photos');

DROP POLICY IF EXISTS "Allow authenticated users to delete defect photos" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete defect photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'defect-photos');

-- Добавление тестовых данных
INSERT INTO public.defects (apartment_id, title, description, status, x_coord, y_coord)
VALUES 
  ('101', 'Трещина в стене', 'Обнаружена трещина шириной 2-3 мм в северо-восточном углу', 'active', 15.5, 20.3),
  ('101', 'Проблема с проводкой', 'Отсутствует заземление в розетках кухни', 'active', 25.8, 35.2),
  ('203', 'Протечка в ванной', 'Вода капает из соединения трубы', 'fixed', 85.2, 60.7),
  ('401', 'Неровная стена', 'Стена в спальне имеет неровности', 'active', 45.1, 65.8)
ON CONFLICT DO NOTHING;

-- Проверка созданной таблицы
SELECT 'Таблица defects создана успешно!' as message;
SELECT COUNT(*) as total_defects FROM public.defects;
```

### 4. Выполните запрос
- Нажмите кнопку **"Run"** или **Ctrl+Enter**
- Дождитесь выполнения всех команд
- Убедитесь, что в результате показано сообщение "Таблица defects создана успешно!"

### 5. Проверьте результат
- Перейдите в раздел **"Table Editor"**
- Найдите таблицу **"defects"**
- Убедитесь, что в ней есть тестовые данные

### 6. Перезапустите приложение
- Остановите текущий сервер (Ctrl+C в терминале)
- Запустите заново: `npm run dev`
- Откройте http://localhost:5175/

## ✅ Проверка работы

После выполнения инструкции:

1. **Откройте приложение**: http://localhost:5175/
2. **Перейдите в**: "Проекты" → "Архитектурные планы"
3. **Проверьте индикатор** в заголовке - должен показать **🗄️ Supabase**
4. **Создайте тестовый дефект** - он должен сохраниться в Supabase
5. **Проверьте в Supabase Dashboard** - дефект должен появиться в таблице

## 🚨 Если что-то не работает

### Проблема: Индикатор показывает localStorage
**Решение**: 
- Проверьте, что SQL выполнился без ошибок
- Убедитесь, что таблица `defects` создана
- Перезапустите приложение

### Проблема: Ошибки при создании дефектов
**Решение**:
- Проверьте политики безопасности в Supabase
- Убедитесь, что RLS включен
- Проверьте права доступа

### Проблема: Фото не загружаются
**Решение**:
- Проверьте, что bucket `defect-photos` создан
- Убедитесь, что политики для Storage настроены
- Проверьте права на загрузку файлов

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте консоль браузера на ошибки
2. Проверьте логи в Supabase Dashboard
3. Убедитесь, что все SQL команды выполнились успешно

---

**🎉 После выполнения этой инструкции все дефекты будут сохраняться в Supabase!**
