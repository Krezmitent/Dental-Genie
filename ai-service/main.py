# =============================================================================
# main.py
# FastAPI application for the Dental Diagnosis AI Inference Service.
# Provides asynchronous image upload and YOLOv5 dental condition detection.
# =============================================================================

import sys
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

import config
from services.detector import get_detector
from utils.image_processing import (
    validate_file_extension,
    validate_content_type,
    validate_file_size,
    bytes_to_cv2_image,
    resize_image,
    get_image_info,
)

# =============================================================================
# Logging Configuration
# =============================================================================
# Remove the default loguru handler and add a custom one
logger.remove()
logger.add(
    sys.stderr,
    format=(
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    ),
    level="DEBUG",
    colorize=True,
)
logger.add(
    "logs/ai_service_{time:YYYY-MM-DD}.log",
    rotation="10 MB",
    retention="30 days",
    level="INFO",
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}",
)


# =============================================================================
# Application Lifespan — Model Pre-loading
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Pre-loads the YOLOv5 model on startup so the first request doesn't
    incur a cold-start delay.
    """
    logger.info("=" * 60)
    logger.info("Dental Diagnosis AI Service starting up...")
    logger.info("=" * 60)

    # Pre-load the detector model
    detector = get_detector()
    status = detector.get_status()
    logger.info(f"Detector status: {status}")

    if detector.is_demo_mode:
        logger.warning(
            "⚠️  Running in DEMO MODE — predictions are synthetic. "
            "Place a trained model at: {path}",
            path=config.MODEL_PATH,
        )
    else:
        logger.info("✅ YOLO11 model loaded and ready for inference.")

    yield  # Application runs

    logger.info("Dental Diagnosis AI Service shutting down...")


# =============================================================================
# FastAPI Application
# =============================================================================
app = FastAPI(
    title="Dental Diagnosis AI Service",
    description=(
        "AI-powered dental condition detection using YOLO11. "
        "Detects caries, periapical lesions, and impacted teeth "
        "from X-ray and intraoral images."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# =============================================================================
# Global Exception Handler
# =============================================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler to prevent raw tracebacks from leaking
    to the client.
    """
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error. Please try again later.",
            "predictions": [],
        },
    )


# =============================================================================
# Routes
# =============================================================================


@app.get("/", tags=["Health"])
async def root() -> Dict[str, Any]:
    """Root endpoint — basic service info."""
    return {
        "service": "Dental Diagnosis AI Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint.
    Returns service status, model loading state, and uptime.
    """
    detector = get_detector()
    status = detector.get_status()

    return {
        "status": "healthy",
        "model_loaded": status["model_loaded"],
        "demo_mode": status["demo_mode"],
        "confidence_threshold": status["confidence_threshold"],
        "num_classes": status["num_classes"],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@app.get("/model/status", tags=["Model"])
async def model_status() -> Dict[str, Any]:
    """
    Detailed model status including class labels and configuration.
    """
    detector = get_detector()
    return {
        "success": True,
        "data": detector.get_status(),
    }


@app.post("/predict", tags=["Inference"])
async def predict(image: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Run dental condition detection on an uploaded image.

    Accepts a single image file (JPEG, PNG, WebP, BMP, TIFF) up to 10 MB.
    Returns detected dental conditions with labels, confidence scores,
    and bounding box coordinates.

    **Request:**
    - Content-Type: multipart/form-data
    - Field name: `image`

    **Response:**
    ```json
    {
        "success": true,
        "predictions": [
            {
                "label": "cavity",
                "confidence": 0.92,
                "bbox": {"x1": 120.5, "y1": 80.0, "x2": 250.3, "y2": 210.7}
            }
        ],
        "processing_time_ms": 145.23,
        "model_version": "yolov5-dental-v1",
        "image_info": {"width": 640, "height": 480, "channels": 3}
    }
    ```
    """
    request_start = time.time()

    # ── 1. Validate file extension ──────────────────────────────────────────
    if not validate_file_extension(image.filename):
        logger.warning(f"Rejected upload: invalid extension — {image.filename}")
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": (
                    f"Invalid file type: {image.filename}. "
                    f"Accepted formats: {', '.join(config.ALLOWED_EXTENSIONS)}"
                ),
                "predictions": [],
            },
        )

    # ── 2. Validate content type ────────────────────────────────────────────
    if not validate_content_type(image.content_type):
        logger.warning(
            f"Rejected upload: invalid content type — {image.content_type}"
        )
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": (
                    f"Invalid content type: {image.content_type}. "
                    f"Accepted types: {', '.join(config.ALLOWED_MIME_TYPES)}"
                ),
                "predictions": [],
            },
        )

    # ── 3. Read file bytes ──────────────────────────────────────────────────
    try:
        file_bytes = await image.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": "Failed to read the uploaded file.",
                "predictions": [],
            },
        )

    # ── 4. Validate file size ───────────────────────────────────────────────
    if not validate_file_size(file_bytes):
        raise HTTPException(
            status_code=413,
            detail={
                "success": False,
                "message": (
                    f"File too large. Maximum size is "
                    f"{config.MAX_UPLOAD_SIZE_MB} MB."
                ),
                "predictions": [],
            },
        )

    # ── 5. Convert to OpenCV image ──────────────────────────────────────────
    cv2_image = bytes_to_cv2_image(file_bytes)

    if cv2_image is None:
        logger.error("Failed to decode image to OpenCV array.")
        raise HTTPException(
            status_code=422,
            detail={
                "success": False,
                "message": (
                    "Could not decode the image. The file may be "
                    "corrupted or in an unsupported format."
                ),
                "predictions": [],
            },
        )

    # ── 6. Resize if necessary ──────────────────────────────────────────────
    cv2_image, scale_factor = resize_image(cv2_image)
    image_info = get_image_info(cv2_image)

    logger.info(
        f"Processing image: {image.filename} | "
        f"size={len(file_bytes) / 1024:.1f}KB | "
        f"dimensions={image_info['width']}x{image_info['height']} | "
        f"scale={scale_factor:.4f}"
    )

    # ── 7. Run detection ────────────────────────────────────────────────────
    detector = get_detector()
    result = detector.predict(cv2_image)

    # ── 8. Adjust bounding boxes if image was scaled ────────────────────────
    if scale_factor != 1.0 and result["success"]:
        for pred in result["predictions"]:
            bbox = pred["bbox"]
            bbox["x1"] = round(bbox["x1"] / scale_factor, 2)
            bbox["y1"] = round(bbox["y1"] / scale_factor, 2)
            bbox["x2"] = round(bbox["x2"] / scale_factor, 2)
            bbox["y2"] = round(bbox["y2"] / scale_factor, 2)

    total_time_ms = (time.time() - request_start) * 1000

    # ── 9. Build response ───────────────────────────────────────────────────
    response = {
        "success": result["success"],
        "predictions": result["predictions"],
        "processing_time_ms": round(total_time_ms, 2),
        "model_version": result.get("model_version", "unknown"),
        "demo_mode": result.get("demo_mode", False),
        "image_info": image_info,
    }

    if not result["success"]:
        response["message"] = result.get("error", "Detection failed.")

    logger.info(
        f"Request complete: {len(result['predictions'])} detections | "
        f"total={total_time_ms:.1f}ms | "
        f"inference={result['processing_time_ms']:.1f}ms | "
        f"file={image.filename}"
    )

    return response


