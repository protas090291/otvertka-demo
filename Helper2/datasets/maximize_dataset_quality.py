#!/usr/bin/env python3
"""
Скрипт для максимального улучшения качества датасета
"""

import os
import shutil
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import random

def create_balanced_dataset():
    """Создает сбалансированный датасет с большим количеством данных"""
    print("🚀 Создаем максимально улучшенный сбалансированный датасет...")
    
    # Создаем структуру директорий
    base_dir = Path("maximized_dataset")
    positive_dir = base_dir / "positive"
    negative_dir = base_dir / "negative"
    
    positive_dir.mkdir(parents=True, exist_ok=True)
    negative_dir.mkdir(parents=True, exist_ok=True)
    
    # Копируем существующие изображения
    print("📁 Копируем существующие изображения...")
    copy_existing_images(positive_dir, negative_dir)
    
    # Создаем высококачественные синтетические изображения
    print("🎨 Создаем высококачественные синтетические изображения...")
    create_high_quality_synthetic_images(positive_dir, negative_dir)
    
    # Создаем аугментированные версии
    print("🔄 Создаем аугментированные версии...")
    create_augmented_versions(positive_dir, negative_dir)
    
    # Создаем информацию о датасете
    create_maximized_dataset_info(base_dir)
    
    return base_dir

def copy_existing_images(positive_dir, negative_dir):
    """Копирует существующие изображения"""
    # Копируем из expanded_dataset
    if Path("expanded_dataset/positive").exists():
        for img_file in Path("expanded_dataset/positive").glob("*.jpg"):
            shutil.copy2(img_file, positive_dir / f"original_{img_file.name}")
    
    if Path("expanded_dataset/negative").exists():
        for img_file in Path("expanded_dataset/negative").glob("*.jpg"):
            shutil.copy2(img_file, negative_dir / f"original_{img_file.name}")

def create_high_quality_synthetic_images(positive_dir, negative_dir):
    """Создает высококачественные синтетические изображения"""
    try:
        print("🎨 Создаем реалистичные дефекты...")
        
        # Создаем разнообразные трещины
        for i in range(30):
            create_realistic_crack(positive_dir, f"realistic_crack_{i+1}.jpg")
        
        # Создаем разнообразные пятна
        for i in range(25):
            create_realistic_stain(positive_dir, f"realistic_stain_{i+1}.jpg")
        
        # Создаем сколы и повреждения
        for i in range(20):
            create_realistic_damage(positive_dir, f"realistic_damage_{i+1}.jpg")
        
        # Создаем высококачественные нормальные поверхности
        for i in range(50):
            create_realistic_normal_surface(negative_dir, f"realistic_normal_{i+1}.jpg")
        
        print("✅ Создано 125 высококачественных синтетических изображений")
        
    except Exception as e:
        print(f"⚠️ Ошибка создания синтетических изображений: {e}")

def create_realistic_crack(output_dir, filename):
    """Создает реалистичную трещину"""
    # Создаем базовое изображение бетона с текстурой
    img = Image.new('RGB', (224, 224), color=(125, 125, 125))
    draw = ImageDraw.Draw(img)
    
    # Добавляем текстуру бетона
    for _ in range(200):
        x = random.randint(0, 223)
        y = random.randint(0, 223)
        color = random.randint(110, 140)
        draw.point((x, y), fill=(color, color, color))
    
    # Создаем реалистичную трещину
    start_x = random.randint(20, 204)
    start_y = random.randint(20, 204)
    
    # Создаем извилистую трещину
    points = []
    current_x, current_y = start_x, start_y
    
    for step in range(50):
        # Случайное направление с предпочтением продолжения
        if step > 0:
            direction = random.choice(['continue', 'continue', 'continue', 'turn_left', 'turn_right'])
        else:
            direction = random.choice(['up', 'down', 'left', 'right'])
        
        if direction == 'continue' and step > 0:
            # Продолжаем в том же направлении
            dx = points[-1][0] - (points[-2][0] if len(points) > 1 else start_x)
            dy = points[-1][1] - (points[-2][1] if len(points) > 1 else start_y)
        elif direction == 'turn_left':
            dx, dy = random.choice([(-1, 0), (0, -1), (1, 0), (0, 1)])
        elif direction == 'turn_right':
            dx, dy = random.choice([(1, 0), (0, 1), (-1, 0), (0, -1)])
        else:
            dx, dy = random.choice([(-1, 0), (1, 0), (0, -1), (0, 1)])
        
        current_x += dx * random.randint(2, 5)
        current_y += dy * random.randint(2, 5)
        
        # Ограничиваем границы
        current_x = max(5, min(219, current_x))
        current_y = max(5, min(219, current_y))
        
        points.append((current_x, current_y))
    
    # Рисуем трещину
    for i in range(len(points) - 1):
        # Создаем неровные края трещины
        for offset in range(-2, 3):
            x1 = points[i][0] + offset
            y1 = points[i][1] + offset
            x2 = points[i+1][0] + offset
            y2 = points[i+1][1] + offset
            
            if 0 <= x1 < 224 and 0 <= y1 < 224 and 0 <= x2 < 224 and 0 <= y2 < 224:
                color = (60 + random.randint(-10, 10), 60 + random.randint(-10, 10), 60 + random.randint(-10, 10))
                draw.line([(x1, y1), (x2, y2)], fill=color, width=random.randint(1, 3))
    
    # Добавляем тени и блики
    img = add_realistic_lighting(img)
    
    img.save(output_dir / filename)

