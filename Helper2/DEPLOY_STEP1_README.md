# Деплой, шаг 1: переменные окружения Supabase

Шаг 1 выполнен: URL и ключи Supabase вынесены в переменные окружения.

## Что сделано

- **`src/lib/supabase.ts`** — читает `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_SERVICE_ROLE_KEY` из `import.meta.env`. Если переменные не заданы, используются прежние значения (для обратной совместимости).
- **`env.example`** — добавлены переменные с префиксом `VITE_` для фронта.
- **`.gitignore`** — добавлены `.env.local`, `.env.production`, `.env.*.local`, чтобы секреты не попадали в репозиторий.

## Как проверить шаг 1

### Без .env (как раньше)

```bash
cd Helper2
npm run dev
```

Приложение должно работать как раньше: переменные не заданы → используются значения по умолчанию в коде.

### С .env.production (для сборки под деплой)

1. В папке `Helper2` создайте файл **`.env.production`** (он не коммитится в git).
2. Заполните его (подставьте свои данные из Supabase Dashboard → Settings → API):

```env
VITE_SUPABASE_URL=https://ваш-проект.supabase.co
VITE_SUPABASE_ANON_KEY=ваш_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key
```

3. Соберите проект:

```bash
cd Helper2
npm run build
```

4. Проверьте превью продакшен-сборки:

```bash
npm run preview
```

Откройте в браузере указанный адрес (обычно http://localhost:4173) и убедитесь, что логин и данные из Supabase работают.

## Дальше

После проверки переходим к **шагу 2** (сборка и загрузка на Timeweb).
