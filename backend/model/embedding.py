import logging

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics.pairwise import cosine_similarity
from torchvision import models
from torchvision.models import ResNet18_Weights


logger = logging.getLogger("signature-verifier.embedding")


class SignatureEmbeddingModel:
    """Extracts fixed-length signature embeddings with a ResNet18 backbone."""

    def __init__(self) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model()
        self.model.eval()
        logger.info("Embedding model loaded on device: %s", self.device)

    def _load_model(self) -> nn.Module:
        try:
            weights = ResNet18_Weights.DEFAULT
            model = models.resnet18(weights=weights)
            logger.info("Loaded ResNet18 with pretrained ImageNet weights.")
        except Exception as exc:
            logger.warning(
                "Could not load pretrained ResNet18 weights (%s). Falling back to random weights.",
                exc,
            )
            model = models.resnet18(weights=None)

        # Replace the classifier with an identity mapping to expose embeddings.
        model.fc = nn.Identity()
        return model.to(self.device)

    @torch.inference_mode()
    def get_embedding(self, image_tensor: torch.Tensor) -> np.ndarray:
        if image_tensor.ndim != 4:
            raise ValueError("Expected image tensor with shape [batch, channels, height, width].")

        embedding = self.model(image_tensor.to(self.device))
        return embedding.cpu().numpy()

    def compare_embeddings(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        similarity = cosine_similarity(emb1, emb2)[0][0]
        # Clamp small numeric overflow from cosine similarity.
        return float(np.clip(similarity, 0.0, 1.0))
