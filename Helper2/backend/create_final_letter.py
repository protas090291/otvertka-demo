#!/usr/bin/env python3
"""
Создание финального письма с логотипом для демонстрации
"""

from letter_generator_with_logo import LetterGeneratorWithLogo

def create_final_demo_letter():
    """Создает финальное демонстрационное письмо"""
    print("📧 Создание финального демонстрационного письма...")
    
    generator = LetterGeneratorWithLogo()
    
    # Данные для финального письма
    apartment_id = "1601"
    issue_type = "смещение сроков монтажа"
    issue_description = "задержка в монтаже оконных блоков в квартире 1601 из-за несоответствия размеров, что влияет на общие сроки сдачи объекта"
    
    try:
        result = generator.create_letter_with_logo(
            apartment_id=apartment_id,
            issue_type=issue_type,
            issue_description=issue_description
        )
        
        if result:
            print("✅ Финальное письмо создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ФИНАЛЬНОГО ПИСЬМА:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать финальное письмо")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании финального письма: {e}")
        return None

if __name__ == "__main__":
    create_final_demo_letter()



