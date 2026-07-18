# AI Model Weights Directory

Place your trained YOLOv5 model weights file here.

## Expected File

- **`best.pt`** — The trained YOLOv5 model weights for dental condition detection.

## How to Obtain

### Option 1: Train Your Own Model
1. Collect and annotate dental X-ray / intraoral images using a tool like [Roboflow](https://roboflow.com/) or [LabelImg](https://github.com/HumanSignal/labelImg).
2. Organize annotations in YOLOv5 format (one `.txt` file per image with `class x_center y_center width height`).
3. Train using Ultralytics YOLOv5:
   ```bash
   yolo detect train data=dental_dataset.yaml model=yolov5s.pt epochs=100 imgsz=640
   ```
4. Copy the best weights from `runs/detect/train/weights/best.pt` to this directory.

### Option 2: Use a Pre-trained Dental Model
Search for community-trained dental detection models on:
- [Roboflow Universe](https://universe.roboflow.com/) — search "dental", "cavity", "teeth"
- [Hugging Face](https://huggingface.co/models) — search for dental YOLO models

### Option 3: Demo Mode
If no `best.pt` file is found, the service will start in **demo mode** and return
synthetic predictions for testing purposes. This allows the frontend and backend
integration to be tested without a real model.

## Class Labels

The model should be trained to detect these classes (in order):

| Index | Label               |
|-------|---------------------|
| 0     | cavity              |
| 1     | plaque              |
| 2     | gingivitis          |
| 3     | calculus             |
| 4     | tooth_discoloration |
| 5     | hypodontia          |
| 6     | mouth_ulcer         |
| 7     | caries              |
| 8     | periapical_lesion   |
| 9     | healthy             |
