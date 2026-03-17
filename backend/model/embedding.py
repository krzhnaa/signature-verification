import logging

import cv2
import numpy as np
from PIL import Image


logger = logging.getLogger("signature-verifier.embedding")

EMBEDDING_SIZE = (128, 128)


def get_embedding(image: Image.Image | np.ndarray) -> np.ndarray:
    """Build a lightweight embedding by resizing, grayscaling, normalizing, and flattening."""
    if isinstance(image, Image.Image):
        image_array = np.array(image)
    else:
        image_array = np.asarray(image)

    if image_array.size == 0:
        raise ValueError("Image data is empty.")

    if image_array.ndim == 3:
        gray_image = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    elif image_array.ndim == 2:
        gray_image = image_array
    else:
        raise ValueError("Unsupported image format for embedding extraction.")

    resized = cv2.resize(gray_image, EMBEDDING_SIZE, interpolation=cv2.INTER_AREA)
    normalized = resized.astype(np.float32) / 255.0
    return normalized.flatten()


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    vector_a = np.asarray(a, dtype=np.float32).reshape(-1)
    vector_b = np.asarray(b, dtype=np.float32).reshape(-1)

    norm_a = np.linalg.norm(vector_a)
    norm_b = np.linalg.norm(vector_b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    similarity = float(np.dot(vector_a, vector_b) / (norm_a * norm_b))
    return float(np.clip(similarity, 0.0, 1.0))


logger.info("Lightweight embedding utilities initialized without heavy ML dependencies.")
