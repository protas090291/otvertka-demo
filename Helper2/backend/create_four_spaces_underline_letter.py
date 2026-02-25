#!/usr/bin/env python3
"""
Создание письма с четырьмя пробелами перед первым подчеркиванием
"""

from learning_document_generator import LearningDocumentGenerator

def create_four_spaces_underline_letter():
    """Создает письмо с четырьмя пробелами перед первым подчеркиванием"""
    print("📧 Создание письма с четырьмя пробелами перед первым подчеркиванием...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для письма с четырьмя пробелами перед подчеркиванием
    document_data = {
        'apartment_id': '9001',
        'apartment_number': '9001',
        'issue_type': 'проблема с отоплением',
        'issue_description': 'обнаружена проблема с системой отопления в квартире 9001, требующая технического решения',
        'expected_resolution': 'Устранение проблемы с отоплением и проверка системы',
        'contact_person': 'Отопленов О.О.',
        'phone': '+7 (999) 777-88-99'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Письмо с четырьмя пробелами перед подчеркиванием создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ПИСЬМА С ЧЕТЫРЬМЯ ПРОБЕЛАМИ ПЕРЕД ПОДЧЕРКИВАНИЕМ:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать письмо с четырьмя пробелами перед подчеркиванием")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании письма с четырьмя пробелами перед подчеркиванием: {e}")
        return None

if __name__ == "__main__":
    create_four_spaces_underline_letter()



