#!/usr/bin/env python3
"""
Создание письма с одним символом подчеркивания перед и после даты
"""

from learning_document_generator import LearningDocumentGenerator

def create_single_underline_letter():
    """Создает письмо с одним символом подчеркивания перед и после даты"""
    print("📧 Создание письма с одним символом подчеркивания перед и после даты...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для письма с одним подчеркиванием
    document_data = {
        'apartment_id': '4001',
        'apartment_number': '4001',
        'issue_type': 'проблема с вентиляцией',
        'issue_description': 'обнаружена проблема с системой вентиляции в квартире 4001, требующая технического решения',
        'expected_resolution': 'Устранение проблемы с вентиляцией и проверка системы',
        'contact_person': 'Козлов К.К.',
        'phone': '+7 (999) 444-33-22'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Письмо с одним подчеркиванием создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ПИСЬМА С ОДНИМ ПОДЧЕРКИВАНИЕМ:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать письмо с одним подчеркиванием")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании письма с одним подчеркиванием: {e}")
        return None

if __name__ == "__main__":
    create_single_underline_letter()



