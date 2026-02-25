#!/usr/bin/env python3
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
