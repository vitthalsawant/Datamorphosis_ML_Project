# Python Camera Analysis Algorithm

Place your Python algorithm files in this folder.

## Setup Instructions

### 1. Install Required Dependencies

```bash
pip install flask flask-cors opencv-python numpy
```

### 2. Configure Your Algorithm

Edit `api_server.py` to integrate your detection logic.

### 3. Run the API Server

```bash
python api_server.py
```

The server will start on `http://localhost:5000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Get camera and system status |
| `/api/analytics` | GET | Get current analytics data |
| `/api/detections` | GET | Get recent detections |
| `/api/heatmap` | GET | Get heatmap data |

## Integration with Dashboard

The Lovable dashboard will poll these endpoints to display:
- Live camera status
- Visitor analytics (count, gender, age)
- Detection alerts
- Heatmap visualization

## Example Response Format

### /api/analytics
```json
{
  "total_visitors": 1250,
  "male_count": 680,
  "female_count": 570,
  "hourly_data": [...],
  "age_distribution": {...}
}
```

### /api/detections
```json
{
  "detections": [
    {
      "id": "det_001",
      "type": "person_counting",
      "confidence": 0.95,
      "timestamp": "2024-01-15T10:30:00Z",
      "camera": "Main Entrance"
    }
  ]
}
```
