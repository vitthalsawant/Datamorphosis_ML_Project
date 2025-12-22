# Datamorphosis ML Project

A real-time person counting and gender classification system with analytics dashboard powered by YOLOv8, TensorFlow, and React. This project provides live camera feeds, visitor analytics, gender statistics, and detection settings through an intuitive web interface.

## 🚀 Quick Start Guide

### Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **Webcam** (for live video detection)
- **Internet connection** (for downloading YOLOv8 model on first run)

### Step 1: Install Python Dependencies

```bash
cd python-algorithm
pip install -r requirements.txt
```

**Key dependencies:**
- Flask (API server)
- ultralytics (YOLOv8)
- tensorflow (Gender classification)
- opencv-python (Camera and image processing)
- numpy, requests, etc.

### Step 2: Train Gender Classification Model (First Time Only)

Before running the detection service, you need to train the gender classification model:

```bash
cd python-algorithm
python train_model.py
```

This will:
- Load the dataset from `CCTV Gender Classifier Dataset/`
- Train a ResNet50-based model
- Save the model to `models/GenderClassification.h5`
- Generate training visualizations in `outputs/`

**Note:** Training may take 10-30 minutes depending on your hardware. You can use `USE_SMALL_DATASET = True` in `config.py` for faster testing.

### Step 3: Start the API Server

Open a terminal and run:

```bash
cd python-algorithm
python api_server.py
```

The API server will start on `http://localhost:5000`

You should see:
```
[INFO] API Server starting on http://localhost:5000
[INFO] Server is ready!
```

### Step 4: Start the Unified Detection Service

In another terminal, run:

```bash
cd python-algorithm
python people_counter_api.py
```

This unified service will:
- ✅ Load YOLOv8 model for person detection
- ✅ Load gender classification model
- ✅ Open camera automatically
- ✅ Detect and count people
- ✅ Classify gender for detected people
- ✅ Send all data to the API server
- ✅ Run headless (no GUI windows)

**Important:** 
- The camera will start automatically
- ROI (Region of Interest) must be configured in the dashboard before counting begins
- All output goes to the web dashboard (no local windows)
- ✅ Run headless (no GUI windows)

**Note:** This can run simultaneously with the person counting service using the same camera feed.

### Step 5: Start the Frontend Dashboard

In a third terminal:

```bash
# Install frontend dependencies (first time only)
npm install

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:8080` (or your configured port)

### Step 6: Configure ROI in Dashboard

1. Open the dashboard at `http://localhost:8080`
2. Navigate to **Detection Settings**
3. Set the ROI (Region of Interest) rectangle on the video feed
4. Click **Save Settings**
5. Person counting and gender classification will begin automatically

## 📊 Where to See Results

| Page | What You See |
|------|-------------|
| **Security Dashboard** (`/customer`) | Total visitors, gender statistics, detections, camera status |
| **Detection Settings** | Person counting stats, ROI configuration, sensitivity controls |
| **Analytics** | Visitor charts, gender distribution, trends |
| **Heatmaps** | Zone traffic data |

## 🏗️ Project Structure

```
Datamorphosis_ML_Project/
├── src/                              # React frontend (TypeScript + Vite)
│   ├── pages/                        # Dashboard pages
│   ├── components/                   # React components
│   └── hooks/                        # Custom hooks (API integration)
└── python-algorithm/                 # Python backend
    ├── api_server.py                 # Flask API server
    ├── people_counter_api.py         # Unified detection service (YOLOv8 + Gender)
    ├── train_model.py                # Gender classification model training
    ├── dataset_analysis.py           # Dataset visualization
    ├── config.py                     # Configuration settings
    ├── models/                       # Trained models
    │   └── GenderClassification.h5  # Gender classification model
    ├── outputs/                      # Training outputs and visualizations
    ├── CCTV Gender Classifier Dataset/  # Training dataset
    │   ├── MALE/                    # Male images
    │   └── FEMALE/                  # Female images
    └── requirements.txt              # Python dependencies
```

## 🛠️ Complete Setup Instructions

### 1. Backend Setup

```bash
# Navigate to python-algorithm directory
cd python-algorithm

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Analyze dataset
python dataset_analysis.py

# Train gender classification model (required before running detection)
python train_model.py

# Start API server
python api_server.py
```

### 2. Detection Service Setup

```bash
# In a new terminal, navigate to python-algorithm
cd python-algorithm

# Start unified detection service
python people_counter_api.py
```

The service will:
- Automatically load YOLOv8 model (downloads on first run)
- Load gender classification model
- Open camera (index 0 by default)
- Start detection and send data to API server

### 3. Frontend Setup

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🌐 Access Points

- **Web Dashboard**: http://localhost:8080
- **API Server**: http://localhost:5000
- **API Info**: http://localhost:5000/api
- **API Status**: http://localhost:5000/api/status

