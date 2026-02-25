#!/usr/bin/env python3
"""
Скрипт для интеграции датасета с системой анализа дефектов
"""

import os
import shutil
from pathlib import Path
import json

def create_training_structure():
    """Создает структуру для обучения модели"""
    print("🔄 Создаем структуру для обучения...")
    
    # Создаем директории для обучения
    train_dirs = [
        "training_data/train/positive",
        "training_data/train/negative", 
        "training_data/val/positive",
        "training_data/val/negative",
        "training_data/test/positive",
        "training_data/test/negative"
    ]
    
    for dir_path in train_dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    
    return train_dirs

def split_dataset():
    """Разделяет датасет на train/val/test"""
    print("🔄 Разделяем датасет на train/val/test...")
    
    # Копируем существующие изображения
    source_positive = Path("concrete_cracks/positive")
    source_negative = Path("concrete_cracks/negative")
    
    if source_positive.exists():
        positive_images = list(source_positive.glob("*.jpg"))
        negative_images = list(source_negative.glob("*.jpg"))
        
        # Разделяем положительные примеры (80% train, 10% val, 10% test)
        train_pos = positive_images[:int(len(positive_images) * 0.8)]
        val_pos = positive_images[int(len(positive_images) * 0.8):int(len(positive_images) * 0.9)]
        test_pos = positive_images[int(len(positive_images) * 0.9):]
        
        # Разделяем отрицательные примеры
        train_neg = negative_images[:int(len(negative_images) * 0.8)]
        val_neg = negative_images[int(len(negative_images) * 0.8):int(len(negative_images) * 0.9)]
        test_neg = negative_images[int(len(negative_images) * 0.9):]
        
        # Копируем файлы
        for img in train_pos:
            shutil.copy2(img, "training_data/train/positive/")
        for img in val_pos:
            shutil.copy2(img, "training_data/val/positive/")
        for img in test_pos:
            shutil.copy2(img, "training_data/test/positive/")
            
        for img in train_neg:
            shutil.copy2(img, "training_data/train/negative/")
        for img in val_neg:
            shutil.copy2(img, "training_data/val/negative/")
        for img in test_neg:
            shutil.copy2(img, "training_data/test/negative/")
        
        print(f"✅ Разделение завершено:")
        print(f"   Train: {len(train_pos)} положительных, {len(train_neg)} отрицательных")
        print(f"   Val: {len(val_pos)} положительных, {len(val_neg)} отрицательных")
        print(f"   Test: {len(test_pos)} положительных, {len(test_neg)} отрицательных")

def create_dataset_config():
    """Создает конфигурационный файл для датасета"""
    config = {
        "dataset_name": "concrete_defects",
        "description": "Датасет дефектов бетона для обучения модели классификации",
        "classes": {
            "positive": "Дефекты (трещины, сколы, повреждения)",
            "negative": "Нормальный бетон без дефектов"
        },
        "image_size": [224, 224],
        "augmentation": {
            "rotation": 15,
            "brightness": 0.2,
            "contrast": 0.2,
            "horizontal_flip": True
        },
        "training": {
            "batch_size": 32,
            "epochs": 50,
            "learning_rate": 0.001,
            "validation_split": 0.2
        }
    }
    
    with open("training_data/dataset_config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("✅ Конфигурация датасета создана: training_data/dataset_config.json")

def create_training_script():
    """Создает скрипт для обучения модели"""
    training_script = '''#!/usr/bin/env python3
"""
Скрипт для обучения модели классификации дефектов бетона
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import json
from pathlib import Path
import numpy as np

def load_dataset_config():
    """Загружает конфигурацию датасета"""
    with open("dataset_config.json", "r", encoding="utf-8") as f:
        return json.load(f)

def create_data_generators(config):
    """Создает генераторы данных для обучения"""
    train_datagen = keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        rotation_range=config["augmentation"]["rotation"],
        brightness_range=[1-config["augmentation"]["brightness"], 
                         1+config["augmentation"]["brightness"]],
        horizontal_flip=config["augmentation"]["horizontal_flip"],
        validation_split=config["training"]["validation_split"]
    )
    
    train_generator = train_datagen.flow_from_directory(
        "train/",
        target_size=tuple(config["image_size"]),
        batch_size=config["training"]["batch_size"],
        class_mode="binary",
        subset="training"
    )
    
    val_generator = train_datagen.flow_from_directory(
        "train/",
        target_size=tuple(config["image_size"]),
        batch_size=config["training"]["batch_size"],
        class_mode="binary",
        subset="validation"
    )
    
    return train_generator, val_generator

def create_model(config):
    """Создает модель для классификации"""
    model = keras.Sequential([
        layers.Conv2D(32, (3, 3), activation="relu", input_shape=(*config["image_size"], 3)),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation="relu"),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation="relu"),
        layers.Flatten(),
        layers.Dense(64, activation="relu"),
        layers.Dropout(0.5),
        layers.Dense(1, activation="sigmoid")
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=config["training"]["learning_rate"]),
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )
    
    return model

def train_model():
    """Обучает модель"""
    print("🚀 Начинаем обучение модели...")
    
    # Загружаем конфигурацию
    config = load_dataset_config()
    
    # Создаем генераторы данных
    train_gen, val_gen = create_data_generators(config)
    
    # Создаем модель
    model = create_model(config)
    
    # Выводим архитектуру модели
    model.summary()
    
    # Обучаем модель
    history = model.fit(
        train_gen,
        epochs=config["training"]["epochs"],
        validation_data=val_gen,
        verbose=1
    )
    
    # Сохраняем модель
    model.save("concrete_defect_model.h5")
    print("✅ Модель сохранена: concrete_defect_model.h5")
    
    return model, history

if __name__ == "__main__":
    train_model()
'''
    
    with open("training_data/train_model.py", "w", encoding="utf-8") as f:
        f.write(training_script)
    
    print("✅ Скрипт обучения создан: training_data/train_model.py")

def main():
    """Основная функция"""
    print("🚀 Интеграция датасета с системой анализа дефектов...")
    
    # Создаем структуру для обучения
    create_training_structure()
    
    # Разделяем датасет
    split_dataset()
    
    # Создаем конфигурацию
    create_dataset_config()
    
    # Создаем скрипт обучения
    create_training_script()
    
    print("✅ Интеграция завершена!")
    print("📁 Структура датасета:")
    print("   training_data/")
    print("   ├── train/")
    print("   ├── val/")
    print("   ├── test/")
    print("   ├── dataset_config.json")
    print("   └── train_model.py")
    print("")
    print("🎯 Следующие шаги:")
    print("   1. cd training_data")
    print("   2. pip install tensorflow")
    print("   3. python train_model.py")

if __name__ == "__main__":
    main()


