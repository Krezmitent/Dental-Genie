# =============================================================================
# utils/image_processing.py
# Image loading, validation, and preprocessing utilities for the AI service.
# Handles raw bytes → OpenCV array conversion with safety checks.
# =============================================================================

import io
from pathlib import Path
from typing import Tuple, Optional

import cv2
import numpy as np
from PIL import Image
from loguru import logger

import config


def validate_file_extension(filename: str) -> bool:
    """
    Check if the uploaded file has an allowed image extension.

    Args:
        filename: Original filename from the upload.

    Returns:
        True if the extension is allowed, False otherwise.
    """
    if not filename:
        return False
    ext = Path(filename).suffix.lower()
    is_valid = ext in config.ALLOWED_EXTENSIONS
    if not is_valid:
        logger.warning(f"Rejected file with extension: {ext} (file: {filename})")
    return is_valid


def validate_content_type(content_type: str) -> bool:
    """
    Check if the uploaded file has an allowed MIME type.

    Args:
        content_type: MIME type from the upload headers.

    Returns:
        True if the MIME type is allowed, False otherwise.
    """
    if not content_type:
        return False
    is_valid = content_type.lower() in config.ALLOWED_MIME_TYPES
    if not is_valid:
        logger.warning(f"Rejected file with content type: {content_type}")
    return is_valid


def validate_file_size(file_bytes: bytes) -> bool:
    """
    Check if the file size is within the allowed limit.

    Args:
        file_bytes: Raw file content bytes.

    Returns:
        True if within limit, False otherwise.
    """
    size = len(file_bytes)
    is_valid = size <= config.MAX_UPLOAD_SIZE_BYTES
    if not is_valid:
        logger.warning(
            f"Rejected file: size {size / (1024 * 1024):.2f} MB "
            f"exceeds limit of {config.MAX_UPLOAD_SIZE_MB} MB"
        )
    return is_valid


def bytes_to_cv2_image(file_bytes: bytes) -> Optional[np.ndarray]:
    """
    Convert raw file bytes to an OpenCV BGR image array.
    Uses PIL as an intermediate for broader format support, then converts
    to OpenCV's BGR format for compatibility with the detection pipeline.

    Args:
        file_bytes: Raw image file content.

    Returns:
        OpenCV image array (BGR) or None if conversion fails.
    """
    try:
        # Method 1: Use PIL for robust format handling
        pil_image = Image.open(io.BytesIO(file_bytes))

        # Convert to RGB if necessary (handles RGBA, P, L, CMYK, etc.)
        if pil_image.mode == "RGBA":
            # Create a white background for transparent images
            background = Image.new("RGB", pil_image.size, (255, 255, 255))
            background.paste(pil_image, mask=pil_image.split()[3])
            pil_image = background
        elif pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")

        # Convert PIL → NumPy → OpenCV BGR
        rgb_array = np.array(pil_image)
        bgr_array = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)

        logger.debug(
            f"Image converted successfully: "
            f"shape={bgr_array.shape}, dtype={bgr_array.dtype}"
        )
        return bgr_array

    except Exception as e:
        logger.error(f"Failed to convert bytes to CV2 image: {e}")

        # Method 2: Fallback to direct OpenCV decoding
        try:
            np_arr = np.frombuffer(file_bytes, dtype=np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if img is not None:
                logger.debug(
                    f"Fallback CV2 decode succeeded: shape={img.shape}"
                )
                return img
        except Exception as fallback_error:
            logger.error(f"Fallback CV2 decode also failed: {fallback_error}")

        return None


def resize_image(
    image: np.ndarray,
    max_size: int = None,
) -> Tuple[np.ndarray, float]:
    """
    Resize an image if it exceeds the maximum dimension, preserving aspect ratio.

    Args:
        image: OpenCV image array (BGR).
        max_size: Maximum dimension (width or height). Defaults to config value.

    Returns:
        Tuple of (resized_image, scale_factor).
        scale_factor is 1.0 if no resizing was needed.
    """
    if max_size is None:
        max_size = config.MAX_IMAGE_SIZE

    height, width = image.shape[:2]
    max_dim = max(height, width)

    if max_dim <= max_size:
        return image, 1.0

    scale = max_size / max_dim
    new_width = int(width * scale)
    new_height = int(height * scale)

    resized = cv2.resize(
        image,
        (new_width, new_height),
        interpolation=cv2.INTER_AREA,  # Best for downscaling
    )

    logger.debug(
        f"Image resized: ({width}x{height}) → ({new_width}x{new_height}), "
        f"scale={scale:.4f}"
    )
    return resized, scale


def get_image_info(image: np.ndarray) -> dict:
    """
    Extract metadata from an OpenCV image array.

    Args:
        image: OpenCV image array.

    Returns:
        Dictionary with image metadata.
    """
    height, width = image.shape[:2]
    channels = image.shape[2] if len(image.shape) == 3 else 1

    return {
        "width": width,
        "height": height,
        "channels": channels,
        "dtype": str(image.dtype),
        "size_bytes": image.nbytes,
    }
