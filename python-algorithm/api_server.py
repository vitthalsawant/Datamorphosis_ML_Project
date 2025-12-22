"""
Flask API Server for Camera Analysis with YOLOv8 People Counting
This server exposes REST endpoints for the Lovable dashboard to consume.
"""

from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from datetime import datetime
import threading
import time
import cv2
import base64
import io
import numpy as np
from PIL import Image
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ============================================
# GLOBAL ANALYTICS DATA (Updated by detection algorithm)
# ============================================

analytics_data = {
    "total_visitors": 0,
    "male_count": 0,
    "female_count": 0,
    "current_occupancy": 0,
    "hourly_data": [],
    "age_distribution": {
        "0-18": 0,
        "19-30": 0,
        "31-45": 0,
        "46-60": 0,
        "60+": 0
    }
}

# Person counting specific data
person_counting_data = {
    "enabled": True,
    "sensitivity": 80,
    "confidence_threshold": 0.8,
    "total_count": 0,
    "current_in_roi": 0,
    "entries_today": 0,
    "exits_today": 0,
    "peak_occupancy": 0,
    "peak_time": None,
    "hourly_foot_traffic": {},
    "roi_config": None  # ROI must be set by user in dashboard
}

# Gender classification specific data
gender_classification_data = {
    "enabled": True,
    "male_count": 0,
    "female_count": 0,
    "total_count": 0,
    "last_update": None
}

detections = []
heatmap_data = []
camera_status = {
    "cameras": [],
    "system_status": "online",
    "detection_running": False
}

# Video streaming
current_frame = None
frame_lock = threading.Lock()


# ============================================
# API ENDPOINTS
# ============================================

@app.route('/', methods=['GET'])
def root():
    """Root endpoint - API information"""
    return jsonify({
        "message": "Datamorphosis ML API Server",
        "description": "This is an API-only server. Access the web dashboard at http://localhost:8080",
        "version": "1.0.0",
        "available_endpoints": [
            "GET  /api/status",
            "GET  /api/analytics",
            "GET  /api/detections",
            "GET  /api/heatmap",
            "GET  /api/person-counting",
            "POST /api/person-counting/settings",
            "POST /api/person-counting/update",
            "POST /api/internal/update-count"
        ],
        "frontend_url": "http://localhost:8080"
    })


