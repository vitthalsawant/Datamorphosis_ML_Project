# -*- coding: utf-8 -*-
"""
YOLOv8 People Detection and Counting with API Integration
This script runs YOLOv8 detection and sends data to the Flask API server.
"""

import cv2
from ultralytics import YOLO
import numpy as np
import time
import requests
from datetime import datetime
import threading

# ============================================
# API Configuration
# ============================================
API_BASE_URL = "http://localhost:5000"

def send_to_api(endpoint, data):
    """Send data to the Flask API"""
    try:
        response = requests.post(f"{API_BASE_URL}{endpoint}", json=data, timeout=1)
        return response.json()
    except Exception as e:
        print(f"[API] Failed to send to {endpoint}: {e}")
        return None

def get_from_api(endpoint):
    """Get data from the Flask API"""
    try:
        response = requests.get(f"{API_BASE_URL}{endpoint}", timeout=1)
        return response.json()
    except Exception as e:
        print(f"[API] Failed to get from {endpoint}: {e}")
        return None

def notify_detection(count, current_in_roi, confidence=0.0):
    """Send detection update to API"""
    try:
        requests.post(f"{API_BASE_URL}/api/person-counting/update", json={
            "total_count": count,
            "current_in_roi": current_in_roi,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat()
        }, timeout=1)
    except:
        pass

# ============================================
# Detection Settings
# ============================================
def get_settings_from_api():
    """Fetch current settings from dashboard"""
    data = get_from_api("/api/person-counting")
    if data:
        return {
            "enabled": data.get("enabled", True),
            "sensitivity": data.get("sensitivity", 80),
            "confidence_threshold": 0.5 + (data.get("sensitivity", 80) / 100) * 0.45,
            "roi_config": data.get("roi_config", {
                "x_start_percent": 20,
                "x_end_percent": 80,
                "y_start_percent": 20,
                "y_end_percent": 80
            })
        }
    return {
        "enabled": True,
        "sensitivity": 80,
        "confidence_threshold": 0.8,
        "roi_config": {
            "x_start_percent": 20,
            "x_end_percent": 80,
            "y_start_percent": 20,
            "y_end_percent": 80
        }
    }

# ============================================
# Auxiliary Functions
# ============================================
def resize_frame(frame, scale_percent):
    """Resize frame by percentage"""
    width = int(frame.shape[1] * scale_percent / 100)
    height = int(frame.shape[0] * scale_percent / 100)
    return cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)

def filter_tracks(centers, patience):
    """Filter track history"""
    filter_dict = {}
    for k, i in centers.items():
        d_frames = i.items()
        filter_dict[k] = dict(list(d_frames)[-patience:])
    return filter_dict

def update_tracking(centers_old, obj_center, thr_centers, lastKey, frame, frame_max):
    """Update object tracking"""
    is_new = 0
    lastpos = [(k, list(center.keys())[-1], list(center.values())[-1]) for k, center in centers_old.items()]
    lastpos = [(i[0], i[2]) for i in lastpos if abs(i[1] - frame) <= frame_max]
    
    previous_pos = [(k, obj_center) for k, centers in lastpos if (np.linalg.norm(np.array(centers) - np.array(obj_center)) < thr_centers)]
    
    if previous_pos:
        id_obj = previous_pos[0][0]
        centers_old[id_obj][frame] = obj_center
    else:
        if lastKey:
            last = lastKey.split('D')[1]
            id_obj = 'ID' + str(int(last) + 1)
        else:
            id_obj = 'ID0'
        is_new = 1
        centers_old[id_obj] = {frame: obj_center}
        lastKey = list(centers_old.keys())[-1]
    
    return centers_old, id_obj, is_new, lastKey

