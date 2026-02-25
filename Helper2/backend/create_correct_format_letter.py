#!/usr/bin/env python3
"""
Создание письма с правильным форматированием даты и номера документа
"""

from learning_document_generator import LearningDocumentGenerator

def create_correct_format_letter():
    """Создает письмо с правильным форматированием даты и номера документа"""
    print("📧 Создание письма с правильным форматированием даты и номера документа...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для письма с правильным форматированием
    document_data = {
        'apartment_id': '1503',
        'apartment_number': '1503',
        'issue_type': 'техническая проблема',
        'issue_description': 'обнаружена техническая проблема в квартире 1503, требующая немедленного решения',
        'expected_resolution': 'Устранение технической проблемы и проверка качества работ',
        'contact_person': 'Иванов И.И.',
        'phone': '+7 (999) 777-66-55'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Письмо с правильным форматированием создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ПИСЬМА С ПРАВИЛЬНЫМ ФОРМАТИРОВАНИЕМ:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать письмо с правильным форматированием")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании письма с правильным форматированием: {e}")
        return None

if __name__ == "__main__":
    create_correct_format_letter()



