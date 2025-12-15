"""
Flask API Server for Camera Analysis
This server exposes REST endpoints for the Lovable dashboard to consume.
"""

from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ============================================
# REPLACE THESE WITH YOUR ACTUAL ALGORITHM
# ============================================

# Store your analysis results here
analytics_data = {
    "total_visitors": 0,
    "male_count": 0,
    "female_count": 0,
    "hourly_data": [],
    "age_distribution": {
        "0-18": 0,
        "19-30": 0,
        "31-45": 0,
        "46-60": 0,
        "60+": 0
    }
}

detections = []
heatmap_data = []
camera_status = {
    "cameras": [],
    "system_status": "online"
}


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get camera and system status"""
    return jsonify({
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "cameras": camera_status["cameras"],
        "system_status": camera_status["system_status"]
    })


@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get current analytics data"""
    # Replace this with your actual algorithm output
    return jsonify({
        "total_visitors": analytics_data["total_visitors"],
        "male_count": analytics_data["male_count"],
        "female_count": analytics_data["female_count"],
        "hourly_data": analytics_data["hourly_data"],
        "age_distribution": analytics_data["age_distribution"],
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


# ============================================
# HELPER FUNCTIONS - Call these from your algorithm
# ============================================

def update_analytics(total, male, female, hourly, age_dist):
    """Update analytics data from your algorithm"""
    global analytics_data
    analytics_data = {
        "total_visitors": total,
        "male_count": male,
        "female_count": female,
        "hourly_data": hourly,
        "age_distribution": age_dist
    }


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


def update_camera_status(cameras):
    """Update camera status from your algorithm"""
    global camera_status
    camera_status["cameras"] = cameras


# ============================================
# YOUR ALGORITHM INTEGRATION
# ============================================

# Example: Import and run your algorithm here
# from your_algorithm import YourDetector
# detector = YourDetector()
# 
# def run_analysis():
#     results = detector.analyze_frame(frame)
#     update_analytics(results['total'], results['male'], results['female'], ...)
#     if results['detection']:
#         add_detection(results['type'], results['confidence'], 'Camera 1')


if __name__ == '__main__':
    print("Starting Camera Analysis API Server...")
    print("Dashboard will connect to: http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET /api/status     - Camera and system status")
    print("  GET /api/analytics  - Visitor analytics")
    print("  GET /api/detections - Recent detections")
    print("  GET /api/heatmap    - Heatmap data")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
