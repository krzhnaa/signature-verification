import logging
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from services.verifier import SignatureVerifier


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("signature-verifier")

app = FastAPI(
    title="ML-Based Signature Verification System",
    description="Single-upload signature verification API powered by ResNet18 embeddings.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

verifier = SignatureVerifier()


@app.get("/")
async def root() -> dict:
    return {
        "message": "Signature verification API is running.",
        "verify_endpoint": "/verify/",
        "users_endpoint": "/users/",
    }


@app.get("/users/")
async def list_users() -> JSONResponse:
    try:
        users = verifier.list_available_users()
        return JSONResponse(content={"users": users})
    except HTTPException as exc:
        logger.warning("Unable to load users: %s", exc.detail)
        raise exc
    except Exception as exc:
        logger.exception("Unexpected error while loading users")
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}") from exc


@app.post("/verify/")
async def verify_signature(
    file: Annotated[UploadFile, File(...)],
    user: Annotated[str, Form(...)],
) -> JSONResponse:
    try:
        logger.info("Received verification request for user=%s file=%s", user, file.filename)
        payload = verifier.verify(uploaded_bytes=await file.read(), filename=file.filename, user=user)
        logger.info(
            "Verification completed for user=%s avg=%.4f max=%.4f result=%s",
            user,
            payload["average_similarity"],
            payload["max_similarity"],
            payload["result"],
        )
        return JSONResponse(content=payload)
    except HTTPException as exc:
        logger.warning("Request failed: %s", exc.detail)
        raise exc
    except Exception as exc:
        logger.exception("Unexpected error during signature verification")
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}") from exc


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