## 🔌 API Endpoints

### Status & Analytics
- `GET /api/status` - System status
- `GET /api/analytics` - All analytics (visitors, gender, people counting)
- `GET /api/detections` - Recent detections
- `GET /api/heatmap` - Heatmap data

### Person Counting
- `GET /api/person-counting` - Person counting data
- `POST /api/person-counting/settings` - Update counting settings
- `POST /api/internal/update-count` - Internal count update

### Gender Classification
- `GET /api/gender-classification` - Gender classification data
- `POST /api/gender-classification/update` - Update gender counts

### Video Streaming
- `GET /api/video/stream` - Live video stream (MJPEG)
- `GET /api/video/frame` - Single video frame
- `POST /api/internal/update-frame` - Internal frame update

## ✨ Features

✅ **Unified Detection Service** - Single service for both person counting and gender classification  
✅ **Live Camera Feeds** - View real-time video streams in dashboard  
✅ **Person Counting** - AI-powered people detection using YOLOv8  
✅ **Gender Classification** - Real-time gender classification using trained ResNet50 model  
✅ **Analytics Dashboard** - View visitor statistics, gender distribution, and analytics  
✅ **ROI Configuration** - Configure detection region from dashboard  
✅ **Headless Operation** - No GUI windows, all output in web dashboard  
✅ **Real-time Updates** - Live statistics and video streaming  

## 🔧 Configuration

### Camera Settings

Default camera index is 0. To change:

Edit `people_counter_api.py`:
```python
camera_index = 0  # Change to 1, 2, etc.
```

### API Server URL

Default: `http://localhost:5000`

To change, edit `API_BASE_URL` in:
- `people_counter_api.py`
- `api_server.py` (if needed)

### Model Configuration

Edit `config.py` to adjust:
- Image size for gender classification
- Training parameters
- Face detection settings
- Tracking parameters

## 🔧 Troubleshooting

### Model Not Found

**Gender Classification Model:**
```bash
# Train the model first
cd python-algorithm
python train_model.py
```

Ensure `models/GenderClassification.h5` exists after training.

**YOLOv8 Model:**
- Downloads automatically on first run
- Requires internet connection
- Check your internet connection if download fails

### Camera Not Opening

- Check if camera is available: `python -c "import cv2; print(cv2.VideoCapture(0).isOpened())"`
- Try different camera indices (0, 1, 2, etc.)
- Ensure no other application is using the camera
- Check camera permissions in OS settings

### API Server Not Responding

- Check if API server is running: `curl http://localhost:5000/api/status`
- Ensure port 5000 is not in use by another application
- Check firewall settings
- Verify Flask is installed: `pip install flask flask-cors`

### Services Not Connecting

- Verify API server is running first (`python api_server.py`)
- Check network connectivity
- Review error messages in console output
- Ensure all dependencies are installed

### ROI Not Working

- Go to Detection Settings in dashboard
- Draw ROI rectangle on video feed
- Click Save Settings
- Wait a few seconds for detection to start

### Port Already in Use

**Flask (5000):**
- Change port in `api_server.py`: `app.run(port=5001)`
- Update `API_BASE_URL` in `people_counter_api.py`

**Frontend (8080):**
- Change port in `vite.config.ts`
- Or use: `npm run dev -- --port 3000`

## 📝 Running the Complete System

### Terminal 1: API Server
```bash
cd python-algorithm
python api_server.py
```

### Terminal 2: Detection Service
```bash
cd python-algorithm
python people_counter_api.py
```

### Terminal 3: Frontend Dashboard
```bash
npm run dev
```

Then:
1. Open browser to `http://localhost:8080`
2. Navigate to Detection Settings
3. Configure ROI region
4. View live detection and statistics!

## 🛠️ Technologies Used

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn-ui

**Backend:**
- Python 3.8+
- Flask (API server)
- YOLOv8 (Person detection)
- TensorFlow/Keras (Gender classification)
- OpenCV (Camera and image processing)
- ResNet50 (Gender classification base model)

## 📄 Additional Documentation

- `python-algorithm/README_SECURITY_SERVICES.md` - Detailed service documentation
- `python-algorithm/README_GENDER_CLASSIFICATION.md` - Gender classification guide
- `python-algorithm/INTEGRATION_GUIDE.md` - Integration details

## 🎯 Quick Reference

**Start everything:**
```bash
# Terminal 1: API Server
cd python-algorithm && python api_server.py

# Terminal 2: Person Counting & Gender Classification
cd python-algorithm && python people_counter_api.py

# Terminal 3: Frontend Dashboard
npm run dev
```

**View results:**
- Dashboard: http://localhost:8080
- API Status: http://localhost:5000/api/status

**Stop services:**
- Press `Ctrl+C` in each terminal

## 📄 License

This project is part of the Datamorphosis ML Project.
