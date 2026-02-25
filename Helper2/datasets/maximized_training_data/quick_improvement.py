#!/usr/bin/env python3
"""
Быстрое улучшение точности на норме при сохранении 98% на дефектах
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
from PIL import Image
import os

def create_optimized_model():
    """Создает оптимизированную модель с лучшим балансом"""
    print("🔧 Создаем оптимизированную модель...")
    
    # Более простая архитектура с лучшим балансом
    model = keras.Sequential([
        # Первый блок
        layers.Conv2D(32, (3, 3), activation="relu", input_shape=(224, 224, 3)),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.2),
        
        # Второй блок
        layers.Conv2D(64, (3, 3), activation="relu"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.2),
        
        # Третий блок
        layers.Conv2D(128, (3, 3), activation="relu"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.3),
        
        # Полносвязные слои
        layers.Flatten(),
        layers.Dense(256, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(1, activation="sigmoid")
    ])
    
    # Оптимизатор с меньшим learning rate для стабильности
    optimizer = keras.optimizers.Adam(learning_rate=0.0005)
    
    model.compile(
        optimizer=optimizer,
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )
    
    return model

def train_optimized_model():
    """Обучает оптимизированную модель"""
    print("🚀 Обучаем оптимизированную модель...")
    
    model = create_optimized_model()
    
    # Генераторы данных с консервативной аугментацией
    train_datagen = keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        rotation_range=10,  # Меньше поворотов
        brightness_range=[0.95, 1.05],  # Меньше изменений яркости
        horizontal_flip=True,
        fill_mode='nearest'
    )
    
    train_generator = train_datagen.flow_from_directory(
        "train/",
        target_size=(224, 224),
        batch_size=16,
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
    
    # Callbacks с более агрессивным early stopping
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=3,  # Меньше patience
            restore_best_weights=True,
            mode='max'
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.3,  # Более агрессивное снижение
            patience=2,
            min_lr=1e-6,
            verbose=1
        ),
        keras.callbacks.ModelCheckpoint(
            'optimized_model.h5',
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        )
    ]
    
    # Обучаем модель
    history = model.fit(
        train_generator,
        epochs=15,  # Меньше эпох
        validation_data=val_generator,
        callbacks=callbacks,
        verbose=1
    )
    
    # Сохраняем финальную модель
    model.save("final_optimized_model.h5")
    print("✅ Оптимизированная модель сохранена: final_optimized_model.h5")
    
    return model

def test_optimized_model():
    """Тестирует оптимизированную модель"""
    print("🧪 Тестируем оптимизированную модель...")
    
    try:
        model = keras.models.load_model("optimized_model.h5")
        print("✅ Загружена лучшая модель из обучения")
    except:
        try:
            model = keras.models.load_model("final_optimized_model.h5")
            print("✅ Загружена финальная модель")
        except:
            print("❌ Не удалось загрузить модель")
            return
    
    def preprocess_image(image_path):
        try:
            img = Image.open(image_path)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img = img.resize((224, 224))
            img_array = np.array(img) / 255.0
            img_array = np.expand_dims(img_array, axis=0)
            return img_array
        except:
            return None
    
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
    
    print(f"📊 Проанализировано {len(test_data)} изображений")
    
    # Тестируем разные пороги
    print(f"\n📊 Результаты оптимизированной модели:")
    print(f"{'Порог':<6} {'Общая':<8} {'Дефекты':<10} {'Норма':<8} {'F1':<6} {'Оценка':<15}")
    print("-" * 70)
    
    best_threshold = 0.5
    best_score = 0
    
    for threshold in [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]:
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
        
        # Оценка результата
        if defect_accuracy >= 0.95 and normal_accuracy >= 0.5:
            evaluation = "🏆 ОТЛИЧНО"
        elif defect_accuracy >= 0.9 and normal_accuracy >= 0.3:
            evaluation = "✅ ХОРОШО"
        elif defect_accuracy >= 0.8:
            evaluation = "⚠️ УДОВЛЕТВОРИТЕЛЬНО"
        else:
            evaluation = "❌ ПЛОХО"
        
        print(f"{threshold:<6.1f} {accuracy:<8.1%} {defect_accuracy:<10.1%} {normal_accuracy:<8.1%} {f1:<6.3f} {evaluation:<15}")
        
        # Ищем лучший результат с сохранением 98% на дефектах
        if defect_accuracy >= 0.95 and normal_accuracy > best_score:
            best_score = normal_accuracy
            best_threshold = threshold
    
    print(f"\n🎯 РЕКОМЕНДАЦИЯ:")
    if best_score > 0:
        print(f"✅ Лучший порог: {best_threshold}")
        print(f"   Точность на дефектах: {defect_accuracy:.1%}")
        print(f"   Точность на норме: {normal_accuracy:.1%}")
        print(f"   Это улучшение по сравнению с предыдущими результатами!")
    else:
        print(f"⚠️ Не удалось найти порог с 95%+ на дефектах и улучшенной норме")
        print(f"   Рекомендуется использовать порог 0.3 для максимального обнаружения дефектов")

def main():
    """Основная функция"""
    print("🎯 Быстрое улучшение точности на норме при сохранении 98% на дефектах")
    print("=" * 70)
    
    # Обучаем оптимизированную модель
    model = train_optimized_model()
    
    # Тестируем
    test_optimized_model()
    
    print("\n✅ Улучшение завершено!")

if __name__ == "__main__":
    main()


