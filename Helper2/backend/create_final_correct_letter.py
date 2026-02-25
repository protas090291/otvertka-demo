#!/usr/bin/env python3
"""
Создание финального письма с правильным форматированием (знак № не подчеркнут)
"""

from learning_document_generator import LearningDocumentGenerator

def create_final_correct_letter():
    """Создает финальное письмо с правильным форматированием"""
    print("📧 Создание финального письма с правильным форматированием (знак № не подчеркнут)...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для финального письма
    document_data = {
        'apartment_id': '2001',
        'apartment_number': '2001',
        'issue_type': 'смещение сроков монтажа',
        'issue_description': 'смещение сроков монтажа инженерных систем в квартире 2001, что влияет на общие сроки сдачи объекта',
        'expected_resolution': 'Ускорение монтажных работ и соблюдение сроков',
        'contact_person': 'Петров П.П.',
        'phone': '+7 (999) 555-44-33'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Финальное письмо с правильным форматированием создано!")
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
    create_final_correct_letter()



