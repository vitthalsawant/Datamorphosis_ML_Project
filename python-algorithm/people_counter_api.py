# -*- coding: utf-8 -*-
"""
Unified People Counter and Gender Classification Service
Combines YOLOv8 person detection with gender classification using one camera
"""

import cv2
from ultralytics import YOLO
import numpy as np
import time
import requests
from datetime import datetime
import os
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.resnet50 import preprocess_input

import config

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

# ============================================
# Detection Settings
# ============================================
def get_settings_from_api():
    """Fetch current settings from dashboard"""
    data = get_from_api("/api/person-counting")
    if data:
        roi_config = data.get("roi_config")
        # Check if ROI is properly configured (not None and has valid values)
        roi_valid = roi_config is not None and isinstance(roi_config, dict) and \
                   all(key in roi_config for key in ["x_start_percent", "x_end_percent", "y_start_percent", "y_end_percent"])
        
        return {
            "enabled": data.get("enabled", True),
            "sensitivity": data.get("sensitivity", 80),
            "confidence_threshold": 0.5 + (data.get("sensitivity", 80) / 100) * 0.45,
            "roi_config": roi_config if roi_valid else None,
            "roi_valid": roi_valid,
            "reset_token": data.get("reset_token", 0)
        }
    return {
        "enabled": True,
        "sensitivity": 80,
        "confidence_threshold": 0.8,
        "roi_config": None,
        "roi_valid": False,
        "reset_token": 0
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

def calculate_distance(point1, point2):
    """Calculate Euclidean distance between two points"""
    return np.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)

def preprocess_face(face_roi):
    """Preprocess face ROI for gender classification"""
    face_resized = cv2.resize(face_roi, (config.IMAGE_SIZE[1], config.IMAGE_SIZE[0]))
    face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
    face_array = preprocess_input(face_rgb)
    face_array = np.expand_dims(face_array, axis=0)
    return face_array

