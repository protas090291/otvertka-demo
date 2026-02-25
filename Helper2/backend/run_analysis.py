#!/usr/bin/env python3
"""
Скрипт для запуска анализа документов для обучения AI
"""

import os
import sys
from document_analyzer import DocumentAnalyzer

def main():
    print("🔍 Запуск анализа документов для обучения AI...")
    
    # Путь к папке с документами
    documents_dir = "../existing_documents"
    
    if not os.path.exists(documents_dir):
        print(f"❌ Папка {documents_dir} не найдена!")
        return
    
    # Создаем анализатор
    analyzer = DocumentAnalyzer()
    
    # Анализируем все документы
    print(f"📁 Анализируем документы в папке: {documents_dir}")
    
    results = analyzer.batch_analyze_documents(documents_dir)
    
    print(f"✅ Анализ завершен! Обработано документов: {len(results)}")
    
    # Выводим краткую статистику
    for result in results:
        filename = result.get('file_name', 'Unknown')
        structure = result.get('structure', {})
        quality = result.get('quality', 0)
        
        print(f"📄 {filename}")
        print(f"   • Качество: {quality}/5")
        print(f"   • Секции: {len(structure.get('sections', []))}")
        print(f"   • Таблицы: {len(structure.get('tables', []))}")
        print(f"   • Заголовки: {len(structure.get('headings', []))}")
        print()

if __name__ == "__main__":
    main()



