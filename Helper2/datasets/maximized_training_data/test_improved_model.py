#!/usr/bin/env python3
"""
Скрипт для тестирования улучшенной модели
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import os

def load_improved_model():
    """Загружает улучшенную модель"""
    try:
        model = keras.models.load_model("improved_model.h5")
        print("✅ Улучшенная модель загружена успешно")
        return model
    except Exception as e:
        print(f"❌ Ошибка загрузки улучшенной модели: {e}")
        try:
            model = keras.models.load_model("final_improved_model.h5")
            print("✅ Финальная улучшенная модель загружена успешно")
            return model
        except Exception as e2:
            print(f"❌ Ошибка загрузки финальной модели: {e2}")
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
        print(f"❌ Ошибка обработки изображения {image_path}: {e}")
        return None

def predict_defect(model, image_path, threshold=0.5):
    """Предсказывает наличие дефекта на изображении"""
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
        'normal_probability': (1 - confidence) * 100
    }

def test_improved_model():
    """Тестирует улучшенную модель"""
    print("🧪 Тестируем улучшенную модель...")
    
    model = load_improved_model()
    if model is None:
        return
    
    # Тестируем с разными порогами
    thresholds = [0.3, 0.4, 0.5, 0.6, 0.7]
    
    for threshold in thresholds:
        print(f"\n📊 Тестирование с порогом {threshold}:")
        
        # Собираем данные
        test_data = []
        test_labels = []
        
        # Дефекты
        test_positive_dir = "test/positive"
        if os.path.exists(test_positive_dir):
            for img_file in os.listdir(test_positive_dir):
                if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    img_path = os.path.join(test_positive_dir, img_file)
                    img_array = preprocess_image(img_path)
                    if img_array is not None:
                        pred = model.predict(img_array, verbose=0)[0][0]
                        test_data.append(pred)
                        test_labels.append(1)
        
        # Норма
        test_negative_dir = "test/negative"
        if os.path.exists(test_negative_dir):
            for img_file in os.listdir(test_negative_dir):
                if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    img_path = os.path.join(test_negative_dir, img_file)
                    img_array = preprocess_image(img_path)
                    if img_array is not None:
                        pred = model.predict(img_array, verbose=0)[0][0]
                        test_data.append(pred)
                        test_labels.append(0)
        
        test_data = np.array(test_data)
        test_labels = np.array(test_labels)
        
        # Вычисляем метрики
        predicted_labels = (test_data > threshold).astype(int)
        
        tp = np.sum((predicted_labels == 1) & (test_labels == 1))
        fp = np.sum((predicted_labels == 1) & (test_labels == 0))
        fn = np.sum((predicted_labels == 0) & (test_labels == 1))
        tn = np.sum((predicted_labels == 0) & (test_labels == 0))
        
        accuracy = (tp + tn) / len(test_labels)
        defect_accuracy = tp / (tp + fn) if (tp + fn) > 0 else 0
        normal_accuracy = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        print(f"   Точность: {accuracy:.1%}")
        print(f"   Дефекты: {defect_accuracy:.1%} ({tp}/{tp + fn})")
        print(f"   Норма: {normal_accuracy:.1%} ({tn}/{tn + fp})")
        print(f"   F1 Score: {f1:.3f}")

def test_individual_predictions():
    """Тестирует индивидуальные предсказания"""
    print("\n🔍 Тестируем индивидуальные предсказания...")
    
    model = load_improved_model()
    if model is None:
        return
    
    # Тестируем несколько примеров
    test_positive_dir = "test/positive"
    test_negative_dir = "test/negative"
    
    print("\n📊 Примеры дефектов:")
    if os.path.exists(test_positive_dir):
        count = 0
        for img_file in os.listdir(test_positive_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')) and count < 5:
                img_path = os.path.join(test_positive_dir, img_file)
                result = predict_defect(model, img_path, threshold=0.5)
                if result:
                    status = "✅ ДЕФЕКТ" if result['has_defect'] else "❌ НОРМА"
                    print(f"  {status} {img_file}: {result['defect_probability']:.1f}%")
                    count += 1
    
    print("\n📊 Примеры нормальных изображений:")
    if os.path.exists(test_negative_dir):
        count = 0
        for img_file in os.listdir(test_negative_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')) and count < 5:
                img_path = os.path.join(test_negative_dir, img_file)
                result = predict_defect(model, img_path, threshold=0.5)
                if result:
                    status = "✅ НОРМА" if not result['has_defect'] else "❌ ДЕФЕКТ"
                    print(f"  {status} {img_file}: {result['defect_probability']:.1f}%")
                    count += 1

def compare_models():
    """Сравнивает разные модели"""
    print("\n📊 Сравнение моделей:")
    print("   Исходная модель (7 изображений): 100% точность (переобучение)")
    print("   Расширенная модель (42 изображения): 61.9% точность (дисбаланс)")
    print("   Максимально улучшенная модель (717 изображений): 55.0% точность (консервативность)")
    print("   Улучшенная модель (717 изображений): см. результаты выше")

def main():
    """Основная функция"""
    print("🚀 Тестирование улучшенной модели")
    print("=" * 70)
    
    test_improved_model()
    test_individual_predictions()
    compare_models()
    
    print("\n✅ Тестирование завершено!")

if __name__ == "__main__":
    main()