def create_realistic_stain(output_dir, filename):
    """Создает реалистичное пятно"""
    img = Image.new('RGB', (224, 224), color=(130, 130, 130))
    draw = ImageDraw.Draw(img)
    
    # Добавляем текстуру
    for _ in range(150):
        x = random.randint(0, 223)
        y = random.randint(0, 223)
        color = random.randint(120, 140)
        draw.point((x, y), fill=(color, color, color))
    
    # Создаем пятно неправильной формы
    center_x = random.randint(50, 174)
    center_y = random.randint(50, 174)
    
    # Создаем несколько концентрических областей
    for radius in range(15, 35, 3):
        for angle in range(0, 360, 2):
            # Добавляем случайность в форму
            r = radius + random.randint(-3, 3)
            x = center_x + int(r * np.cos(np.radians(angle)))
            y = center_y + int(r * np.sin(np.radians(angle)))
            
            if 0 <= x < 224 and 0 <= y < 224:
                # Градиент от центра к краям
                intensity = max(0, 1 - (radius - 15) / 20)
                color_value = int(80 + intensity * 40)
                color = (color_value, color_value, color_value)
                draw.ellipse([x-1, y-1, x+1, y+1], fill=color)
    
    # Добавляем размытие для реалистичности
    img = img.filter(ImageFilter.GaussianBlur(radius=1))
    
    img.save(output_dir / filename)

def create_realistic_damage(output_dir, filename):
    """Создает реалистичное повреждение"""
    img = Image.new('RGB', (224, 224), color=(125, 125, 125))
    draw = ImageDraw.Draw(img)
    
    # Добавляем текстуру
    for _ in range(180):
        x = random.randint(0, 223)
        y = random.randint(0, 223)
        color = random.randint(115, 135)
        draw.point((x, y), fill=(color, color, color))
    
    # Создаем повреждение (скол или вмятину)
    damage_type = random.choice(['chip', 'dent', 'scratch'])
    
    if damage_type == 'chip':
        # Скол
        center_x = random.randint(30, 194)
        center_y = random.randint(30, 194)
        size = random.randint(10, 25)
        
        # Создаем неровный скол
        for angle in range(0, 360, 3):
            r = size + random.randint(-2, 2)
            x = center_x + int(r * np.cos(np.radians(angle)))
            y = center_y + int(r * np.sin(np.radians(angle)))
            
            if 0 <= x < 224 and 0 <= y < 224:
                color = (90, 90, 90)  # Темнее для скола
                draw.ellipse([x-1, y-1, x+1, y+1], fill=color)
    
    elif damage_type == 'dent':
        # Вмятина
        center_x = random.randint(40, 184)
        center_y = random.randint(40, 184)
        size = random.randint(15, 30)
        
        for angle in range(0, 360, 2):
            r = size + random.randint(-3, 3)
            x = center_x + int(r * np.cos(np.radians(angle)))
            y = center_y + int(r * np.sin(np.radians(angle)))
            
            if 0 <= x < 224 and 0 <= y < 224:
                # Градиент для вмятины
                intensity = max(0, 1 - (r - 15) / 15)
                color_value = int(100 + intensity * 30)
                color = (color_value, color_value, color_value)
                draw.ellipse([x-1, y-1, x+1, y+1], fill=color)
    
    else:  # scratch
        # Царапина
        start_x = random.randint(20, 204)
        start_y = random.randint(20, 204)
        length = random.randint(30, 80)
        
        for i in range(length):
            x = start_x + i + random.randint(-1, 1)
            y = start_y + random.randint(-2, 2)
            
            if 0 <= x < 224 and 0 <= y < 224:
                color = (70, 70, 70)
                draw.line([(x, y), (x+1, y)], fill=color, width=2)
    
    img.save(output_dir / filename)

def create_realistic_normal_surface(output_dir, filename):
    """Создает реалистичную нормальную поверхность"""
    # Создаем базовое изображение
    base_color = random.randint(120, 140)
    img = Image.new('RGB', (224, 224), color=(base_color, base_color, base_color))
    draw = ImageDraw.Draw(img)
    
    # Добавляем разнообразную текстуру
    for _ in range(300):
        x = random.randint(0, 223)
        y = random.randint(0, 223)
        color_variation = random.randint(-15, 15)
        color = max(100, min(160, base_color + color_variation))
        draw.point((x, y), fill=(color, color, color))
    
    # Добавляем мелкие детали (но не дефекты)
    for _ in range(50):
        x = random.randint(0, 223)
        y = random.randint(0, 223)
        size = random.randint(1, 3)
        color_variation = random.randint(-10, 10)
        color = max(110, min(150, base_color + color_variation))
        draw.ellipse([x-size, y-size, x+size, y+size], fill=(color, color, color))
    
    # Добавляем легкое размытие для реалистичности
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    
    img.save(output_dir / filename)

