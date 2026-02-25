#!/usr/bin/env python3
"""
Скрипт для загрузки существующих документов в систему обучения AI
Использование: python upload_documents_for_learning.py [путь_к_папке_с_документами]
"""

import os
import sys
import argparse
from document_analyzer import DocumentAnalyzer
from learning_document_generator import LearningDocumentGenerator

def main():
    parser = argparse.ArgumentParser(description='Загрузка документов для обучения AI')
    parser.add_argument('documents_path', nargs='?', default='./existing_documents', 
                       help='Путь к папке с существующими документами')
    parser.add_argument('--supabase-url', help='URL Supabase')
    parser.add_argument('--supabase-key', help='Service Role Key Supabase')
    
    args = parser.parse_args()
    
    # Настройки Supabase (можно задать через переменные окружения)
    supabase_url = args.supabase_url or os.getenv('SUPABASE_URL')
    supabase_key = args.supabase_key or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Ошибка: Не указаны настройки Supabase")
        print("Используйте --supabase-url и --supabase-key или переменные окружения SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY")
        return 1
    
    documents_path = args.documents_path
    
    if not os.path.exists(documents_path):
        print(f"❌ Ошибка: Папка {documents_path} не существует")
        print("Создайте папку и поместите туда ваши документы (.docx файлы)")
        return 1
    
    print(f"🚀 Начинаем анализ документов в папке: {documents_path}")
    print(f"📊 Supabase URL: {supabase_url}")
    
    # Инициализируем анализатор
    analyzer = DocumentAnalyzer(supabase_url, supabase_key)
    
    # Анализируем все документы в папке
    print("\n📋 Анализируем документы...")
    results = analyzer.batch_analyze_documents(documents_path)
    
    if not results:
        print("❌ Не найдено документов для анализа")
        return 1
    
    print(f"✅ Проанализировано {len(results)} документов")
    
    # Выводим статистику
    print("\n📊 Статистика анализа:")
    document_types = {}
    for result in results:
        doc_type = analyzer.determine_document_type(result)
        document_types[doc_type] = document_types.get(doc_type, 0) + 1
    
    for doc_type, count in document_types.items():
        print(f"  • {doc_type}: {count} документов")
    
    # Показываем примеры найденных паттернов
    print("\n🔍 Примеры найденных паттернов:")
    for i, result in enumerate(results[:3]):  # Показываем первые 3
        print(f"\n  Документ {i+1}: {result['file_name']}")
        print(f"    Тип: {analyzer.determine_document_type(result)}")
        print(f"    Секции: {len(result['structure'].get('sections', []))}")
        print(f"    Таблицы: {len(result['tables'])}")
        print(f"    Качество: {analyzer._assess_document_quality(result)}/5")
    
    print(f"\n🎉 Анализ завершен! Данные загружены в Supabase для обучения AI")
    print("\n📖 Теперь AI-помощник может использовать эти примеры для создания документов")
    print("   Попробуйте команды:")
    print("   • 'Умный акт с данными для квартиры 1101'")
    print("   • 'Умный отчет о дефектах для квартиры 1205'")
    print("   • 'Умный отчет о работах для квартиры 1301'")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

