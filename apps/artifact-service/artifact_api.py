"""
Artifact Verification API Service
Integrates IPFS verification with language-fi oracle for tokenomics
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, List
import os
import tempfile
import shutil

from ipfs_verifier import (
    IPFSVerifier,
    ProvenanceAttestationBuilder,
    ArtifactRegistry,
    create_artifact_verifier
)

app = FastAPI(title="MEMBRA Artifact Verification Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global verifier instances
ipfs_verifier, attestation_builder, artifact_registry = create_artifact_verifier(
    ipfs_gateway=os.getenv("IPFS_GATEWAY", "https://ipfs.io/ipfs/"),
    oracle_endpoint=os.getenv("ORACLE_ENDPOINT", "http://localhost:8000")
)


class ArtifactUploadRequest(BaseModel):
    creator_wallet: str
    metadata: Optional[Dict] = None


class AttestationVerificationRequest(BaseModel):
    attestation_id: str


class ArtifactVerificationResponse(BaseModel):
    attestation_id: str
    ipfs_cid: str
    content_hash: str
    verification_status: str
    oracle_signature: Optional[str] = None
    artifact_type: str
    size_bytes: int
    created_at: float


@app.get("/")
async def root():
    return {
        "service": "MEMBRA Artifact Verification",
        "version": "1.0.0",
        "status": "active"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/artifacts/upload", response_model=ArtifactVerificationResponse)
async def upload_artifact(
    file: UploadFile = File(...),
    creator_wallet: str = None,
    metadata: str = None
):
    """
    Upload audio/video artifact, create IPFS CID, and generate provenance attestation
    """
    if not creator_wallet:
        raise HTTPException(status_code=400, detail="creator_wallet is required")
    
    # Validate file type
    allowed_extensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.mp4', '.avi', '.mov', '.mkv', '.webm']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {allowed_extensions}"
        )
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_file_path = tmp_file.name
    
    try:
        # Parse metadata if provided
        metadata_dict = {}
        if metadata:
            import json
            try:
                metadata_dict = json.loads(metadata)
            except json.JSONDecodeError:
                pass
        
        # Create attestation
        attestation = attestation_builder.create_artifact_attestation(
            tmp_file_path,
            creator_wallet=creator_wallet,
            metadata=metadata_dict
        )
        
        # Register in registry
        attestation_id = artifact_registry.register_artifact(attestation)
        
        return ArtifactVerificationResponse(
            attestation_id=attestation_id,
            ipfs_cid=attestation['ipfs_cid'],
            content_hash=attestation['content_hash'],
            verification_status=attestation['verification_status'],
            oracle_signature=attestation.get('oracle_signature'),
            artifact_type=attestation['artifact_type'],
            size_bytes=attestation['size_bytes'],
            created_at=attestation['created_at']
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)


@app.get("/api/artifacts/{attestation_id}")
async def get_artifact(attestation_id: str):
    """Retrieve artifact attestation by ID"""
    attestation = artifact_registry.get_attestation(attestation_id)
    
    if not attestation:
        raise HTTPException(status_code=404, detail="Attestation not found")
    
    return attestation


@app.post("/api/artifacts/{attestation_id}/verify")
async def verify_artifact(attestation_id: str):
    """Verify artifact attestation"""
    attestation = artifact_registry.get_attestation(attestation_id)
    
    if not attestation:
        raise HTTPException(status_code=404, detail="Attestation not found")
    
    is_valid = attestation_builder.verify_artifact_attestation(attestation)
    
    return {
        "attestation_id": attestation_id,
        "is_valid": is_valid,
        "verification_status": "verified" if is_valid else "failed"
    }


@app.get("/api/artifacts")
async def list_artifacts(
    artifact_type: Optional[str] = None,
    creator_wallet: Optional[str] = None,
    limit: int = 50
):
    """List artifact attestations with optional filters"""
    attestations = list(artifact_registry.attestations.values())
    
    # Apply filters
    if artifact_type:
        attestations = [a for a in attestations if a['artifact_type'] == artifact_type]
    
    if creator_wallet:
        attestations = [a for a in attestations if a['creator_wallet'] == creator_wallet]
    
    # Apply limit
    attestations = attestations[:limit]
    
    return {
        "count": len(attestations),
        "artifacts": attestations
    }


@app.post("/api/artifacts/check-uniqueness")
async def check_artifact_uniqueness(file: UploadFile = File(...)):
    """Check if artifact is unique (not already registered)"""
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_file_path = tmp_file.name
    
    try:
        is_unique = artifact_registry.verify_artifact_uniqueness(tmp_file_path)
        
        return {
            "is_unique": is_unique,
            "message": "Artifact is unique" if is_unique else "Duplicate artifact detected"
        }
    finally:
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)


@app.get("/api/artifacts/ipfs/{cid}")
async def get_ipfs_content(cid: str):
    """Retrieve content from IPFS by CID"""
    try:
        content = ipfs_verifier.retrieve_from_ipfs(cid)
        
        return {
            "cid": cid,
            "size_bytes": len(content),
            "content_type": "application/octet-stream"
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"IPFS retrieval failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        log_level="info"
    )