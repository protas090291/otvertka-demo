#!/usr/bin/env python3
"""
Интерактивный тестер модели для обнаружения дефектов
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import os
import random
from pathlib import Path

def load_best_model():
    """Загружает лучшую модель"""
    models_to_try = [
        "improved_model.h5",
        "final_improved_model.h5", 
        "best_maximized_model.h5",
        "maximized_concrete_defect_model.h5"
    ]
    
    for model_path in models_to_try:
        try:
            model = keras.models.load_model(model_path)
            print(f"✅ Загружена модель: {model_path}")
            return model
        except:
            continue
    
    print("❌ Не удалось загрузить ни одну модель")
    return None

def preprocess_image(image_path, target_size=(224, 224)):
    """Предобрабатывает изображение для модели"""
    try:
        img = Image.open(image_path)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img = img.resize(target_size)
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f"❌ Ошибка обработки изображения: {e}")
        return None

def predict_defect(model, image_path, threshold=0.3):
    """Предсказывает наличие дефекта"""
    img_array = preprocess_image(image_path)
    if img_array is None:
        return None
    
    prediction = model.predict(img_array, verbose=0)
    confidence = float(prediction[0][0])
    has_defect = confidence > threshold
    
    return {
        'has_defect': has_defect,
        'confidence': confidence,
        'defect_probability': confidence * 100,
        'normal_probability': (1 - confidence) * 100,
        'threshold': threshold
    }

def test_random_images(model, num_tests=10):
    """Тестирует случайные изображения"""
    print(f"🎲 Тестируем {num_tests} случайных изображений...")
    
    # Собираем все тестовые изображения
    test_images = []
    
    # Дефекты
    if Path("test/positive").exists():
        for img_file in Path("test/positive").glob("*.jpg"):
            test_images.append(("DEFECT", str(img_file)))
    
    # Норма
    if Path("test/negative").exists():
        for img_file in Path("test/negative").glob("*.jpg"):
            test_images.append(("NORMAL", str(img_file)))
    
    if not test_images:
        print("❌ Нет тестовых изображений")
        return
    
    # Выбираем случайные изображения
    random_images = random.sample(test_images, min(num_tests, len(test_images)))
    
    print(f"\n📊 Результаты тестирования:")
    print(f"{'Тип':<8} {'Файл':<40} {'Результат':<12} {'Уверенность':<12} {'Правильно':<10}")
    print("-" * 90)
    
    correct_predictions = 0
    total_predictions = 0
    
    for true_type, image_path in random_images:
        result = predict_defect(model, image_path, threshold=0.3)
        if result:
            filename = Path(image_path).name
            predicted_type = "ДЕФЕКТ" if result['has_defect'] else "НОРМА"
            confidence = f"{result['defect_probability']:.1f}%"
            
            # Проверяем правильность
            is_correct = (true_type == "DEFECT" and result['has_defect']) or \
                        (true_type == "NORMAL" and not result['has_defect'])
            
            if is_correct:
                correct_predictions += 1
                correct_symbol = "✅"
            else:
                correct_symbol = "❌"
            
            total_predictions += 1
            
            print(f"{true_type:<8} {filename:<40} {predicted_type:<12} {confidence:<12} {correct_symbol:<10}")
    
    accuracy = (correct_predictions / total_predictions) * 100 if total_predictions > 0 else 0
    print(f"\n📈 Точность на случайных изображениях: {accuracy:.1f}% ({correct_predictions}/{total_predictions})")

def test_specific_image(model, image_path):
    """Тестирует конкретное изображение"""
    print(f"🔍 Тестируем изображение: {Path(image_path).name}")
    
    result = predict_defect(model, image_path, threshold=0.3)
    if result:
        print(f"\n📊 Результат анализа:")
        print(f"   Вероятность дефекта: {result['defect_probability']:.1f}%")
        print(f"   Вероятность нормы: {result['normal_probability']:.1f}%")
        print(f"   Порог классификации: {result['threshold']:.1f}")
        
        if result['has_defect']:
            print(f"   🚨 РЕЗУЛЬТАТ: ДЕФЕКТ ОБНАРУЖЕН!")
            if result['defect_probability'] > 70:
                print(f"   ⚠️ ВЫСОКАЯ УВЕРЕННОСТЬ - требует внимания!")
            elif result['defect_probability'] > 50:
                print(f"   ⚖️ СРЕДНЯЯ УВЕРЕННОСТЬ - рекомендуется проверка")
            else:
                print(f"   🔍 НИЗКАЯ УВЕРЕННОСТЬ - возможна ложная тревога")
        else:
            print(f"   ✅ РЕЗУЛЬТАТ: НОРМА (дефект не обнаружен)")
    else:
        print("❌ Не удалось проанализировать изображение")

def interactive_test():
    """Интерактивное тестирование"""
    print("🎯 Интерактивный тестер модели обнаружения дефектов")
    print("=" * 60)
    
    # Загружаем модель
    model = load_best_model()
    if model is None:
        return
    
    while True:
        print(f"\n📋 Выберите действие:")
        print("1. 🎲 Тест случайных изображений")
        print("2. 🔍 Тест конкретного изображения")
        print("3. 📊 Статистика по типам дефектов")
        print("4. 🎯 Тест с разными порогами")
        print("5. ❌ Выход")
        
        choice = input("\nВведите номер (1-5): ").strip()
        
        if choice == "1":
            try:
                num = int(input("Сколько изображений тестировать? (по умолчанию 10): ") or "10")
                test_random_images(model, num)
            except ValueError:
                test_random_images(model, 10)
        
        elif choice == "2":
            print(f"\n📁 Доступные тестовые изображения:")
            
            # Показываем примеры
            if Path("test/positive").exists():
                defect_files = list(Path("test/positive").glob("*.jpg"))[:5]
                print(f"   Дефекты:")
                for i, f in enumerate(defect_files, 1):
                    print(f"   {i}. {f.name}")
            
            if Path("test/negative").exists():
                normal_files = list(Path("test/negative").glob("*.jpg"))[:5]
                print(f"   Норма:")
                for i, f in enumerate(normal_files, 1):
                    print(f"   {i}. {f.name}")
            
            image_path = input(f"\nВведите путь к изображению: ").strip()
            if image_path and Path(image_path).exists():
                test_specific_image(model, image_path)
            else:
                print("❌ Файл не найден")
        
        elif choice == "3":
            print(f"\n📊 Статистика по типам дефектов:")
            print("   🏗️ Трещины: 63 изображения (19.6%)")
            print("   🎨 Пятна: 213 изображений (66.4%)")
            print("   🔧 Повреждения: 32 изображения (10%)")
            print("   🪟 Стекло: 12 изображений (3.7%)")
            print("   🏠 Потолок: 13 изображений (4%)")
            print("   📊 Всего дефектов: 321 изображение")
        
        elif choice == "4":
            print(f"\n🎯 Тест с разными порогами:")
            image_path = input("Введите путь к изображению: ").strip()
            if image_path and Path(image_path).exists():
                print(f"\n📊 Результаты с разными порогами:")
                print(f"{'Порог':<8} {'Результат':<12} {'Уверенность':<12}")
                print("-" * 35)
                
                for threshold in [0.1, 0.3, 0.5, 0.7, 0.9]:
                    result = predict_defect(model, image_path, threshold)
                    if result:
                        predicted = "ДЕФЕКТ" if result['has_defect'] else "НОРМА"
                        confidence = f"{result['defect_probability']:.1f}%"
                        print(f"{threshold:<8.1f} {predicted:<12} {confidence:<12}")
            else:
                print("❌ Файл не найден")
        
        elif choice == "5":
            print("👋 До свидания!")
            break
        
        else:
            print("❌ Неверный выбор")

def main():
    """Основная функция"""
    print("🚀 Запуск интерактивного тестера модели")
    print("=" * 50)
    
    interactive_test()

if __name__ == "__main__":
    main()


