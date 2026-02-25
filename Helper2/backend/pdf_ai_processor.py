"""
Модуль для обработки PDF файлов с использованием PaddleOCR-VL
Поддерживает извлечение текста, таблиц, формул и графиков из PDF документов
"""

import os
import logging
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import json
from datetime import datetime

try:
    from paddleocr import PaddleOCRVL
    PADDLEOCR_AVAILABLE = True
except ImportError as e:
    logging.warning(f"PaddleOCR не установлен: {e}")
    PaddleOCRVL = None
    PADDLEOCR_AVAILABLE = False

try:
    from pdf2image import convert_from_path
    from PIL import Image
    import io
    PDF2IMAGE_AVAILABLE = True
except ImportError as e:
    logging.warning(f"PDF2Image dependencies not installed: {e}")
    PDF2IMAGE_AVAILABLE = False

logger = logging.getLogger(__name__)


class PDFAIProcessor:
    """Класс для обработки PDF файлов с помощью PaddleOCR-VL"""
    
    def __init__(self):
        """
        Инициализация процессора PDF
        PaddleOCR-VL автоматически определяет использование GPU/CPU
        """
        self.pipeline = None
        self._initialize_pipeline()
    
    def _initialize_pipeline(self):
        """Инициализация PaddleOCR-VL pipeline"""
        try:
            if PaddleOCRVL is None:
                raise ImportError("PaddleOCR-VL не установлен. Установите зависимости: pip install paddleocr[doc-parser]")
            
            logger.info("Инициализация PaddleOCR-VL pipeline...")
            # PaddleOCR-VL автоматически определяет GPU/CPU, параметр use_gpu не нужен
            self.pipeline = PaddleOCRVL()
            logger.info("✅ PaddleOCR-VL pipeline успешно инициализирован")
        except Exception as e:
            logger.error(f"❌ Ошибка инициализации PaddleOCR-VL: {e}")
            self.pipeline = None
            raise
    
    def process_pdf_file(self, pdf_path: Union[str, Path]) -> Dict[str, Any]:
        """
        Обработка PDF файла и извлечение всех данных
        
        Args:
            pdf_path: Путь к PDF файлу
            
        Returns:
            Словарь с извлеченными данными:
            {
                'text': str,           # Весь текст документа
                'tables': List[Dict],  # Извлеченные таблицы
                'formulas': List[str], # Формулы
                'charts': List[Dict],  # Графики/диаграммы
                'structure': Dict,      # Структура документа
                'metadata': Dict       # Метаданные
            }
        """
        if self.pipeline is None:
            raise RuntimeError("PaddleOCR-VL pipeline не инициализирован")
        
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF файл не найден: {pdf_path}")
        
        logger.info(f"📄 Обработка PDF: {pdf_path.name}")
        
        try:
            # Конвертируем PDF в изображения (по одной странице)
            logger.info("Конвертация PDF в изображения...")
            images = convert_from_path(str(pdf_path), dpi=300)
            
            all_results = {
                'file_name': pdf_path.name,
                'file_path': str(pdf_path),
                'file_size': pdf_path.stat().st_size,
                'pages': len(images),
                'text': '',
                'tables': [],
                'formulas': [],
                'charts': [],
                'structure': {
                    'headings': [],
                    'sections': [],
                    'page_breaks': []
                },
                'metadata': {
                    'processed_at': datetime.now().isoformat(),
                    'model': 'PaddleOCR-VL-0.9B'
                },
                'pages_data': []
            }
            
            # Обрабатываем каждую страницу
            for page_num, image in enumerate(images, 1):
                logger.info(f"Обработка страницы {page_num}/{len(images)}...")
                
                try:
                    # Сохраняем изображение во временный файл
                    temp_image_path = f"/tmp/page_{page_num}.png"
                    image.save(temp_image_path, 'PNG')
                    
                    # Обрабатываем через PaddleOCR-VL
                    output = self.pipeline.predict(temp_image_path)
                    
                    # Извлекаем данные из результата
                    page_data = self._extract_page_data(output, page_num)
                    all_results['pages_data'].append(page_data)
                    
                    # Объединяем данные со всех страниц
                    all_results['text'] += page_data.get('text', '') + '\n\n'
                    all_results['tables'].extend(page_data.get('tables', []))
                    all_results['formulas'].extend(page_data.get('formulas', []))
                    all_results['charts'].extend(page_data.get('charts', []))
                    
                    # Удаляем временный файл
                    if os.path.exists(temp_image_path):
                        os.remove(temp_image_path)
                        
                except Exception as e:
                    logger.error(f"Ошибка обработки страницы {page_num}: {e}")
                    continue
            
            logger.info(f"✅ PDF обработан успешно: {len(all_results['text'])} символов текста, "
                       f"{len(all_results['tables'])} таблиц, {len(all_results['formulas'])} формул")
            
            return all_results
            
        except Exception as e:
            logger.error(f"❌ Ошибка обработки PDF: {e}")
            raise
    
    def _extract_page_data(self, output: Any, page_num: int) -> Dict[str, Any]:
        """
        Извлечение данных из результата PaddleOCR-VL
        
        Args:
            output: Результат от PaddleOCR-VL
            page_num: Номер страницы
            
        Returns:
            Словарь с данными страницы
        """
        page_data = {
            'page_number': page_num,
            'text': '',
            'tables': [],
            'formulas': [],
            'charts': [],
            'elements': []
        }
        
        try:
            # Обрабатываем результаты
            for res in output:
                # Сохраняем в JSON для анализа
                json_data = res.to_dict() if hasattr(res, 'to_dict') else {}
                
                # Извлекаем текст
                if 'text' in json_data:
                    page_data['text'] += json_data['text'] + '\n'
                
                # Извлекаем таблицы
                if 'tables' in json_data:
                    for table in json_data['tables']:
                        page_data['tables'].append({
                            'page': page_num,
                            'data': table,
                            'type': 'table'
                        })
                
                # Извлекаем формулы
                if 'formulas' in json_data:
                    page_data['formulas'].extend(json_data['formulas'])
                
                # Извлекаем графики
                if 'charts' in json_data:
                    page_data['charts'].extend(json_data['charts'])
                
                # Сохраняем все элементы
                if 'elements' in json_data:
                    page_data['elements'].extend(json_data['elements'])
        
        except Exception as e:
            logger.warning(f"Ошибка извлечения данных со страницы {page_num}: {e}")
        
        return page_data
    
    def process_pdf_url(self, pdf_url: str) -> Dict[str, Any]:
        """
        Обработка PDF по URL
        
        Args:
            pdf_url: URL PDF файла
            
        Returns:
            Словарь с извлеченными данными
        """
        import requests
        import tempfile
        
        logger.info(f"📥 Загрузка PDF по URL: {pdf_url}")
        
        try:
            # Загружаем PDF
            response = requests.get(pdf_url, timeout=30)
            response.raise_for_status()
            
            # Сохраняем во временный файл
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                tmp_file.write(response.content)
                tmp_path = tmp_file.name
            
            try:
                # Обрабатываем
                result = self.process_pdf_file(tmp_path)
                return result
            finally:
                # Удаляем временный файл
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        
        except Exception as e:
            logger.error(f"❌ Ошибка обработки PDF по URL: {e}")
            raise
    
    def extract_text_only(self, pdf_path: Union[str, Path]) -> str:
        """
        Извлечение только текста из PDF (быстрый режим)
        
        Args:
            pdf_path: Путь к PDF файлу
            
        Returns:
            Извлеченный текст
        """
        result = self.process_pdf_file(pdf_path)
        return result.get('text', '')
    
    def extract_tables_only(self, pdf_path: Union[str, Path]) -> List[Dict]:
        """
        Извлечение только таблиц из PDF
        
        Args:
            pdf_path: Путь к PDF файлу
            
        Returns:
            Список таблиц
        """
        result = self.process_pdf_file(pdf_path)
        return result.get('tables', [])
    
    def save_results_to_json(self, results: Dict[str, Any], output_path: Union[str, Path]):
        """
        Сохранение результатов в JSON файл
        
        Args:
            results: Результаты обработки
            output_path: Путь для сохранения
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Результаты сохранены в: {output_path}")


# Глобальный экземпляр процессора (ленивая инициализация)
_processor_instance = None
_initialization_lock = False


def get_pdf_processor() -> PDFAIProcessor:
    """
    Получить глобальный экземпляр PDF процессора (singleton)
    Инициализация происходит только при первом вызове
    
    Returns:
        Экземпляр PDFAIProcessor
    """
    global _processor_instance, _initialization_lock
    
    if _processor_instance is None and not _initialization_lock:
        try:
            _initialization_lock = True
            logger.info("Инициализация PaddleOCR-VL (первый запуск, загрузка моделей может занять время)...")
            _processor_instance = PDFAIProcessor()
            logger.info("✅ PaddleOCR-VL готов к работе!")
        except Exception as e:
            logger.error(f"Ошибка инициализации PaddleOCR-VL: {e}")
            _initialization_lock = False
            raise
        finally:
            _initialization_lock = False
    
    if _processor_instance is None:
        raise RuntimeError("PaddleOCR-VL не инициализирован")
    
    return _processor_instance

