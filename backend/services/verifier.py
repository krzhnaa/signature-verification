import logging
from pathlib import Path

import numpy as np
from fastapi import HTTPException

from model.embedding import SignatureEmbeddingModel
from utils.image_processing import (
    ALLOWED_EXTENSIONS,
    load_signature_sample_from_bytes,
    load_signature_sample_from_path,
)


logger = logging.getLogger("signature-verifier.verifier")


class SignatureVerifier:
    """Compares an uploaded signature against a user's stored signature style."""

    def __init__(self, dataset_dir: str | None = None) -> None:
        self.dataset_dir = Path(dataset_dir or Path(__file__).resolve().parents[1] / "dataset")
        self.embedding_model = SignatureEmbeddingModel()

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
        references = self._load_reference_profiles(reference_files)
        uploaded_profile = self._build_profile(
            filename or "uploaded_signature",
            load_signature_sample_from_bytes(uploaded_bytes, filename),
        )

        user_profile = self._build_user_profile(references)
        reference_matches = [self._compare_profiles(uploaded_profile, reference) for reference in references]

        centroid_similarity = self._compare_to_centroid(uploaded_profile, user_profile)
        reference_scores = [match["combined_similarity"] for match in reference_matches]
        average_reference_similarity = float(np.mean(reference_scores))
        max_reference_similarity = float(np.max(reference_scores))
        consistency_score = self._compute_consistency_score(reference_scores, user_profile)

        final_similarity = self._combine_final_similarity(
            centroid_similarity=centroid_similarity["style_similarity"],
            average_reference_similarity=average_reference_similarity,
            max_reference_similarity=max_reference_similarity,
            consistency_score=consistency_score,
        )

        adaptive_threshold = user_profile["acceptance_threshold"]
        result = "Genuine" if final_similarity >= adaptive_threshold else "Forged"

        logger.info(
            "Verification for %s -> final=%.4f threshold=%.4f avg_ref=%.4f max_ref=%.4f consistency=%.4f",
            user_key,
            final_similarity,
            adaptive_threshold,
            average_reference_similarity,
            max_reference_similarity,
            consistency_score,
        )

        return {
            "average_similarity": round(average_reference_similarity, 4),
            "max_similarity": round(max_reference_similarity, 4),
            "all_scores": [round(score, 4) for score in reference_scores],
            "result": result,
            "details": {
                "final_similarity": round(final_similarity, 4),
                "adaptive_threshold": round(adaptive_threshold, 4),
                "scoring": "user-style aware: centroid style + average reference match + best reference match + consistency",
                "centroid_similarity": {
                    "embedding_similarity": round(centroid_similarity["embedding_similarity"], 4),
                    "projection_similarity": round(centroid_similarity["projection_similarity"], 4),
                    "shape_similarity": round(centroid_similarity["shape_similarity"], 4),
                    "density_similarity": round(centroid_similarity["density_similarity"], 4),
                    "aspect_similarity": round(centroid_similarity["aspect_similarity"], 4),
                    "style_similarity": round(centroid_similarity["style_similarity"], 4),
                },
                "user_profile": {
                    "intra_user_average": round(user_profile["intra_user_average"], 4),
                    "intra_user_minimum": round(user_profile["intra_user_minimum"], 4),
                    "reference_count": len(references),
                },
                "thresholds": {
                    "accept_if_final_similarity_above": round(adaptive_threshold, 4),
                },
                "references": [
                    {
                        "reference_file": match["reference_file"],
                        "embedding_similarity": round(match["embedding_similarity"], 4),
                        "projection_similarity": round(match["projection_similarity"], 4),
                        "shape_similarity": round(match["shape_similarity"], 4),
                        "density_similarity": round(match["density_similarity"], 4),
                        "aspect_similarity": round(match["aspect_similarity"], 4),
                        "combined_similarity": round(match["combined_similarity"], 4),
                    }
                    for match in reference_matches
                ],
            },
        }

    def _get_reference_files(self, user_key: str, original_user: str) -> list[Path]:
        user_dir = self.dataset_dir / user_key
        if not user_dir.exists() or not user_dir.is_dir():
            raise HTTPException(status_code=404, detail=f"User '{original_user}' not found in dataset.")

        reference_files = sorted([path for path in user_dir.iterdir() if self._is_supported_image(path)])
        if not reference_files:
            raise HTTPException(status_code=404, detail=f"No signatures found for user '{original_user}'.")

        return reference_files

    def _load_reference_profiles(self, reference_files: list[Path]) -> list[dict]:
        profiles = []
        for reference_file in reference_files:
            sample = load_signature_sample_from_path(reference_file)
            profiles.append(self._build_profile(reference_file.name, sample))
        return profiles

    def _build_profile(self, name: str, sample: dict) -> dict:
        embedding = self.embedding_model.get_embedding(sample["tensor"]).reshape(-1)
        return {
            "name": name,
            "embedding": embedding,
            "projection": sample["projection"],
            "hu_moments": sample["hu_moments"],
            "ink_ratio": float(sample["ink_ratio"]),
            "aspect_ratio": float(sample["aspect_ratio"]),
        }

    def _build_user_profile(self, references: list[dict]) -> dict:
        embeddings = np.stack([reference["embedding"] for reference in references], axis=0)
        projections = np.stack([reference["projection"] for reference in references], axis=0)
        hu_moments = np.stack([reference["hu_moments"] for reference in references], axis=0)
        ink_ratios = np.array([reference["ink_ratio"] for reference in references], dtype=np.float32)
        aspect_ratios = np.array([reference["aspect_ratio"] for reference in references], dtype=np.float32)

        centroid = {
            "embedding": embeddings.mean(axis=0),
            "projection": projections.mean(axis=0),
            "hu_moments": hu_moments.mean(axis=0),
            "ink_ratio": float(ink_ratios.mean()),
            "aspect_ratio": float(aspect_ratios.mean()),
        }

        pair_scores = []
        if len(references) > 1:
            for idx, reference_a in enumerate(references):
                for reference_b in references[idx + 1 :]:
                    pair_scores.append(self._compare_profiles(reference_a, reference_b)["combined_similarity"])
        else:
            pair_scores.append(0.82)

        intra_user_average = float(np.mean(pair_scores))
        intra_user_minimum = float(np.min(pair_scores))
        acceptance_threshold = float(
            np.clip(max(0.58, intra_user_average - 0.12, intra_user_minimum - 0.05), 0.58, 0.9)
        )

        return {
            "centroid": centroid,
            "intra_user_average": intra_user_average,
            "intra_user_minimum": intra_user_minimum,
            "acceptance_threshold": acceptance_threshold,
        }

    def _compare_to_centroid(self, uploaded_profile: dict, user_profile: dict) -> dict:
        centroid = user_profile["centroid"]
        embedding_similarity = self._cosine_similarity(uploaded_profile["embedding"], centroid["embedding"])
        projection_similarity = self._cosine_similarity(uploaded_profile["projection"], centroid["projection"])
        shape_similarity = self._shape_similarity(uploaded_profile["hu_moments"], centroid["hu_moments"])
        density_similarity = self._ratio_similarity(uploaded_profile["ink_ratio"], centroid["ink_ratio"])
        aspect_similarity = self._ratio_similarity(uploaded_profile["aspect_ratio"], centroid["aspect_ratio"])

        style_similarity = float(
            np.clip(
                (0.38 * embedding_similarity)
                + (0.26 * projection_similarity)
                + (0.18 * shape_similarity)
                + (0.10 * density_similarity)
                + (0.08 * aspect_similarity),
                0.0,
                1.0,
            )
        )

        return {
            "embedding_similarity": embedding_similarity,
            "projection_similarity": projection_similarity,
            "shape_similarity": shape_similarity,
            "density_similarity": density_similarity,
            "aspect_similarity": aspect_similarity,
            "style_similarity": style_similarity,
        }

    def _compare_profiles(self, profile_a: dict, profile_b: dict) -> dict:
        embedding_similarity = self._cosine_similarity(profile_a["embedding"], profile_b["embedding"])
        projection_similarity = self._cosine_similarity(profile_a["projection"], profile_b["projection"])
        shape_similarity = self._shape_similarity(profile_a["hu_moments"], profile_b["hu_moments"])
        density_similarity = self._ratio_similarity(profile_a["ink_ratio"], profile_b["ink_ratio"])
        aspect_similarity = self._ratio_similarity(profile_a["aspect_ratio"], profile_b["aspect_ratio"])

        combined_similarity = float(
            np.clip(
                (0.36 * embedding_similarity)
                + (0.28 * projection_similarity)
                + (0.18 * shape_similarity)
                + (0.10 * density_similarity)
                + (0.08 * aspect_similarity),
                0.0,
                1.0,
            )
        )

        return {
            "reference_file": profile_b["name"],
            "embedding_similarity": embedding_similarity,
            "projection_similarity": projection_similarity,
            "shape_similarity": shape_similarity,
            "density_similarity": density_similarity,
            "aspect_similarity": aspect_similarity,
            "combined_similarity": combined_similarity,
        }

    def _compute_consistency_score(self, reference_scores: list[float], user_profile: dict) -> float:
        average_score = float(np.mean(reference_scores))
        minimum_expected = user_profile["intra_user_minimum"]
        average_expected = user_profile["intra_user_average"]
        midpoint = (minimum_expected + average_expected) / 2.0
        return float(np.clip((average_score - (midpoint - 0.10)) / 0.30, 0.0, 1.0))

    def _combine_final_similarity(
        self,
        centroid_similarity: float,
        average_reference_similarity: float,
        max_reference_similarity: float,
        consistency_score: float,
    ) -> float:
        return float(
            np.clip(
                (0.35 * centroid_similarity)
                + (0.30 * average_reference_similarity)
                + (0.20 * max_reference_similarity)
                + (0.15 * consistency_score),
                0.0,
                1.0,
            )
        )

    def _cosine_similarity(self, vector_a: np.ndarray, vector_b: np.ndarray) -> float:
        norm_a = np.linalg.norm(vector_a)
        norm_b = np.linalg.norm(vector_b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.clip(np.dot(vector_a, vector_b) / (norm_a * norm_b), 0.0, 1.0))

    def _shape_similarity(self, hu_a: np.ndarray, hu_b: np.ndarray) -> float:
        distance = float(np.linalg.norm(hu_a - hu_b))
        return float(np.clip(1.0 / (1.0 + (0.85 * distance)), 0.0, 1.0))

    def _ratio_similarity(self, value_a: float, value_b: float) -> float:
        base = max(abs(value_a), abs(value_b), 1e-6)
        return float(np.clip(1.0 - (abs(value_a - value_b) / base), 0.0, 1.0))

    def _is_supported_image(self, path: Path) -> bool:
        return path.is_file() and path.suffix.lower() in ALLOWED_EXTENSIONS
