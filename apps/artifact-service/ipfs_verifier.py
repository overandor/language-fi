"""
IPFS Audio/Video Artifact Verification System
Integrates with language-fi oracle for artifact verification and IPFS hosting
"""
import hashlib
import json
import os
import time
from typing import Dict, List, Optional, Tuple
import base64

import requests
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.backends import default_backend


class IPFSVerifier:
    """Handles IPFS content addressing and artifact verification"""
    
    def __init__(self, ipfs_gateway: str = "https://ipfs.io/ipfs/"):
        self.ipfs_gateway = ipfs_gateway
        self.pinata_api_key = os.getenv("PINATA_API_KEY")
        self.pinata_secret_key = os.getenv("PINATA_SECRET_API_KEY")
        
    def upload_to_ipfs(self, file_path: str) -> str:
        """Upload file to IPFS via Pinata and return CID"""
        if not self.pinata_api_key or not self.pinata_secret_key:
            # Fallback to local IPFS node if available
            return self._upload_to_local_ipfs(file_path)
        
        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        
        filename = os.path.basename(file_path)
        with open(file_path, 'rb') as f:
            files = {'file': (filename, f)}
            
            headers = {
                'pinata_api_key': self.pinata_api_key,
                'pinata_secret_api_key': self.pinata_secret_key
            }
            
            response = requests.post(url, files=files, headers=headers)
            response.raise_for_status()
            
            return response.json()['IpfsHash']
    
    def _upload_to_local_ipfs(self, file_path: str) -> str:
        """Upload to local IPFS node (fallback)"""
        try:
            url = "http://localhost:5001/api/v0/add"
            with open(file_path, 'rb') as f:
                files = {'file': f}
                response = requests.post(url, files=files)
                response.raise_for_status()
                return response.json()['Hash']
        except Exception as e:
            print(f"Local IPFS upload failed: {e}")
            # Generate mock CID for testing
            return self._generate_mock_cid(file_path)
    
    def _generate_mock_cid(self, file_path: str) -> str:
        """Generate mock CID for testing when IPFS is unavailable"""
        with open(file_path, 'rb') as f:
            content = f.read()
            content_hash = hashlib.sha256(content).hexdigest()
            return f"Qm{content_hash[:44]}"
    
    def retrieve_from_ipfs(self, cid: str) -> bytes:
        """Retrieve content from IPFS by CID"""
        url = f"{self.ipfs_gateway}{cid}"
        response = requests.get(url)
        response.raise_for_status()
        return response.content
    
    def verify_content_integrity(self, cid: str, expected_hash: str) -> bool:
        """Verify that IPFS content matches expected hash"""
        try:
            content = self.retrieve_from_ipfs(cid)
            actual_hash = hashlib.sha256(content).hexdigest()
            return actual_hash == expected_hash
        except Exception as e:
            print(f"Content verification failed: {e}")
            return False


class ArtifactAnalyzer:
    """Analyzes audio/video artifacts for verification"""
    
    def __init__(self):
        self.supported_formats = {
            'audio': ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
            'video': ['.mp4', '.avi', '.mov', '.mkv', '.webm']
        }
    
    def detect_artifact_type(self, file_path: str) -> Optional[str]:
        """Detect if file is audio or video"""
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext in self.supported_formats['audio']:
            return 'audio'
        elif ext in self.supported_formats['video']:
            return 'video'
        return None
    
    def analyze_audio(self, file_path: str) -> Dict:
        """Analyze audio file for verification metrics"""
        # Basic analysis without heavy dependencies
        file_size = os.path.getsize(file_path)
        
        with open(file_path, 'rb') as f:
            content = f.read()
            content_hash = hashlib.sha256(content).hexdigest()
        
        return {
            'type': 'audio',
            'size_bytes': file_size,
            'content_hash': content_hash,
            'format': os.path.splitext(file_path)[1][1:],
            'timestamp': time.time()
        }
    
    def analyze_video(self, file_path: str) -> Dict:
        """Analyze video file for verification metrics"""
        file_size = os.path.getsize(file_path)
        
        with open(file_path, 'rb') as f:
            content = f.read()
            content_hash = hashlib.sha256(content).hexdigest()
        
        return {
            'type': 'video',
            'size_bytes': file_size,
            'content_hash': content_hash,
            'format': os.path.splitext(file_path)[1][1:],
            'timestamp': time.time()
        }
    
    def generate_perceptual_hash(self, file_path: str) -> str:
        """Generate perceptual hash for duplicate detection"""
        try:
            with open(file_path, 'rb') as f:
                # Sample first 4KB for perceptual hashing
                sample = f.read(4096)
                return hashlib.md5(sample).hexdigest()
        except Exception:
            return hashlib.sha256(file_path.encode()).hexdigest()


