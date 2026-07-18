# =============================================================================
# config.py
# Centralized configuration for the AI Inference Service.
# Loads settings from environment variables with sensible defaults.
# =============================================================================

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

# --- Model Configuration ---
# Path to the YOLOv5 model weights file.
# Set via MODEL_PATH env var, or defaults to models/best.pt
MODEL_PATH = os.getenv("MODEL_PATH", str(MODELS_DIR / "best.pt"))

# Confidence threshold for detections (0.0 - 1.0)
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.45"))

# IoU threshold for Non-Maximum Suppression
IOU_THRESHOLD = float(os.getenv("IOU_THRESHOLD", "0.35"))

# Maximum image dimension (images larger than this are resized)
MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE", "1280"))

# YOLOv5 inference image size
INFERENCE_IMAGE_SIZE = int(os.getenv("INFERENCE_IMAGE_SIZE", "640"))

# --- Server Configuration ---
HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
PORT = int(os.getenv("AI_SERVICE_PORT", "8005"))
WORKERS = int(os.getenv("AI_SERVICE_WORKERS", "1"))
RELOAD = os.getenv("AI_SERVICE_RELOAD", "true").lower() == "true"

# --- Class Labels ---
# These are the dental condition classes the model is trained to detect.
# Update this list if you retrain the model with different classes.
CLASS_LABELS = [
    "caries",
    "periapical_lesion",
    "impacted_tooth",
]

# --- CORS ---
ALLOWED_ORIGINS = os.getenv(
    "AI_CORS_ORIGINS",
    "http://localhost:5000,http://localhost:3000,http://localhost:5173"
).split(",")

# --- Upload Limits ---
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}