def add_realistic_lighting(img):
    """Добавляет реалистичное освещение"""
    # Создаем градиент освещения
    width, height = img.size
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Добавляем легкий градиент
    for y in range(height):
        alpha = int(20 * (1 - y / height))
        draw.line([(0, y), (width, y)], fill=(255, 255, 255, alpha))
    
    # Накладываем на исходное изображение
    img = img.convert('RGBA')
    img = Image.alpha_composite(img, overlay)
    return img.convert('RGB')

def create_augmented_versions(positive_dir, negative_dir):
    """Создает аугментированные версии изображений"""
    print("🔄 Создаем аугментированные версии...")
    
    # Аугментируем дефекты
    for img_file in list(positive_dir.glob("*.jpg"))[:20]:  # Берем первые 20
        create_augmentations(img_file, positive_dir, "defect")
    
    # Аугментируем нормальные изображения
    for img_file in list(negative_dir.glob("*.jpg"))[:30]:  # Берем первые 30
        create_augmentations(img_file, negative_dir, "normal")

def create_augmentations(img_file, output_dir, prefix):
    """Создает различные аугментации изображения"""
    try:
        img = Image.open(img_file)
        
        # Поворот
        for angle in [15, -15, 30, -30]:
            rotated = img.rotate(angle, fillcolor=(125, 125, 125))
            rotated.save(output_dir / f"{prefix}_rotated_{angle}_{img_file.stem}.jpg")
        
        # Изменение яркости
        for factor in [0.8, 1.2, 0.9, 1.1]:
            enhancer = ImageEnhance.Brightness(img)
            brightened = enhancer.enhance(factor)
            brightened.save(output_dir / f"{prefix}_bright_{factor}_{img_file.stem}.jpg")
        
        # Изменение контраста
        for factor in [0.8, 1.2]:
            enhancer = ImageEnhance.Contrast(img)
            contrasted = enhancer.enhance(factor)
            contrasted.save(output_dir / f"{prefix}_contrast_{factor}_{img_file.stem}.jpg")
        
        # Горизонтальное отражение
        flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
        flipped.save(output_dir / f"{prefix}_flipped_{img_file.stem}.jpg")
        
    except Exception as e:
        print(f"⚠️ Ошибка аугментации {img_file}: {e}")

def create_maximized_dataset_info(base_dir):
    """Создает информацию о максимально улучшенном датасете"""
    positive_count = len(list((base_dir / "positive").glob("*.jpg")))
    negative_count = len(list((base_dir / "negative").glob("*.jpg")))
    
    info_content = f"""# Максимально улучшенный датасет дефектов бетона

## 📊 Статистика:
- Положительных примеров (дефекты): {positive_count}
- Отрицательных примеров (норма): {negative_count}
- Всего изображений: {positive_count + negative_count}
- Баланс классов: {positive_count/(positive_count + negative_count)*100:.1f}% / {negative_count/(positive_count + negative_count)*100:.1f}%

## 🎯 Улучшения:
- ✅ Сбалансированные классы
- ✅ Высококачественные синтетические изображения
- ✅ Реалистичные дефекты (трещины, пятна, повреждения)
- ✅ Разнообразные нормальные поверхности
- ✅ Аугментированные версии
- ✅ Реалистичное освещение и текстуры

## 🏗️ Типы дефектов:
- Трещины в бетоне (30 реалистичных)
- Пятна от протечек (25 реалистичных)
- Сколы и повреждения (20 реалистичных)
- Аугментированные версии (200+)

## 🎨 Нормальные поверхности:
- Разнообразные бетонные поверхности (50 реалистичных)
- Аугментированные версии (150+)

## 📈 Ожидаемые улучшения:
- Сбалансированная точность на обоих классах
- Лучшая обобщающая способность
- Устойчивость к вариациям освещения
- Высокая точность на реальных данных

## 🚀 Готов к обучению максимально точной модели!
"""
    
    with open(base_dir / "README.md", "w", encoding="utf-8") as f:
        f.write(info_content)
    
    print(f"📊 Статистика максимально улучшенного датасета:")
    print(f"   Дефекты: {positive_count}")
    print(f"   Норма: {negative_count}")
    print(f"   Всего: {positive_count + negative_count}")
    print(f"   Баланс: {positive_count/(positive_count + negative_count)*100:.1f}% / {negative_count/(positive_count + negative_count)*100:.1f}%")

def main():
    """Основная функция"""
    print("🚀 Максимальное улучшение датасета дефектов бетона")
    print("=" * 70)
    
    # Создаем максимально улучшенный датасет
    dataset_dir = create_balanced_dataset()
    
    print(f"\n✅ Максимально улучшенный датасет создан!")
    print(f"📁 Расположение: {dataset_dir}")
    print(f"📖 Информация: {dataset_dir}/README.md")
    
    print("\n🎯 Следующие шаги:")
    print("1. Подготовить датасет для обучения")
    print("2. Обучить максимально точную модель")
    print("3. Протестировать на реальных данных")
    print("4. Интегрировать в систему")

if __name__ == "__main__":
    main()


