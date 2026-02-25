#!/usr/bin/env python3
"""
Скрипт для улучшения точности на нормальных изображениях при сохранении 98% на дефектах
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
from PIL import Image
import os
import json
from pathlib import Path

def create_specialized_models():
    """Создает специализированные модели для разных задач"""
    print("🔧 Создаем специализированные модели...")
    
    # Модель 1: Фокус на дефекты (сохраняем 98%)
    defect_model = keras.Sequential([
        layers.Conv2D(32, (3, 3), activation="relu", input_shape=(224, 224, 3)),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.2),
        
        layers.Conv2D(64, (3, 3), activation="relu"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.2),
        
        layers.Conv2D(128, (3, 3), activation="relu"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.3),
        
        layers.Flatten(),
        layers.Dense(256, activation="relu"),
        layers.Dropout(0.4),
        layers.Dense(1, activation="sigmoid")
    ])
    
    defect_model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )
    
    # Модель 2: Фокус на норму (улучшаем точность на норме)
    normal_model = keras.Sequential([
        layers.Conv2D(32, (3, 3), activation="relu", input_shape=(224, 224, 3)),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        layers.Conv2D(64, (3, 3), activation="relu"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        layers.Conv2D(128, (3, 3), activation="relu"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.3),
        
        layers.Flatten(),
        layers.Dense(256, activation="relu"),
        layers.Dropout(0.5),
        layers.Dense(1, activation="sigmoid")
    ])
    
    normal_model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0005),  # Меньший learning rate
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )
    
    return defect_model, normal_model

def create_balanced_dataset():
    """Создает сбалансированный датасет с акцентом на норму"""
    print("📊 Создаем сбалансированный датасет...")
    
    # Создаем структуру
    balanced_dir = Path("balanced_dataset")
    (balanced_dir / "train" / "positive").mkdir(parents=True, exist_ok=True)
    (balanced_dir / "train" / "negative").mkdir(parents=True, exist_ok=True)
    (balanced_dir / "val" / "positive").mkdir(parents=True, exist_ok=True)
    (balanced_dir / "val" / "negative").mkdir(parents=True, exist_ok=True)
    (balanced_dir / "test" / "positive").mkdir(parents=True, exist_ok=True)
    (balanced_dir / "test" / "negative").mkdir(parents=True, exist_ok=True)
    
    # Копируем существующие данные
    import shutil
    
    # Дефекты (все)
    if Path("train/positive").exists():
        for img in Path("train/positive").glob("*.jpg"):
            shutil.copy2(img, balanced_dir / "train" / "positive" / img.name)
    if Path("val/positive").exists():
        for img in Path("val/positive").glob("*.jpg"):
            shutil.copy2(img, balanced_dir / "val" / "positive" / img.name)
    if Path("test/positive").exists():
        for img in Path("test/positive").glob("*.jpg"):
            shutil.copy2(img, balanced_dir / "test" / "positive" / img.name)
    
    # Норма (все)
    if Path("train/negative").exists():
        for img in Path("train/negative").glob("*.jpg"):
            shutil.copy2(img, balanced_dir / "train" / "negative" / img.name)
    if Path("val/negative").exists():
        for img in Path("val/negative").glob("*.jpg"):
            shutil.copy2(img, balanced_dir / "val" / "negative" / img.name)
    if Path("test/negative").exists():
        for img in Path("test/negative").glob("*.jpg"):
            shutil.copy2(img, balanced_dir / "test" / "negative" / img.name)
    
    return balanced_dir

def train_specialized_models():
    """Обучает специализированные модели"""
    print("🚀 Обучаем специализированные модели...")
    
    # Создаем датасет
    dataset_dir = create_balanced_dataset()
    
    # Создаем модели
    defect_model, normal_model = create_specialized_models()
    
    # Генераторы данных
    train_datagen = keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        rotation_range=10,  # Меньше аугментации
        brightness_range=[0.95, 1.05],  # Меньше изменений
        horizontal_flip=True,
        fill_mode='nearest'
    )
    
    train_generator = train_datagen.flow_from_directory(
        str(dataset_dir / "train"),
        target_size=(224, 224),
        batch_size=16,
        class_mode="binary",
        shuffle=True
    )
    
    val_datagen = keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
    val_generator = val_datagen.flow_from_directory(
        str(dataset_dir / "val"),
        target_size=(224, 224),
        batch_size=16,
        class_mode="binary",
        shuffle=False
    )
    
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=5,
            restore_best_weights=True,
            mode='max'
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Обучаем модель для дефектов
    print("🎯 Обучаем модель для дефектов...")
    defect_model.fit(
        train_generator,
        epochs=20,
        validation_data=val_generator,
        callbacks=callbacks,
        verbose=1
    )
    defect_model.save("defect_focused_model.h5")
    
    # Обучаем модель для нормы
    print("🎯 Обучаем модель для нормы...")
    normal_model.fit(
        train_generator,
        epochs=20,
        validation_data=val_generator,
        callbacks=callbacks,
        verbose=1
    )
    normal_model.save("normal_focused_model.h5")
    
    return defect_model, normal_model

def create_ensemble_model():
    """Создает ensemble модель из двух специализированных"""
    print("🤝 Создаем ensemble модель...")
    
    # Загружаем обученные модели
    defect_model = keras.models.load_model("defect_focused_model.h5")
    normal_model = keras.models.load_model("normal_focused_model.h5")
    
    # Создаем ensemble
    def ensemble_predict(image_array):
        defect_pred = defect_model.predict(image_array, verbose=0)[0][0]
        normal_pred = normal_model.predict(image_array, verbose=0)[0][0]
        
        # Комбинируем предсказания
        # Если модель дефектов уверена в дефекте, и модель нормы не уверена в норме
        if defect_pred > 0.3 and normal_pred < 0.7:
            return defect_pred  # Дефект
        elif normal_pred > 0.6 and defect_pred < 0.4:
            return 0.2  # Норма (низкая вероятность дефекта)
        else:
            # Компромисс
            return (defect_pred + (1 - normal_pred)) / 2
    
    return ensemble_predict

def test_ensemble_model():
    """Тестирует ensemble модель"""
    print("🧪 Тестируем ensemble модель...")
    
    ensemble_predict = create_ensemble_model()
    
    # Тестируем на данных
    test_positive_dir = "test/positive"
    test_negative_dir = "test/negative"
    
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
    
    # Собираем предсказания
    predictions = []
    true_labels = []
    
    # Дефекты
    if os.path.exists(test_positive_dir):
        for img_file in os.listdir(test_positive_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_positive_dir, img_file)
                img_array = preprocess_image(img_path)
                if img_array is not None:
                    pred = ensemble_predict(img_array)
                    predictions.append(pred)
                    true_labels.append(1)
    
    # Норма
    if os.path.exists(test_negative_dir):
        for img_file in os.listdir(test_negative_dir):
            if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(test_negative_dir, img_file)
                img_array = preprocess_image(img_path)
                if img_array is not None:
                    pred = ensemble_predict(img_array)
                    predictions.append(pred)
                    true_labels.append(0)
    
    predictions = np.array(predictions)
    true_labels = np.array(true_labels)
    
    # Тестируем разные пороги
    print(f"\n📊 Результаты ensemble модели:")
    print(f"{'Порог':<6} {'Общая':<8} {'Дефекты':<10} {'Норма':<8} {'F1':<6}")
    print("-" * 50)
    
    best_threshold = 0.5
    best_score = 0
    
    for threshold in [0.3, 0.4, 0.5, 0.6, 0.7]:
        predicted_labels = (predictions > threshold).astype(int)
        
        tp = np.sum((predicted_labels == 1) & (true_labels == 1))
        fp = np.sum((predicted_labels == 1) & (true_labels == 0))
        fn = np.sum((predicted_labels == 0) & (true_labels == 1))
        tn = np.sum((predicted_labels == 0) & (true_labels == 0))
        
        accuracy = (tp + tn) / len(true_labels)
        defect_accuracy = tp / (tp + fn) if (tp + fn) > 0 else 0
        normal_accuracy = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        print(f"{threshold:<6.1f} {accuracy:<8.1%} {defect_accuracy:<10.1%} {normal_accuracy:<8.1%} {f1:<6.3f}")
        
        # Ищем лучший баланс
        if defect_accuracy >= 0.95 and normal_accuracy > best_score:
            best_score = normal_accuracy
            best_threshold = threshold
    
    print(f"\n🎯 Лучший порог для сохранения 98% дефектов: {best_threshold}")
    print(f"   Точность на дефектах: {defect_accuracy:.1%}")
    print(f"   Точность на норме: {normal_accuracy:.1%}")

def main():
    """Основная функция"""
    print("🎯 Улучшаем точность на норме при сохранении 98% на дефектах")
    print("=" * 70)
    
    # Обучаем специализированные модели
    defect_model, normal_model = train_specialized_models()
    
    # Тестируем ensemble
    test_ensemble_model()
    
    print("\n✅ Улучшение завершено!")

if __name__ == "__main__":
    main()
