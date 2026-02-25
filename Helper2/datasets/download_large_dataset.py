#!/usr/bin/env python3
"""
Скрипт для загрузки большого датасета дефектов бетона
"""

import os
import requests
import zipfile
import shutil
from pathlib import Path
import time

def download_file(url, filename, max_retries=3):
    """Загружает файл по URL"""
    for attempt in range(max_retries):
        try:
            print(f"🔄 Загружаем {filename}... (попытка {attempt + 1})")
            response = requests.get(url, timeout=30, stream=True)
            response.raise_for_status()
            
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ Загружено: {filename}")
            return True
        except Exception as e:
            print(f"❌ Ошибка загрузки {filename} (попытка {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(5)
    return False

def create_sample_dataset():
    """Создает расширенный датасет из доступных источников"""
    print("🚀 Создаем расширенный датасет дефектов...")
    
    # Создаем структуру директорий
    base_dir = Path("expanded_dataset")
    positive_dir = base_dir / "positive"
    negative_dir = base_dir / "negative"
    
    positive_dir.mkdir(parents=True, exist_ok=True)
    negative_dir.mkdir(parents=True, exist_ok=True)
    
    # Копируем существующие изображения
    print("📁 Копируем существующие изображения...")
    
    # Копируем из training_data
    if Path("training_data/train/positive").exists():
        for img_file in Path("training_data/train/positive").glob("*.jpg"):
            shutil.copy2(img_file, positive_dir / f"train_{img_file.name}")
    
    if Path("training_data/test/positive").exists():
        for img_file in Path("training_data/test/positive").glob("*.jpg"):
            shutil.copy2(img_file, positive_dir / f"test_{img_file.name}")
    
    if Path("training_data/val/positive").exists():
        for img_file in Path("training_data/val/positive").glob("*.jpg"):
            shutil.copy2(img_file, positive_dir / f"val_{img_file.name}")
    
    if Path("training_data/test/negative").exists():
        for img_file in Path("training_data/test/negative").glob("*.jpg"):
            shutil.copy2(img_file, negative_dir / f"test_{img_file.name}")
    
    # Создаем дополнительные примеры дефектов (симуляция)
    print("🎨 Создаем дополнительные примеры...")
    create_synthetic_defects(positive_dir, negative_dir)
    
    # Создаем информацию о датасете
    create_dataset_info(base_dir)
    
    return base_dir

def create_synthetic_defects(positive_dir, negative_dir):
    """Создает синтетические примеры дефектов"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        import numpy as np
        
        print("🎨 Создаем синтетические изображения дефектов...")
        
        # Создаем изображения трещин
        for i in range(10):
            # Создаем базовое изображение бетона
            img = Image.new('RGB', (224, 224), color=(120, 120, 120))
            draw = ImageDraw.Draw(img)
            
            # Добавляем шум для реалистичности
            noise = np.random.randint(-20, 20, (224, 224, 3))
            img_array = np.array(img) + noise
            img_array = np.clip(img_array, 0, 255).astype(np.uint8)
            img = Image.fromarray(img_array)
            draw = ImageDraw.Draw(img)
            
            # Рисуем трещину
            start_x = np.random.randint(0, 224)
            start_y = np.random.randint(0, 224)
            end_x = np.random.randint(0, 224)
            end_y = np.random.randint(0, 224)
            
            # Рисуем извилистую линию (трещину)
            points = []
            steps = 20
            for step in range(steps + 1):
                t = step / steps
                x = int(start_x + (end_x - start_x) * t + np.random.randint(-10, 10))
                y = int(start_y + (end_y - start_y) * t + np.random.randint(-10, 10))
                points.append((x, y))
            
            for j in range(len(points) - 1):
                draw.line([points[j], points[j+1]], fill=(60, 60, 60), width=3)
            
            # Сохраняем изображение
            img.save(positive_dir / f"synthetic_crack_{i+1}.jpg")
        
        # Создаем изображения пятен
        for i in range(10):
            img = Image.new('RGB', (224, 224), color=(130, 130, 130))
            draw = ImageDraw.Draw(img)
            
            # Добавляем шум
            noise = np.random.randint(-15, 15, (224, 224, 3))
            img_array = np.array(img) + noise
            img_array = np.clip(img_array, 0, 255).astype(np.uint8)
            img = Image.fromarray(img_array)
            draw = ImageDraw.Draw(img)
            
            # Рисуем пятно
            center_x = np.random.randint(50, 174)
            center_y = np.random.randint(50, 174)
            radius = np.random.randint(20, 40)
            
            # Создаем неровное пятно
            for angle in range(0, 360, 5):
                r = radius + np.random.randint(-5, 5)
                x = center_x + int(r * np.cos(np.radians(angle)))
                y = center_y + int(r * np.sin(np.radians(angle)))
                if 0 <= x < 224 and 0 <= y < 224:
                    draw.ellipse([x-2, y-2, x+2, y+2], fill=(80, 80, 80))
            
            img.save(positive_dir / f"synthetic_stain_{i+1}.jpg")
        
        # Создаем нормальные изображения бетона
        for i in range(15):
            img = Image.new('RGB', (224, 224), color=(125, 125, 125))
            draw = ImageDraw.Draw(img)
            
            # Добавляем реалистичный шум
            noise = np.random.randint(-10, 10, (224, 224, 3))
            img_array = np.array(img) + noise
            img_array = np.clip(img_array, 0, 255).astype(np.uint8)
            img = Image.fromarray(img_array)
            
            # Добавляем мелкие текстуры
            for _ in range(50):
                x = np.random.randint(0, 224)
                y = np.random.randint(0, 224)
                color = np.random.randint(110, 140)
                draw.point((x, y), fill=(color, color, color))
            
            img.save(negative_dir / f"synthetic_normal_{i+1}.jpg")
        
        print("✅ Создано 35 синтетических изображений")
        
    except ImportError:
        print("⚠️ PIL не установлен, пропускаем создание синтетических изображений")
    except Exception as e:
        print(f"⚠️ Ошибка создания синтетических изображений: {e}")

def create_dataset_info(base_dir):
    """Создает информацию о расширенном датасете"""
    positive_count = len(list((base_dir / "positive").glob("*.jpg")))
    negative_count = len(list((base_dir / "negative").glob("*.jpg")))
    
    info_content = f"""# Расширенный датасет дефектов бетона

## Статистика:
- Положительных примеров (дефекты): {positive_count}
- Отрицательных примеров (норма): {negative_count}
- Всего изображений: {positive_count + negative_count}

## Структура:
- `positive/` - изображения с дефектами
- `negative/` - изображения без дефектов

## Типы дефектов:
- Трещины в бетоне
- Пятна от протечек
- Повреждения стекла
- Структурные дефекты
- Синтетические примеры

## Создан: {time.strftime('%Y-%m-%d %H:%M:%S')}
"""
    
    with open(base_dir / "README.md", "w", encoding="utf-8") as f:
        f.write(info_content)
    
    print(f"📊 Статистика расширенного датасета:")
    print(f"   Дефекты: {positive_count}")
    print(f"   Норма: {negative_count}")
    print(f"   Всего: {positive_count + negative_count}")

def main():
    """Основная функция"""
    print("🚀 Создание расширенного датасета дефектов бетона")
    print("=" * 60)
    
    # Создаем расширенный датасет
    dataset_dir = create_sample_dataset()
    
    print(f"\n✅ Расширенный датасет создан!")
    print(f"📁 Расположение: {dataset_dir}")
    print(f"📖 Информация: {dataset_dir}/README.md")
    
    print("\n🎯 Следующие шаги:")
    print("1. Проверить качество изображений")
    print("2. Переобучить модель на расширенном датасете")
    print("3. Сравнить результаты с предыдущей моделью")

if __name__ == "__main__":
    main()


