# Duplicate Counting Prevention Tracker - Documentation

## Overview

This document explains the tracker mechanism implemented to prevent duplicate counting of people in the gender classification and people counting system. The tracker ensures that each person is counted **only once**, even if they leave and re-enter the frame.

## Problem Statement

Without a tracker, the system would count the same person multiple times if:
- They temporarily leave the camera's field of view and return
- They move in and out of the Region of Interest (ROI)
- The detection system loses track of them momentarily

## Solution: Person ID Tracking System

The tracker uses a combination of two data structures to prevent duplicate counting:

### 1. `counted_person_ids` (Set)
- **Type**: Python `set()`
- **Purpose**: Stores unique person IDs that have already been counted
- **Key Feature**: **NEVER cleared** - persists throughout the entire detection session
- **Location**: Line 200 in `people_counter_api.py`

```python
counted_person_ids = set()  # Track which person IDs have already been counted (prevents duplicates - NEVER cleared)
```

### 2. `tracked_people_gender` (Dictionary)
- **Type**: Python `dict`
- **Purpose**: Stores gender information and metadata for each person ID
- **Structure**: `{person_id: {'gender': str, 'confidence': float, 'counted': bool, 'first_seen_frame': int}}`
- **Location**: Line 199 in `people_counter_api.py`

```python
tracked_people_gender = {}  # Track gender for each person ID
```

## How It Works

### Step 1: Person Detection and ID Assignment

When a person is detected by YOLOv8:
1. The system calculates the center point of the detected person
2. The `update_tracking()` function (lines 86-107) assigns a unique ID:
   - If the person matches a previously tracked position → uses existing ID
   - If it's a new person → assigns a new ID (ID0, ID1, ID2, etc.)

```python
centers_old, id_obj, is_new, lastKey = update_tracking(
    centers_old, (center_x_full, center_y_full), 
    thr_centers, lastKey, frame_count, frame_max
)
```

### Step 2: Gender Classification

For each detected person:
1. Face detection is performed on the person's bounding box
2. If a face is found, gender classification is performed using the trained model
3. The system gets a gender prediction (MALE or FEMALE) with confidence score

### Step 3: Duplicate Prevention Check

**Critical Logic** (Lines 366-390):

```python
# Only count each person ID once, even if gender classification happens multiple times
if id_obj not in counted_person_ids and person_gender:
    # This person ID hasn't been counted yet - count them now
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
```

**Key Points**:
- ✅ Person is counted **only if** `id_obj not in counted_person_ids`
- ✅ Once added to `counted_person_ids`, the person will **never be counted again**
- ✅ Gender information is stored in `tracked_people_gender` for display purposes

### Step 4: Visual Indicators

The system provides visual feedback on the video frame:

- **Red bounding box**: Person not yet counted
- **Green bounding box**: Person already counted
- **Gender label**: Shows gender and confidence (e.g., "MALE (0.95) [COUNTED]")

```python
# Draw person bounding box
if id_obj in counted_person_ids:
    color = (0, 255, 0)  # Green for already counted
else:
    color = (0, 0, 255)  # Red for new detection
cv2.rectangle(ROI, (xmin, ymin), (xmax, ymax), color, 2)
```

### Step 5: Cleanup (Without Losing Count Status)

When a person leaves the frame (Lines 442-460):

```python
# Clean up tracked_people_gender for IDs that are no longer in frame
current_tracked_ids = set(centers_old.keys())
ids_to_remove = []
for tracked_id in list(tracked_people_gender.keys()):
    if tracked_id not in current_tracked_ids:
        ids_to_remove.append(tracked_id)

# Remove old tracking data (but keep in counted_person_ids to prevent duplicates)
for tracked_id in ids_to_remove:
    if tracked_id in tracked_people_gender:
        del tracked_people_gender[tracked_id]
        # Note: counted_person_ids is NOT cleared - this prevents duplicate counting
```

**Important**: 
- `tracked_people_gender` entries are removed when person leaves (to save memory)
- **BUT** `counted_person_ids` is **never cleared** - this ensures if the same person returns, they won't be counted again

## Code Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Frame Processing Loop                                      │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  1. YOLOv8 detects person in ROI                            │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  2. update_tracking() assigns/updates person ID            │
│     (ID0, ID1, ID2, ...)                                    │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Face detection + Gender classification                  │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Check: Is id_obj in counted_person_ids?                │
└─────────────────────────────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
          NO │                       │ YES
            │                       │
            ▼                       ▼
┌───────────────────────┐  ┌───────────────────────┐
│ Count person          │  │ Skip counting         │
│ - Add to male/female  │  │ - Update gender info  │
│ - Add to              │  │ - Show as counted     │
│   counted_person_ids  │  │                       │
│ - Store in            │  │                       │
│   tracked_people_     │  │                       │
│   gender              │  │                       │
└───────────────────────┘  └───────────────────────┘
```

## Key Features

### ✅ Persistent Counting Prevention
- Once a person ID is added to `counted_person_ids`, it remains there forever
- Even if the person leaves and returns, they won't be counted again
- This prevents duplicate counting across the entire session

### ✅ Memory Management
- `tracked_people_gender` is cleaned up when people leave the frame
- `counted_person_ids` persists but uses minimal memory (just IDs as strings)

### ✅ Visual Feedback
- Color-coded bounding boxes (red = new, green = counted)
- Gender labels with confidence scores
- "[COUNTED]" indicator for already-counted people

### ✅ Consistency
- Total count is always: `male_count + female_count`
- No discrepancies between gender counts and total count

## Example Scenario

1. **Frame 100**: Person enters ROI → Gets ID0 → Gender classified as MALE → Added to `counted_person_ids` → `male_count = 1`
2. **Frame 200**: Person leaves ROI → Removed from `tracked_people_gender` → **BUT** ID0 stays in `counted_person_ids`
3. **Frame 300**: Same person returns → Gets ID0 again (or new ID) → System checks `counted_person_ids` → Finds ID0 → **NOT counted again** ✅

## Configuration

The tracker uses these parameters (defined in `people_counter_api.py`):

- `thr_centers = 20`: Distance threshold for matching person positions
- `frame_max = 5`: Maximum frame gap for tracking continuity
- `patience = 100`: Number of frames to keep in tracking history

## Files Involved

- **Main Implementation**: `python-algorithm/people_counter_api.py`
  - Lines 193-203: Tracker initialization
  - Lines 366-390: Duplicate prevention logic
  - Lines 442-460: Cleanup logic

- **Supporting Functions**: 
  - `update_tracking()` (lines 86-107): Person ID assignment
  - `filter_tracks()` (lines 78-84): Track history management

## Benefits

1. **Accuracy**: Prevents false inflation of counts
2. **Reliability**: Works even if tracking temporarily fails
3. **Performance**: Minimal overhead (set lookup is O(1))
4. **User Experience**: Clear visual indicators of counting status

## Limitations

- If a person's ID changes (due to tracking failure), they might be counted again
- The system relies on consistent person ID assignment from `update_tracking()`
- Memory usage grows with number of unique people seen (but minimal - just IDs)

## Future Improvements

Potential enhancements:
- Add time-based expiration for `counted_person_ids` (e.g., reset after 24 hours)
- Implement face recognition to match people even if ID changes
- Add configuration option to enable/disable persistent counting

---

**Last Updated**: Based on implementation in `people_counter_api.py`
**Author**: Datamorphosis ML Project Team
