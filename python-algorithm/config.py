# -*- coding: utf-8 -*-
"""
Configuration file for CCTV Gender Classification Project
"""

import os

# Base directory (project root)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Dataset paths
DATASET_DIR = os.path.join(BASE_DIR, 'CCTV Gender Classifier Dataset')
MALE_FOLDER = os.path.join(DATASET_DIR, 'MALE')
FEMALE_FOLDER = os.path.join(DATASET_DIR, 'FEMALE')

# Model paths
MODELS_DIR = os.path.join(BASE_DIR, 'models')
MODEL_PATH = os.path.join(MODELS_DIR, 'GenderClassification.h5')

# Output paths
OUTPUT_DIR = os.path.join(BASE_DIR, 'outputs')
SAMPLE_IMAGES_PATH = os.path.join(OUTPUT_DIR, 'sample_images.png')
DATASET_DISTRIBUTION_PATH = os.path.join(OUTPUT_DIR, 'dataset_distribution.png')
MODEL_ACCURACY_PATH = os.path.join(OUTPUT_DIR, 'model_accuracy.png')
MODEL_LOSS_PATH = os.path.join(OUTPUT_DIR, 'model_loss.png')
PREDICTION_SAMPLES_PATH = os.path.join(OUTPUT_DIR, 'prediction_samples.png')

# Model configuration
# Note: ImageDataGenerator assigns classes alphabetically: female=0, male=1
# So we need to match this order for correct predictions
LABELS2INT = {"MALE": 1, "FEMALE": 0}  # Updated to match generator's alphabetical order
INT2LABELS = {0: "FEMALE", 1: "MALE"}  # Updated: 0=FEMALE, 1=MALE
CLASS_NAMES = ['FEMALE', 'MALE']  # Alphabetical order to match generator

# Training configuration
IMAGE_SIZE = (200, 100)  # (height, width)
BATCH_SIZE = 16  # Reduced from 32 for large datasets to avoid memory errors
EPOCHS = 10
LEARNING_RATE = 1e-5
TRAIN_RATIO = 0.8
VAL_RATIO = 0.1
TEST_RATIO = 0.1

# Dataset subset configuration (for faster training/testing)
USE_SMALL_DATASET = False  # Set to True to use only a subset
SUBSET_PERCENTAGE = 0.2  # Use only 20% of data if USE_SMALL_DATASET is True

# Use generator-based training (recommended for large datasets)
USE_GENERATOR_TRAINING = True  # Uses ImageDataGenerator - loads images on-demand

# Face detection configuration (optimized for speed)
FACE_CASCADE_PATH = None  # Will use cv2.data.haarcascades default
MIN_FACE_SIZE = (30, 30)
SCALE_FACTOR = 1.1
MIN_NEIGHBORS = 3  # Reduced from 5 for faster detection

# Tracking configuration
TRACKING_THRESHOLD = 50  # Distance threshold for same person
TRACKING_FRAMES = 10  # Frames to remember face positions

# Performance optimization
MAX_FPS = 60  # Maximum FPS to maintain stability
FRAME_SKIP_THRESHOLD = 45  # Start skipping frames above this FPS

# Create necessary directories
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
