#!/usr/bin/env python3
"""
Проверка статуса предзагрузки PaddleOCR-VL
"""

import sys
import os

def check_status():
    """Проверяет статус загрузки"""
    try:
        # Пробуем импортировать и проверить, загружена ли модель
        from pdf_ai_processor import _processor_instance, PADDLEOCR_AVAILABLE
        
        print("=" * 60)
        print("  СТАТУС PADDLEOCR-VL")
        print("=" * 60)
        print("")
        
        if not PADDLEOCR_AVAILABLE:
            print("❌ PaddleOCR-VL библиотека не установлена")
            return False
        
        print("✅ Библиотека установлена")
        
        if _processor_instance is not None:
            print("✅ Модель загружена и готова к использованию!")
            print("")
            print("🎉 Можно использовать API для быстрой обработки PDF")
            return True
        else:
            print("⏳ Модель еще не загружена")
            print("")
            print("📝 Проверьте логи загрузки:")
            print("   tail -f Helper2/backend/preload.log")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка проверки: {e}")
        return False

if __name__ == "__main__":
    check_status()