@app.post("/predict/url", tags=["Inference"])
async def predict_from_url(request: Request) -> Dict[str, Any]:
    """
    Run dental condition detection on an image specified by URL.
    Useful for processing images already hosted on Cloudinary.

    **Request body:**
    ```json
    {
        "image_url": "https://res.cloudinary.com/..."
    }
    ```
    """
    import aiohttp

    body = await request.json()
    image_url = body.get("image_url")

    if not image_url:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": "image_url is required in the request body.",
                "predictions": [],
            },
        )

    # ── Download the image ──────────────────────────────────────────────────
    try:
        logger.info(f"Downloading image from URL: {image_url[:100]}...")

        # Use aiohttp for async HTTP download
        # Import here to avoid requiring aiohttp if not using this endpoint
        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(image_url) as resp:
                if resp.status != 200:
                    raise HTTPException(
                        status_code=400,
                        detail={
                            "success": False,
                            "message": (
                                f"Failed to download image. "
                                f"HTTP status: {resp.status}"
                            ),
                            "predictions": [],
                        },
                    )

                content_type = resp.headers.get("Content-Type", "")
                if not any(
                    mime in content_type for mime in config.ALLOWED_MIME_TYPES
                ):
                    raise HTTPException(
                        status_code=400,
                        detail={
                            "success": False,
                            "message": (
                                f"URL does not point to a valid image. "
                                f"Content-Type: {content_type}"
                            ),
                            "predictions": [],
                        },
                    )

                file_bytes = await resp.read()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download image from URL: {e}")
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": f"Failed to download image: {str(e)}",
                "predictions": [],
            },
        )

    # ── Validate size ───────────────────────────────────────────────────────
    if not validate_file_size(file_bytes):
        raise HTTPException(
            status_code=413,
            detail={
                "success": False,
                "message": (
                    f"Image too large. Maximum size is "
                    f"{config.MAX_UPLOAD_SIZE_MB} MB."
                ),
                "predictions": [],
            },
        )

    # ── Convert and detect ──────────────────────────────────────────────────
    cv2_image = bytes_to_cv2_image(file_bytes)

    if cv2_image is None:
        raise HTTPException(
            status_code=422,
            detail={
                "success": False,
                "message": "Could not decode the image from the URL.",
                "predictions": [],
            },
        )

    cv2_image, scale_factor = resize_image(cv2_image)
    image_info = get_image_info(cv2_image)

    detector = get_detector()
    result = detector.predict(cv2_image)

    # Adjust bounding boxes
    if scale_factor != 1.0 and result["success"]:
        for pred in result["predictions"]:
            bbox = pred["bbox"]
            bbox["x1"] = round(bbox["x1"] / scale_factor, 2)
            bbox["y1"] = round(bbox["y1"] / scale_factor, 2)
            bbox["x2"] = round(bbox["x2"] / scale_factor, 2)
            bbox["y2"] = round(bbox["y2"] / scale_factor, 2)

    return {
        "success": result["success"],
        "predictions": result["predictions"],
        "processing_time_ms": result["processing_time_ms"],
        "model_version": result.get("model_version", "unknown"),
        "demo_mode": result.get("demo_mode", False),
        "image_info": image_info,
        "source_url": image_url,
    }


# =============================================================================
# Entry Point
# =============================================================================
if __name__ == "__main__":
    logger.info(
        f"Starting Dental Diagnosis AI Service on "
        f"{config.HOST}:{config.PORT}"
    )
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        workers=config.WORKERS,
        reload=config.RELOAD,
        log_level="info",
    )
