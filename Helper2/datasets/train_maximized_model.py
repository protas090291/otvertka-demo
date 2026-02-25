#!/usr/bin/env python3
"""
Скрипт для обучения максимально точной модели на улучшенном датасете
"""

import os
import shutil
from pathlib import Path
import json

def prepare_maximized_dataset():
    """Подготавливает максимально улучшенный датасет для обучения"""
    print("🔄 Подготавливаем максимально улучшенный датасет...")
    
    # Создаем структуру для обучения
    train_dir = Path("maximized_training_data")
    train_dir.mkdir(exist_ok=True)
    
    # Создаем поддиректории
    (train_dir / "train" / "positive").mkdir(parents=True, exist_ok=True)
    (train_dir / "train" / "negative").mkdir(parents=True, exist_ok=True)
    (train_dir / "val" / "positive").mkdir(parents=True, exist_ok=True)
    (train_dir / "val" / "negative").mkdir(parents=True, exist_ok=True)
    (train_dir / "test" / "positive").mkdir(parents=True, exist_ok=True)
    (train_dir / "test" / "negative").mkdir(parents=True, exist_ok=True)
    
    # Копируем изображения из maximized_dataset
    source_positive = Path("maximized_dataset/positive")
    source_negative = Path("maximized_dataset/negative")
    
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

def create_maximized_config():
    """Создает конфигурацию для максимально улучшенного датасета"""
    config = {
        "dataset_name": "maximized_concrete_defects",
        "description": "Максимально улучшенный сбалансированный датасет дефектов бетона",
        "classes": {
            "positive": "Дефекты (трещины, пятна, повреждения, сколы)",
            "negative": "Нормальный бетон без дефектов"
        },
        "image_size": [224, 224],
        "augmentation": {
            "rotation": 30,
            "brightness": 0.4,
            "contrast": 0.4,
            "horizontal_flip": True,
            "vertical_flip": True,
            "zoom_range": 0.3,
            "shear_range": 0.2,
            "width_shift_range": 0.2,
            "height_shift_range": 0.2
        },
        "training": {
            "batch_size": 32,
            "epochs": 50,
            "learning_rate": 0.0001,
            "validation_split": 0.2,
            "class_weight": {
                "0": 1.0,  # negative
                "1": 1.0   # positive (сбалансировано)
            }
        },
        "model": {
            "architecture": "advanced_cnn",
            "regularization": "strong",
            "optimization": "adam_with_scheduling"
        }
    }
    
    return config