# ============================================
# Main Detection Loop
# ============================================
def run_detection():
    print("[INFO] Loading YOLOv8 model...")
    model = YOLO('yolov8x.pt')
    dict_classes = model.model.names
    
    # Configuration
    scale_percent = 100
    thr_centers = 20
    frame_max = 5
    patience = 100
    alpha = 0.1
    camera_index = 0
    
    print("[INFO] Initializing camera...")
    video = cv2.VideoCapture(camera_index)
    
    if not video.isOpened():
        print("[ERROR] Could not open camera!")
        return
    
    video.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    video.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    print(f"[INFO] Camera resolution: {width}x{height}")
    print("[INFO] Starting detection... Press 'q' to quit")
    print("[INFO] Sending data to dashboard at http://localhost:5000")
    
    # Detection variables
    centers_old = {}
    count_p = 0
    lastKey = ''
    frame_count = 0
    start_time = time.time()
    last_api_update = 0
    
    while True:
        ret, frame = video.read()
        if not ret:
            print("[WARNING] Failed to grab frame")
            break
        
        # Get settings from API every 5 seconds
        if time.time() - last_api_update > 5:
            settings = get_settings_from_api()
            conf_level = settings["confidence_threshold"]
            roi_cfg = settings["roi_config"]
            last_api_update = time.time()
        else:
            conf_level = 0.8
            roi_cfg = {"x_start_percent": 20, "x_end_percent": 80, "y_start_percent": 20, "y_end_percent": 80}
        
        frame = resize_frame(frame, scale_percent)
        current_height, current_width = frame.shape[:2]
        
        # Calculate ROI from settings
        roi_x_start = int(current_width * roi_cfg["x_start_percent"] / 100)
        roi_x_end = int(current_width * roi_cfg["x_end_percent"] / 100)
        roi_y_start = int(current_height * roi_cfg["y_start_percent"] / 100)
        roi_y_end = int(current_height * roi_cfg["y_end_percent"] / 100)
        
        area_roi = [np.array([
            (roi_x_start, roi_y_start),
            (roi_x_end, roi_y_start),
            (roi_x_end, roi_y_end),
            (roi_x_start, roi_y_end)
        ], np.int32)]
        
        ROI = frame[roi_y_start:roi_y_end, roi_x_start:roi_x_end]
        
        # Run YOLO detection
        y_hat = model.predict(ROI, conf=conf_level, classes=[0], device='cpu', verbose=False)
        
        boxes = y_hat[0].boxes.xyxy.cpu().numpy()
        conf = y_hat[0].boxes.conf.cpu().numpy()
        current_in_roi = len(boxes)
        
        # Process detections
        for ix, box in enumerate(boxes):
            xmin, ymin, xmax, ymax = box.astype('int')
            center_x = int((xmax + xmin) / 2)
            center_y = int((ymax + ymin) / 2)
            center_x_full = center_x + roi_x_start
            center_y_full = center_y + roi_y_start
            
            centers_old, id_obj, is_new, lastKey = update_tracking(
                centers_old, (center_x_full, center_y_full), 
                thr_centers, lastKey, frame_count, frame_max
            )
            
            count_p += is_new
            
            # Draw on ROI
            cv2.rectangle(ROI, (xmin, ymin), (xmax, ymax), (0, 0, 255), 2)
            cv2.putText(ROI, f"{id_obj}:{conf[ix]:.2f}", 
                       (xmin, ymin - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        # Filter tracks
        centers_old = filter_tracks(centers_old, patience)
        
        # Draw overlay
        cv2.putText(frame, f'Total Count: {count_p}', (30, 40), 
                   cv2.FONT_HERSHEY_TRIPLEX, 1.2, (0, 255, 0), 2)
        cv2.putText(frame, f'Current in ROI: {current_in_roi}', (30, 80), 
                   cv2.FONT_HERSHEY_TRIPLEX, 1.0, (0, 255, 255), 2)
        
        elapsed = time.time() - start_time
        if frame_count > 0:
            fps = frame_count / elapsed
            cv2.putText(frame, f'FPS: {fps:.1f}', (30, 120), 
                       cv2.FONT_HERSHEY_TRIPLEX, 0.8, (255, 255, 0), 2)
        
        # Draw ROI
        overlay = frame.copy()
        cv2.polylines(overlay, pts=area_roi, isClosed=True, color=(255, 0, 0), thickness=2)
        cv2.fillPoly(overlay, area_roi, (255, 0, 0))
        frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
        
        # Send to API every 10 frames
        if frame_count % 10 == 0:
            try:
                requests.post(f"{API_BASE_URL}/api/internal/update-count", json={
                    "total_count": count_p,
                    "current_in_roi": current_in_roi
                }, timeout=0.5)
            except:
                pass
        
        cv2.imshow('People Detection - Press Q to quit', frame)
        frame_count += 1
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    video.release()
    cv2.destroyAllWindows()
    print(f"\n[INFO] Detection stopped. Total people counted: {count_p}")

if __name__ == '__main__':
    print("=" * 60)
    print("YOLOv8 People Counter with Dashboard Integration")
    print("=" * 60)
    print("\nMake sure the API server is running:")
    print("  python api_server.py")
    print("\nThis script will send detection data to the dashboard.")
    print("=" * 60)
    run_detection()
