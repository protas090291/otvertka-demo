"""
Упрощенный модуль для обработки PDF файлов
Использует базовые библиотеки (pypdf, pdf2image) для извлечения данных
Можно расширить до PaddleOCR-VL позже
"""

import os
import logging
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import json
from datetime import datetime

try:
    from pdf2image import convert_from_path
    from PIL import Image
    import pypdf
    PDF2IMAGE_AVAILABLE = True
except ImportError as e:
    logging.warning(f"PDF processing dependencies not installed: {e}")
    PDF2IMAGE_AVAILABLE = False

logger = logging.getLogger(__name__)


class SimplePDFProcessor:
    """Упрощенный класс для обработки PDF файлов"""
    
    def __init__(self):
        """Инициализация процессора PDF"""
        if not PDF2IMAGE_AVAILABLE:
            raise ImportError("Необходимые библиотеки не установлены. Установите: pip install pdf2image pypdf Pillow")
        logger.info("✅ Simple PDF Processor инициализирован")
    
    def process_pdf_file(self, pdf_path: Union[str, Path]) -> Dict[str, Any]:
        """
        Обработка PDF файла и извлечение данных
        
        Args:
            pdf_path: Путь к PDF файлу
            
        Returns:
            Словарь с извлеченными данными
        """
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF файл не найден: {pdf_path}")
        
        logger.info(f"📄 Обработка PDF: {pdf_path.name}")
        
        try:
            # Извлекаем текст через pypdf
            text_content = self._extract_text_with_pypdf(pdf_path)
            
            # Получаем метаданные
            metadata = self._extract_metadata(pdf_path)
            
            # Конвертируем в изображения для будущего OCR
            images = convert_from_path(str(pdf_path), dpi=200)
            
            results = {
                'file_name': pdf_path.name,
                'file_path': str(pdf_path),
                'file_size': pdf_path.stat().st_size,
                'pages': len(images),
                'text': text_content,
                'tables': [],  # Будет добавлено при интеграции PaddleOCR
                'formulas': [],  # Будет добавлено при интеграции PaddleOCR
                'charts': [],  # Будет добавлено при интеграции PaddleOCR
                'structure': {
                    'headings': self._extract_headings(text_content),
                    'sections': [],
                    'page_breaks': list(range(1, len(images) + 1))
                },
                'metadata': {
                    **metadata,
                    'processed_at': datetime.now().isoformat(),
                    'processor': 'SimplePDFProcessor',
                    'note': 'Для полной функциональности (таблицы, формулы, OCR) установите PaddleOCR-VL'
                },
                'pages_data': [
                    {
                        'page_number': i + 1,
                        'text': self._extract_page_text(pdf_path, i + 1),
                        'has_images': True
                    }
                    for i in range(len(images))
                ]
            }
            
            logger.info(f"✅ PDF обработан: {len(text_content)} символов текста, {len(images)} страниц")
            return results
            
        except Exception as e:
            logger.error(f"❌ Ошибка обработки PDF: {e}")
            raise
    
    def _extract_text_with_pypdf(self, pdf_path: Path) -> str:
        """Извлечение текста через pypdf"""
        text_parts = []
        
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = pypdf.PdfReader(file)
                
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(f"--- Страница {page_num} ---\n{page_text}\n")
                    except Exception as e:
                        logger.warning(f"Ошибка извлечения текста со страницы {page_num}: {e}")
                        continue
        except Exception as e:
            logger.error(f"Ошибка чтения PDF: {e}")
            raise
        
        return "\n".join(text_parts)
    
    def _extract_page_text(self, pdf_path: Path, page_num: int) -> str:
        """Извлечение текста с конкретной страницы"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = pypdf.PdfReader(file)
                if page_num <= len(pdf_reader.pages):
                    return pdf_reader.pages[page_num - 1].extract_text() or ""
        except Exception as e:
            logger.warning(f"Ошибка извлечения текста со страницы {page_num}: {e}")
        return ""
    
    def _extract_metadata(self, pdf_path: Path) -> Dict[str, Any]:
        """Извлечение метаданных PDF"""
        metadata = {}
        
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = pypdf.PdfReader(file)
                
                if pdf_reader.metadata:
                    metadata = {
                        'title': pdf_reader.metadata.get('/Title', ''),
                        'author': pdf_reader.metadata.get('/Author', ''),
                        'subject': pdf_reader.metadata.get('/Subject', ''),
                        'creator': pdf_reader.metadata.get('/Creator', ''),
                        'producer': pdf_reader.metadata.get('/Producer', ''),
                        'creation_date': str(pdf_reader.metadata.get('/CreationDate', '')),
                        'modification_date': str(pdf_reader.metadata.get('/ModDate', ''))
                    }
                
                metadata['total_pages'] = len(pdf_reader.pages)
                metadata['is_encrypted'] = pdf_reader.is_encrypted
        except Exception as e:
            logger.warning(f"Ошибка извлечения метаданных: {e}")
        
        return metadata
    
    def _extract_headings(self, text: str) -> List[str]:
        """Простое извлечение заголовков (строки в верхнем регистре или с особым форматированием)"""
        headings = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            # Простая эвристика: заголовки часто короткие и в верхнем регистре
            if line and len(line) < 100:
                # Проверяем, похоже ли на заголовок
                if line.isupper() or (len(line.split()) <= 5 and line[0].isupper()):
                    headings.append(line)
        
        return headings[:20]  # Ограничиваем количество
    
    def process_pdf_url(self, pdf_url: str) -> Dict[str, Any]:
        """Обработка PDF по URL"""
        import requests
        import tempfile
        
        logger.info(f"📥 Загрузка PDF по URL: {pdf_url}")
        
        try:
            response = requests.get(pdf_url, timeout=30)
            response.raise_for_status()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                tmp_file.write(response.content)
                tmp_path = tmp_file.name
            
            try:
                result = self.process_pdf_file(tmp_path)
                return result
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        
        except Exception as e:
            logger.error(f"❌ Ошибка обработки PDF по URL: {e}")
            raise
    
    def extract_text_only(self, pdf_path: Union[str, Path]) -> str:
        """Извлечение только текста"""
        result = self.process_pdf_file(pdf_path)
        return result.get('text', '')
    
    def extract_tables_only(self, pdf_path: Union[str, Path]) -> List[Dict]:
        """Извлечение таблиц (пока возвращает пустой список, требует PaddleOCR)"""
        logger.warning("Извлечение таблиц требует PaddleOCR-VL. Установите для полной функциональности.")
        return []


# Глобальный экземпляр
_simple_processor_instance = None


def get_simple_pdf_processor() -> SimplePDFProcessor:
    """Получить глобальный экземпляр простого PDF процессора"""
    global _simple_processor_instance
    if _simple_processor_instance is None:
        _simple_processor_instance = SimplePDFProcessor()
    return _simple_processor_instance

