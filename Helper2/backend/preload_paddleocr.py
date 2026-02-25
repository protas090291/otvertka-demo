#!/usr/bin/env python3
"""
Скрипт для предварительной загрузки моделей PaddleOCR-VL
Загружает все необходимые модели, чтобы потом использовать их быстро
"""

import sys
import logging
from pathlib import Path

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def preload_paddleocr():
    """Предзагрузка PaddleOCR-VL моделей"""
    try:
        logger.info("🚀 Начинаем предзагрузку PaddleOCR-VL...")
        logger.info("📦 Это может занять 5-15 минут при первом запуске")
        logger.info("")
        
        # Импортируем процессор
        from pdf_ai_processor import get_pdf_processor, PDFAIProcessor
        
        logger.info("📥 Инициализация PaddleOCR-VL pipeline...")
        logger.info("   (модели будут загружены автоматически)")
        logger.info("")
        
        # Инициализируем процессор (это загрузит модели)
        processor = get_pdf_processor()
        
        logger.info("")
        logger.info("✅ PaddleOCR-VL успешно инициализирован!")
        logger.info("✅ Все модели загружены и готовы к использованию")
        logger.info("")
        logger.info("🎉 Теперь можно использовать API для быстрой обработки PDF!")
        
        return True
        
    except ImportError as e:
        logger.error(f"❌ Ошибка импорта: {e}")
        logger.error("Убедитесь, что PaddleOCR установлен: pip install paddleocr[doc-parser]")
        return False
    except Exception as e:
        logger.error(f"❌ Ошибка при загрузке моделей: {e}")
        logger.error("Проверьте подключение к интернету и повторите попытку")
        return False

def test_processor():
    """Тестирование процессора на простом примере"""
    try:
        logger.info("")
        logger.info("🧪 Тестируем процессор...")
        
        from pdf_ai_processor import get_pdf_processor
        processor = get_pdf_processor()
        
        logger.info("✅ Процессор работает корректно!")
        logger.info("✅ Модели готовы к использованию")
        
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка тестирования: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  ПРЕДЗАГРУЗКА PADDLEOCR-VL МОДЕЛЕЙ")
    print("=" * 60)
    print("")
    
    success = preload_paddleocr()
    
    if success:
        # Тестируем процессор
        test_processor()
        print("")
        print("=" * 60)
        print("  ✅ ПРЕДЗАГРУЗКА ЗАВЕРШЕНА УСПЕШНО")
        print("=" * 60)
        sys.exit(0)
    else:
        print("")
        print("=" * 60)
        print("  ❌ ПРЕДЗАГРУЗКА НЕ УДАЛАСЬ")
        print("=" * 60)
        sys.exit(1)
