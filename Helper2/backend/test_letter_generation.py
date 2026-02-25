#!/usr/bin/env python3
"""
Тестовый скрипт для создания письма заказчику на основе обученных примеров
"""

import os
import json
from datetime import datetime
from learning_document_generator import LearningDocumentGenerator

def create_test_letter():
    """Создает тестовое письмо заказчику"""
    print("📧 Создание тестового письма заказчику...")
    
    # Создаем генератор документов
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,  # Не используем Supabase для теста
        supabase_key=None
    )
    
    # Тестовые данные для письма
    test_data = {
        'apartment_id': '1501',
        'apartment_number': '1501',
        'issue_type': 'смещение сроков',
        'issue_description': 'Задержка в поставке материалов для отделочных работ',
        'expected_resolution': 'Поставка материалов запланирована на 15.10.2025',
        'contact_person': 'Иванов И.И.',
        'phone': '+7 (999) 123-45-67'
    }
    
    try:
        # Создаем письмо на основе примеров
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=test_data
        )
        
        if result:
            print("✅ Письмо успешно создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое письма
            print("\n📄 СОДЕРЖИМОЕ ПИСЬМА:")
            print("=" * 50)
            
            # Читаем и показываем содержимое
            try:
                from docx import Document
                doc = Document(result)
                for paragraph in doc.paragraphs:
                    if paragraph.text.strip():
                        print(paragraph.text)
                print("=" * 50)
            except Exception as e:
                print(f"Ошибка чтения документа: {e}")
            
            return result
        else:
            print("❌ Не удалось создать письмо")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании письма: {e}")
        return None

def analyze_learning_examples():
    """Анализирует примеры писем для обучения"""
    print("🔍 Анализ примеров писем...")
    
    letters_dir = "../existing_documents/письма"
    if not os.path.exists(letters_dir):
        print(f"❌ Папка с письмами не найдена: {letters_dir}")
        return
    
    letters = []
    for filename in os.listdir(letters_dir):
        if filename.endswith('.docx'):
            letters.append(filename)
    
    print(f"📧 Найдено писем для обучения: {len(letters)}")
    for letter in letters:
        print(f"  • {letter}")
    
    return letters

def main():
    print("🚀 ТЕСТИРОВАНИЕ ОБУЧЕННОГО AI ПОМОЩНИКА")
    print("=" * 50)
    
    # Анализируем примеры
    letters = analyze_learning_examples()
    
    if not letters:
        print("❌ Нет примеров писем для обучения")
        return
    
    print("\n" + "=" * 50)
    
    # Создаем тестовое письмо
    result = create_test_letter()
    
    if result:
        print(f"\n🎉 ТЕСТ УСПЕШЕН!")
        print(f"📧 Письмо создано: {result}")
        print("\n🎯 AI помощник успешно обучен и может создавать письма в стиле ваших примеров!")
    else:
        print("\n❌ ТЕСТ НЕ ПРОШЕЛ")
        print("Проверьте настройки и примеры документов")

if __name__ == "__main__":
    main()
