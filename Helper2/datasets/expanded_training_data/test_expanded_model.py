#!/usr/bin/env python3
"""
Скрипт для тестирования улучшенной модели на расширенном датасете
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import os
import json

def load_expanded_model():
    """Загружает улучшенную модель"""
    try:
        model = keras.models.load_model("expanded_concrete_defect_model.h5")
        print("✅ Улучшенная модель загружена успешно")
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

def test_expanded_model():
    """Тестирует улучшенную модель на всех данных"""
    print("🧪 Тестируем улучшенную модель на расширенном датасете...")
    
    model = load_expanded_model()
    if model is None:
        return
    
    # Тестируем на train данных
    print("\n📊 Результаты на обучающих данных:")
    train_positive_dir = "train/positive"
    train_negative_dir = "train/negative"
    
    correct_predictions = 0
    total_predictions = 0
    
    if os.path.exists(train_positive_dir):
        for img_file in os.listdir(train_positive_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(train_positive_dir, img_file)
                result = predict_defect(model, img_path)
                if result:
                    is_correct = result['has_defect']  # Должно быть True для positive
                    correct_predictions += is_correct
                    total_predictions += 1
                    status = "✅" if is_correct else "❌"
                    print(f"  {status} {img_file}: {'ДЕФЕКТ' if result['has_defect'] else 'НОРМА'} "
                          f"(уверенность: {result['defect_probability']:.1f}%)")
    
    if os.path.exists(train_negative_dir):
        for img_file in os.listdir(train_negative_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(train_negative_dir, img_file)
                result = predict_defect(model, img_path)
                if result:
                    is_correct = not result['has_defect']  # Должно быть False для negative
                    correct_predictions += is_correct
                    total_predictions += 1
                    status = "✅" if is_correct else "❌"
                    print(f"  {status} {img_file}: {'ДЕФЕКТ' if result['has_defect'] else 'НОРМА'} "
                          f"(уверенность: {result['defect_probability']:.1f}%)")
    
    # Тестируем на val данных
    print("\n📊 Результаты на валидационных данных:")
    val_positive_dir = "val/positive"
    val_negative_dir = "val/negative"
    
    if os.path.exists(val_positive_dir):
        for img_file in os.listdir(val_positive_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(val_positive_dir, img_file)
                result = predict_defect(model, img_path)
                if result:
                    is_correct = result['has_defect']
                    correct_predictions += is_correct
                    total_predictions += 1
                    status = "✅" if is_correct else "❌"
                    print(f"  {status} {img_file}: {'ДЕФЕКТ' if result['has_defect'] else 'НОРМА'} "
                          f"(уверенность: {result['defect_probability']:.1f}%)")
    
    if os.path.exists(val_negative_dir):
        for img_file in os.listdir(val_negative_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(val_negative_dir, img_file)
                result = predict_defect(model, img_path)
                if result:
                    is_correct = not result['has_defect']
                    correct_predictions += is_correct
                    total_predictions += 1
                    status = "✅" if is_correct else "❌"
                    print(f"  {status} {img_file}: {'ДЕФЕКТ' if result['has_defect'] else 'НОРМА'} "
                          f"(уверенность: {result['defect_probability']:.1f}%)")
    
    # Тестируем на test данных
    print("\n📊 Результаты на тестовых данных:")
    test_positive_dir = "test/positive"
    test_negative_dir = "test/negative"
    
    if os.path.exists(test_positive_dir):
        for img_file in os.listdir(test_positive_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_positive_dir, img_file)
                result = predict_defect(model, img_path)
                if result:
                    is_correct = result['has_defect']
                    correct_predictions += is_correct
                    total_predictions += 1
                    status = "✅" if is_correct else "❌"
                    print(f"  {status} {img_file}: {'ДЕФЕКТ' if result['has_defect'] else 'НОРМА'} "
                          f"(уверенность: {result['defect_probability']:.1f}%)")
    
    if os.path.exists(test_negative_dir):
        for img_file in os.listdir(test_negative_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_negative_dir, img_file)
                result = predict_defect(model, img_path)
                if result:
                    is_correct = not result['has_defect']
                    correct_predictions += is_correct
                    total_predictions += 1
                    status = "✅" if is_correct else "❌"
                    print(f"  {status} {img_file}: {'ДЕФЕКТ' if result['has_defect'] else 'НОРМА'} "
                          f"(уверенность: {result['defect_probability']:.1f}%)")
    
    # Выводим общую статистику
    if total_predictions > 0:
        accuracy = (correct_predictions / total_predictions) * 100
        print(f"\n📈 Общая статистика:")
        print(f"   Правильных предсказаний: {correct_predictions}/{total_predictions}")
        print(f"   Точность: {accuracy:.1f}%")
    else:
        print("\n❌ Нет данных для тестирования")

def main():
    """Основная функция"""
    print("🚀 Тестирование улучшенной модели на расширенном датасете")
    print("=" * 70)
    
    test_expanded_model()
    
    print("\n✅ Тестирование завершено!")

if __name__ == "__main__":
    main()


