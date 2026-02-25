#!/usr/bin/env python3
"""
Создание финального идеального письма с правильным выравниванием
"""

from learning_document_generator import LearningDocumentGenerator

def create_final_perfect_letter():
    """Создает финальное идеальное письмо"""
    print("📧 Создание финального идеального письма...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для финального идеального письма
    document_data = {
        'apartment_id': '2101',
        'apartment_number': '2101',
        'issue_type': 'смещение сроков монтажа сантехники',
        'issue_description': 'задержка в монтаже сантехнического оборудования в квартире 2101 из-за несоответствия размеров трубопроводов, что влияет на общие сроки сдачи объекта',
        'expected_resolution': 'Проведение дополнительных замеров и замена трубопроводов',
        'contact_person': 'Козлов К.К.',
        'phone': '+7 (999) 333-44-55'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Финальное идеальное письмо создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ФИНАЛЬНОГО ИДЕАЛЬНОГО ПИСЬМА:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать финальное идеальное письмо")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании финального идеального письма: {e}")
        return None

if __name__ == "__main__":
    create_final_perfect_letter()



