"""
Artifact Ingestion Service
Handles image upload → IPFS CID → OCR → fraud detection → scoring → oracle attestation
"""

import os
import hashlib
from typing import Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import requests
from PIL import Image
import imagehash
import numpy as np
from collections import defaultdict

# IPFS configuration
IPFS_API_URL = os.getenv("IPFS_API_URL", "http://localhost:5001")
PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_KEY = os.getenv("PINATA_SECRET_KEY")

# OCR configuration (using Tesseract or cloud API)
USE_CLOUD_OCR = os.getenv("USE_CLOUD_OCR", "false").lower() == "true"

# Scoring weights
CONFIDENCE_WEIGHT = 0.4
RARITY_WEIGHT = 0.2
NOVELTY_WEIGHT = 0.2
DISTRIBUTION_WEIGHT = 0.2

BASE_EMISSION = 10  # Base LGU per score unit
MAX_PER_IMAGE = 1000  # Max LGU per artifact

# Per-wallet caps
DAILY_CAP = 10000  # Max LGU per wallet per day


@dataclass
class ArtifactAnalysis:
    """Result of artifact analysis"""
    cid: str
    confidence: float
    denomination: Optional[int]
    year: Optional[int]
    perceptual_hash: str
    is_duplicate: bool
    is_anomaly: bool
    score: float
    mint_amount: float
    timestamp: datetime


