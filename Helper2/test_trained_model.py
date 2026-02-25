#!/usr/bin/env python3
"""
Скрипт для тестирования обученной модели на новых изображениях
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import os
import sys

def load_model():
    """Загружает обученную модель"""
    try:
        model = keras.models.load_model("concrete_defect_model.h5")
        print("✅ Модель загружена успешно")
        return model
    except Exception as e:
        print(f"❌ Ошибка загрузки модели: {e}")
        return None

def preprocess_image(image_path, target_size=(224, 224)):
    """Предобрабатывает изображение для модели"""
    try:
        # Загружаем изображение
        img = Image.open(image_path)
        
        # Конвертируем в RGB если нужно
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Изменяем размер
        img = img.resize(target_size)
        
        # Конвертируем в массив и нормализуем
        img_array = np.array(img) / 255.0
        
        # Добавляем batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        print(f"❌ Ошибка обработки изображения {image_path}: {e}")
        return None

def predict_defect(model, image_path):
    """Предсказывает наличие дефекта на изображении"""
    # Предобрабатываем изображение
    img_array = preprocess_image(image_path)
    if img_array is None:
        return None
    
    # Делаем предсказание
    prediction = model.predict(img_array, verbose=0)
    
    # Интерпретируем результат
    confidence = float(prediction[0][0])
    has_defect = confidence > 0.5
    
    return {
        'has_defect': has_defect,
        'confidence': confidence,
        'defect_probability': confidence * 100,
        'normal_probability': (1 - confidence) * 100
    }

def test_model_on_dataset():
    """Тестирует модель на всех изображениях в датасете"""
    print("🧪 Тестируем модель на датасете...")
    
    # Загружаем модель
    model = load_model()
    if model is None:
        return
    
    # Тестируем на train данных
    print("\n📊 Результаты на обучающих данных:")
    train_positive_dir = "train/positive"
    train_negative_dir = "train/negative"
    
    if os.path.exists(train_positive_dir):
        for img_file in os.listdir(train_positive_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(train_positive_dir, img_file)
                result = predict_defect(model, img_path)
                if result:
                    print(f"  {img_file}: {'✅ ДЕФЕКТ' if result['has_defect'] else '❌ НОРМА'} "
                          f"(уверенность: {result['defect_probability']:.1f}%)")
    
    if os.path.exists(train_negative_dir):
        for img_file in os.listdir(train_negative_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(train_negative_dir, img_file)
                result = predict_defect(model, img_path)
                if result:
                    print(f"  {img_file}: {'✅ ДЕФЕКТ' if result['has_defect'] else '❌ НОРМА'} "
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
                    print(f"  {img_file}: {'✅ ДЕФЕКТ' if result['has_defect'] else '❌ НОРМА'} "
                          f"(уверенность: {result['defect_probability']:.1f}%)")
    
    if os.path.exists(test_negative_dir):
        for img_file in os.listdir(test_negative_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_negative_dir, img_file)
                result = predict_defect(model, img_path)
                if result:
                    print(f"  {img_file}: {'✅ ДЕФЕКТ' if result['has_defect'] else '❌ НОРМА'} "
                          f"(уверенность: {result['defect_probability']:.1f}%)")

def test_single_image(image_path):
    """Тестирует модель на одном изображении"""
    print(f"🔍 Анализируем изображение: {image_path}")
    
    # Загружаем модель
    model = load_model()
    if model is None:
        return
    
    # Делаем предсказание
    result = predict_defect(model, image_path)
    if result is None:
        return
    
    # Выводим результат
    print(f"📊 Результат анализа:")
    print(f"   Наличие дефекта: {'✅ ДА' if result['has_defect'] else '❌ НЕТ'}")
    print(f"   Уверенность: {result['confidence']:.3f}")
    print(f"   Вероятность дефекта: {result['defect_probability']:.1f}%")
    print(f"   Вероятность нормы: {result['normal_probability']:.1f}%")

def main():
    """Основная функция"""
    print("🚀 Тестирование обученной модели классификации дефектов")
    print("=" * 60)
    
    if len(sys.argv) > 1:
        # Тестируем конкретное изображение
        image_path = sys.argv[1]
        if os.path.exists(image_path):
            test_single_image(image_path)
        else:
            print(f"❌ Файл не найден: {image_path}")
    else:
        # Тестируем на всем датасете
        test_model_on_dataset()
    
    print("\n✅ Тестирование завершено!")

if __name__ == "__main__":
    main()


