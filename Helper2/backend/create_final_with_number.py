#!/usr/bin/env python3
"""
Создание финального письма с номером документа
"""

from learning_document_generator import LearningDocumentGenerator

def create_final_with_number():
    """Создает финальное письмо с номером документа"""
    print("📧 Создание финального письма с номером документа...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для финального письма
    document_data = {
        'apartment_id': '2601',
        'apartment_number': '2601',
        'issue_type': 'смещение сроков монтажа систем вентиляции',
        'issue_description': 'задержка в монтаже систем вентиляции в квартире 2601 из-за несоответствия проектных решений, что влияет на общие сроки сдачи объекта',
        'expected_resolution': 'Корректировка проектных решений и ускорение монтажных работ',
        'contact_person': 'Новиков Н.Н.',
        'phone': '+7 (999) 666-77-88'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Финальное письмо с номером документа создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ФИНАЛЬНОГО ПИСЬМА С НОМЕРОМ:")
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
    create_final_with_number()