class ArtifactIngestionService:
    """Main service for artifact ingestion and analysis"""
    
    def __init__(self):
        self.cid_history = set()  # Track used CIDs
        self.perceptual_hashes = defaultdict(list)  # Track similar images
        self.wallet_daily_mints = defaultdict(float)  # Track per-wallet daily mints
        self.submission_history = defaultdict(list)  # Track user submissions
        
    async def process_artifact(
        self,
        image_data: bytes,
        wallet_address: str
    ) -> ArtifactAnalysis:
        """
        Process an artifact through the full pipeline:
        1. Upload to IPFS → CID
        2. OCR analysis
        3. Fraud detection
        4. Scoring
        5. Calculate mint amount
        """
        # Step 1: Upload to IPFS
        cid = await self._upload_to_ipfs(image_data)
        
        # Check CID uniqueness
        if cid in self.cid_history:
            raise ValueError("CID already used - replay attack detected")
        
        # Step 2: OCR analysis
        ocr_result = await self._analyze_ocr(image_data)
        
        # Step 3: Fraud detection
        fraud_result = await self._detect_fraud(image_data, cid, wallet_address)
        
        if fraud_result["is_duplicate"]:
            raise ValueError("Duplicate artifact detected")
        
        if fraud_result["is_anomaly"]:
            # Flag but don't necessarily reject - could be legitimate rare item
            pass
        
        # Step 4: Calculate score
        score = self._calculate_score(
            confidence=ocr_result["confidence"],
            rarity=ocr_result.get("rarity", 0.5),
            novelty=fraud_result["novelty"],
            distribution=fraud_result["distribution"]
        )
        
        # Step 5: Calculate mint amount
        mint_amount = min(MAX_PER_IMAGE, BASE_EMISSION * score)
        
        # Step 6: Check daily cap
        if not self._check_daily_cap(wallet_address, mint_amount):
            raise ValueError("Daily cap exceeded")
        
        # Record submission
        self._record_submission(cid, wallet_address, score, mint_amount)
        
        return ArtifactAnalysis(
            cid=cid,
            confidence=ocr_result["confidence"],
            denomination=ocr_result.get("denomination"),
            year=ocr_result.get("year"),
            perceptual_hash=fraud_result["perceptual_hash"],
            is_duplicate=fraud_result["is_duplicate"],
            is_anomaly=fraud_result["is_anomaly"],
            score=score,
            mint_amount=mint_amount,
            timestamp=datetime.utcnow()
        )
    
    async def _upload_to_ipfs(self, image_data: bytes) -> str:
        """Upload image to IPFS and return CID"""
        try:
            # Try Pinata first (more reliable for production)
            if PINATA_API_KEY and PINATA_SECRET_KEY:
                return await self._upload_to_pinata(image_data)
            
            # Fallback to local IPFS node
            files = {'file': image_data}
            response = requests.post(f"{IPFS_API_URL}/api/v0/add", files=files)
            response.raise_for_status()
            result = response.json()
            return result["Hash"]
        except Exception as e:
            raise RuntimeError(f"IPFS upload failed: {str(e)}")
    
    async def _upload_to_pinata(self, image_data: bytes) -> str:
        """Upload to Pinata IPFS gateway"""
        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        headers = {
            "pinata_api_key": PINATA_API_KEY,
            "pinata_secret_api_key": PINATA_SECRET_KEY
        }
        
        files = {'file': ('artifact.jpg', image_data, 'image/jpeg')}
        response = requests.post(url, files=files, headers=headers)
        response.raise_for_status()
        return response.json()["IpfsHash"]
    
    async def _analyze_ocr(self, image_data: bytes) -> Dict:
        """Analyze image with OCR to extract denomination, year, confidence"""
        try:
            if USE_CLOUD_OCR:
                return await self._cloud_ocr(image_data)
            else:
                return await self._local_ocr(image_data)
        except Exception:
            # Fallback to low confidence if OCR fails
            return {
                "confidence": 0.3,
                "denomination": None,
                "year": None,
                "rarity": 0.5
            }
    
    async def _local_ocr(self, image_data: bytes) -> Dict:
        """Local OCR using Tesseract (fallback)"""
        try:
            import pytesseract
            from io import BytesIO
            
            image = Image.open(BytesIO(image_data))
            text = pytesseract.image_to_string(image)
            
            # Extract denomination (basic pattern matching)
            denomination = self._extract_denomination(text)
            year = self._extract_year(text)
            
            # Calculate confidence based on text clarity
            confidence = self._calculate_ocr_confidence(image, text)
            
            return {
                "confidence": confidence,
                "denomination": denomination,
                "year": year,
                "rarity": self._calculate_rarity(denomination, year)
            }
        except ImportError:
            # Tesseract not available
            return {
                "confidence": 0.3,
                "denomination": None,
                "year": None,
                "rarity": 0.5
            }
        except Exception:
            # Other OCR errors
            return {
                "confidence": 0.3,
                "denomination": None,
                "year": None,
                "rarity": 0.5
            }
    
    async def _cloud_ocr(self, image_data: bytes) -> Dict:
        """Cloud OCR using Google Vision API or similar"""
        # Placeholder for cloud OCR integration
        # Would use Google Cloud Vision, AWS Textract, or Azure Computer Vision
        return {
            "confidence": 0.8,
            "denomination": 100,
            "year": 2020,
            "rarity": 0.6
        }
    
    def _extract_denomination(self, text: str) -> Optional[int]:
        """Extract denomination from OCR text"""
        import re
        patterns = [
            r'\$?(\d+)',
            r'(\d+)\s*dollars?',
            r'ONE\s*(\d+)',
            r'FIVE\s*(\d+)',
            r'TEN\s*(\d+)',
            r'TWENTY\s*(\d+)',
            r'FIFTY\s*(\d+)',
            r'HUNDRED\s*(\d+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    continue
        return None
    
    def _extract_year(self, text: str) -> Optional[int]:
        """Extract year from OCR text"""
        import re
        match = re.search(r'(19|20)\d{2}', text)
        if match:
            return int(match.group())
        return None
    
    def _calculate_ocr_confidence(self, image: Image.Image, text: str) -> float:
        """Calculate OCR confidence based on image quality and text output"""
        # Basic confidence calculation
        confidence = 0.5
        
        # Boost if we got meaningful text
        if len(text.strip()) > 10:
            confidence += 0.2
        
        # Boost if image is high resolution
        if image.width >= 1000 and image.height >= 1000:
            confidence += 0.1
        
        # Boost if image is clear (low blur approximation)
        try:
            img_array = np.array(image)
            if len(img_array.shape) == 3:
                variance = np.var(img_array)
                if variance > 1000:  # Good contrast
                    confidence += 0.1
        except Exception:
            pass
        
        return min(confidence, 1.0)
    
    def _calculate_rarity(self, denomination: Optional[int], year: Optional[int]) -> float:
        """Calculate rarity score based on denomination and year"""
        rarity = 0.5  # Base rarity
        
        # Older years are rarer
        if year and year < 2000:
            rarity += 0.2
        elif year and year < 2010:
            rarity += 0.1
        
        # Higher denominations are rarer
        if denomination and denomination >= 100:
            rarity += 0.2
        elif denomination and denomination >= 50:
            rarity += 0.1
        
        return min(rarity, 1.0)
    
    async def _detect_fraud(
        self,
        image_data: bytes,
        cid: str,
        wallet_address: str
    ) -> Dict:
        """
        Detect fraud using:
        - Perceptual hashing (duplicate detection)
        - Distribution analysis (farming detection)
        - Anomaly detection
        """
        # Calculate perceptual hash
        perceptual_hash = self._calculate_perceptual_hash(image_data)
        
        # Check for duplicates
        is_duplicate = self._check_duplicate(perceptual_hash)
        
        # Calculate novelty (how recently have we seen similar images)
        novelty = self._calculate_novelty(perceptual_hash, wallet_address)
        
        # Calculate distribution (is this user dominating submissions?)
        distribution = self._calculate_distribution(wallet_address)
        
        # Check for anomalies
        is_anomaly = self._detect_anomaly(image_data)
        
        return {
            "perceptual_hash": perceptual_hash,
            "is_duplicate": is_duplicate,
            "novelty": novelty,
            "distribution": distribution,
            "is_anomaly": is_anomaly
        }
    
    def _calculate_perceptual_hash(self, image_data: bytes) -> str:
        """Calculate perceptual hash for duplicate detection"""
        try:
            from io import BytesIO
            image = Image.open(BytesIO(image_data))
            # Use multiple hash types for robustness
            ahash = str(imagehash.average_hash(image))
            phash = str(imagehash.phash(image))
            dhash = str(imagehash.dhash(image))
            return f"{ahash}:{phash}:{dhash}"
        except Exception:
            # Fallback to simple hash
            return hashlib.sha256(image_data).hexdigest()
    
    def _check_duplicate(self, perceptual_hash: str) -> bool:
        """Check if this image is a duplicate of existing submissions"""
        # Check exact match
        if perceptual_hash in self.perceptual_hashes:
            return True
        
        # Check for similar hashes (hamming distance)
        for existing_hash in self.perceptual_hashes:
            if self._hash_similarity(perceptual_hash, existing_hash) > 0.9:
                return True
        
        return False
    
    def _hash_similarity(self, hash1: str, hash2: str) -> float:
        """Calculate similarity between two perceptual hashes"""
        # Simple implementation - can be enhanced with proper hamming distance
        return 1.0 if hash1 == hash2 else 0.0
    
    def _calculate_novelty(self, perceptual_hash: str, wallet_address: str) -> float:
        """Calculate novelty score - newer/unique images get higher scores"""
        novelty = 1.0  # Base novelty
        
        # Check if user has submitted similar images recently
        user_history = self.submission_history.get(wallet_address, [])
        recent_hashes = [h["hash"] for h in user_history if h["timestamp"] > datetime.utcnow() - timedelta(hours=24)]
        
        if perceptual_hash in recent_hashes:
            novelty -= 0.3  # Penalty for recent similar submissions
        
        return max(novelty, 0.0)
    
    def _calculate_distribution(self, wallet_address: str) -> float:
        """Calculate distribution score - prevent farming by single users"""
        user_history = self.submission_history.get(wallet_address, [])
        
        # Check if user is submitting too frequently
        recent_count = len([h for h in user_history if h["timestamp"] > datetime.utcnow() - timedelta(hours=24)])
        
        if recent_count > 10:
            return 0.3  # Low distribution score for heavy submitters
        elif recent_count > 5:
            return 0.6
        else:
            return 1.0
    
    def _detect_anomaly(self, image_data: bytes) -> bool:
        """Detect anomalous images that might be manipulated"""
        try:
            from io import BytesIO
            image = Image.open(BytesIO(image_data))
            
            # Check for basic anomalies
            # 1. Extremely small or large images
            if image.width < 100 or image.height < 100:
                return True
            if image.width > 10000 or image.height > 10000:
                return True
            
            # 2. Unusual aspect ratios
            aspect_ratio = image.width / image.height
            if aspect_ratio < 0.1 or aspect_ratio > 10:
                return True
            
            return False
        except Exception:
            return True  # Treat errors as anomalies
    
    def _calculate_score(
        self,
        confidence: float,
        rarity: float,
        novelty: float,
        distribution: float
    ) -> float:
        """
        Calculate protocol score using weighted formula:
        score = 0.4 * confidence + 0.2 * rarity + 0.2 * novelty + 0.2 * distribution
        """
        score = (
            CONFIDENCE_WEIGHT * confidence +
            RARITY_WEIGHT * rarity +
            NOVELTY_WEIGHT * novelty +
            DISTRIBUTION_WEIGHT * distribution
        )
        
        # Scale to 0-100 range
        return score * 100
    
    def _check_daily_cap(self, wallet_address: str, mint_amount: float) -> bool:
        """Check if wallet has exceeded daily mint cap"""
        today = datetime.utcnow().date()
        key = f"{wallet_address}:{today}"
        
        daily_total = self.wallet_daily_mints.get(key, 0)
        return daily_total + mint_amount <= DAILY_CAP
    
    def _record_submission(
        self,
        cid: str,
        wallet_address: str,
        score: float,
        mint_amount: float
    ):
        """Record submission for tracking"""
        # Mark CID as used
        self.cid_history.add(cid)
        
        # Update daily mint total
        today = datetime.utcnow().date()
        key = f"{wallet_address}:{today}"
        self.wallet_daily_mints[key] = self.wallet_daily_mints.get(key, 0) + mint_amount
        
        # Record in submission history
        self.submission_history[wallet_address].append({
            "cid": cid,
            "score": score,
            "amount": mint_amount,
            "timestamp": datetime.utcnow()
        })
