"""
Artifact Service API Server
FastAPI server for artifact ingestion, analysis, and oracle attestation
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import base64
from datetime import datetime

from ingestion import ArtifactIngestionService
from oracle import OracleAttestationAPI
from gating import get_gating_service

# Initialize FastAPI app
app = FastAPI(
    title="LGU Artifact Service",
    description="Proof-of-Value Artifact minting service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ingestion_service = ArtifactIngestionService()
oracle_api = OracleAttestationAPI()
gating_service = get_gating_service()


class AnalyzeRequest(BaseModel):
    """Request model for artifact analysis"""
    image_data: str  # Base64 encoded image
    wallet_address: str


class AnalyzeResponse(BaseModel):
    """Response model for artifact analysis"""
    cid: str
    confidence: float
    denomination: Optional[int]
    year: Optional[int]
    score: float
    mint_amount: float
    perceptual_hash: str
    is_duplicate: bool
    is_anomaly: bool
    attestation: dict
    timestamp: str


class WalletStatsResponse(BaseModel):
    """Response model for wallet statistics"""
    daily_mints: float
    weekly_mints: float
    daily_submissions: int
    daily_remaining: float
    weekly_remaining: float
    submissions_remaining: int


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "LGU Artifact Service",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/api/artifact/analyze", response_model=AnalyzeResponse)
async def analyze_artifact(request: AnalyzeRequest):
    """
    Analyze artifact and generate oracle attestation
    
    Args:
        request: AnalyzeRequest with base64 image and wallet address
    
    Returns:
        AnalyzeResponse with analysis results and attestation
    """
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image_data)
        
        # Check gating rules
        # First do a preliminary check (we don't know the mint amount yet)
        allowed, reason = gating_service.check_submission_allowed(
            request.wallet_address,
            0  # Will check after we know the amount
        )
        if not allowed:
            raise HTTPException(status_code=429, detail=reason)
        
        # Process artifact
        analysis = await ingestion_service.process_artifact(
            image_data,
            request.wallet_address
        )
        
        # Check gating rules with actual mint amount
        allowed, reason = gating_service.check_submission_allowed(
            request.wallet_address,
            analysis.mint_amount
        )
        if not allowed:
            raise HTTPException(status_code=429, detail=reason)
        
        # Generate oracle attestation
        attestation = oracle_api.create_attestation({
            "cid": analysis.cid,
            "score": analysis.score,
            "mint_amount": analysis.mint_amount
        })
        
        # Record submission for gating
        gating_service.record_submission(
            request.wallet_address,
            analysis.mint_amount,
            analysis.score
        )
        
        return AnalyzeResponse(
            cid=analysis.cid,
            confidence=analysis.confidence,
            denomination=analysis.denomination,
            year=analysis.year,
            score=analysis.score,
            mint_amount=analysis.mint_amount,
            perceptual_hash=analysis.perceptual_hash,
            is_duplicate=analysis.is_duplicate,
            is_anomaly=analysis.is_anomaly,
            attestation=attestation,
            timestamp=analysis.timestamp.isoformat()
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/wallet/stats", response_model=WalletStatsResponse)
async def get_wallet_stats(wallet_address: str):
    """
    Get wallet statistics
    
    Args:
        wallet_address: Ethereum wallet address
    
    Returns:
        WalletStatsResponse with usage statistics
    """
    try:
        stats = gating_service.get_wallet_stats(wallet_address)
        return WalletStatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@app.post("/api/attestation/verify")
async def verify_attestation(
    cid: str,
    score: float,
    amount: float,
    nonce: int,
    signature: str
):
    """
    Verify oracle attestation signature
    
    Args:
        cid: IPFS CID
        score: Protocol score
        amount: Mint amount
        nonce: Oracle nonce
        signature: Oracle signature
    
    Returns:
        Verification result
    """
    try:
        result = oracle_api.verify_mint_request(
            cid=cid,
            score=score,
            amount=amount,
            nonce=nonce,
            signature=signature
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@app.post("/api/admin/reset-daily")
async def reset_daily_limits():
    """
    Reset daily limits (admin endpoint, should be protected)
    In production, add authentication middleware
    """
    try:
        gating_service.reset_daily_limits()
        return {"status": "success", "message": "Daily limits reset"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")


@app.post("/api/admin/blacklist")
async def add_to_blacklist(wallet_address: str):
    """
    Add wallet to blacklist (admin endpoint, should be protected)
    In production, add authentication middleware
    """
    try:
        gating_service.add_to_blacklist(wallet_address)
        return {"status": "success", "message": f"Wallet {wallet_address} blacklisted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blacklist failed: {str(e)}")


@app.delete("/api/admin/blacklist/{wallet_address}")
async def remove_from_blacklist(wallet_address: str):
    """
    Remove wallet from blacklist (admin endpoint, should be protected)
    In production, add authentication middleware
    """
    try:
        gating_service.remove_from_blacklist(wallet_address)
        return {"status": "success", "message": f"Wallet {wallet_address} removed from blacklist"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blacklist removal failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
