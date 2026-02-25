#!/usr/bin/env python3
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
        horizontal_flip=config["augmentation"]["horizontal_flip"]
    )
    
    # Используем все данные для обучения, так как у нас мало изображений
    train_generator = train_datagen.flow_from_directory(
        "train/",
        target_size=tuple(config["image_size"]),
        batch_size=min(config["training"]["batch_size"], 4),  # Ограничиваем batch_size
        class_mode="binary"
    )
    
    # Создаем валидационный генератор из test данных
    val_datagen = keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
    val_generator = val_datagen.flow_from_directory(
        "test/",
        target_size=tuple(config["image_size"]),
        batch_size=1,  # Маленький batch для валидации
        class_mode="binary"
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
