#!/usr/bin/env python3
"""
Улучшенный анализатор документов для обучения AI
Работает с DOCX и PDF файлами
"""

import os
import sys
import json
from datetime import datetime
from typing import Dict, Any, List
from document_analyzer import DocumentAnalyzer

def analyze_docx_files(documents_dir: str) -> List[Dict[str, Any]]:
    """Анализирует DOCX файлы"""
    analyzer = DocumentAnalyzer()
    results = []
    
    print("📄 Анализируем DOCX файлы...")
    
    for root, dirs, files in os.walk(documents_dir):
        for filename in files:
            if filename.endswith(('.docx', '.doc')):
                file_path = os.path.join(root, filename)
                print(f"  🔍 {filename}")
                
                analysis = analyzer.analyze_document_structure(file_path)
                if analysis:
                    # Добавляем информацию о типе документа
                    analysis['document_type'] = determine_document_type(filename, root)
                    analysis['file_path'] = file_path
                    results.append(analysis)
    
    return results

def determine_document_type(filename: str, directory: str) -> str:
    """Определяет тип документа по имени файла и папке"""
    filename_lower = filename.lower()
    directory_lower = directory.lower()
    
    if 'письм' in filename_lower or 'письм' in directory_lower:
        return 'letter'
    elif 'дефект' in filename_lower or 'дефект' in directory_lower:
        return 'defect_act'
    elif 'отчет' in filename_lower or 'еденельн' in directory_lower:
        return 'weekly_report'
    elif 'приемк' in filename_lower or 'приемк' in directory_lower:
        return 'handover_act'
    elif 'акт' in filename_lower:
        return 'act'
    else:
        return 'unknown'

def analyze_pdf_files(documents_dir: str) -> List[Dict[str, Any]]:
    """Анализирует PDF файлы (базовая информация)"""
    results = []
    
    print("📄 Анализируем PDF файлы...")
    
    for root, dirs, files in os.walk(documents_dir):
        for filename in files:
            if filename.endswith('.pdf'):
                file_path = os.path.join(root, filename)
                print(f"  🔍 {filename}")
                
                # Базовая информация о PDF файле
                analysis = {
                    'file_name': filename,
                    'file_size': os.path.getsize(file_path),
                    'analysis_date': datetime.now().isoformat(),
                    'document_type': determine_document_type(filename, root),
                    'file_path': file_path,
                    'file_format': 'pdf',
                    'structure': {
                        'total_paragraphs': 0,
                        'total_tables': 0,
                        'headings': [],
                        'sections': []
                    },
                    'content': {
                        'apartment_info': {},
                        'defects': [],
                        'works': [],
                        'recommendations': [],
                        'signatures': [],
                        'statistics': {}
                    },
                    'tables': [],
                    'formatting': {},
                    'metadata': {},
                    'quality': 3  # Базовая оценка для PDF
                }
                
                results.append(analysis)
    
    return results

def save_analysis_results(results: List[Dict[str, Any]], output_file: str):
    """Сохраняет результаты анализа в JSON файл"""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Результаты анализа сохранены в: {output_file}")

def print_analysis_summary(results: List[Dict[str, Any]]):
    """Выводит сводку по анализу"""
    print("\n📊 СВОДКА ПО АНАЛИЗУ ДОКУМЕНТОВ:")
    print("=" * 50)
    
    # Группируем по типам
    by_type = {}
    for result in results:
        doc_type = result.get('document_type', 'unknown')
        if doc_type not in by_type:
            by_type[doc_type] = []
        by_type[doc_type].append(result)
    
    for doc_type, docs in by_type.items():
        print(f"\n📁 {doc_type.upper()} ({len(docs)} документов):")
        for doc in docs:
            filename = doc.get('file_name', 'Unknown')
            quality = doc.get('quality', 0)
            structure = doc.get('structure', {})
            
            print(f"  • {filename}")
            print(f"    - Качество: {quality}/5")
            print(f"    - Секции: {len(structure.get('sections', []))}")
            print(f"    - Таблицы: {len(structure.get('tables', []))}")
            print(f"    - Заголовки: {len(structure.get('headings', []))}")

def main():
    print("🚀 ЗАПУСК ПОЛНОГО АНАЛИЗА ДОКУМЕНТОВ ДЛЯ ОБУЧЕНИЯ AI")
    print("=" * 60)
    
    # Путь к папке с документами
    documents_dir = "../existing_documents"
    
    if not os.path.exists(documents_dir):
        print(f"❌ Папка {documents_dir} не найдена!")
        return
    
    all_results = []
    
    # Анализируем DOCX файлы
    docx_results = analyze_docx_files(documents_dir)
    all_results.extend(docx_results)
    
    # Анализируем PDF файлы
    pdf_results = analyze_pdf_files(documents_dir)
    all_results.extend(pdf_results)
    
    # Сохраняем результаты
    output_file = "document_analysis_results.json"
    save_analysis_results(all_results, output_file)
    
    # Выводим сводку
    print_analysis_summary(all_results)
    
    print(f"\n✅ АНАЛИЗ ЗАВЕРШЕН!")
    print(f"📊 Всего обработано документов: {len(all_results)}")
    print(f"💾 Результаты сохранены в: {output_file}")
    
    print("\n🎯 СЛЕДУЮЩИЕ ШАГИ:")
    print("1. Проверьте результаты анализа")
    print("2. Используйте голосовые команды для создания документов на основе примеров")
    print("3. AI теперь знает структуру и стиль ваших документов!")

if __name__ == "__main__":
    main()



