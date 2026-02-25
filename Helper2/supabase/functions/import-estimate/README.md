# Edge Function: Импорт сметы из Excel/CSV

Эта Edge Function парсит файлы Excel (.xlsx, .xls) или CSV и загружает данные в таблицу `estimate_items`.

## Деплой

```bash
# Установите Supabase CLI если еще не установлен
npm install -g supabase

# Войдите в Supabase
supabase login

# Свяжите проект (если еще не связан)
supabase link --project-ref YOUR_PROJECT_REF

# Деплой функции
supabase functions deploy import-estimate
```

## Использование

### Из фронтенда:

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('estimate_id', estimateId);

const response = await fetch(
  `${SUPABASE_URL}/functions/v1/import-estimate`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: formData
  }
);

const result = await response.json();
```

## Параметры

- `file` (File): Файл Excel (.xlsx, .xls) или CSV
- `estimate_id` (string): ID сметы в таблице `estimates`

## Ответ

```json
{
  "success": true,
  "added": 150,
  "total": 150,
  "importedFromSheet": "Смета",
  "message": "Импортировано позиций: 150"
}
```

## Ошибки

- `400`: Отсутствует файл или estimate_id
- `400`: Неподдерживаемый формат файла
- `400`: Файл пустой или не содержит данных
- `500`: Ошибка парсинга или записи в БД
