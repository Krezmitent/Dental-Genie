# =============================================================================
# services/detector.py
# YOLOv5 dental condition detection engine.
# Handles model loading, inference, and result formatting.
# Includes a demo mode fallback when model weights are not available.
# =============================================================================

import random
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

import numpy as np
from loguru import logger

import config


class DentalDetector:
    """
    Encapsulates the YOLOv5 dental condition detection pipeline.
    Loads the model once at startup and provides a predict() method
    for running inference on OpenCV image arrays.

    Falls back to demo mode if model weights are not found, generating
    synthetic predictions for frontend/backend integration testing.
    """

    def __init__(self):
        self.model = None
        self.is_demo_mode = False
        self.model_path = config.MODEL_PATH
        self.confidence_threshold = config.CONFIDENCE_THRESHOLD
        self.iou_threshold = config.IOU_THRESHOLD
        self.inference_size = config.INFERENCE_IMAGE_SIZE
        self.class_labels = config.CLASS_LABELS
        self._load_model()

    def _load_model(self) -> None:
        """
        Attempt to load the YOLOv5 model from the configured path.
        Falls back to demo mode if loading fails.
        """
        model_file = Path(self.model_path)

        if not model_file.exists():
            logger.warning(
                f"Model weights not found at: {self.model_path}. "
                f"Starting in DEMO MODE with synthetic predictions."
            )
            self.is_demo_mode = True
            return

        try:
            logger.info(f"Loading YOLO11 model from: {self.model_path}")
            start_time = time.time()

            # Import torch and ultralytics only when actually needed
            from ultralytics import YOLO

            self.model = YOLO(self.model_path)

            load_time = (time.time() - start_time) * 1000
            logger.info(
                f"YOLO11 model loaded successfully in {load_time:.0f}ms. "
                f"Classes: {len(self.class_labels)}"
            )
            self.is_demo_mode = False

        except Exception as e:
            logger.error(
                f"Failed to load YOLO11 model: {e}. "
                f"Falling back to DEMO MODE."
            )
            self.is_demo_mode = True
            self.model = None

    def _is_likely_xray(self, image: np.ndarray) -> bool:
        import cv2
        import numpy as np
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        mean_saturation = np.mean(hsv[:, :, 1])
        logger.debug(f"Image mean saturation: {mean_saturation:.2f}")
        # X-rays are typically grayscale (mean saturation < 15-25).
        # Normal color photos usually have mean saturation > 40.
        return mean_saturation < 30.0

    def predict(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Run dental condition detection on an image.
        """
        start_time = time.time()

        try:
            if not self._is_likely_xray(image):
                processing_time_ms = (time.time() - start_time) * 1000
                return {
                    "success": False,
                    "predictions": [],
                    "processing_time_ms": round(processing_time_ms, 2),
                    "model_version": "validation",
                    "demo_mode": self.is_demo_mode,
                    "error": "The uploaded image does not appear to be a dental X-ray. Please upload a valid X-ray image for analysis."
                }

            if self.is_demo_mode:
                predictions = self._generate_demo_predictions(image)
                model_version = "demo-mode-v1"
            else:
                predictions = self._run_inference(image)
                model_version = "yolo11-panoramic-v1"

            processing_time_ms = (time.time() - start_time) * 1000

            logger.info(
                f"Detection complete: {len(predictions)} objects found "
                f"in {processing_time_ms:.1f}ms "
                f"(demo={self.is_demo_mode})"
            )

            return {
                "success": True,
                "predictions": predictions,
                "processing_time_ms": round(processing_time_ms, 2),
                "model_version": model_version,
                "demo_mode": self.is_demo_mode,
            }

        except Exception as e:
            processing_time_ms = (time.time() - start_time) * 1000
            logger.error(f"Detection failed after {processing_time_ms:.1f}ms: {e}")
            return {
                "success": False,
                "predictions": [],
                "processing_time_ms": round(processing_time_ms, 2),
                "model_version": "error",
                "demo_mode": self.is_demo_mode,
                "error": str(e),
            }

    def _run_inference(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Run actual YOLO11 inference using the loaded model.

        Args:
            image: OpenCV image array (BGR format).

        Returns:
            List of prediction dictionaries.
        """
        import torch

        # Run inference
        results = self.model(
            image,
            imgsz=self.inference_size,
            conf=self.confidence_threshold,
            iou=self.iou_threshold,
            verbose=False,
        )

        predictions = []

        for result in results:
            boxes = result.boxes
            if boxes is None or len(boxes) == 0:
                continue

            for i in range(len(boxes)):
                # Extract bounding box coordinates (xyxy format)
                box = boxes.xyxy[i].cpu().numpy()
                x1, y1, x2, y2 = box.tolist()

                # Extract confidence score
                confidence = float(boxes.conf[i].cpu().numpy())

                # Extract class index and map to label
                class_idx = int(boxes.cls[i].cpu().numpy())

                # Map class index to label name
                if class_idx < len(self.class_labels):
                    label = self.class_labels[class_idx]
                else:
                    # Fallback: use model's own class name if available
                    label = (
                        result.names.get(class_idx, f"class_{class_idx}")
                        if hasattr(result, "names")
                        else f"class_{class_idx}"
                    )

                predictions.append({
                    "label": label,
                    "confidence": round(confidence, 4),
                    "bbox": {
                        "x1": round(x1, 2),
                        "y1": round(y1, 2),
                        "x2": round(x2, 2),
                        "y2": round(y2, 2),
                    },
                })

        # Sort by confidence descending
        predictions.sort(key=lambda p: p["confidence"], reverse=True)

        logger.debug(
            f"Real inference: {len(predictions)} detections above "
            f"confidence threshold {self.confidence_threshold}"
        )

        return predictions

    def _generate_demo_predictions(
        self, image: np.ndarray
    ) -> List[Dict[str, Any]]:
        """
        Generate realistic synthetic predictions for demo/testing mode.
        Produces 1-4 random detections with plausible bounding boxes
        based on actual image dimensions.

        Args:
            image: OpenCV image array (BGR format).

        Returns:
            List of synthetic prediction dictionaries.
        """
        height, width = image.shape[:2]

        # Generate 1-4 random detections
        num_predictions = random.randint(1, 4)

        # Conditions weighted by clinical prevalence
        condition_weights = {
            "cavity": 0.25,
            "plaque": 0.20,
            "gingivitis": 0.15,
            "calculus": 0.12,
            "caries": 0.10,
            "tooth_discoloration": 0.08,
            "mouth_ulcer": 0.04,
            "periapical_lesion": 0.03,
            "hypodontia": 0.02,
            "healthy": 0.01,
        }

        conditions = list(condition_weights.keys())
        weights = list(condition_weights.values())

        # Pick distinct conditions
        selected = random.choices(conditions, weights=weights, k=num_predictions)

        predictions = []
        used_regions = []

        for label in selected:
            # Generate a non-overlapping bounding box
            for attempt in range(10):
                box_w = random.randint(int(width * 0.08), int(width * 0.25))
                box_h = random.randint(int(height * 0.08), int(height * 0.25))
                x1 = random.randint(int(width * 0.05), max(int(width * 0.05) + 1, width - box_w - int(width * 0.05)))
                y1 = random.randint(int(height * 0.05), max(int(height * 0.05) + 1, height - box_h - int(height * 0.05)))
                x2 = x1 + box_w
                y2 = y1 + box_h

                # Check for overlap with existing boxes
                overlapping = False
                for region in used_regions:
                    if (
                        x1 < region[2]
                        and x2 > region[0]
                        and y1 < region[3]
                        and y2 > region[1]
                    ):
                        overlapping = True
                        break

                if not overlapping:
                    used_regions.append((x1, y1, x2, y2))
                    break

            # Generate a realistic confidence score (0.45 - 0.98)
            confidence = round(random.uniform(0.45, 0.98), 4)

            predictions.append({
                "label": label,
                "confidence": confidence,
                "bbox": {
                    "x1": round(float(x1), 2),
                    "y1": round(float(y1), 2),
                    "x2": round(float(x2), 2),
                    "y2": round(float(y2), 2),
                },
            })

        # Sort by confidence descending
        predictions.sort(key=lambda p: p["confidence"], reverse=True)

        logger.debug(
            f"Demo predictions generated: {len(predictions)} detections "
            f"for image {width}x{height}"
        )

        return predictions

    def get_status(self) -> Dict[str, Any]:
        """
        Get the current status of the detector.

        Returns:
            Dictionary with model status information.
        """
        return {
            "model_loaded": self.model is not None,
            "demo_mode": self.is_demo_mode,
            "model_path": self.model_path,
            "confidence_threshold": self.confidence_threshold,
            "iou_threshold": self.iou_threshold,
            "inference_size": self.inference_size,
            "num_classes": len(self.class_labels),
            "class_labels": self.class_labels,
        }


# Module-level singleton — initialized once when first imported
detector_instance: Optional[DentalDetector] = None


def get_detector() -> DentalDetector:
    """
    Get or create the singleton DentalDetector instance.
    Ensures the model is loaded only once across the application.

    Returns:
        The DentalDetector singleton.
    """
    global detector_instance
    if detector_instance is None:
        logger.info("Initializing DentalDetector singleton...")
        detector_instance = DentalDetector()
    return detector_instance
