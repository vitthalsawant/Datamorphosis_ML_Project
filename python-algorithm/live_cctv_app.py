# -*- coding: utf-8 -*-
"""
Live CCTV Gender Classification Application
GUI application for real-time gender classification from camera feed
"""

import os
import threading
import time
import numpy as np
import cv2
import tkinter as tk
from tkinter import messagebox
import matplotlib
matplotlib.use('TkAgg')  # Use TkAgg for GUI compatibility

from tensorflow.keras.models import load_model
from tensorflow.keras.applications.resnet50 import preprocess_input

import config


class CCTVGenderAnalyzer:
    """GUI application for live CCTV gender classification"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("Live CCTV Gender Classification Analyzer")
        self.root.geometry("1000x700")
        self.root.configure(bg='#f0f0f0')
        
        self.model = None
        self.face_cascade = None
        self.camera = None
        self.is_running = False
        self.tracking_thread = None
        
        # Person tracking variables
        self.tracked_people = []  # List of dictionaries with face info and gender
        self.face_tracking_buffer = []  # Recent face positions for tracking
        self.male_count = 0
        self.female_count = 0
        self.total_people_counted = 0
        
        # Tracking parameters
        self.tracking_threshold = config.TRACKING_THRESHOLD
        self.tracking_frames = config.TRACKING_FRAMES
        
        # Try to load saved model
        self.load_model()
        self.load_face_cascade()
        
        self.setup_ui()
    
    def load_model(self):
        """Load the trained gender classification model"""
        try:
            if os.path.exists(config.MODEL_PATH):
                print("[INFO] Loading saved model...")
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
            # Try to load the cascade file
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            if self.face_cascade.empty():
                raise Exception("Could not load face cascade")
            print("[INFO] Face cascade loaded successfully!")
        except Exception as e:
            print(f"[ERROR] Error loading face cascade: {e}")
            messagebox.showerror("Error", "Could not load face detection model. Please check OpenCV installation.")
            self.face_cascade = None
    
    def setup_ui(self):
        """Setup the user interface"""
        # Title
        title_label = tk.Label(self.root, text="Live CCTV Gender Classification", 
                              font=("Arial", 20, "bold"), bg='#f0f0f0')
        title_label.pack(pady=15)
        
        # Instructions
        instruction_label = tk.Label(self.root, 
                                    text="Click 'Start Camera' to begin live gender classification",
                                    font=("Arial", 12), bg='#f0f0f0')
        instruction_label.pack(pady=5)
        
        # Control buttons frame
        control_frame = tk.Frame(self.root, bg='#f0f0f0')
        control_frame.pack(pady=15)
        
        # Start/Stop button
        self.start_stop_btn = tk.Button(control_frame, text="Start Camera", 
                                        command=self.toggle_camera, font=("Arial", 12),
                                        bg='#4CAF50', fg='white', padx=20, pady=10,
                                        cursor='hand2')
        self.start_stop_btn.pack(side=tk.LEFT, padx=10)
        
        # Reset button
        reset_btn = tk.Button(control_frame, text="Reset Count", 
                              command=self.reset_count, font=("Arial", 12),
                              bg='#FF9800', fg='white', padx=20, pady=10,
                              cursor='hand2')
        reset_btn.pack(side=tk.LEFT, padx=10)
        
        # Statistics frame
        stats_frame = tk.Frame(self.root, bg='#f0f0f0')
        stats_frame.pack(pady=10, padx=20, fill='x')
        
        # Statistics labels
        self.male_label = tk.Label(stats_frame, text="Male: 0", 
                                   font=("Arial", 14, "bold"), bg='#f0f0f0', fg='#2196F3')
        self.male_label.pack(side=tk.LEFT, padx=20)
        
        self.female_label = tk.Label(stats_frame, text="Female: 0", 
                                     font=("Arial", 14, "bold"), bg='#f0f0f0', fg='#E91E63')
        self.female_label.pack(side=tk.LEFT, padx=20)
        
        self.total_label = tk.Label(stats_frame, text="Total: 0", 
                                    font=("Arial", 14, "bold"), bg='#f0f0f0')
        self.total_label.pack(side=tk.LEFT, padx=20)
        
        # Status label
        self.status_label = tk.Label(self.root, text="Camera: Off", 
                                     font=("Arial", 10), bg='#f0f0f0', fg='red')
        self.status_label.pack(pady=5)
        
        # Results frame
        results_frame = tk.Frame(self.root, bg='#f0f0f0')
        results_frame.pack(pady=10, padx=20, fill='both', expand=True)
        
        # Results title
        results_title = tk.Label(results_frame, text="Live Detection Log", 
                                font=("Arial", 12, "bold"), bg='#f0f0f0')
        results_title.pack(pady=5)
        
        # Results display
        self.results_text = tk.Text(results_frame, height=8, width=80, 
                                    font=("Arial", 9), wrap=tk.WORD,
                                    bg='white', relief=tk.SUNKEN, borderwidth=2)
        self.results_text.pack(pady=5, fill='both', expand=True)
        
        scrollbar = tk.Scrollbar(self.results_text)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.results_text.config(yscrollcommand=scrollbar.set)
        scrollbar.config(command=self.results_text.yview)
        
        # Add initial message
        self.results_text.insert(tk.END, "Ready to start live camera feed...\n")
        self.results_text.insert(tk.END, "Click 'Start Camera' to begin detection.\n\n")
    
    def toggle_camera(self):
        """Start or stop the live camera feed"""
        if not self.is_running:
            self.start_camera()
        else:
            self.stop_camera()
    
    def start_camera(self):
        """Start live camera feed"""
        if not self.model:
            messagebox.showerror("Error", 
                f"Model not available. Please train the model first.\n\n"
                f"Make sure '{config.MODEL_PATH}' exists or run train_model.py")
            return
        
        if not self.face_cascade or self.face_cascade.empty():
            messagebox.showerror("Error", 
                "Face detection model not available.\n\nPlease check OpenCV installation.")
            return
        
        try:
            self.camera = cv2.VideoCapture(0)
            if not self.camera.isOpened():
                raise Exception("Could not open camera")
            
            self.is_running = True
            self.start_stop_btn.config(text="Stop Camera", bg='#f44336')
            self.status_label.config(text="Camera: On", fg='green')
            self.results_text.delete(1.0, tk.END)
            self.results_text.insert(tk.END, "Camera started. Detecting faces...\n\n")
            
            # Start tracking thread
            self.tracking_thread = threading.Thread(target=self._process_camera_feed, daemon=True)
            self.tracking_thread.start()
            
        except Exception as e:
            messagebox.showerror("Error", f"Could not start camera: {str(e)}")
            if self.camera:
                self.camera.release()
                self.camera = None
    
    def stop_camera(self):
        """Stop live camera feed"""
        self.is_running = False
        if self.camera:
            self.camera.release()
            self.camera = None
        
        self.start_stop_btn.config(text="Start Camera", bg='#4CAF50')
        self.status_label.config(text="Camera: Off", fg='red')
        self.results_text.insert(tk.END, "\nCamera stopped.\n")
    
    def reset_count(self):
        """Reset the person count"""
        self.male_count = 0
        self.female_count = 0
        self.total_people_counted = 0
        self.tracked_people = []
        self.face_tracking_buffer = []
        self.update_statistics()
        self.results_text.delete(1.0, tk.END)
        self.results_text.insert(tk.END, "Count reset. Ready for new detections...\n\n")
    
    def update_statistics(self):
        """Update the statistics labels"""
        self.male_label.config(text=f"Male: {self.male_count}")
        self.female_label.config(text=f"Female: {self.female_count}")
        self.total_label.config(text=f"Total: {self.total_people_counted}")
    
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
        # Resize to match model input size (200, 100) = (height, width)
        # cv2.resize takes (width, height), so we use (100, 200)
        face_resized = cv2.resize(face_roi, (config.IMAGE_SIZE[1], config.IMAGE_SIZE[0]))
        # Convert BGR to RGB
        face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
        # Preprocess for ResNet50
        face_array = preprocess_input(face_rgb)
        # Expand dimensions for batch
        face_array = np.expand_dims(face_array, axis=0)
        return face_array
    
    def _process_camera_feed(self):
        """Process live camera feed in background thread"""
        window_name = "Live CCTV - Gender Classification"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_name, 800, 600)
        
        frame_count = 0
        processed_frame_count = 0
        start_time = time.time()
        last_fps_check = start_time

        try:
            while self.is_running and self.camera and self.camera.isOpened():
                ret, frame = self.camera.read()
                if not ret:
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
                
                # Update tracking buffer (keep only recent frames)
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

                                    if gender_idx == 0:  # MALE
                                        self.male_count += 1
                                    else:  # FEMALE
                                        self.female_count += 1

                                    # Add to tracked people
                                    self.tracked_people.append({
                                        'center': face_center,
                                        'gender': gender,
                                        'bbox': (x, y, w, h),
                                        'confidence': confidence,
                                        'first_seen': frame_count
                                    })

                                    # Update UI
                                    if self.root.winfo_exists():
                                        log_msg = f"[Frame {frame_count}] New {gender} detected! (Confidence: {confidence:.2f})\n"
                                        self.root.after(0, self._update_results, log_msg)
                                        self.root.after(0, self.update_statistics)

                                # Draw bounding box and label
                                color = (255, 0, 0) if gender_idx == 0 else (255, 0, 255)  # Blue for male, Magenta for female
                                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)

                                # Label with gender and confidence
                                label = f"{gender} ({confidence:.2f})"
                                if is_new:
                                    label += " [NEW]"

                                # Put text on frame
                                cv2.putText(frame, label, (x, y-10),
                                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

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
                                    if gender_idx == 0:
                                        self.male_count += 1
                                    else:
                                        self.female_count += 1

                                    self.tracked_people.append({
                                        'center': face_center,
                                        'gender': gender,
                                        'bbox': (x, y, w, h),
                                        'confidence': confidence,
                                        'first_seen': frame_count
                                    })

                                    if self.root.winfo_exists():
                                        log_msg = f"[Frame {frame_count}] New {gender} detected! (Confidence: {confidence:.2f})\n"
                                        self.root.after(0, self._update_results, log_msg)
                                        self.root.after(0, self.update_statistics)

                                color = (255, 0, 0) if gender_idx == 0 else (255, 0, 255)
                                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                                label = f"{gender} ({confidence:.2f})"
                                if is_new:
                                    label += " [NEW]"
                                cv2.putText(frame, label, (x, y-10),
                                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                            except Exception as e2:
                                print(f"[ERROR] Error processing individual face: {e2}")
                                continue
                
                # Update tracking buffer with current frame faces
                self.face_tracking_buffer.extend(current_frame_faces)
                
                # Draw statistics on frame
                stats_text = [
                    f"Male: {self.male_count}",
                    f"Female: {self.female_count}",
                    f"Total: {self.total_people_counted}"
                ]
                
                y_offset = 30
                for i, text in enumerate(stats_text):
                    cv2.putText(frame, text, (10, y_offset + i*25), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                # Show frame
                cv2.imshow(window_name, frame)
                
                # Break on 'q' key press
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                
                processed_frame_count += 1

                # Calculate and display FPS
                current_time = time.time()
                if processed_frame_count > 1:
                    fps = processed_frame_count / (current_time - start_time)
                    fps_text = f"FPS: {fps:.1f}"
                    cv2.putText(frame, fps_text, (10, frame.shape[0] - 10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
        except Exception as e:
            import traceback
            error_msg = f"Error in camera feed: {str(e)}"
            print(f"[ERROR] Error in camera feed thread: {error_msg}")
            print(traceback.format_exc())
            if self.root.winfo_exists():
                self.root.after(0, self._show_error, error_msg)
        finally:
            cv2.destroyAllWindows()
            if self.camera:
                self.camera.release()
            self.is_running = False
            if self.root.winfo_exists():
                self.root.after(0, self.stop_camera)
    
    def _update_results(self, text):
        """Update results text (thread-safe)"""
        try:
            if hasattr(self, 'results_text') and self.results_text.winfo_exists():
                self.results_text.insert(tk.END, text)
                self.results_text.see(tk.END)
        except (tk.TclError, AttributeError, RuntimeError):
            # GUI was closed or object doesn't exist, ignore
            pass
    
    def _show_error(self, error_msg):
        """Show error message (thread-safe)"""
        try:
            if not self.root.winfo_exists():
                return
            
            self.results_text.insert(tk.END, f"\nERROR: {error_msg}\n")
            
            # Use after to ensure messagebox is shown after GUI update
            def show_error_popup():
                try:
                    if self.root.winfo_exists():
                        messagebox.showerror("Error", error_msg)
                except:
                    pass
            
            self.root.after(100, show_error_popup)
        except (tk.TclError, AttributeError, RuntimeError):
            # GUI was closed, ignore
            pass


def main():
    """Main function to run the GUI application"""
    print("\n" + "="*60)
    print("Starting CCTV Gender Classification Analyzer GUI...")
    print("="*60 + "\n")
    
    try:
        root = tk.Tk()
        app = CCTVGenderAnalyzer(root)
        
        def on_closing():
            """Handle window closing properly"""
            try:
                # Stop camera if running
                if app.is_running:
                    app.stop_camera()
                # Close OpenCV windows
                cv2.destroyAllWindows()
                root.quit()
                root.destroy()
            except:
                pass
        
        root.protocol("WM_DELETE_WINDOW", on_closing)
        root.mainloop()
    except KeyboardInterrupt:
        print("\nGUI closed by user.")
    except Exception as e:
        print(f"[ERROR] Error starting GUI: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
