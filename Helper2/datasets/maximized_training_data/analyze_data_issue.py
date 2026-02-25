#!/usr/bin/env python3
"""
Анализ проблемы с данными - почему модель не может различить дефекты и норму
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
from PIL import Image
import os
import matplotlib.pyplot as plt
from pathlib import Path

def analyze_image_distributions():
    """Анализирует распределения изображений"""
    print("🔍 Анализируем распределения изображений...")
    
    def get_image_stats(image_path):
        """Получает статистики изображения"""
        try:
            img = Image.open(image_path)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img_array = np.array(img)
            
            return {
                'mean': np.mean(img_array),
                'std': np.std(img_array),
                'min': np.min(img_array),
                'max': np.max(img_array),
                'shape': img_array.shape
            }
        except:
            return None
    
    # Анализируем дефекты
    defect_stats = []
    test_positive_dir = "test/positive"
    if os.path.exists(test_positive_dir):
        for img_file in os.listdir(test_positive_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_positive_dir, img_file)
                stats = get_image_stats(img_path)
                if stats:
                    defect_stats.append(stats)
    
    # Анализируем норму
    normal_stats = []
    test_negative_dir = "test/negative"
    if os.path.exists(test_negative_dir):
        for img_file in os.listdir(test_negative_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_negative_dir, img_file)
                stats = get_image_stats(img_path)
                if stats:
                    normal_stats.append(stats)
    
    print(f"📊 Статистики изображений:")
    print(f"   Дефекты: {len(defect_stats)} изображений")
    print(f"   Норма: {len(normal_stats)} изображений")
    
    if defect_stats and normal_stats:
        # Средние значения
        defect_mean = np.mean([s['mean'] for s in defect_stats])
        normal_mean = np.mean([s['mean'] for s in normal_stats])
        
        defect_std = np.mean([s['std'] for s in defect_stats])
        normal_std = np.mean([s['std'] for s in normal_stats])
        
        print(f"\n📈 Средние характеристики:")
        print(f"   Дефекты - среднее: {defect_mean:.1f}, std: {defect_std:.1f}")
        print(f"   Норма - среднее: {normal_mean:.1f}, std: {normal_std:.1f}")
        
        # Проверяем различия
        if abs(defect_mean - normal_mean) < 10:
            print("⚠️ ПРОБЛЕМА: Изображения дефектов и нормы очень похожи!")
            print("   Это объясняет, почему модель не может их различить")
        else:
            print("✅ Изображения достаточно различны")

def test_simple_model():
    """Тестирует простую модель для понимания проблемы"""
    print("\n🧪 Тестируем простую модель...")
    
    # Создаем очень простую модель
    model = keras.Sequential([
        layers.Conv2D(16, (3, 3), activation="relu", input_shape=(224, 224, 3)),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(32, (3, 3), activation="relu"),
        layers.MaxPooling2D((2, 2)),
        layers.Flatten(),
        layers.Dense(64, activation="relu"),
        layers.Dense(1, activation="sigmoid")
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.01),  # Высокий learning rate
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )
    
    # Генераторы данных
    train_datagen = keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        horizontal_flip=True
    )
    
    train_generator = train_datagen.flow_from_directory(
        "train/",
        target_size=(224, 224),
        batch_size=32,
        class_mode="binary",
        shuffle=True
    )
    
    val_datagen = keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
    val_generator = val_datagen.flow_from_directory(
        "val/",
        target_size=(224, 224),
        batch_size=32,
        class_mode="binary",
        shuffle=False
    )
    
    # Обучаем на 5 эпох
    print("🚀 Обучаем простую модель на 5 эпох...")
    history = model.fit(
        train_generator,
        epochs=5,
        validation_data=val_generator,
        verbose=1
    )
    
    # Тестируем
    test_datagen = keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
    test_generator = test_datagen.flow_from_directory(
        "test/",
        target_size=(224, 224),
        batch_size=1,
        class_mode="binary",
        shuffle=False
    )
    
    # Получаем предсказания
    predictions = model.predict(test_generator, verbose=0)
    true_labels = test_generator.classes
    
    # Анализируем предсказания
    defect_predictions = predictions[true_labels == 1]
    normal_predictions = predictions[true_labels == 0]
    
    print(f"\n📊 Результаты простой модели:")
    print(f"   Дефекты - среднее предсказание: {np.mean(defect_predictions):.3f}")
    print(f"   Норма - среднее предсказание: {np.mean(normal_predictions):.3f}")
    print(f"   Разница: {abs(np.mean(defect_predictions) - np.mean(normal_predictions)):.3f}")
    
    if abs(np.mean(defect_predictions) - np.mean(normal_predictions)) < 0.1:
        print("⚠️ ПРОБЛЕМА: Модель не может различить классы!")
        print("   Это указывает на проблему с данными")
    else:
        print("✅ Модель может различить классы")

def check_data_quality():
    """Проверяет качество данных"""
    print("\n🔍 Проверяем качество данных...")
    
    # Проверяем количество файлов
    train_pos = len(list(Path("train/positive").glob("*.jpg"))) if Path("train/positive").exists() else 0
    train_neg = len(list(Path("train/negative").glob("*.jpg"))) if Path("train/negative").exists() else 0
    val_pos = len(list(Path("val/positive").glob("*.jpg"))) if Path("val/positive").exists() else 0
    val_neg = len(list(Path("val/negative").glob("*.jpg"))) if Path("val/negative").exists() else 0
    test_pos = len(list(Path("test/positive").glob("*.jpg"))) if Path("test/positive").exists() else 0
    test_neg = len(list(Path("test/negative").glob("*.jpg"))) if Path("test/negative").exists() else 0
    
    print(f"📊 Количество изображений:")
    print(f"   Train: {train_pos} дефектов, {train_neg} норма")
    print(f"   Val: {val_pos} дефектов, {val_neg} норма")
    print(f"   Test: {test_pos} дефектов, {test_neg} норма")
    
    # Проверяем баланс
    total_pos = train_pos + val_pos + test_pos
    total_neg = train_neg + val_neg + test_neg
    
    if total_pos > 0 and total_neg > 0:
        ratio = total_pos / total_neg
        print(f"   Соотношение дефекты/норма: {ratio:.2f}")
        
        if ratio < 0.5 or ratio > 2.0:
            print("⚠️ ПРОБЛЕМА: Сильный дисбаланс классов!")
        else:
            print("✅ Классы достаточно сбалансированы")

def suggest_solutions():
    """Предлагает решения проблемы"""
    print("\n💡 ПРЕДЛОЖЕНИЯ ПО РЕШЕНИЮ:")
    
    print("1. 🔄 Проблема с синтетическими данными:")
    print("   - Синтетические изображения могут быть слишком 'идеальными'")
    print("   - Модель не может различить реальные и синтетические дефекты")
    print("   - РЕШЕНИЕ: Добавить больше реальных изображений дефектов")
    
    print("\n2. 📊 Проблема с аугментацией:")
    print("   - Слишком агрессивная аугментация искажает признаки")
    print("   - РЕШЕНИЕ: Использовать более консервативную аугментацию")
    
    print("\n3. 🏗️ Проблема с архитектурой:")
    print("   - Слишком сложная модель переобучается")
    print("   - РЕШЕНИЕ: Использовать transfer learning с предобученными моделями")
    
    print("\n4. 🎯 Проблема с loss function:")
    print("   - Binary crossentropy может не подходить для дисбаланса")
    print("   - РЕШЕНИЕ: Использовать focal loss или class weights")
    
    print("\n5. 📈 Проблема с данными:")
    print("   - Изображения дефектов и нормы слишком похожи")
    print("   - РЕШЕНИЕ: Собрать более разнообразные и контрастные данные")

def main():
    """Основная функция"""
    print("🔍 Анализ проблемы с данными")
    print("=" * 50)
    
    analyze_image_distributions()
    test_simple_model()
    check_data_quality()
    suggest_solutions()
    
    print("\n✅ Анализ завершен!")

if __name__ == "__main__":
    main()


