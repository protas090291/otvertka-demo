#!/usr/bin/env python3
"""
Скрипт для переобучения модели на расширенном датасете
"""

import os
import shutil
from pathlib import Path
import json

def prepare_expanded_dataset():
    """Подготавливает расширенный датасет для обучения"""
    print("🔄 Подготавливаем расширенный датасет...")
    
    # Создаем структуру для обучения
    train_dir = Path("expanded_training_data")
    train_dir.mkdir(exist_ok=True)
    
    # Создаем поддиректории
    (train_dir / "train" / "positive").mkdir(parents=True, exist_ok=True)
    (train_dir / "train" / "negative").mkdir(parents=True, exist_ok=True)
    (train_dir / "val" / "positive").mkdir(parents=True, exist_ok=True)
    (train_dir / "val" / "negative").mkdir(parents=True, exist_ok=True)
    (train_dir / "test" / "positive").mkdir(parents=True, exist_ok=True)
    (train_dir / "test" / "negative").mkdir(parents=True, exist_ok=True)
    
    # Копируем изображения из expanded_dataset
    source_positive = Path("expanded_dataset/positive")
    source_negative = Path("expanded_dataset/negative")
    
    if source_positive.exists():
        positive_images = list(source_positive.glob("*.jpg"))
        negative_images = list(source_negative.glob("*.jpg"))
        
        print(f"📊 Найдено изображений:")
        print(f"   Дефекты: {len(positive_images)}")
        print(f"   Норма: {len(negative_images)}")
        
        # Разделяем на train/val/test (70%/15%/15%)
        train_pos = positive_images[:int(len(positive_images) * 0.7)]
        val_pos = positive_images[int(len(positive_images) * 0.7):int(len(positive_images) * 0.85)]
        test_pos = positive_images[int(len(positive_images) * 0.85):]
        
        train_neg = negative_images[:int(len(negative_images) * 0.7)]
        val_neg = negative_images[int(len(negative_images) * 0.7):int(len(negative_images) * 0.85)]
        test_neg = negative_images[int(len(negative_images) * 0.85):]
        
        # Копируем файлы
        for img in train_pos:
            shutil.copy2(img, train_dir / "train" / "positive" / img.name)
        for img in val_pos:
            shutil.copy2(img, train_dir / "val" / "positive" / img.name)
        for img in test_pos:
            shutil.copy2(img, train_dir / "test" / "positive" / img.name)
            
        for img in train_neg:
            shutil.copy2(img, train_dir / "train" / "negative" / img.name)
        for img in val_neg:
            shutil.copy2(img, train_dir / "val" / "negative" / img.name)
        for img in test_neg:
            shutil.copy2(img, train_dir / "test" / "negative" / img.name)
        
        print(f"✅ Разделение завершено:")
        print(f"   Train: {len(train_pos)} дефектов, {len(train_neg)} норма")
        print(f"   Val: {len(val_pos)} дефектов, {len(val_neg)} норма")
        print(f"   Test: {len(test_pos)} дефектов, {len(test_neg)} норма")
    
    return train_dir

def create_expanded_config():
    """Создает конфигурацию для расширенного датасета"""
    config = {
        "dataset_name": "expanded_concrete_defects",
        "description": "Расширенный датасет дефектов бетона с синтетическими примерами",
        "classes": {
            "positive": "Дефекты (трещины, пятна, повреждения)",
            "negative": "Нормальный бетон без дефектов"
        },
        "image_size": [224, 224],
        "augmentation": {
            "rotation": 20,
            "brightness": 0.3,
            "contrast": 0.3,
            "horizontal_flip": True,
            "zoom_range": 0.2
        },
        "training": {
            "batch_size": 16,
            "epochs": 20,
            "learning_rate": 0.0005,
            "validation_split": 0.2
        }
    }
    
    return config

