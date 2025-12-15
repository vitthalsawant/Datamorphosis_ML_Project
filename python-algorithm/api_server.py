"""
Flask API Server for Camera Analysis with YOLOv8 People Counting
This server exposes REST endpoints for the Lovable dashboard to consume.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import threading
import time

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
    "roi_config": {
        "x_start_percent": 20,
        "x_end_percent": 80,
        "y_start_percent": 20,
        "y_end_percent": 80
    }
}

detections = []
heatmap_data = []
camera_status = {
    "cameras": [],
    "system_status": "online",
    "detection_running": False
}


# ============================================
# API ENDPOINTS
# ============================================

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
    """Get current analytics data including person counting"""
    return jsonify({
        "total_visitors": analytics_data["total_visitors"],
        "male_count": analytics_data["male_count"],
        "female_count": analytics_data["female_count"],
        "current_occupancy": analytics_data["current_occupancy"],
        "hourly_data": analytics_data["hourly_data"],
        "age_distribution": analytics_data["age_distribution"],
        "person_counting": person_counting_data,
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
    person_counting_data["hourly_foot_traffic"][hour] = count


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


# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    print("=" * 60)
    print("Starting Camera Analysis API Server with Person Counting...")
    print("=" * 60)
    print("Dashboard will connect to: http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET  /api/status          - Camera and system status")
    print("  GET  /api/analytics       - Visitor analytics + person counting")
    print("  GET  /api/detections      - Recent detections")
    print("  GET  /api/heatmap         - Heatmap data")
    print("  GET  /api/person-counting - Person counting specific data")
    print("  POST /api/person-counting/settings - Update counting settings")
    print("\n" + "=" * 60)
    print("To run YOLOv8 detection, run in another terminal:")
    print("  python people_counter_api.py")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
