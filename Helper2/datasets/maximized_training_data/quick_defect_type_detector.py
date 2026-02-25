#!/usr/bin/env python3
"""
Быстрый детектор типов дефектов на основе анализа изображений
Вместо обучения новой модели, анализируем характеристики изображений
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import cv2
import os
from pathlib import Path

def analyze_image_characteristics(image_path):
    """Анализирует характеристики изображения для определения типа дефекта"""
    try:
        # Загружаем изображение
        img = cv2.imread(str(image_path))
        if img is None:
            return None
        
        # Конвертируем в RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Анализируем характеристики
        characteristics = {}
        
        # 1. Анализ контраста
        characteristics['contrast'] = np.std(gray)
        
        # 2. Анализ яркости
        characteristics['brightness'] = np.mean(gray)
        
        # 3. Анализ градиентов (для трещин)
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        characteristics['gradient_magnitude'] = np.mean(np.sqrt(grad_x**2 + grad_y**2))
        
        # 4. Анализ цветовых каналов
        characteristics['red_mean'] = np.mean(img_rgb[:, :, 0])
        characteristics['green_mean'] = np.mean(img_rgb[:, :, 1])
        characteristics['blue_mean'] = np.mean(img_rgb[:, :, 2])
        
        # 5. Анализ текстур (для пятен)
        characteristics['texture_variance'] = np.var(gray)
        
        # 6. Анализ краев (для повреждений)
        edges = cv2.Canny(gray, 50, 150)
        characteristics['edge_density'] = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
        
        return characteristics
        
    except Exception as e:
        print(f"Ошибка анализа {image_path}: {e}")
        return None

def determine_defect_type(characteristics):
    """Определяет тип дефекта на основе характеристик"""
    if not characteristics:
        return "unknown", 0.0
    
    # Правила для определения типа дефекта
    scores = {
        'normal': 0.0,
        'crack': 0.0,
        'stain': 0.0,
        'damage': 0.0,
        'glass_defect': 0.0,
        'ceiling_issue': 0.0
    }
    
    # Норма - средние значения всех характеристик
    if (50 < characteristics['brightness'] < 200 and 
        20 < characteristics['contrast'] < 80 and
        characteristics['edge_density'] < 0.1):
        scores['normal'] += 0.8
    
    # Трещины - высокие градиенты, низкий контраст
    if (characteristics['gradient_magnitude'] > 30 and 
        characteristics['contrast'] < 50):
        scores['crack'] += 0.9
    
    # Пятна - низкий контраст, средняя яркость
    if (characteristics['contrast'] < 40 and 
        100 < characteristics['brightness'] < 180):
        scores['stain'] += 0.8
    
    # Повреждения - высокие градиенты, много краев
    if (characteristics['gradient_magnitude'] > 25 and 
        characteristics['edge_density'] > 0.15):
        scores['damage'] += 0.7
    
    # Дефекты стекла - очень высокий контраст
    if characteristics['contrast'] > 100:
        scores['glass_defect'] += 0.8
    
    # Проблемы с потолком - специфичные цвета
    if (characteristics['red_mean'] > 150 and 
        characteristics['green_mean'] > 150 and 
        characteristics['blue_mean'] > 150):
        scores['ceiling_issue'] += 0.6
    
    # Находим лучший результат
    best_type = max(scores, key=scores.get)
    confidence = scores[best_type]
    
    return best_type, confidence

def create_defect_type_detector():
    """Создает детектор типов дефектов"""
    print("🔧 Создаем быстрый детектор типов дефектов...")
    
    # Тестируем на нескольких изображениях
    test_dir = Path("test")
    if not test_dir.exists():
        print("❌ Папка test не найдена")
        return
    
    results = []
    
    # Анализируем дефекты
    defect_dir = test_dir / "positive"
    if defect_dir.exists():
        defect_files = list(defect_dir.glob("*.jpg"))[:10]
        print(f"🔍 Анализируем {len(defect_files)} дефектов...")
        
        for img_file in defect_files:
            characteristics = analyze_image_characteristics(img_file)
            if characteristics:
                defect_type, confidence = determine_defect_type(characteristics)
                results.append({
                    'file': img_file.name,
                    'type': defect_type,
                    'confidence': confidence,
                    'characteristics': characteristics
                })
                print(f"   {img_file.name}: {defect_type} ({confidence:.2f})")
    
    # Анализируем нормальные изображения
    normal_dir = test_dir / "negative"
    if normal_dir.exists():
        normal_files = list(normal_dir.glob("*.jpg"))[:5]
        print(f"🔍 Анализируем {len(normal_files)} нормальных изображений...")
        
        for img_file in normal_files:
            characteristics = analyze_image_characteristics(img_file)
            if characteristics:
                defect_type, confidence = determine_defect_type(characteristics)
                results.append({
                    'file': img_file.name,
                    'type': defect_type,
                    'confidence': confidence,
                    'characteristics': characteristics
                })
                print(f"   {img_file.name}: {defect_type} ({confidence:.2f})")
    
    return results

def save_defect_detector():
    """Сохраняет детектор типов дефектов"""
    print("💾 Сохраняем детектор типов дефектов...")
    
    detector_code = '''
def detect_defect_type(image_path):
    """Быстрый детектор типов дефектов"""
    import cv2
    import numpy as np
    
    try:
        # Загружаем изображение
        img = cv2.imread(str(image_path))
        if img is None:
            return "unknown", 0.0
        
        # Конвертируем в RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Анализируем характеристики
        contrast = np.std(gray)
        brightness = np.mean(gray)
        
        # Градиенты для трещин
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.mean(np.sqrt(grad_x**2 + grad_y**2))
        
        # Цветовые каналы
        red_mean = np.mean(img_rgb[:, :, 0])
        green_mean = np.mean(img_rgb[:, :, 1])
        blue_mean = np.mean(img_rgb[:, :, 2])
        
        # Края для повреждений
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
        
        # Правила определения
        scores = {
            'normal': 0.0,
            'crack': 0.0,
            'stain': 0.0,
            'damage': 0.0,
            'glass_defect': 0.0,
            'ceiling_issue': 0.0
        }
        
        # Норма
        if (50 < brightness < 200 and 20 < contrast < 80 and edge_density < 0.1):
            scores['normal'] += 0.8
        
        # Трещины
        if (gradient_magnitude > 30 and contrast < 50):
            scores['crack'] += 0.9
        
        # Пятна
        if (contrast < 40 and 100 < brightness < 180):
            scores['stain'] += 0.8
        
        # Повреждения
        if (gradient_magnitude > 25 and edge_density > 0.15):
            scores['damage'] += 0.7
        
        # Дефекты стекла
        if contrast > 100:
            scores['glass_defect'] += 0.8
        
        # Проблемы с потолком
        if (red_mean > 150 and green_mean > 150 and blue_mean > 150):
            scores['ceiling_issue'] += 0.6
        
        # Лучший результат
        best_type = max(scores, key=scores.get)
        confidence = scores[best_type]
        
        return best_type, confidence
        
    except Exception as e:
        return "unknown", 0.0

# Типы дефектов на русском
DEFECT_TYPES_RU = {
    'normal': 'Норма',
    'crack': 'Трещина',
    'stain': 'Пятно',
    'damage': 'Повреждение',
    'glass_defect': 'Дефект стекла',
    'ceiling_issue': 'Проблема с потолком',
    'unknown': 'Неизвестно'
}
'''
    
    with open('defect_type_detector.py', 'w', encoding='utf-8') as f:
        f.write(detector_code)
    
    print("✅ Детектор сохранен: defect_type_detector.py")

if __name__ == "__main__":
    print("⚡ Быстрое создание детектора типов дефектов")
    print("=" * 50)
    
    results = create_defect_type_detector()
    save_defect_detector()
    
    print("\n✅ Готово! Теперь можно определять типы дефектов быстро.")