def create_retrain_script():
    """Создает скрипт для переобучения"""
    script_content = '''#!/usr/bin/env python3
"""
Скрипт для переобучения модели на расширенном датасете
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import json
from pathlib import Path
import numpy as np

def load_dataset_config():
    """Загружает конфигурацию датасета"""
    with open("expanded_dataset_config.json", "r", encoding="utf-8") as f:
        return json.load(f)

def create_data_generators(config):
    """Создает генераторы данных для обучения"""
    train_datagen = keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        rotation_range=config["augmentation"]["rotation"],
        brightness_range=[1-config["augmentation"]["brightness"], 
                         1+config["augmentation"]["brightness"]],
        horizontal_flip=config["augmentation"]["horizontal_flip"],
        zoom_range=config["augmentation"]["zoom_range"]
    )
    
    train_generator = train_datagen.flow_from_directory(
        "train/",
        target_size=tuple(config["image_size"]),
        batch_size=config["training"]["batch_size"],
        class_mode="binary"
    )
    
    val_datagen = keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
    val_generator = val_datagen.flow_from_directory(
        "val/",
        target_size=tuple(config["image_size"]),
        batch_size=config["training"]["batch_size"],
        class_mode="binary"
    )
    
    return train_generator, val_generator

def create_improved_model(config):
    """Создает улучшенную модель для классификации"""
    model = keras.Sequential([
        layers.Conv2D(32, (3, 3), activation="relu", input_shape=(*config["image_size"], 3)),
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
        layers.Dropout(0.25),
        
        layers.Flatten(),
        layers.Dense(512, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(256, activation="relu"),
        layers.Dropout(0.5),
        layers.Dense(1, activation="sigmoid")
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=config["training"]["learning_rate"]),
        loss="binary_crossentropy",
        metrics=["accuracy", "precision", "recall"]
    )
    
    return model

def train_expanded_model():
    """Обучает модель на расширенном датасете"""
    print("🚀 Начинаем переобучение модели на расширенном датасете...")
    
    # Загружаем конфигурацию
    config = load_dataset_config()
    
    # Создаем генераторы данных
    train_gen, val_gen = create_data_generators(config)
    
    # Создаем улучшенную модель
    model = create_improved_model(config)
    
    # Выводим архитектуру модели
    model.summary()
    
    # Callbacks для улучшения обучения
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-7
        )
    ]
    
    # Обучаем модель
    history = model.fit(
        train_gen,
        epochs=config["training"]["epochs"],
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Сохраняем модель
    model.save("expanded_concrete_defect_model.h5")
    print("✅ Улучшенная модель сохранена: expanded_concrete_defect_model.h5")
    
    # Сохраняем историю обучения
    with open("training_history.json", "w") as f:
        json.dump({
            'loss': [float(x) for x in history.history['loss']],
            'accuracy': [float(x) for x in history.history['accuracy']],
            'val_loss': [float(x) for x in history.history['val_loss']],
            'val_accuracy': [float(x) for x in history.history['val_accuracy']]
        }, f)
    
    return model, history

if __name__ == "__main__":
    train_expanded_model()
'''
    
    return script_content

def main():
    """Основная функция"""
    print("🚀 Подготовка к переобучению модели на расширенном датасете")
    print("=" * 70)
    
    # Подготавливаем датасет
    train_dir = prepare_expanded_dataset()
    
    # Создаем конфигурацию
    config = create_expanded_config()
    with open(train_dir / "expanded_dataset_config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    # Создаем скрипт переобучения
    script_content = create_retrain_script()
    with open(train_dir / "retrain_model.py", "w", encoding="utf-8") as f:
        f.write(script_content)
    
    print(f"\n✅ Подготовка завершена!")
    print(f"📁 Директория: {train_dir}")
    print(f"📊 Конфигурация: {train_dir}/expanded_dataset_config.json")
    print(f"🤖 Скрипт обучения: {train_dir}/retrain_model.py")
    
    print(f"\n🎯 Для запуска переобучения:")
    print(f"   cd {train_dir}")
    print(f"   python retrain_model.py")

if __name__ == "__main__":
    main()


