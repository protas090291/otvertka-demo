#!/usr/bin/env python3
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
        metrics=["accuracy"]
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
            monitor='val_accuracy',
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
            monitor='val_accuracy',
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
            'val_loss': [float(x) for x in history.history['val_loss']],
            'val_accuracy': [float(x) for x in history.history['val_accuracy']]
        }, f)
    
    # Создаем графики обучения
    plot_training_history(history)
    
    return model, history

def plot_training_history(history):
    """Создает графики истории обучения"""
    try:
        fig, axes = plt.subplots(1, 2, figsize=(15, 5))
        
        # Точность
        axes[0].plot(history.history['accuracy'], label='Training')
        axes[0].plot(history.history['val_accuracy'], label='Validation')
        axes[0].set_title('Model Accuracy')
        axes[0].set_xlabel('Epoch')
        axes[0].set_ylabel('Accuracy')
        axes[0].legend()
        
        # Потери
        axes[1].plot(history.history['loss'], label='Training')
        axes[1].plot(history.history['val_loss'], label='Validation')
        axes[1].set_title('Model Loss')
        axes[1].set_xlabel('Epoch')
        axes[1].set_ylabel('Loss')
        axes[1].legend()
        
        plt.tight_layout()
        plt.savefig('training_history.png', dpi=300, bbox_inches='tight')
        print("📊 Графики обучения сохранены: training_history.png")
        
    except Exception as e:
        print(f"⚠️ Ошибка создания графиков: {e}")

if __name__ == "__main__":
    train_maximized_model()
