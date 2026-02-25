#!/usr/bin/env python3
"""
Скрипт для тестирования максимально улучшенной модели
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import os
import json

def load_maximized_model():
    """Загружает максимально улучшенную модель"""
    try:
        model = keras.models.load_model("best_maximized_model.h5")
        print("✅ Максимально улучшенная модель загружена успешно")
        return model
    except Exception as e:
        print(f"❌ Ошибка загрузки модели: {e}")
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

def predict_defect(model, image_path):
    """Предсказывает наличие дефекта на изображении"""
    img_array = preprocess_image(image_path)
    if img_array is None:
        return None
    
    prediction = model.predict(img_array, verbose=0)
    confidence = float(prediction[0][0])
    has_defect = confidence > 0.5
    
    return {
        'has_defect': has_defect,
        'confidence': confidence,
        'defect_probability': confidence * 100,
        'normal_probability': (1 - confidence) * 100
    }

def test_maximized_model():
    """Тестирует максимально улучшенную модель"""
    print("🧪 Тестируем максимально улучшенную модель...")
    
    model = load_maximized_model()
    if model is None:
        return
    
    # Тестируем на test данных
    print("\n📊 Результаты на тестовых данных:")
    test_positive_dir = "test/positive"
    test_negative_dir = "test/negative"
    
    correct_predictions = 0
    total_predictions = 0
    positive_correct = 0
    positive_total = 0
    negative_correct = 0
    negative_total = 0
    
    if os.path.exists(test_positive_dir):
        print("🔍 Тестируем дефекты:")
        for img_file in os.listdir(test_positive_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_positive_dir, img_file)
                result = predict_defect(model, img_path)
                if result:
                    is_correct = result['has_defect']  # Должно быть True
                    correct_predictions += is_correct
                    positive_correct += is_correct
                    total_predictions += 1
                    positive_total += 1
                    status = "✅" if is_correct else "❌"
                    print(f"  {status} {img_file}: {'ДЕФЕКТ' if result['has_defect'] else 'НОРМА'} "
                          f"(уверенность: {result['defect_probability']:.1f}%)")
    
    if os.path.exists(test_negative_dir):
        print("\n🔍 Тестируем нормальные изображения:")
        for img_file in os.listdir(test_negative_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_negative_dir, img_file)
                result = predict_defect(model, img_path)
                if result:
                    is_correct = not result['has_defect']  # Должно быть False
                    correct_predictions += is_correct
                    negative_correct += is_correct
                    total_predictions += 1
                    negative_total += 1
                    status = "✅" if is_correct else "❌"
                    print(f"  {status} {img_file}: {'ДЕФЕКТ' if result['has_defect'] else 'НОРМА'} "
                          f"(уверенность: {result['defect_probability']:.1f}%)")
    
    # Выводим детальную статистику
    if total_predictions > 0:
        overall_accuracy = (correct_predictions / total_predictions) * 100
        positive_accuracy = (positive_correct / positive_total) * 100 if positive_total > 0 else 0
        negative_accuracy = (negative_correct / negative_total) * 100 if negative_total > 0 else 0
        
        print(f"\n📈 Детальная статистика:")
        print(f"   Общая точность: {overall_accuracy:.1f}% ({correct_predictions}/{total_predictions})")
        print(f"   Точность на дефектах: {positive_accuracy:.1f}% ({positive_correct}/{positive_total})")
        print(f"   Точность на норме: {negative_accuracy:.1f}% ({negative_correct}/{negative_total})")
        
        # Анализ результатов
        print(f"\n🎯 Анализ результатов:")
        if overall_accuracy >= 90:
            print("   🏆 ОТЛИЧНЫЙ результат! Модель работает превосходно!")
        elif overall_accuracy >= 80:
            print("   ✅ ХОРОШИЙ результат! Модель работает хорошо!")
        elif overall_accuracy >= 70:
            print("   ⚠️ УДОВЛЕТВОРИТЕЛЬНЫЙ результат. Есть место для улучшения.")
        else:
            print("   ❌ ПЛОХОЙ результат. Требуется доработка модели.")
        
        if abs(positive_accuracy - negative_accuracy) <= 10:
            print("   ✅ Классы сбалансированы!")
        else:
            print("   ⚠️ Есть дисбаланс между классами.")
    else:
        print("\n❌ Нет данных для тестирования")

def compare_with_previous_models():
    """Сравнивает с предыдущими моделями"""
    print("\n📊 Сравнение с предыдущими моделями:")
    print("   Исходная модель (7 изображений): 100% точность (переобучение)")
    print("   Расширенная модель (42 изображения): 61.9% точность (дисбаланс)")
    print("   Максимально улучшенная модель (717 изображений): см. результаты выше")

def main():
    """Основная функция"""
    print("🚀 Тестирование максимально улучшенной модели")
    print("=" * 70)
    
    test_maximized_model()
    compare_with_previous_models()
    
    print("\n✅ Тестирование завершено!")

if __name__ == "__main__":
    main()


