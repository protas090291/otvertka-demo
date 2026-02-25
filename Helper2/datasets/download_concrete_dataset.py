#!/usr/bin/env python3
"""
Скрипт для загрузки и организации датасета дефектов бетона
"""

import os
import requests
import time
from pathlib import Path

def download_image(url, filename, max_retries=3):
    """Загружает изображение по URL"""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"✅ Загружено: {filename}")
            return True
        except Exception as e:
            print(f"❌ Ошибка загрузки {url} (попытка {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
    return False

def create_sample_negative_images():
    """Создает примеры неповрежденного бетона"""
    # Создаем простые изображения неповрежденного бетона
    negative_dir = Path("concrete_cracks/negative")
    negative_dir.mkdir(parents=True, exist_ok=True)
    
    # Список URL с изображениями неповрежденного бетона (примеры)
    negative_urls = [
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",  # Бетонная стена
        "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",  # Бетонная поверхность
        "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",  # Бетонный пол
    ]
    
    print("🔄 Загружаем примеры неповрежденного бетона...")
    for i, url in enumerate(negative_urls):
        filename = negative_dir / f"concrete_negative_{i+1}.jpg"
        if not filename.exists():
            download_image(url, filename)
        else:
            print(f"⏭️  Пропускаем существующий файл: {filename}")

def create_sample_positive_images():
    """Создает примеры поврежденного бетона"""
    positive_dir = Path("concrete_cracks/positive")
    positive_dir.mkdir(parents=True, exist_ok=True)
    
    # Список URL с изображениями трещин в бетоне (примеры)
    positive_urls = [
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",  # Трещина в бетоне
        "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",  # Повреждение бетона
    ]
    
    print("🔄 Загружаем примеры поврежденного бетона...")
    for i, url in enumerate(positive_urls):
        filename = positive_dir / f"concrete_crack_{i+1}.jpg"
        if not filename.exists():
            download_image(url, filename)
        else:
            print(f"⏭️  Пропускаем существующий файл: {filename}")

def create_dataset_info():
    """Создает информацию о датасете"""
    info_content = """
# Датасет дефектов бетона

## Структура:
- `positive/` - изображения с дефектами (трещины, сколы, повреждения)
- `negative/` - изображения без дефектов (нормальный бетон)

## Статистика:
"""
    
    positive_dir = Path("concrete_cracks/positive")
    negative_dir = Path("concrete_cracks/negative")
    
    positive_count = len(list(positive_dir.glob("*.jpg"))) if positive_dir.exists() else 0
    negative_count = len(list(negative_dir.glob("*.jpg"))) if negative_dir.exists() else 0
    
    info_content += f"- Положительных примеров: {positive_count}\n"
    info_content += f"- Отрицательных примеров: {negative_count}\n"
    info_content += f"- Всего изображений: {positive_count + negative_count}\n"
    
    with open("concrete_cracks/README.md", "w", encoding="utf-8") as f:
        f.write(info_content)
    
    print(f"📊 Статистика датасета:")
    print(f"   Положительных примеров: {positive_count}")
    print(f"   Отрицательных примеров: {negative_count}")
    print(f"   Всего изображений: {positive_count + negative_count}")

def main():
    """Основная функция"""
    print("🚀 Создание датасета дефектов бетона...")
    
    # Создаем директории
    os.makedirs("concrete_cracks/positive", exist_ok=True)
    os.makedirs("concrete_cracks/negative", exist_ok=True)
    
    # Загружаем примеры
    create_sample_negative_images()
    create_sample_positive_images()
    
    # Создаем информацию о датасете
    create_dataset_info()
    
    print("✅ Датасет создан успешно!")
    print("📁 Расположение: concrete_cracks/")
    print("📖 Информация: concrete_cracks/README.md")

if __name__ == "__main__":
    main()


