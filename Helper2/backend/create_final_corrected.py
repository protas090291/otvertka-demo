#!/usr/bin/env python3
"""
Создание финального исправленного письма без рамок и с правильным выравниванием
"""

from precise_letter_generator import PreciseLetterGenerator

def create_final_corrected():
    """Создает финальное исправленное письмо"""
    print("📧 Создание финального исправленного письма...")
    
    generator = PreciseLetterGenerator()
    
    # Данные для финального письма
    apartment_id = "2001"
    issue_type = "техническая проблема с вентиляцией"
    issue_description = "обнаружены несоответствия в системе вентиляции квартиры 2001, требующие дополнительной проверки и корректировки"
    
    try:
        result = generator.create_precise_letter(
            apartment_id=apartment_id,
            issue_type=issue_type,
            issue_description=issue_description
        )
        
        if result:
            print("✅ Финальное исправленное письмо создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ФИНАЛЬНОГО ИСПРАВЛЕННОГО ПИСЬМА:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать финальное исправленное письмо")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании финального исправленного письма: {e}")
        return None

if __name__ == "__main__":
    create_final_corrected()



