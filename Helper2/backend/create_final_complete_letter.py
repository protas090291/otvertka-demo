#!/usr/bin/env python3
"""
Создание финального письма с полным форматированием
"""

from learning_document_generator import LearningDocumentGenerator

def create_final_complete_letter():
    """Создает финальное письмо с полным форматированием"""
    print("📧 Создание финального письма с полным форматированием...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для финального письма
    document_data = {
        'apartment_id': '2701',
        'apartment_number': '2701',
        'issue_type': 'смещение сроков монтажа систем кондиционирования',
        'issue_description': 'задержка в монтаже систем кондиционирования в квартире 2701 из-за несоответствия технических характеристик оборудования, что влияет на общие сроки сдачи объекта',
        'expected_resolution': 'Замена оборудования и ускорение монтажных работ',
        'contact_person': 'Орлов О.О.',
        'phone': '+7 (999) 555-66-77'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Финальное письмо с полным форматированием создано!")
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
    create_final_complete_letter()



