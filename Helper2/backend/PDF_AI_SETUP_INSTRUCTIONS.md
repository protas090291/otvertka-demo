# Инструкция по установке и настройке PaddleOCR-VL

## 📋 Что было сделано:

1. ✅ Создан модуль `pdf_ai_processor.py` для работы с PaddleOCR-VL
2. ✅ Добавлены API endpoints в `simple_main.py`:
   - `POST /api/pdf/process` - обработка загруженного PDF
   - `POST /api/pdf/process-url` - обработка PDF по URL
   - `GET /api/pdf/extract-text` - быстрое извлечение текста
   - `GET /api/pdf/extract-tables` - извлечение таблиц
   - `GET /api/pdf/health` - проверка доступности
3. ✅ Обновлен `requirements.txt` с необходимыми зависимостями

## 🚀 Установка зависимостей

### Вариант 1: С GPU (рекомендуется для лучшей производительности)

```bash
cd backend

# Установка PaddlePaddle для CUDA 12.6
# Для других версий CUDA см. https://www.paddlepaddle.org.cn/en/install/
python -m pip install paddlepaddle-gpu==3.2.1 -i https://www.paddlepaddle.org.cn/packages/stable/cu126/

# Установка PaddleOCR с поддержкой парсинга документов
python -m pip install -U "paddleocr[doc-parser]"

# Установка safetensors (специальная версия)
# Для Linux:
python -m pip install https://paddle-whl.bj.bcebos.com/nightly/cu126/safetensors/safetensors-0.6.2.dev0-cp38-abi3-linux_x86_64.whl

# Для Windows:
python -m pip install https://xly-devops.cdn.bcebos.com/safetensors-nightly/safetensors-0.6.2.dev0-cp38-abi3-win_amd64.whl

# Дополнительные зависимости
pip install pdf2image pypdf Pillow
```

### Вариант 2: Только CPU (медленнее, но проще)

```bash
cd backend

# Установка PaddlePaddle для CPU
python -m pip install paddlepaddle==3.2.1 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/

# Установка PaddleOCR
python -m pip install -U "paddleocr[doc-parser]"

# Дополнительные зависимости
pip install pdf2image pypdf Pillow
```

### Важно для macOS:

Для macOS рекомендуется использовать Docker, так как PaddlePaddle может иметь проблемы с совместимостью.

## 📦 Дополнительные системные зависимости

Для работы с PDF нужны системные библиотеки:

### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install poppler-utils
```

### macOS:
```bash
brew install poppler
```

### Windows:
Скачайте и установите poppler из: https://github.com/oschwartz10612/poppler-windows/releases/

## 🧪 Проверка установки

После установки проверьте:

```bash
cd backend
python -c "from pdf_ai_processor import PDFAIProcessor; print('✅ PaddleOCR-VL установлен успешно!')"
```

## 🎯 Использование API

### 1. Обработка загруженного PDF файла:

```bash
curl -X POST "http://localhost:8010/api/pdf/process" \
  -F "file=@document.pdf" \
  -F "extract_text=true" \
  -F "extract_tables=true" \
  -F "extract_formulas=true" \
  -F "extract_charts=true"
```

### 2. Обработка PDF по URL:

```bash
curl -X POST "http://localhost:8010/api/pdf/process-url" \
  -H "Content-Type: application/json" \
  -d '{
    "pdf_url": "https://example.com/document.pdf",
    "extract_text": true,
    "extract_tables": true,
    "extract_formulas": true,
    "extract_charts": true
  }'
```

### 3. Быстрое извлечение текста:

```bash
curl "http://localhost:8010/api/pdf/extract-text?pdf_url=https://example.com/document.pdf"
```

### 4. Извлечение таблиц:

```bash
curl "http://localhost:8010/api/pdf/extract-tables?pdf_url=https://example.com/document.pdf"
```

### 5. Проверка доступности:

```bash
curl "http://localhost:8010/api/pdf/health"
```

## 📝 Пример ответа API

```json
{
  "success": true,
  "data": {
    "file_name": "document.pdf",
    "file_size": 1234567,
    "pages": 5,
    "text": "Извлеченный текст из документа...",
    "tables": [
      {
        "page": 1,
        "data": [[...], [...]],
        "type": "table"
      }
    ],
    "formulas": ["E=mc²", "F=ma"],
    "charts": [...],
    "structure": {
      "headings": [...],
      "sections": [...]
    },
    "metadata": {
      "processed_at": "2025-01-XX...",
      "model": "PaddleOCR-VL-0.9B"
    }
  }
}
```

## ⚙️ Настройка производительности

### Использование GPU:

В `pdf_ai_processor.py` по умолчанию используется GPU (если доступно):

```python
processor = PDFAIProcessor(use_gpu=True)
```

### Использование CPU:

```python
processor = PDFAIProcessor(use_gpu=False)
```

## 🔧 Устранение проблем

### Проблема: "PaddleOCR-VL не установлен"

**Решение:** Убедитесь, что установлены все зависимости:
```bash
pip install paddleocr[doc-parser] paddlepaddle-gpu pdf2image
```

### Проблема: "poppler not found"

**Решение:** Установите poppler для вашей системы (см. выше)

### Проблема: "CUDA out of memory"

**Решение:** Используйте CPU версию или уменьшите размер обрабатываемых изображений

### Проблема: Медленная обработка

**Решение:** 
- Используйте GPU версию
- Обрабатывайте страницы по одной
- Используйте более низкое разрешение (dpi=200 вместо 300)

## 📚 Дополнительная информация

- [Официальная документация PaddleOCR-VL](https://huggingface.co/PaddlePaddle/PaddleOCR-VL)
- [PaddlePaddle Installation Guide](https://www.paddlepaddle.org.cn/en/install/)
- [PaddleOCR Documentation](https://github.com/PaddlePaddle/PaddleOCR)

## 🎉 Готово!

После установки всех зависимостей перезапустите backend:

```bash
cd backend
uvicorn simple_main:app --host 0.0.0.0 --port 8010
```

API будет доступно по адресу: `http://localhost:8010/api/pdf/`