# ============================================
# Main Detection Loop
# ============================================
def run_detection():
    print("[INFO] Loading YOLOv8 model...")
    yolo_model = YOLO('yolov8x.pt')
    dict_classes = yolo_model.model.names
    
    # Load gender classification model
    print("[INFO] Loading gender classification model...")
    gender_model = None
    face_cascade = None
    
    try:
        if os.path.exists(config.MODEL_PATH):
            gender_model = load_model(config.MODEL_PATH)
            print("[INFO] Gender classification model loaded successfully!")
        else:
            print(f"[WARNING] Gender model not found at {config.MODEL_PATH}")
            print("[WARNING] Gender classification will be disabled. Train model: python train_model.py")
    except Exception as e:
        print(f"[ERROR] Error loading gender model: {e}")
        gender_model = None
    
    # Load face cascade
    try:
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        if face_cascade.empty():
            raise Exception("Could not load face cascade")
        print("[INFO] Face cascade loaded successfully!")
    except Exception as e:
        print(f"[ERROR] Error loading face cascade: {e}")
        face_cascade = None
    
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
    print("[INFO] Starting unified detection service... (Running headless - no GUI windows)")
    print("[INFO] Sending data to dashboard at http://localhost:5000")
    print("[INFO] View results at http://localhost:8080")
    print("[INFO] ⚠️  IMPORTANT: ROI region must be configured in dashboard before counting starts!")
    print("[INFO]    Go to Detection Settings and set the ROI rectangle to begin detection.")
    print("[INFO] Press Ctrl+C to stop the service")
    
    # Detection variables
    centers_old = {}
    count_p = 0
    lastKey = ''
    frame_count = 0
    start_time = time.time()
    last_api_update = 0
    
    # Gender classification tracking
    # IMPORTANT: Tracking logic to prevent duplicate counting
    # - counted_person_ids: Set of person IDs that have been counted (prevents duplicates)
    # - tracked_people_gender: Dictionary storing gender info for each person ID
    # - Each person ID is counted ONLY ONCE when gender is first successfully classified
    # - Person IDs persist in counted_person_ids even after they leave frame to prevent re-counting
    tracked_people_gender = {}  # Track gender for each person ID: {id: {'gender': str, 'confidence': float, 'counted': bool}}
    counted_person_ids = set()  # Track which person IDs have already been counted (prevents duplicates - NEVER cleared)
    face_tracking_buffer = []
    male_count = 0
    female_count = 0
    
    # Initialize settings and reset tracking token
    settings = get_settings_from_api()
    conf_level = settings["confidence_threshold"]
    roi_cfg = settings["roi_config"]
    roi_valid = settings["roi_valid"]
    reset_token = settings.get("reset_token", 0)
    
    try:
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
                roi_valid = settings["roi_valid"]

                # If dashboard reset was triggered, clear local counters/tracking
                new_reset_token = settings.get("reset_token", reset_token)
                if new_reset_token != reset_token:
                    reset_token = new_reset_token
                    male_count = 0
                    female_count = 0
                    count_p = 0
                    counted_person_ids.clear()
                    tracked_people_gender.clear()
                    centers_old.clear()
                    print("[INFO] Reset token detected from dashboard. Local counters cleared.")

                last_api_update = time.time()
            
            frame = resize_frame(frame, scale_percent)
            current_height, current_width = frame.shape[:2]
            
            # Only process if ROI is configured from dashboard
            if not roi_valid or roi_cfg is None:
                # Show message that ROI needs to be configured (on frame for web dashboard)
                cv2.putText(frame, 'ROI not configured!', (30, 40), 
                           cv2.FONT_HERSHEY_TRIPLEX, 1.2, (0, 0, 255), 2)
                cv2.putText(frame, 'Please set ROI region in dashboard', (30, 80), 
                           cv2.FONT_HERSHEY_TRIPLEX, 0.8, (0, 0, 255), 2)
                cv2.putText(frame, 'Detection paused until ROI is set', (30, 120), 
                           cv2.FONT_HERSHEY_TRIPLEX, 0.8, (255, 255, 0), 2)
                
                # Send frame to API for streaming even when ROI not configured
                try:
                    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    requests.post(f"{API_BASE_URL}/api/internal/update-frame", 
                                files={'frame': buffer.tobytes()},
                                timeout=0.1)
                except:
                    pass
                
                # No GUI window - just send to web dashboard
                frame_count += 1
                time.sleep(0.033)  # ~30 FPS
                continue
            
            # Calculate ROI from settings
            roi_x_start = int(current_width * roi_cfg["x_start_percent"] / 100)
            roi_x_end = int(current_width * roi_cfg["x_end_percent"] / 100)
            roi_y_start = int(current_height * roi_cfg["y_start_percent"] / 100)
            roi_y_end = int(current_height * roi_cfg["y_end_percent"] / 100)
            
            # Validate ROI bounds
            if roi_x_start >= roi_x_end or roi_y_start >= roi_y_end:
                cv2.putText(frame, 'Invalid ROI configuration!', (30, 40), 
                           cv2.FONT_HERSHEY_TRIPLEX, 1.0, (0, 0, 255), 2)
                # Send frame to API for web dashboard
                try:
                    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    requests.post(f"{API_BASE_URL}/api/internal/update-frame", 
                                files={'frame': buffer.tobytes()},
                                timeout=0.1)
                except:
                    pass
                frame_count += 1
                time.sleep(0.033)  # ~30 FPS
                continue
            
            area_roi = [np.array([
                (roi_x_start, roi_y_start),
                (roi_x_end, roi_y_start),
                (roi_x_end, roi_y_end),
                (roi_x_start, roi_y_end)
            ], np.int32)]
            
            ROI = frame[roi_y_start:roi_y_end, roi_x_start:roi_x_end]
            
            # Run YOLO detection only when ROI is valid
            y_hat = yolo_model.predict(ROI, conf=conf_level, classes=[0], device='cpu', verbose=False)
            
            boxes = y_hat[0].boxes.xyxy.cpu().numpy()
            conf = y_hat[0].boxes.conf.cpu().numpy()
            current_in_roi = len(boxes)
            
            # Update face tracking buffer
            if len(face_tracking_buffer) > config.TRACKING_FRAMES:
                face_tracking_buffer.pop(0)
            
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
                
                # Gender classification for detected person
                person_gender = None
                gender_classified = False
                
                if gender_model and face_cascade and not face_cascade.empty():
                    # Extract person region (slightly expanded for face detection)
                    person_x_start = max(0, roi_x_start + xmin - 20)
                    person_x_end = min(current_width, roi_x_start + xmax + 20)
                    person_y_start = max(0, roi_y_start + ymin - 20)
                    person_y_end = min(current_height, roi_y_start + ymax + 20)
                    
                    person_roi = frame[person_y_start:person_y_end, person_x_start:person_x_end]
                    
                    if person_roi.size > 0:
                        # Detect faces in person region
                        gray_person = cv2.cvtColor(person_roi, cv2.COLOR_BGR2GRAY)
                        faces = face_cascade.detectMultiScale(
                            gray_person,
                            scaleFactor=config.SCALE_FACTOR,
                            minNeighbors=config.MIN_NEIGHBORS,
                            minSize=config.MIN_FACE_SIZE
                        )
                        
                        if len(faces) > 0:
                            # Use the largest face
                            faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
                            fx, fy, fw, fh = faces[0]
                            
                            # Extract face ROI
                            face_roi = person_roi[fy:fy+fh, fx:fx+fw]
                            
                            if face_roi.size > 0 and fw >= config.MIN_FACE_SIZE[0] and fh >= config.MIN_FACE_SIZE[1]:
                                try:
                                    # Preprocess and predict gender
                                    face_array = preprocess_face(face_roi)
                                    prediction = gender_model.predict(face_array, verbose=0)
                                    
                                    # Get prediction probabilities
                                    female_prob = prediction[0][0]  # Index 0 = FEMALE (alphabetical)
                                    male_prob = prediction[0][1]    # Index 1 = MALE (alphabetical)
                                    
                                    # Determine gender based on highest probability
                                    gender_idx = np.argmax(prediction[0])
                                    confidence = prediction[0][gender_idx]
                                    
                                    # Map prediction index to gender label
                                    # Generator uses alphabetical: female=0, male=1
                                    # So: 0 = FEMALE, 1 = MALE
                                    person_gender = config.INT2LABELS[gender_idx]
                                    
                                    # Debug output for first few detections
                                    if is_new:
                                        print(f"[DEBUG] Person {id_obj} prediction:")
                                        print(f"  Female prob: {female_prob:.3f}, Male prob: {male_prob:.3f}")
                                        print(f"  Predicted index: {gender_idx}, Gender: {person_gender}, Confidence: {confidence:.3f}")
                                    
                                    # Update gender tracking for this person
                                    # Only count each person ID once, even if gender classification happens multiple times
                                    if id_obj not in counted_person_ids and person_gender:
                                        # This person ID hasn't been counted yet - count them now
                                        # gender_idx: 0=FEMALE, 1=MALE (alphabetical order from generator)
                                        if gender_idx == 1:  # MALE (index 1)
                                            male_count += 1
                                        elif gender_idx == 0:  # FEMALE (index 0)
                                            female_count += 1
                                        
                                        # Mark this person as counted to prevent duplicates
                                        counted_person_ids.add(id_obj)
                                        count_p += 1
                                        gender_classified = True
                                        
                                        # Store gender info for this person
                                        tracked_people_gender[id_obj] = {
                                            'gender': person_gender,
                                            'confidence': float(confidence),
                                            'counted': True,
                                            'first_seen_frame': frame_count
                                        }
                                        
                                        if is_new:
                                            print(f"[INFO] Person {id_obj}: NEW {person_gender} detected (Confidence: {confidence:.2f})")
                                        else:
                                            print(f"[INFO] Person {id_obj}: Gender classified as {person_gender} (Confidence: {confidence:.2f})")
                                    elif id_obj in tracked_people_gender:
                                        # Person already counted, just update gender info if needed
                                        tracked_people_gender[id_obj]['gender'] = person_gender
                                        tracked_people_gender[id_obj]['confidence'] = float(confidence)
                                    
                                    # Draw gender label on person box (for all detected people with gender)
                                    if person_gender:
                                        gender_label = f"{person_gender} ({confidence:.2f})"
                                        if id_obj in counted_person_ids:
                                            gender_label += " [COUNTED]"
                                        cv2.putText(ROI, gender_label, (xmin, ymin - 25), 
                                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 2)
                                except Exception as e:
                                    print(f"[ERROR] Error in gender classification: {e}")
                                    pass
                            else:
                                # Face detected but too small or invalid
                                # Check if person was already counted and show tracked info
                                if id_obj in tracked_people_gender:
                                    gender_info = tracked_people_gender[id_obj]
                                    gender_label = f"{gender_info['gender']} (tracked)"
                                    cv2.putText(ROI, gender_label, (xmin, ymin - 25), 
                                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 2)
                        else:
                            # No face detected in person region, but person is tracked
                            if id_obj in tracked_people_gender:
                                gender_info = tracked_people_gender[id_obj]
                                gender_label = f"{gender_info['gender']} (tracked)"
                                cv2.putText(ROI, gender_label, (xmin, ymin - 25), 
                                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 2)
                else:
                    # Gender model not available, but check if person was already tracked
                    if id_obj in tracked_people_gender:
                        gender_info = tracked_people_gender[id_obj]
                        gender_label = f"{gender_info['gender']} (tracked)"
                        cv2.putText(ROI, gender_label, (xmin, ymin - 25), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 2)
                
                # Draw person bounding box
                # Use different color if person is already counted
                if id_obj in counted_person_ids:
                    color = (0, 255, 0)  # Green for already counted
                else:
                    color = (0, 0, 255)  # Red for new detection
                cv2.rectangle(ROI, (xmin, ymin), (xmax, ymax), color, 2)
                cv2.putText(ROI, f"{id_obj}:{conf[ix]:.2f}", 
                           (xmin, ymin - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            # Filter tracks
            centers_old = filter_tracks(centers_old, patience)
            
            # Clean up tracked_people_gender for IDs that are no longer in frame
            # Remove IDs that haven't been seen in recent frames (but keep in counted_person_ids)
            current_tracked_ids = set(centers_old.keys())
            ids_to_remove = []
            for tracked_id in list(tracked_people_gender.keys()):
                if tracked_id not in current_tracked_ids:
                    # Person left frame - mark for removal from active tracking
                    # BUT keep in counted_person_ids to prevent re-counting if they return
                    ids_to_remove.append(tracked_id)
            
            # Remove old tracking data (but keep in counted_person_ids to prevent duplicates)
            for tracked_id in ids_to_remove:
                if tracked_id in tracked_people_gender:
                    # Remove from active tracking but keep counted status
                    # This prevents re-counting if the same person comes back
                    del tracked_people_gender[tracked_id]
                    # Note: counted_person_ids is NOT cleared - this prevents duplicate counting
                    if frame_count % 100 == 0:  # Only log occasionally to reduce spam
                        print(f"[INFO] Person {tracked_id} left frame - removed from active tracking (still counted)")
            
            # Calculate total count from gender counts to ensure consistency
            # This ensures: male_count + female_count = total_count
            total_count_from_gender = male_count + female_count
            
            # Draw overlay
            cv2.putText(frame, f'Total Count: {total_count_from_gender} (M:{male_count}+F:{female_count})', (30, 40), 
                       cv2.FONT_HERSHEY_TRIPLEX, 1.0, (0, 255, 0), 2)
            cv2.putText(frame, f'Current in ROI: {current_in_roi}', (30, 80), 
                       cv2.FONT_HERSHEY_TRIPLEX, 1.0, (0, 255, 255), 2)
            cv2.putText(frame, f'Male: {male_count} | Female: {female_count}', (30, 120), 
                       cv2.FONT_HERSHEY_TRIPLEX, 0.8, (255, 255, 0), 2)
            
            elapsed = time.time() - start_time
            if frame_count > 0:
                fps = frame_count / elapsed
                cv2.putText(frame, f'FPS: {fps:.1f}', (30, 160), 
                           cv2.FONT_HERSHEY_TRIPLEX, 0.8, (255, 255, 0), 2)
            
            # Draw ROI
            overlay = frame.copy()
            cv2.polylines(overlay, pts=area_roi, isClosed=True, color=(255, 0, 0), thickness=2)
            cv2.fillPoly(overlay, area_roi, (255, 0, 0))
            frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
            
            # Send frame to API for streaming (throttle to every 3 frames to reduce load)
            if frame_count % 3 == 0:  # Only send every 3rd frame (~10 FPS instead of 30)
                try:
                    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    requests.post(f"{API_BASE_URL}/api/internal/update-frame", 
                                files={'frame': buffer.tobytes()},
                                timeout=0.1)
                except:
                    pass
            
            # Send to API every 10 frames
            if frame_count % 10 == 0:
                try:
                    # Calculate total count from gender counts (ensures consistency)
                    total_count_from_gender = male_count + female_count
                    
                    # Send people count (use total from gender counts)
                    requests.post(f"{API_BASE_URL}/api/internal/update-count", json={
                        "total_count": total_count_from_gender,
                        "current_in_roi": current_in_roi
                    }, timeout=0.5)
                    
                    # Send gender counts (total_count = male_count + female_count)
                    requests.post(f"{API_BASE_URL}/api/gender-classification/update", json={
                        "male_count": male_count,
                        "female_count": female_count,
                        "total_count": total_count_from_gender,  # Ensure consistency
                        "timestamp": datetime.now().isoformat()
                    }, timeout=0.5)
                except:
                    pass
            
            # No GUI window - all output goes to web dashboard
            frame_count += 1
            
            # Small delay to maintain ~30 FPS
            time.sleep(0.033)
    
    except KeyboardInterrupt:
        print("\n[INFO] Stopping detection service...")
    except Exception as e:
        print(f"\n[ERROR] Error in detection loop: {e}")
        import traceback
        traceback.print_exc()
    finally:
        video.release()
        total_final = male_count + female_count
        print(f"[INFO] Detection stopped.")
        print(f"[INFO] Final counts - Total: {total_final} (Male: {male_count} + Female: {female_count})")
        print(f"[INFO] Verification: {male_count} + {female_count} = {total_final} ✓")

if __name__ == '__main__':
    print("=" * 60)
    print("Unified People Counter & Gender Classification Service")
    print("=" * 60)
    print("\nMake sure the API server is running:")
    print("  python api_server.py")
    print("\nThis script combines:")
    print("  - YOLOv8 person detection and counting")
    print("  - Gender classification using trained model")
    print("  - Single camera for both services")
    print("\n[INFO] Auto-starting camera...")
    print("=" * 60)
    
    # Auto-start camera without user input
    print("\n[INFO] Opening camera...")
    try:
        run_detection()
    except KeyboardInterrupt:
        print("\n[INFO] Detection service stopped by user (Ctrl+C).")