@app.route('/api', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        "message": "Datamorphosis ML API",
        "endpoints": {
            "GET /api/status": "Get camera and system status",
            "GET /api/analytics": "Get visitor analytics + person counting",
            "GET /api/detections": "Get recent detections",
            "GET /api/heatmap": "Get heatmap data",
            "GET /api/person-counting": "Get person counting specific data",
            "GET /api/gender-classification": "Get gender classification data",
            "POST /api/person-counting/settings": "Update counting settings",
            "POST /api/person-counting/update": "Update count from detection script",
            "POST /api/gender-classification/update": "Update gender classification data",
            "POST /api/internal/update-count": "Internal count update endpoint"
        }
    })


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get camera and system status"""
    return jsonify({
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "cameras": camera_status["cameras"],
        "system_status": camera_status["system_status"],
        "detection_running": camera_status["detection_running"]
    })


@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get current analytics data including person counting and gender classification"""
    return jsonify({
        "total_visitors": analytics_data["total_visitors"],
        "male_count": gender_classification_data["male_count"],  # Use gender classification data
        "female_count": gender_classification_data["female_count"],  # Use gender classification data
        "current_occupancy": analytics_data["current_occupancy"],
        "hourly_data": analytics_data["hourly_data"],
        "age_distribution": analytics_data["age_distribution"],
        "person_counting": person_counting_data,
        "gender_classification": gender_classification_data,
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/detections', methods=['GET'])
def get_detections():
    """Get recent detections"""
    return jsonify({
        "detections": detections[-50:],  # Last 50 detections
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/heatmap', methods=['GET'])
def get_heatmap():
    """Get heatmap data"""
    return jsonify({
        "zones": heatmap_data,
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/person-counting', methods=['GET'])
def get_person_counting():
    """Get person counting specific data"""
    return jsonify({
        "enabled": person_counting_data["enabled"],
        "sensitivity": person_counting_data["sensitivity"],
        "total_count": person_counting_data["total_count"],
        "current_in_roi": person_counting_data["current_in_roi"],
        "entries_today": person_counting_data["entries_today"],
        "exits_today": person_counting_data["exits_today"],
        "peak_occupancy": person_counting_data["peak_occupancy"],
        "peak_time": person_counting_data["peak_time"],
        "hourly_foot_traffic": person_counting_data["hourly_foot_traffic"],
        "roi_config": person_counting_data["roi_config"],
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/person-counting/settings', methods=['POST'])
def update_person_counting_settings():
    """Update person counting settings from dashboard"""
    global person_counting_data
    data = request.get_json()
    
    if 'enabled' in data:
        person_counting_data['enabled'] = data['enabled']
    if 'sensitivity' in data:
        person_counting_data['sensitivity'] = data['sensitivity']
        # Convert sensitivity (0-100) to confidence threshold (0.5-0.95)
        person_counting_data['confidence_threshold'] = 0.5 + (data['sensitivity'] / 100) * 0.45
    if 'roi_config' in data:
        # If ROI config is provided, update it (can be None or a dict)
        if data['roi_config'] is None:
            person_counting_data['roi_config'] = None
        elif isinstance(data['roi_config'], dict):
            if person_counting_data['roi_config'] is None:
                person_counting_data['roi_config'] = {}
            person_counting_data['roi_config'].update(data['roi_config'])
    
    return jsonify({
        "success": True,
        "message": "Settings updated successfully",
        "current_settings": {
            "enabled": person_counting_data["enabled"],
            "sensitivity": person_counting_data["sensitivity"],
            "confidence_threshold": person_counting_data["confidence_threshold"],
            "roi_config": person_counting_data["roi_config"]
        }
    })


@app.route('/api/person-counting/update', methods=['POST'])
def update_person_counting():
    """Update person counting data from detection script"""
    global person_counting_data
    data = request.get_json()
    
    total_count = data.get('total_count', person_counting_data['total_count'])
    current_in_roi = data.get('current_in_roi', person_counting_data['current_in_roi'])
    
    update_person_count(total_count, current_in_roi)
    
    return jsonify({
        "success": True,
        "message": "Person count updated successfully",
        "total_count": person_counting_data["total_count"],
        "current_in_roi": person_counting_data["current_in_roi"]
    })


@app.route('/api/internal/update-count', methods=['POST'])
def internal_update_count():
    """Internal endpoint for updating count from detection script"""
    global person_counting_data
    data = request.get_json()
    
    total_count = data.get('total_count', person_counting_data['total_count'])
    current_in_roi = data.get('current_in_roi', person_counting_data['current_in_roi'])
    
    update_person_count(total_count, current_in_roi)
    
    return jsonify({
        "success": True,
        "total_count": person_counting_data["total_count"],
        "current_in_roi": person_counting_data["current_in_roi"]
    })


@app.route('/api/gender-classification/update', methods=['POST'])
def update_gender_classification():
    """Update gender classification data from service"""
    global gender_classification_data, analytics_data
    data = request.get_json()
    
    male_count = data.get('male_count', gender_classification_data['male_count'])
    female_count = data.get('female_count', gender_classification_data['female_count'])
    total_count_from_data = data.get('total_count', 0)
    
    # Ensure consistency: total_count = male_count + female_count
    calculated_total = male_count + female_count
    
    # Use calculated total to ensure consistency
    gender_classification_data['male_count'] = male_count
    gender_classification_data['female_count'] = female_count
    gender_classification_data['total_count'] = calculated_total  # Always use calculated total
    gender_classification_data['last_update'] = datetime.now().isoformat()
    
    # Also update analytics data (use calculated total for consistency)
    analytics_data['male_count'] = male_count
    analytics_data['female_count'] = female_count
    analytics_data['total_visitors'] = calculated_total  # Use calculated total
    
    # Log if there's a mismatch (for debugging)
    if total_count_from_data != calculated_total:
        print(f"[WARNING] Total count mismatch: received {total_count_from_data}, calculated {calculated_total}")
        print(f"[INFO] Using calculated total: {calculated_total} = {male_count} (male) + {female_count} (female)")
    
    return jsonify({
        "success": True,
        "message": "Gender classification data updated successfully",
        "male_count": gender_classification_data["male_count"],
        "female_count": gender_classification_data["female_count"],
        "total_count": gender_classification_data["total_count"]
    })


@app.route('/api/gender-classification', methods=['GET'])
def get_gender_classification():
    """Get gender classification data"""
    return jsonify({
        "enabled": gender_classification_data["enabled"],
        "male_count": gender_classification_data["male_count"],
        "female_count": gender_classification_data["female_count"],
        "total_count": gender_classification_data["total_count"],
        "last_update": gender_classification_data["last_update"],
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/video/stream', methods=['GET'])
def video_stream():
    """Stream video frames as MJPEG"""
    def generate():
        global current_frame, frame_lock
        # Create a placeholder frame when no camera is active
        placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(placeholder, 'Camera Not Active', (150, 200), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.putText(placeholder, 'Run: python people_counter_api.py', (80, 250), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
        
        while True:
            with frame_lock:
                if current_frame is not None:
                    # Encode frame as JPEG
                    ret, buffer = cv2.imencode('.jpg', current_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    if ret:
                        frame_bytes = buffer.tobytes()
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                else:
                    # Send placeholder frame when camera is not active
                    ret, buffer = cv2.imencode('.jpg', placeholder, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    if ret:
                        frame_bytes = buffer.tobytes()
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.033)  # ~30 FPS
    
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/video/frame', methods=['GET'])
def video_frame():
    """Get single video frame as base64 encoded image"""
    global current_frame, frame_lock
    with frame_lock:
        if current_frame is not None:
            ret, buffer = cv2.imencode('.jpg', current_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if ret:
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
                return jsonify({
                    "success": True,
                    "frame": f"data:image/jpeg;base64,{frame_base64}",
                    "timestamp": datetime.now().isoformat()
                })
    return jsonify({
        "success": False,
        "message": "No video frame available"
    }), 404


@app.route('/api/internal/update-frame', methods=['POST'])
def internal_update_frame():
    """Internal endpoint for updating video frame from detection script"""
    global current_frame, frame_lock
    try:
        if 'frame' in request.files:
            frame_data = request.files['frame'].read()
            nparr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame is not None:
                with frame_lock:
                    current_frame = frame.copy()
                return jsonify({"success": True}), 200
        elif request.content_type and 'image' in request.content_type:
            # Handle raw image data
            frame_data = request.data
            nparr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame is not None:
                with frame_lock:
                    current_frame = frame.copy()
                return jsonify({"success": True}), 200
    except Exception as e:
        # Only log actual errors, not every request
        pass  # Silent fail for performance
    return jsonify({"success": False}), 400


def update_video_frame(frame):
    """Update the current video frame (called from detection script)"""
    global current_frame, frame_lock
    with frame_lock:
        current_frame = frame.copy()


# ============================================
# HELPER FUNCTIONS - Call these from your algorithm
# ============================================

def update_analytics(total, male, female, hourly, age_dist, current_occupancy=0):
    """Update analytics data from your algorithm"""
    global analytics_data
    analytics_data = {
        "total_visitors": total,
        "male_count": male,
        "female_count": female,
        "current_occupancy": current_occupancy,
        "hourly_data": hourly,
        "age_distribution": age_dist
    }


def update_person_count(count, current_in_roi=0):
    """Update person counting data from YOLOv8 algorithm"""
    global person_counting_data, analytics_data
    
    person_counting_data["total_count"] = count
    person_counting_data["current_in_roi"] = current_in_roi
    analytics_data["total_visitors"] = count
    analytics_data["current_occupancy"] = current_in_roi
    
    # Track peak occupancy
    if current_in_roi > person_counting_data["peak_occupancy"]:
        person_counting_data["peak_occupancy"] = current_in_roi
        person_counting_data["peak_time"] = datetime.now().isoformat()
    
    # Update hourly foot traffic
    hour = datetime.now().strftime("%H:00")
    if hour not in person_counting_data["hourly_foot_traffic"]:
        person_counting_data["hourly_foot_traffic"][hour] = 0
    # Update with current total count (cumulative)
    person_counting_data["hourly_foot_traffic"][hour] = count
    
    # Update entries/exits tracking
    old_count = person_counting_data.get("_last_count", 0)
    if count > old_count:
        person_counting_data["entries_today"] += (count - old_count)
    elif count < old_count:
        person_counting_data["exits_today"] += (old_count - count)
    person_counting_data["_last_count"] = count
    
    # Update entries/exits tracking
    if count > person_counting_data["total_count"]:
        person_counting_data["entries_today"] += (count - person_counting_data["total_count"])
    elif count < person_counting_data["total_count"]:
        person_counting_data["exits_today"] += (person_counting_data["total_count"] - count)


def add_detection(detection_type, confidence, camera_name, metadata=None):
    """Add a new detection from your algorithm"""
    global detections
    detections.append({
        "id": f"det_{len(detections) + 1}",
        "type": detection_type,
        "confidence": confidence,
        "camera": camera_name,
        "timestamp": datetime.now().isoformat(),
        "metadata": metadata or {}
    })


def update_heatmap(zones_data):
    """Update heatmap zones from your algorithm"""
    global heatmap_data
    heatmap_data = zones_data


def update_camera_status(cameras, detection_running=False):
    """Update camera status from your algorithm"""
    global camera_status
    camera_status["cameras"] = cameras
    camera_status["detection_running"] = detection_running


def get_detection_settings():
    """Get current detection settings for the algorithm"""
    return {
        "enabled": person_counting_data["enabled"],
        "confidence_threshold": person_counting_data["confidence_threshold"],
        "roi_config": person_counting_data["roi_config"]
    }


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors with JSON response"""
    return jsonify({
        "error": "Not Found",
        "message": "The requested URL was not found on the server.",
        "note": "This is an API-only server. For the web dashboard, visit http://localhost:8080",
        "available_endpoints": [
            "GET  /api/status",
            "GET  /api/analytics",
            "GET  /api/detections",
            "GET  /api/heatmap",
            "GET  /api/person-counting",
            "POST /api/person-counting/settings",
            "POST /api/person-counting/update",
            "POST /api/internal/update-count"
        ],
        "frontend_url": "http://localhost:8080"
    }), 404


# ============================================
# SAMPLE DATA INITIALIZATION
# ============================================

def initialize_sample_data():
    """Initialize sample data for testing/demo purposes"""
    global analytics_data, person_counting_data
    
    # Sample hourly data for today (last 8 hours)
    current_hour = datetime.now().hour
    for h in range(max(0, current_hour - 8), current_hour + 1):
        hour_str = f"{h:02d}:00"
        # Generate sample data with some variation
        base_count = 20 + (h - 9) * 5 if h >= 9 else 10
        person_counting_data["hourly_foot_traffic"][hour_str] = max(0, base_count + (h % 3) * 2)
    
    # Sample age distribution
    analytics_data["age_distribution"] = {
        "0-18": 15,
        "19-30": 45,
        "31-45": 30,
        "46-60": 20,
        "60+": 10
    }
    
    # Sample gender counts
    analytics_data["male_count"] = 65
    analytics_data["female_count"] = 55
    analytics_data["total_visitors"] = 120
    analytics_data["current_occupancy"] = 8
    person_counting_data["total_count"] = 120
    person_counting_data["peak_occupancy"] = 12


# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    # Initialize sample data for demo
    initialize_sample_data()
    print("=" * 60)
    print("Starting Camera Analysis API Server with Person Counting...")
    print("=" * 60)
    print("Dashboard will connect to: http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET  /                              - API information")
    print("  GET  /api                           - API endpoints list")
    print("  GET  /api/status                    - Camera and system status")
    print("  GET  /api/analytics                 - Visitor analytics + person counting")
    print("  GET  /api/detections                - Recent detections")
    print("  GET  /api/heatmap                   - Heatmap data")
    print("  GET  /api/person-counting           - Person counting specific data")
    print("  GET  /api/video/stream              - Live video stream (MJPEG)")
    print("  GET  /api/video/frame               - Single video frame")
    print("  POST /api/person-counting/settings   - Update counting settings")
    print("  POST /api/person-counting/update    - Update count from detection script")
    print("  POST /api/internal/update-count     - Internal count update endpoint")
    print("  POST /api/internal/update-frame     - Update video frame")
    print("\nNote: This is an API-only server.")
    print("      Access the web dashboard at: http://localhost:8080")
    print("\n" + "=" * 60)
    print("To run YOLOv8 detection, run in another terminal:")
    print("  python people_counter_api.py")
    print("=" * 60)
    
    # Disable Flask request logging to reduce console spam
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)  # Only show errors, not every request
    
    app.run(host='0.0.0.0', port=5000, debug=False)  # Set to False to reduce logging