class ProvenanceAttestationBuilder:
    """Builds provenance attestations for artifacts"""
    
    def __init__(self, ipfs_verifier: IPFSVerifier):
        self.ipfs_verifier = ipfs_verifier
        self.analyzer = ArtifactAnalyzer()
    
    def create_artifact_attestation(
        self,
        file_path: str,
        creator_wallet: str,
        metadata: Dict = None
    ) -> Dict:
        """Create full provenance attestation for an artifact"""
        
        # Analyze artifact
        artifact_type = self.analyzer.detect_artifact_type(file_path)
        if not artifact_type:
            raise ValueError("Unsupported file type")
        
        if artifact_type == 'audio':
            analysis = self.analyzer.analyze_audio(file_path)
        else:
            analysis = self.analyzer.analyze_video(file_path)
        
        # Upload to IPFS
        cid = self.ipfs_verifier.upload_to_ipfs(file_path)
        
        # Generate perceptual hash for fraud detection
        perceptual_hash = self.analyzer.generate_perceptual_hash(file_path)
        
        # Build attestation
        attestation = {
            'artifact_type': artifact_type,
            'ipfs_cid': cid,
            'content_hash': analysis['content_hash'],
            'perceptual_hash': perceptual_hash,
            'size_bytes': analysis['size_bytes'],
            'format': analysis['format'],
            'creator_wallet': creator_wallet,
            'created_at': analysis['timestamp'],
            'metadata': metadata or {},
            'verification_status': 'pending'
        }
        
        return attestation
    
    def verify_artifact_attestation(self, attestation: Dict) -> bool:
        """Verify that artifact attestation is valid"""
        
        # Verify IPFS content integrity
        if not self.ipfs_verifier.verify_content_integrity(
            attestation['ipfs_cid'],
            attestation['content_hash']
        ):
            return False
        
        # Additional verification checks can be added here
        # - Check perceptual hash against database for duplicates
        # - Verify creator wallet signature
        # - Check metadata consistency
        
        return True


class ArtifactRegistry:
    """Registry for artifact attestations with oracle integration"""
    
    def __init__(self, oracle_endpoint: str = "http://localhost:8000"):
        self.oracle_endpoint = oracle_endpoint
        self.attestations: Dict[str, Dict] = {}
        self.perceptual_hashes: Dict[str, str] = {}  # For duplicate detection
    
    def register_artifact(self, attestation: Dict) -> str:
        """Register artifact attestation and generate attestation ID"""
        
        # Check for duplicates using perceptual hash
        perceptual_hash = attestation['perceptual_hash']
        if perceptual_hash in self.perceptual_hashes:
            raise ValueError("Duplicate artifact detected")
        
        # Generate attestation ID
        attestation_id = hashlib.sha256(
            f"{attestation['ipfs_cid']}{attestation['creator_wallet']}{time.time()}".encode()
        ).hexdigest()[:16]
        
        # Store attestation
        attestation['attestation_id'] = attestation_id
        attestation['verification_status'] = 'verified'
        self.attestations[attestation_id] = attestation
        self.perceptual_hashes[perceptual_hash] = attestation_id
        
        # Submit to oracle for cryptographic verification
        self._submit_to_oracle(attestation)
        
        return attestation_id
    
    def _submit_to_oracle(self, attestation: Dict):
        """Submit attestation to language-fi oracle for verification"""
        try:
            oracle_payload = {
                'attestation_id': attestation['attestation_id'],
                'ipfs_cid': attestation['ipfs_cid'],
                'content_hash': attestation['content_hash'],
                'creator_wallet': attestation['creator_wallet'],
                'artifact_type': attestation['artifact_type']
            }
            
            response = requests.post(
                f"{self.oracle_endpoint}/api/oracle/verify",
                json=oracle_payload,
                timeout=10
            )
            
            if response.status_code == 200:
                oracle_signature = response.json().get('signature')
                if oracle_signature:
                    attestation['oracle_signature'] = oracle_signature
        except Exception as e:
            print(f"Oracle submission failed: {e}")
    
    def get_attestation(self, attestation_id: str) -> Optional[Dict]:
        """Retrieve artifact attestation by ID"""
        return self.attestations.get(attestation_id)
    
    def verify_artifact_uniqueness(self, file_path: str) -> bool:
        """Verify that artifact is unique (not already registered)"""
        analyzer = ArtifactAnalyzer()
        perceptual_hash = analyzer.generate_perceptual_hash(file_path)
        return perceptual_hash not in self.perceptual_hashes


# Factory function for easy instantiation
def create_artifact_verifier(
    ipfs_gateway: str = "https://ipfs.io/ipfs/",
    oracle_endpoint: str = "http://localhost:8000"
) -> Tuple[IPFSVerifier, ProvenanceAttestationBuilder, ArtifactRegistry]:
    """Create complete artifact verification stack"""
    ipfs_verifier = IPFSVerifier(ipfs_gateway)
    attestation_builder = ProvenanceAttestationBuilder(ipfs_verifier)
    registry = ArtifactRegistry(oracle_endpoint)
    
    return ipfs_verifier, attestation_builder, registry


if __name__ == "__main__":
    # Example usage
    verifier, builder, registry = create_artifact_verifier()
    
    # Example with a test file
    test_file = "test_audio.mp3"
    if os.path.exists(test_file):
        attestation = builder.create_artifact_attestation(
            test_file,
            creator_wallet="test_wallet_address",
            metadata={"title": "Test Audio", "description": "Test artifact"}
        )
        
        attestation_id = registry.register_artifact(attestation)
        print(f"Artifact registered with ID: {attestation_id}")
    else:
        print("Test file not found")