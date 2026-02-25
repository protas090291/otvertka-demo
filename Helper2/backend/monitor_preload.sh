#!/bin/bash
# Скрипт для мониторинга загрузки PaddleOCR-VL

echo "🔍 Мониторинг загрузки PaddleOCR-VL"
echo "=================================="
echo ""

# Проверяем процессы
PROCESSES=$(ps aux | grep -E "python.*preload|python.*pdf_ai" | grep -v grep | wc -l | tr -d ' ')
if [ "$PROCESSES" -gt 0 ]; then
    echo "✅ Процесс загрузки активен"
    echo ""
    ps aux | grep -E "python.*preload|python.*pdf_ai" | grep -v grep
    echo ""
else
    echo "ℹ️  Процесс загрузки не найден (возможно, уже завершен)"
    echo ""
fi

# Проверяем логи
if [ -f "preload_output.log" ]; then
    echo "📋 Последние строки лога:"
    echo "---"
    tail -10 preload_output.log
    echo "---"
    echo ""
    echo "💡 Для просмотра в реальном времени: tail -f preload_output.log"
elif [ -f "preload.log" ]; then
    echo "📋 Последние строки лога:"
    echo "---"
    tail -10 preload.log
    echo "---"
    echo ""
else
    echo "ℹ️  Лог файл еще не создан"
    echo ""
fi

# Проверяем статус модели
echo "🔍 Проверка статуса модели:"
python3 -c "
try:
    from pdf_ai_processor import _processor_instance, PADDLEOCR_AVAILABLE
    if PADDLEOCR_AVAILABLE:
        print('✅ Библиотека установлена')
        if _processor_instance is not None:
            print('✅ Модель загружена и готова!')
        else:
            print('⏳ Модель еще загружается...')
    else:
        print('❌ Библиотека не установлена')
except Exception as e:
    print(f'⚠️  Ошибка: {e}')
" 2>/dev/null