def create_maximized_training_script():
    """Создает скрипт для обучения максимально точной модели"""
    script_content = '''#!/usr/bin/env python3
"""
Скрипт для обучения максимально точной модели на улучшенном датасете
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import json
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt

def load_dataset_config():
    """Загружает конфигурацию датасета"""
    with open("maximized_dataset_config.json", "r", encoding="utf-8") as f:
        return json.load(f)

def create_advanced_data_generators(config):
    """Создает продвинутые генераторы данных"""
    train_datagen = keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        rotation_range=config["augmentation"]["rotation"],
        brightness_range=[1-config["augmentation"]["brightness"], 
                         1+config["augmentation"]["brightness"]],
        contrast_range=[1-config["augmentation"]["contrast"], 
                       1+config["augmentation"]["contrast"]],
        horizontal_flip=config["augmentation"]["horizontal_flip"],
        vertical_flip=config["augmentation"]["vertical_flip"],
        zoom_range=config["augmentation"]["zoom_range"],
        shear_range=config["augmentation"]["shear_range"],
        width_shift_range=config["augmentation"]["width_shift_range"],
        height_shift_range=config["augmentation"]["height_shift_range"],
        fill_mode='nearest'
    )
    
    train_generator = train_datagen.flow_from_directory(
        "train/",
        target_size=tuple(config["image_size"]),
        batch_size=config["training"]["batch_size"],
        class_mode="binary",
        shuffle=True
    )
    
    val_datagen = keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
    val_generator = val_datagen.flow_from_directory(
        "val/",
        target_size=tuple(config["image_size"]),
        batch_size=config["training"]["batch_size"],
        class_mode="binary",
        shuffle=False
    )
    
    return train_generator, val_generator

def create_maximized_model(config):
    """Создает максимально точную модель"""
    model = keras.Sequential([
        # Первый блок
        layers.Conv2D(32, (3, 3), activation="relu", input_shape=(*config["image_size"], 3)),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3, 3), activation="relu"),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Второй блок
        layers.Conv2D(64, (3, 3), activation="relu"),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation="relu"),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Третий блок
        layers.Conv2D(128, (3, 3), activation="relu"),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3, 3), activation="relu"),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Четвертый блок
        layers.Conv2D(256, (3, 3), activation="relu"),
        layers.BatchNormalization(),
        layers.Conv2D(256, (3, 3), activation="relu"),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Полносвязные слои
        layers.Flatten(),
        layers.Dense(1024, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(512, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(256, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(1, activation="sigmoid")
    ])
    
    # Компилируем с продвинутым оптимизатором
    optimizer = keras.optimizers.Adam(
        learning_rate=config["training"]["learning_rate"],
        beta_1=0.9,
        beta_2=0.999,
        epsilon=1e-07
    )
    
    model.compile(
        optimizer=optimizer,
        loss="binary_crossentropy",
        metrics=["accuracy", "precision", "recall", "f1_score"]
    )
    
    return model

def train_maximized_model():
    """Обучает максимально точную модель"""
    print("🚀 Начинаем обучение максимально точной модели...")
    
    # Загружаем конфигурацию
    config = load_dataset_config()
    
    # Создаем генераторы данных
    train_gen, val_gen = create_advanced_data_generators(config)
    
    # Создаем модель
    model = create_maximized_model(config)
    
    # Выводим архитектуру модели
    model.summary()
    
    # Продвинутые callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_f1_score',
            patience=10,
            restore_best_weights=True,
            mode='max'
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-8,
            verbose=1
        ),
        keras.callbacks.ModelCheckpoint(
            'best_maximized_model.h5',
            monitor='val_f1_score',
            save_best_only=True,
            mode='max',
            verbose=1
        )
    ]
    
    # Обучаем модель
    history = model.fit(
        train_gen,
        epochs=config["training"]["epochs"],
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1,
        class_weight=config["training"]["class_weight"]
    )
    
    # Сохраняем финальную модель
    model.save("maximized_concrete_defect_model.h5")
    print("✅ Максимально точная модель сохранена: maximized_concrete_defect_model.h5")
    
    # Сохраняем историю обучения
    with open("maximized_training_history.json", "w") as f:
        json.dump({
            'loss': [float(x) for x in history.history['loss']],
            'accuracy': [float(x) for x in history.history['accuracy']],
            'precision': [float(x) for x in history.history['precision']],
            'recall': [float(x) for x in history.history['recall']],
            'f1_score': [float(x) for x in history.history['f1_score']],
            'val_loss': [float(x) for x in history.history['val_loss']],
            'val_accuracy': [float(x) for x in history.history['val_accuracy']],
            'val_precision': [float(x) for x in history.history['val_precision']],
            'val_recall': [float(x) for x in history.history['val_recall']],
            'val_f1_score': [float(x) for x in history.history['val_f1_score']]
        }, f)
    
    # Создаем графики обучения
    plot_training_history(history)
    
    return model, history

def plot_training_history(history):
    """Создает графики истории обучения"""
    try:
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # Точность
        axes[0, 0].plot(history.history['accuracy'], label='Training')
        axes[0, 0].plot(history.history['val_accuracy'], label='Validation')
        axes[0, 0].set_title('Model Accuracy')
        axes[0, 0].set_xlabel('Epoch')
        axes[0, 0].set_ylabel('Accuracy')
        axes[0, 0].legend()
        
        # Потери
        axes[0, 1].plot(history.history['loss'], label='Training')
        axes[0, 1].plot(history.history['val_loss'], label='Validation')
        axes[0, 1].set_title('Model Loss')
        axes[0, 1].set_xlabel('Epoch')
        axes[0, 1].set_ylabel('Loss')
        axes[0, 1].legend()
        
        # F1 Score
        axes[1, 0].plot(history.history['f1_score'], label='Training')
        axes[1, 0].plot(history.history['val_f1_score'], label='Validation')
        axes[1, 0].set_title('F1 Score')
        axes[1, 0].set_xlabel('Epoch')
        axes[1, 0].set_ylabel('F1 Score')
        axes[1, 0].legend()
        
        # Precision vs Recall
        axes[1, 1].plot(history.history['precision'], label='Precision')
        axes[1, 1].plot(history.history['recall'], label='Recall')
        axes[1, 1].set_title('Precision vs Recall')
        axes[1, 1].set_xlabel('Epoch')
        axes[1, 1].set_ylabel('Score')
        axes[1, 1].legend()
        
        plt.tight_layout()
        plt.savefig('training_history.png', dpi=300, bbox_inches='tight')
        print("📊 Графики обучения сохранены: training_history.png")
        
    except Exception as e:
        print(f"⚠️ Ошибка создания графиков: {e}")

if __name__ == "__main__":
    train_maximized_model()
'''
    
    return script_content

def main():
    """Основная функция"""
    print("🚀 Подготовка к обучению максимально точной модели")
    print("=" * 70)
    
    # Подготавливаем датасет
    train_dir = prepare_maximized_dataset()
    
    # Создаем конфигурацию
    config = create_maximized_config()
    with open(train_dir / "maximized_dataset_config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    # Создаем скрипт обучения
    script_content = create_maximized_training_script()
    with open(train_dir / "train_maximized_model.py", "w", encoding="utf-8") as f:
        f.write(script_content)
    
    print(f"\n✅ Подготовка завершена!")
    print(f"📁 Директория: {train_dir}")
    print(f"📊 Конфигурация: {train_dir}/maximized_dataset_config.json")
    print(f"🤖 Скрипт обучения: {train_dir}/train_maximized_model.py")
    
    print(f"\n🎯 Для запуска обучения максимально точной модели:")
    print(f"   cd {train_dir}")
    print(f"   python train_maximized_model.py")
    
    print(f"\n📈 Ожидаемые результаты:")
    print(f"   - Точность: >90%")
    print(f"   - F1 Score: >0.9")
    print(f"   - Сбалансированная точность на обоих классах")
    print(f"   - Высокая обобщающая способность")

if __name__ == "__main__":
    main()


