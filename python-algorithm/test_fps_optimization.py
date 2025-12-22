# -*- coding: utf-8 -*-
"""
Test script to verify FPS optimizations
"""

import time
import cv2
import numpy as np
from ultralytics import YOLO
import config

def test_face_detection_speed():
    """Test face detection speed with optimized parameters"""
    print("Testing face detection speed...")

    # Load face cascade
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Create a test frame
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

    # Test detection speed
    start_time = time.time()
    faces = face_cascade.detectMultiScale(
        cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY),
        scaleFactor=config.SCALE_FACTOR,
        minNeighbors=config.MIN_NEIGHBORS,
        minSize=config.MIN_FACE_SIZE
    )
    detection_time = time.time() - start_time

    print(f"Face detection time: {detection_time:.4f} seconds")
    print(f"Faces detected: {len(faces)}")
    print(".2f")

def test_yolo_speed():
    """Test YOLO model speed for comparison"""
    print("\nTesting YOLO model speed...")

    try:
        model = YOLO('yolov8n.pt')  # Small model for testing

        # Create test frame
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

        # Test inference speed
        start_time = time.time()
        results = model(frame, conf=0.5, classes=[0], verbose=False)  # Only person class
        inference_time = time.time() - start_time

        detections = len(results[0].boxes) if results else 0
        print(f"YOLO inference time: {inference_time:.4f} seconds")
        print(f"Objects detected: {detections}")
        print(".2f")

    except Exception as e:
        print(f"YOLO test failed: {e}")

def main():
    """Run all tests"""
    print("="*50)
    print("FPS Optimization Test")
    print("="*50)

    test_face_detection_speed()
    test_yolo_speed()

    print("\n" + "="*50)
    print("Key Optimizations Applied:")
    print("- Removed artificial FPS limits (time.sleep)")
    print("- Reduced minNeighbors from 5 to 3 for faster detection")
    print("- Implemented batch processing for multiple faces")
    print("- Added intelligent frame skipping for high FPS")
    print("- Added real-time FPS monitoring")
    print("="*50)

if __name__ == "__main__":
    main()
