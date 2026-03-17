import logging
from pathlib import Path

import numpy as np
from fastapi import HTTPException

from model.embedding import cosine_similarity, get_embedding
from utils.image_processing import (
    ALLOWED_EXTENSIONS,
    load_signature_sample_from_bytes,
    load_signature_sample_from_path,
)


logger = logging.getLogger("signature-verifier.verifier")


class SignatureVerifier:
    """Lightweight signature verification optimized for low-memory deployment."""

    def __init__(self, dataset_dir: str | None = None) -> None:
        self.dataset_dir = Path(dataset_dir or Path(__file__).resolve().parents[1] / "dataset")

    def list_available_users(self) -> list[str]:
        if not self.dataset_dir.exists():
            raise HTTPException(status_code=500, detail="Dataset directory does not exist.")

        users = sorted(
            [
                path.name
                for path in self.dataset_dir.iterdir()
                if path.is_dir() and any(self._is_supported_image(file) for file in path.iterdir())
            ]
        )

        if not users:
            raise HTTPException(status_code=404, detail="No users found in dataset.")

        return users

    def verify(self, uploaded_bytes: bytes, filename: str | None, user: str) -> dict:
        user_key = user.strip().lower()
        if not user_key:
            raise HTTPException(status_code=400, detail="User is required.")

        reference_files = self._get_reference_files(user_key, user)
        uploaded_sample = load_signature_sample_from_bytes(uploaded_bytes, filename)
        uploaded_embedding = get_embedding(uploaded_sample["image"])

        scores: list[float] = []
        reference_details: list[dict] = []

        for reference_file in reference_files:
            reference_sample = load_signature_sample_from_path(reference_file)
            reference_embedding = get_embedding(reference_sample["image"])
            similarity = cosine_similarity(uploaded_embedding, reference_embedding)
            scores.append(similarity)
            reference_details.append(
                {
                    "reference_file": reference_file.name,
                    "embedding_similarity": round(similarity, 4),
                }
            )

        if not scores:
            raise HTTPException(status_code=404, detail=f"No signatures found for user '{user}'.")

        average_similarity = float(np.mean(scores))
        max_similarity = float(np.max(scores))
        result = "Genuine" if (average_similarity > 0.75 or max_similarity > 0.80) else "Forged"

        logger.info(
            "Verification for %s -> avg=%.4f max=%.4f result=%s refs=%d",
            user_key,
            average_similarity,
            max_similarity,
            result,
            len(scores),
        )

        return {
            "average_similarity": round(average_similarity, 4),
            "max_similarity": round(max_similarity, 4),
            "all_scores": [round(score, 4) for score in scores],
            "result": result,
            "details": {
                "final_similarity": round(max_similarity, 4),
                "adaptive_threshold": 0.8,
                "scoring": (
                    "Lightweight feature extraction with centered grayscale signatures, "
                    "normalized pixel embeddings, and cosine similarity."
                ),
                "user_profile": {
                    "reference_count": len(reference_files),
                },
                "references": reference_details,
            },
        }

    def _get_reference_files(self, user_key: str, original_user: str) -> list[Path]:
        user_dir = self.dataset_dir / user_key
        if not user_dir.exists() or not user_dir.is_dir():
            raise HTTPException(status_code=404, detail=f"User '{original_user}' not found in dataset.")

        reference_files = sorted(path for path in user_dir.iterdir() if self._is_supported_image(path))
        if not reference_files:
            raise HTTPException(status_code=404, detail=f"No signatures found for user '{original_user}'.")

        return reference_files

    def _is_supported_image(self, path: Path) -> bool:
        return path.is_file() and path.suffix.lower() in ALLOWED_EXTENSIONS
