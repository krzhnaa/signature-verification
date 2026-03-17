from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from fastapi import HTTPException
from PIL import Image


ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".webp"}
CANVAS_SIZE = 128
PADDING = 18


def _validate_extension(filename: str | None) -> None:
    if not filename:
        return

    extension = filename.lower().rsplit(".", maxsplit=1)
    ext = f".{extension[-1]}" if len(extension) == 2 else ""
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload an image file.")


def _load_pil_image_from_bytes(file_bytes: bytes, filename: str | None) -> Image.Image:
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    _validate_extension(filename)

    try:
        with Image.open(BytesIO(file_bytes)) as image:
            return image.convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image file.") from exc


def _load_pil_image_from_path(path: str | Path) -> Image.Image:
    file_path = Path(path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Dataset image not found: {file_path.name}")

    _validate_extension(file_path.name)

    try:
        with Image.open(file_path) as image:
            return image.convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid dataset image: {file_path.name}") from exc


def _create_signature_mask(gray_array: np.ndarray) -> np.ndarray:
    normalized = cv2.normalize(gray_array, None, 0, 255, cv2.NORM_MINMAX)
    blurred = cv2.GaussianBlur(normalized, (5, 5), 0)

    _, binary_inv = cv2.threshold(
        blurred,
        0,
        255,
        cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU,
    )

    foreground_ratio = float(np.count_nonzero(binary_inv)) / float(binary_inv.size)
    if foreground_ratio > 0.55:
        _, binary = cv2.threshold(
            blurred,
            0,
            255,
            cv2.THRESH_BINARY + cv2.THRESH_OTSU,
        )
        binary_inv = 255 - binary

    kernel = np.ones((3, 3), np.uint8)
    opened = cv2.morphologyEx(binary_inv, cv2.MORPH_OPEN, kernel, iterations=1)
    cleaned = cv2.dilate(opened, kernel, iterations=1)
    return cleaned


def _center_signature(mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    points = cv2.findNonZero(mask)
    if points is None:
        raise HTTPException(status_code=400, detail="No visible signature strokes were detected.")

    x, y, w, h = cv2.boundingRect(points)
    cropped = mask[y : y + h, x : x + w]

    max_dim = max(h, w)
    if max_dim <= 0:
        raise HTTPException(status_code=400, detail="Unable to isolate signature strokes.")

    target = CANVAS_SIZE - (PADDING * 2)
    scale = target / max_dim
    resized_w = max(1, int(round(w * scale)))
    resized_h = max(1, int(round(h * scale)))
    resized = cv2.resize(cropped, (resized_w, resized_h), interpolation=cv2.INTER_AREA)

    centered_mask = np.zeros((CANVAS_SIZE, CANVAS_SIZE), dtype=np.uint8)
    x_offset = (CANVAS_SIZE - resized_w) // 2
    y_offset = (CANVAS_SIZE - resized_h) // 2
    centered_mask[y_offset : y_offset + resized_h, x_offset : x_offset + resized_w] = resized

    # White paper background with dark strokes for stable lightweight comparisons.
    signature_image = np.full((CANVAS_SIZE, CANVAS_SIZE), 255, dtype=np.uint8)
    signature_image[centered_mask > 0] = 0
    aspect_ratio = float(w) / float(max(h, 1))
    return centered_mask, signature_image, aspect_ratio


def _projection_features(mask: np.ndarray, bins: int = 32) -> np.ndarray:
    rows = (mask > 0).sum(axis=1).astype(np.float32)
    cols = (mask > 0).sum(axis=0).astype(np.float32)

    row_chunks = np.array_split(rows, bins)
    col_chunks = np.array_split(cols, bins)
    row_profile = np.array([chunk.mean() for chunk in row_chunks], dtype=np.float32)
    col_profile = np.array([chunk.mean() for chunk in col_chunks], dtype=np.float32)

    feature = np.concatenate([row_profile, col_profile])
    norm = np.linalg.norm(feature)
    if norm > 0:
        feature = feature / norm
    return feature


def _hu_moments(mask: np.ndarray) -> np.ndarray:
    moments = cv2.moments(mask)
    hu = cv2.HuMoments(moments).flatten()
    hu = np.sign(hu) * np.log1p(np.abs(hu))
    return hu.astype(np.float32)


def _build_signature_sample(pil_image: Image.Image) -> dict[str, np.ndarray | Image.Image]:
    gray_array = np.array(pil_image.convert("L"))
    signature_mask = _create_signature_mask(gray_array)
    centered_mask, signature_image, aspect_ratio = _center_signature(signature_mask)

    processed_image = Image.fromarray(signature_image)

    return {
        "image": processed_image,
        "mask": centered_mask,
        "ink_ratio": float(np.count_nonzero(centered_mask)) / float(centered_mask.size),
        "aspect_ratio": aspect_ratio,
        "projection": _projection_features(centered_mask),
        "hu_moments": _hu_moments(centered_mask),
    }


def load_signature_sample_from_bytes(file_bytes: bytes, filename: str | None = None) -> dict:
    pil_image = _load_pil_image_from_bytes(file_bytes, filename)
    return _build_signature_sample(pil_image)


def load_signature_sample_from_path(path: str | Path) -> dict:
    pil_image = _load_pil_image_from_path(path)
    return _build_signature_sample(pil_image)
