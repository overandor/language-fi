"""
Oracle Signature Service
Generates cryptographic attestations for artifact mints
"""

import os
from typing import Dict
from dataclasses import dataclass
from datetime import datetime
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

# Oracle private key (in production, use KMS or secure vault)
ORACLE_PRIVATE_KEY = os.getenv("ORACLE_PRIVATE_KEY")
if not ORACLE_PRIVATE_KEY:
    raise ValueError("ORACLE_PRIVATE_KEY environment variable required")

# Chain ID for signature replay protection
CHAIN_ID = int(os.getenv("CHAIN_ID", "1"))  # Default to mainnet

# Nonce management (in production, use database)
_nonces = set()
_current_nonce = 0


@dataclass
class OracleAttestation:
    """Oracle attestation for artifact mint"""
    cid: str
    score: float
    amount: float
    nonce: int
    signature: str
    chain_id: int
    timestamp: datetime


class OracleSignatureService:
    """Service for generating oracle attestations"""
    
    def __init__(self):
        self.account = Account.from_key(ORACLE_PRIVATE_KEY)
        self.w3 = Web3()
    
    def generate_attestation(
        self,
        cid: str,
        score: float,
        amount: float
    ) -> OracleAttestation:
        """
        Generate oracle attestation for artifact mint
        This signature will be verified by the smart contract
        """
        # Get next nonce
        nonce = self._get_next_nonce()
        
        # Create message hash
        message_hash = self._create_message_hash(cid, score, amount, nonce)
        
        # Sign message
        signature = self._sign_message(message_hash)
        
        return OracleAttestation(
            cid=cid,
            score=score,
            amount=amount,
            nonce=nonce,
            signature=signature,
            chain_id=CHAIN_ID,
            timestamp=datetime.utcnow()
        )
    
    def _create_message_hash(
        self,
        cid: str,
        score: float,
        amount: float,
        nonce: int
    ) -> str:
        """
        Create message hash that matches contract verification
        Contract uses: keccak256(abi.encodePacked(cid, score, amount, nonce, block.chainid))
        """
        # Convert to bytes32 format for CID
        cid_bytes32 = Web3.to_bytes(hexstr=cid) if cid.startswith("0x") else Web3.to_bytes(text=cid)
        cid_bytes32 = Web3.keccak(cid_bytes32)  # Hash to get fixed length
        
        # Encode message
        message = Web3.solidity_keccak(
            ['bytes32', 'uint256', 'uint256', 'uint256', 'uint256'],
            [
                cid_bytes32,
                int(score),
                int(amount),
                nonce,
                CHAIN_ID
            ]
        )
        
        return message.hex()
    
    def _sign_message(self, message_hash: str) -> str:
        """Sign message hash with oracle private key"""
        message = encode_defunct(hexstr=message_hash)
        signed_message = self.account.sign_message(message)
        return signed_message.signature.hex()
    
    def _get_next_nonce(self) -> int:
        """Get next nonce for replay protection"""
        global _current_nonce
        _current_nonce += 1
        _nonces.add(_current_nonce)
        return _current_nonce
    
    def verify_attestation(
        self,
        cid: str,
        score: float,
        amount: float,
        nonce: int,
        signature: str
    ) -> bool:
        """
        Verify attestation signature
        Used for testing and validation
        """
        # Recreate message hash
        message_hash = self._create_message_hash(cid, score, amount, nonce)
        
        # Recover signer
        message = encode_defunct(hexstr=message_hash)
        recovered_address = self.w3.eth.account.recover_message(message, signature=signature)
        
        # Check if signer is oracle
        return recovered_address.lower() == self.account.address.lower()
    
    def get_oracle_address(self) -> str:
        """Get oracle address (public key)"""
        return self.account.address


class OracleAttestationAPI:
    """API wrapper for oracle attestation service"""
    
    def __init__(self):
        self.oracle_service = OracleSignatureService()
    
    def create_attestation(
        self,
        artifact_analysis: Dict
    ) -> Dict:
        """
        Create attestation from artifact analysis
        """
        cid = artifact_analysis["cid"]
        score = artifact_analysis["score"]
        amount = artifact_analysis["mint_amount"]
        
        # Generate attestation
        attestation = self.oracle_service.generate_attestation(
            cid=cid,
            score=score,
            amount=amount
        )
        
        return {
            "cid": attestation.cid,
            "score": attestation.score,
            "amount": attestation.amount,
            "nonce": attestation.nonce,
            "signature": attestation.signature,
            "chain_id": attestation.chain_id,
            "oracle_address": self.oracle_service.get_oracle_address(),
            "timestamp": attestation.timestamp.isoformat()
        }
    
    def verify_mint_request(
        self,
        cid: str,
        score: float,
        amount: float,
        nonce: int,
        signature: str
    ) -> Dict:
        """
        Verify mint request signature
        """
        is_valid = self.oracle_service.verify_attestation(
            cid=cid,
            score=score,
            amount=amount,
            nonce=nonce,
            signature=signature
        )
        
        return {
            "valid": is_valid,
            "oracle_address": self.oracle_service.get_oracle_address(),
            "nonce_used": nonce in _nonces
        }


# Singleton instance
_oracle_service = None

def get_oracle_service() -> OracleSignatureService:
    """Get singleton oracle service instance"""
    global _oracle_service
    if _oracle_service is None:
        _oracle_service = OracleSignatureService()
    return _oracle_service


def get_attestation_api() -> OracleAttestationAPI:
    """Get singleton attestation API instance"""
    return OracleAttestationAPI()
