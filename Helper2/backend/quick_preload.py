#!/usr/bin/env python3
"""
Быстрая предзагрузка PaddleOCR-VL
Просто инициализирует модель без обработки файлов
"""

import logging
import sys

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def quick_preload():
    """Быстрая предзагрузка - только инициализация"""
    try:
        print("🚀 Начинаем предзагрузку PaddleOCR-VL...")
        print("📦 Загрузка моделей (~1-2 ГБ, 5-15 минут)...")
        print("")
        
        # Импортируем и инициализируем
        from pdf_ai_processor import PDFAIProcessor
        
        print("⏳ Инициализация pipeline (загрузка моделей)...")
        processor = PDFAIProcessor()
        
        print("")
        print("✅ PaddleOCR-VL успешно загружен!")
        print("✅ Модели готовы к использованию")
        print("")
        print("🎉 Теперь API будет работать быстро!")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    success = quick_preload()
    sys.exit(0 if success else 1)





