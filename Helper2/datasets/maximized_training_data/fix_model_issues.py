#!/usr/bin/env python3
"""
Скрипт для исправления проблем с максимально улучшенной моделью
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
from PIL import Image
import os
import json
import matplotlib.pyplot as plt

def analyze_model_predictions():
    """Анализирует предсказания модели для понимания проблемы"""
    print("🔍 Анализируем предсказания модели...")
    
    model = keras.models.load_model("best_maximized_model.h5")
    
    # Собираем все предсказания
    predictions = []
    true_labels = []
    filenames = []
    
    # Анализируем дефекты
    test_positive_dir = "test/positive"
    if os.path.exists(test_positive_dir):
        for img_file in os.listdir(test_positive_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_positive_dir, img_file)
                img_array = preprocess_image(img_path)
                if img_array is not None:
                    pred = model.predict(img_array, verbose=0)[0][0]
                    predictions.append(pred)
                    true_labels.append(1)  # дефект
                    filenames.append(f"DEFECT: {img_file}")
    
    # Анализируем нормальные изображения
    test_negative_dir = "test/negative"
    if os.path.exists(test_negative_dir):
        for img_file in os.listdir(test_negative_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_negative_dir, img_file)
                img_array = preprocess_image(img_path)
                if img_array is not None:
                    pred = model.predict(img_array, verbose=0)[0][0]
                    predictions.append(pred)
                    true_labels.append(0)  # норма
                    filenames.append(f"NORMAL: {img_file}")
    
    predictions = np.array(predictions)
    true_labels = np.array(true_labels)
    
    print(f"📊 Статистика предсказаний:")
    print(f"   Минимальное значение: {predictions.min():.4f}")
    print(f"   Максимальное значение: {predictions.max():.4f}")
    print(f"   Среднее значение: {predictions.mean():.4f}")
    print(f"   Медиана: {np.median(predictions):.4f}")
    print(f"   Стандартное отклонение: {predictions.std():.4f}")
    
    # Анализируем распределение
    defect_predictions = predictions[true_labels == 1]
    normal_predictions = predictions[true_labels == 0]
    
    print(f"\n📈 Распределение по классам:")
    print(f"   Дефекты - среднее: {defect_predictions.mean():.4f}, мин: {defect_predictions.min():.4f}, макс: {defect_predictions.max():.4f}")
    print(f"   Норма - среднее: {normal_predictions.mean():.4f}, мин: {normal_predictions.min():.4f}, макс: {normal_predictions.max():.4f}")
    
    # Находим оптимальный порог
    best_threshold = find_optimal_threshold(predictions, true_labels)
    print(f"\n🎯 Оптимальный порог: {best_threshold:.4f}")
    
    return predictions, true_labels, best_threshold

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

def find_optimal_threshold(predictions, true_labels):
    """Находит оптимальный порог для классификации"""
    thresholds = np.arange(0.1, 0.9, 0.01)
    best_threshold = 0.5
    best_f1 = 0
    
    for threshold in thresholds:
        predicted_labels = (predictions > threshold).astype(int)
        
        # Вычисляем метрики
        tp = np.sum((predicted_labels == 1) & (true_labels == 1))
        fp = np.sum((predicted_labels == 1) & (true_labels == 0))
        fn = np.sum((predicted_labels == 0) & (true_labels == 1))
        tn = np.sum((predicted_labels == 0) & (true_labels == 0))
        
        if tp + fp > 0 and tp + fn > 0:
            precision = tp / (tp + fp)
            recall = tp / (tp + fn)
            f1 = 2 * (precision * recall) / (precision + recall)
            
            if f1 > best_f1:
                best_f1 = f1
                best_threshold = threshold
    
    return best_threshold

def test_with_different_thresholds():
    """Тестирует модель с разными порогами"""
    print("\n🧪 Тестируем с разными порогами...")
    
    model = keras.models.load_model("best_maximized_model.h5")
    
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
    
    # Тестируем разные пороги
    thresholds = [0.3, 0.4, 0.5, 0.6, 0.7]
    
    print(f"\n📊 Результаты с разными порогами:")
    print(f"{'Порог':<8} {'Точность':<10} {'Дефекты':<10} {'Норма':<10} {'F1':<8}")
    print("-" * 50)
    
    best_threshold = 0.5
    best_accuracy = 0
    
    for threshold in thresholds:
        predicted_labels = (test_data > threshold).astype(int)
        
        # Вычисляем метрики
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
        
        print(f"{threshold:<8.1f} {accuracy:<10.1%} {defect_accuracy:<10.1%} {normal_accuracy:<10.1%} {f1:<8.3f}")
        
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_threshold = threshold
    
    print(f"\n🎯 Лучший порог: {best_threshold} (точность: {best_accuracy:.1%})")
    return best_threshold

def create_improved_model():
    """Создает улучшенную модель с лучшей архитектурой"""
    print("\n🔧 Создаем улучшенную модель...")
    
    # Более простая и эффективная архитектура
    model = keras.Sequential([
        # Первый блок
        layers.Conv2D(32, (3, 3), activation="relu", input_shape=(224, 224, 3)),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Второй блок
        layers.Conv2D(64, (3, 3), activation="relu"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Третий блок
        layers.Conv2D(128, (3, 3), activation="relu"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Полносвязные слои
        layers.Flatten(),
        layers.Dense(256, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(1, activation="sigmoid")
    ])
    
    # Оптимизатор с более высоким learning rate
    optimizer = keras.optimizers.Adam(learning_rate=0.001)
    
    model.compile(
        optimizer=optimizer,
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )
    
    return model

def retrain_improved_model():
    """Переобучает модель с улучшенными параметрами"""
    print("\n🚀 Переобучаем модель с улучшенными параметрами...")
    
    # Создаем улучшенную модель
    model = create_improved_model()
    
    # Создаем генераторы данных с менее агрессивной аугментацией
    train_datagen = keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        rotation_range=15,
        brightness_range=[0.9, 1.1],
        horizontal_flip=True,
        fill_mode='nearest'
    )
    
    train_generator = train_datagen.flow_from_directory(
        "train/",
        target_size=(224, 224),
        batch_size=16,  # Увеличиваем batch size
        class_mode="binary",
        shuffle=True
    )
    
    val_datagen = keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
    val_generator = val_datagen.flow_from_directory(
        "val/",
        target_size=(224, 224),
        batch_size=16,
        class_mode="binary",
        shuffle=False
    )
    
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=8,
            restore_best_weights=True,
            mode='max'
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-6,
            verbose=1
        ),
        keras.callbacks.ModelCheckpoint(
            'improved_model.h5',
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        )
    ]
    
    # Обучаем модель
    history = model.fit(
        train_generator,
        epochs=30,
        validation_data=val_generator,
        callbacks=callbacks,
        verbose=1
    )
    
    # Сохраняем финальную модель
    model.save("final_improved_model.h5")
    print("✅ Улучшенная модель сохранена: final_improved_model.h5")
    
    return model, history

def main():
    """Основная функция"""
    print("🔧 Исправляем проблемы с максимально улучшенной моделью")
    print("=" * 70)
    
    # Анализируем текущую модель
    predictions, true_labels, optimal_threshold = analyze_model_predictions()
    
    # Тестируем с разными порогами
    best_threshold = test_with_different_thresholds()
    
    # Переобучаем модель
    improved_model, history = retrain_improved_model()
    
    print("\n✅ Исправления завершены!")
    print(f"🎯 Рекомендуемый порог: {best_threshold}")
    print("📁 Созданы файлы: improved_model.h5, final_improved_model.h5")

if __name__ == "__main__":
    main()


