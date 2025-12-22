# -*- coding: utf-8 -*-
"""
Headless Gender Classification Service
Runs gender classification without GUI and sends data to API server
"""

import os
import time
import numpy as np
import cv2
import requests
from datetime import datetime
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.resnet50 import preprocess_input

import config

# API Configuration
API_BASE_URL = "http://localhost:5000"


class GenderClassificationService:
    """Headless gender classification service"""
    
    def __init__(self):
        self.model = None
        self.face_cascade = None
        self.camera = None
        self.is_running = False
        
        # Person tracking variables
        self.tracked_people = []
        self.face_tracking_buffer = []
        self.male_count = 0
        self.female_count = 0
        self.total_people_counted = 0
        
        # Tracking parameters
        self.tracking_threshold = config.TRACKING_THRESHOLD
        self.tracking_frames = config.TRACKING_FRAMES
        
        # Load model and cascade
        self.load_model()
        self.load_face_cascade()
    
    def load_model(self):
        """Load the trained gender classification model"""
        try:
            if os.path.exists(config.MODEL_PATH):
                print("[INFO] Loading gender classification model...")
                self.model = load_model(config.MODEL_PATH)
                print("[INFO] Model loaded successfully!")
            else:
                print(f"[WARNING] Model not found at {config.MODEL_PATH}")
                print("[WARNING] Please train the model first by running train_model.py")
                self.model = None
        except Exception as e:
            print(f"[ERROR] Error loading model: {e}")
            import traceback
            traceback.print_exc()
            self.model = None
    
    def load_face_cascade(self):
        """Load OpenCV face detection cascade"""
        try:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            if self.face_cascade.empty():
                raise Exception("Could not load face cascade")
            print("[INFO] Face cascade loaded successfully!")
        except Exception as e:
            print(f"[ERROR] Error loading face cascade: {e}")
            self.face_cascade = None
    
    def send_to_api(self, endpoint, data):
        """Send data to the Flask API"""
        try:
            response = requests.post(f"{API_BASE_URL}{endpoint}", json=data, timeout=1)
            return response.json()
        except Exception as e:
            print(f"[API] Failed to send to {endpoint}: {e}")
            return None
    
    def update_gender_counts(self):
        """Send gender count updates to API"""
        try:
            self.send_to_api("/api/gender-classification/update", {
                "male_count": self.male_count,
                "female_count": self.female_count,
                "total_count": self.total_people_counted,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            print(f"[ERROR] Failed to update gender counts: {e}")
    
    def detect_faces(self, frame):
        """Detect faces in a frame"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=config.SCALE_FACTOR,
            minNeighbors=config.MIN_NEIGHBORS,
            minSize=config.MIN_FACE_SIZE
        )
        return faces
    
    def calculate_face_center(self, x, y, w, h):
        """Calculate the center point of a face"""
        return (x + w // 2, y + h // 2)
    
    def calculate_distance(self, point1, point2):
        """Calculate Euclidean distance between two points"""
        return np.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)
    
    def is_new_person(self, face_center):
        """Check if a face belongs to a new person"""
        # Check against recent tracking buffer
        for tracked_face in self.face_tracking_buffer:
            distance = self.calculate_distance(face_center, tracked_face['center'])
            if distance < self.tracking_threshold:
                return False, tracked_face.get('gender', None)
        
        # Check against all tracked people
        for person in self.tracked_people:
            distance = self.calculate_distance(face_center, person['center'])
            if distance < self.tracking_threshold:
                return False, person.get('gender', None)
        
        return True, None
    
    def preprocess_face(self, face_roi):
        """Preprocess face ROI for gender classification"""
        face_resized = cv2.resize(face_roi, (config.IMAGE_SIZE[1], config.IMAGE_SIZE[0]))
        face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
        face_array = preprocess_input(face_rgb)
        face_array = np.expand_dims(face_array, axis=0)
        return face_array
    
    def start(self):
        """Start the gender classification service"""
        if not self.model:
            print("[ERROR] Model not available. Cannot start service.")
            return
        
        if not self.face_cascade or self.face_cascade.empty():
            print("[ERROR] Face detection model not available. Cannot start service.")
            return
        
        try:
            self.camera = cv2.VideoCapture(0)
            if not self.camera.isOpened():
                raise Exception("Could not open camera")
            
            print("[INFO] Camera opened successfully")
            print("[INFO] Starting gender classification service...")
            print("[INFO] Sending data to dashboard at http://localhost:5000")
            print("[INFO] Press Ctrl+C to stop")
            
            self.is_running = True
            frame_count = 0
            processed_frame_count = 0
            start_time = time.time()
            last_api_update = 0

            while self.is_running:
                ret, frame = self.camera.read()
                if not ret:
                    print("[WARNING] Failed to grab frame")
                    break

                frame_count += 1

                # Frame skipping for high FPS to maintain stability
                current_time = time.time()
                if processed_frame_count > 10:  # Wait for stable FPS measurement
                    fps = processed_frame_count / (current_time - start_time)
                    if fps > config.FRAME_SKIP_THRESHOLD:
                        # Skip frames to maintain stability
                        skip_frames = int(fps / config.MAX_FPS)
                        if frame_count % (skip_frames + 1) != 0:
                            continue
                
                # Flip frame horizontally for mirror effect
                frame = cv2.flip(frame, 1)
                
                # Detect faces
                faces = self.detect_faces(frame)
                
                # Update tracking buffer
                if len(self.face_tracking_buffer) > self.tracking_frames:
                    self.face_tracking_buffer.pop(0)
                
                current_frame_faces = []
                valid_faces = []

                # First pass: collect valid faces
                for (x, y, w, h) in faces:
                    # Extract face ROI
                    face_roi = frame[y:y+h, x:x+w]

                    # Skip if face ROI is too small
                    if face_roi.size == 0 or w < config.MIN_FACE_SIZE[0] or h < config.MIN_FACE_SIZE[1]:
                        continue

                    valid_faces.append((x, y, w, h, face_roi))

                # Batch process faces for better performance
                if valid_faces:
                    try:
                        # Prepare batch of face arrays
                        face_arrays = []
                        face_info = []

                        for x, y, w, h, face_roi in valid_faces:
                            face_array = self.preprocess_face(face_roi)
                            face_arrays.append(face_array[0])  # Remove batch dimension
                            face_info.append((x, y, w, h))

                        # Batch prediction
                        if face_arrays:
                            batch_array = np.array(face_arrays)
                            predictions = self.model.predict(batch_array, verbose=0)

                            # Process each prediction
                            for i, (x, y, w, h) in enumerate(face_info):
                                prediction = predictions[i]
                                gender_idx = np.argmax(prediction)
                                confidence = prediction[gender_idx]
                                gender = config.INT2LABELS[gender_idx]

                                # Calculate face center
                                face_center = self.calculate_face_center(x, y, w, h)

                                # Check if this is a new person
                                is_new, existing_gender = self.is_new_person(face_center)

                                # Add to current frame tracking
                                current_frame_faces.append({
                                    'center': face_center,
                                    'gender': gender,
                                    'bbox': (x, y, w, h),
                                    'confidence': confidence
                                })

                                # If new person, count them
                                if is_new:
                                    self.total_people_counted += 1

                                    if gender_idx == 1:  # MALE (index 1 from alphabetical order)
                                        self.male_count += 1
                                    elif gender_idx == 0:  # FEMALE (index 0 from alphabetical order)
                                        self.female_count += 1

                                    # Add to tracked people
                                    self.tracked_people.append({
                                        'center': face_center,
                                        'gender': gender,
                                        'bbox': (x, y, w, h),
                                        'confidence': confidence,
                                        'first_seen': frame_count
                                    })

                                    print(f"[INFO] Frame {frame_count}: New {gender} detected! (Confidence: {confidence:.2f})")
                                    print(f"[INFO] Total - Male: {self.male_count}, Female: {self.female_count}, Total: {self.total_people_counted}")

                    except Exception as e:
                        print(f"[ERROR] Error in batch processing: {e}")
                        # Fallback to individual processing if batch fails
                        for x, y, w, h, face_roi in valid_faces:
                            try:
                                face_center = self.calculate_face_center(x, y, w, h)
                                is_new, existing_gender = self.is_new_person(face_center)

                                face_array = self.preprocess_face(face_roi)
                                prediction = self.model.predict(face_array, verbose=0)
                                gender_idx = np.argmax(prediction[0])
                                confidence = prediction[0][gender_idx]
                                gender = config.INT2LABELS[gender_idx]

                                current_frame_faces.append({
                                    'center': face_center,
                                    'gender': gender,
                                    'bbox': (x, y, w, h),
                                    'confidence': confidence
                                })

                                if is_new:
                                    self.total_people_counted += 1
                                    if gender_idx == 1:
                                        self.male_count += 1
                                    elif gender_idx == 0:
                                        self.female_count += 1

                                    self.tracked_people.append({
                                        'center': face_center,
                                        'gender': gender,
                                        'bbox': (x, y, w, h),
                                        'confidence': confidence,
                                        'first_seen': frame_count
                                    })

                                    print(f"[INFO] Frame {frame_count}: New {gender} detected! (Confidence: {confidence:.2f})")
                                    print(f"[INFO] Total - Male: {self.male_count}, Female: {self.female_count}, Total: {self.total_people_counted}")

                            except Exception as e2:
                                print(f"[ERROR] Error processing individual face: {e2}")
                                continue
                
                # Update tracking buffer
                self.face_tracking_buffer.extend(current_frame_faces)
                
                # Send updates to API every 10 frames
                if frame_count % 10 == 0:
                    self.update_gender_counts()
                    last_api_update = time.time()
                
                # Send frame to API for streaming
                try:
                    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    requests.post(f"{API_BASE_URL}/api/internal/update-frame", 
                                files={'frame': buffer.tobytes()},
                                timeout=0.1)
                except:
                    pass

                processed_frame_count += 1

                # Calculate and display FPS every 30 frames
                if processed_frame_count % 30 == 0 and processed_frame_count > 0:
                    current_time = time.time()
                    fps = processed_frame_count / (current_time - start_time)
                    print(f"[INFO] Current FPS: {fps:.1f}")
                
        except KeyboardInterrupt:
            print("\n[INFO] Stopping gender classification service...")
        except Exception as e:
            print(f"[ERROR] Error in camera feed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.stop()
    
    def stop(self):
        """Stop the service"""
        self.is_running = False
        if self.camera:
            self.camera.release()
            print("[INFO] Camera released")
        print(f"[INFO] Service stopped. Final counts - Male: {self.male_count}, Female: {self.female_count}, Total: {self.total_people_counted}")


def main():
    """Main function"""
    print("=" * 60)
    print("Gender Classification Service (Headless)")
    print("=" * 60)
    print("\n[INFO] This service runs without GUI and sends data to the API server")
    print("[INFO] Make sure the API server is running: python api_server.py")
    print("=" * 60 + "\n")
    
    service = GenderClassificationService()
    service.start()


if __name__ == "__main__":
    main()
