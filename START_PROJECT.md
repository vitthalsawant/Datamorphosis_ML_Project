# How to Run the Datamorphosis ML Project

## Prerequisites

- **Python 3.8+** (Python 3.13.7 detected ✓)
- **Node.js 18+** (Node.js v22.18.0 detected ✓)
- **Webcam** (for live video detection)

## Quick Start

### Option 1: Run Everything (Recommended)

Open **3 separate terminal windows** and run:

#### Terminal 1: Flask API Server
```bash
cd python-algorithm
python api_server.py
```
Server will start on: `http://localhost:5000`

#### Terminal 2: Person Counting & Gender Classification
```bash
cd python-algorithm
python people_counter_api.py
```
This will start camera detection for person counting and gender classification.

#### Terminal 3: Frontend Development Server
```bash
npm run dev
```
Frontend will start on: `http://localhost:8080`

### Option 2: Run Only Frontend (API Server Already Running)

If the Flask API server is already running in the background:

```bash
npm run dev
```

Then open: `http://localhost:8080`

## Access Points

- **Web Dashboard**: http://localhost:8080
- **API Server**: http://localhost:5000
- **API Info**: http://localhost:5000/api

## Project Structure

```
Datamorphosis_ML_Project-1/
├── src/                    # React frontend (TypeScript + Vite)
│   ├── pages/             # Dashboard pages
│   ├── components/        # React components
│   └── hooks/            # Custom hooks (API integration)
└── python-algorithm/      # Python backend
    ├── api_server.py      # Flask API server
    ├── people_counter_api.py  # YOLOv8 detection script
    └── yolov8x.pt         # YOLOv8 model weights
```

## Features

✅ **Live Camera Feeds** - View real-time video streams
✅ **Person Counting** - AI-powered people detection and counting
✅ **Gender Classification** - Real-time gender classification
✅ **Analytics Dashboard** - View visitor statistics and analytics
✅ **Camera Management** - Manage multiple camera feeds
✅ **Detection Settings** - Configure detection sensitivity and ROI

## Troubleshooting

### Port Already in Use
If port 5000 or 8080 is already in use:
- **Flask (5000)**: Change port in `api_server.py` line 436
- **Frontend (8080)**: Change port in `vite.config.ts` line 10

### Camera Not Working
- Make sure your webcam is connected and not being used by another application
- Check camera permissions in your OS settings
- Try changing `camera_index = 0` to `camera_index = 1` in `people_counter_api.py`

### API Connection Issues
- Ensure Flask server is running before starting the frontend
- Check browser console for CORS errors
- Verify API server is accessible at `http://localhost:5000/api/status`

## Development

### Frontend Development
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run linter
```

### Python Backend
```bash
cd python-algorithm
python api_server.py           # Start API server
python people_counter_api.py   # Start detection script
```

## API Endpoints

- `GET /api/status` - System status
- `GET /api/analytics` - Visitor analytics
- `GET /api/detections` - Recent detections
- `GET /api/heatmap` - Heatmap data
- `GET /api/video/stream` - Live video stream (MJPEG)
- `GET /api/person-counting` - Person counting data
- `POST /api/person-counting/settings` - Update settings

## Notes

- The Flask API server must be running for the frontend to display live data
- The detection script (`people_counter_api.py`) is optional but required for live video feeds
- Video streaming requires both the API server and detection script to be running

