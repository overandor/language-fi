#!/usr/bin/env python3
"""
Oracle Run Module
Implements reproducible oracle runs with input snapshot, normalization, scoring, run hash, and signed attestation.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, List, Any


class OracleRun:
    """Reproducible oracle run with full attestation"""
    
    def __init__(self, run_id: str = None):
        self.run_id = run_id or self._generate_run_id()
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.input_snapshot = {}
        self.normalization_params = {}
        self.scoring_params = {}
        self.primitive_prices = {}
        self.previous_run_hash = None
        self.current_run_hash = None
        self.data_sources = []
        self.signature = None
        self.policy_version = "v1.0"
        
    def _generate_run_id(self) -> str:
        """Generate unique run ID"""
        return f"run_{int(datetime.now(timezone.utc).timestamp())}"
    
    def set_input_snapshot(self, data: Dict[str, Any]) -> str:
        """
        Set input data snapshot and return hash
        
        Args:
            data: Input data dictionary
            
        Returns:
            SHA-256 hash of the input data
        """
        # Create deterministic string representation
        data_str = json.dumps(data, sort_keys=True)
        self.input_snapshot = data
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    def set_normalization_params(self, params: Dict[str, Any]):
        """Set normalization parameters"""
        self.normalization_params = params
    
    def set_scoring_params(self, params: Dict[str, Any]):
        """Set scoring parameters"""
        self.scoring_params = params
    
    def set_primitive_prices(self, prices: Dict[str, float]):
        """Set computed primitive prices"""
        self.primitive_prices = prices
    
    def set_data_sources(self, sources: List[str]):
        """Set list of data sources used"""
        self.data_sources = sources
    
    def set_previous_run_hash(self, hash_value: str):
        """Set hash of previous oracle run"""
        self.previous_run_hash = hash_value
    
    def compute_run_hash(self) -> str:
        """
        Compute hash of the entire oracle run for reproducibility
        
        Returns:
            SHA-256 hash of all run parameters
        """
        # Create deterministic representation of all inputs
        run_data = {
            'run_id': self.run_id,
            'timestamp': self.timestamp,
            'input_snapshot_hash': hashlib.sha256(json.dumps(self.input_snapshot, sort_keys=True).encode()).hexdigest(),
            'normalization_params': self.normalization_params,
            'scoring_params': self.scoring_params,
            'previous_run_hash': self.previous_run_hash,
            'policy_version': self.policy_version
        }
        
        run_str = json.dumps(run_data, sort_keys=True)
        self.current_run_hash = hashlib.sha256(run_str.encode()).hexdigest()
        return self.current_run_hash
    
    def sign_run(self, private_key: str = None) -> str:
        """
        Sign the oracle run hash (placeholder for actual signature)
        
        Args:
            private_key: Private key for signing (optional, uses demo key if not provided)
            
        Returns:
            Signature of the run hash
        """
        if not self.current_run_hash:
            self.compute_run_hash()
        
        # Placeholder for actual cryptographic signature
        # In production, use proper signing with Ed25519 or similar
        if private_key:
            # Real implementation would use proper signing
            self.signature = f"signed_{self.current_run_hash[:16]}"
        else:
            self.signature = f"demo_signature_{self.current_run_hash[:16]}"
        
        return self.signature
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert oracle run to dictionary for storage/transmission"""
        return {
            'run_id': self.run_id,
            'timestamp': self.timestamp,
            'input_snapshot_hash': hashlib.sha256(json.dumps(self.input_snapshot, sort_keys=True).encode()).hexdigest() if self.input_snapshot else None,
            'input_snapshot_size': len(json.dumps(self.input_snapshot)) if self.input_snapshot else 0,
            'normalization_params': self.normalization_params,
            'scoring_params': self.scoring_params,
            'primitive_prices': self.primitive_prices,
            'previous_run_hash': self.previous_run_hash,
            'current_run_hash': self.current_run_hash,
            'data_sources': self.data_sources,
            'signature': self.signature,
            'policy_version': self.policy_version
        }
    
    def verify_reproducibility(self, other_run: 'OracleRun') -> bool:
        """
        Verify that another oracle run produces the same result with same inputs
        
        Args:
            other_run: Another OracleRun instance to compare against
            
        Returns:
            True if runs are reproducible (same inputs produce same outputs)
        """
        # Check if inputs are the same
        if self.input_snapshot != other_run.input_snapshot:
            return False
        
        # Check if parameters are the same
        if self.normalization_params != other_run.normalization_params:
            return False
        
        if self.scoring_params != other_run.scoring_params:
            return False
        
        # Check if outputs are the same
        if self.primitive_prices != other_run.primitive_prices:
            return False
        
        # Check if hashes match
        if self.current_run_hash != other_run.current_run_hash:
            return False
        
        return True
    
    def get_attestation(self) -> Dict[str, Any]:
        """
        Get signed attestation of the oracle run
        
        Returns:
            Attestation dictionary with all verification information
        """
        if not self.current_run_hash:
            self.compute_run_hash()
        
        if not self.signature:
            self.sign_run()
        
        return {
            'attestation_type': 'oracle_run',
            'run_id': self.run_id,
            'timestamp': self.timestamp,
            'run_hash': self.current_run_hash,
            'signature': self.signature,
            'data_sources': self.data_sources,
            'policy_version': self.policy_version,
            'input_hash': hashlib.sha256(json.dumps(self.input_snapshot, sort_keys=True).encode()).hexdigest() if self.input_snapshot else None,
            'primitive_count': len(self.primitive_prices)
        }


class OracleLedger:
    """Public oracle ledger for storing historical oracle runs"""
    
    def __init__(self):
        self.runs: List[OracleRun] = []
    
    def add_run(self, run: OracleRun):
        """Add an oracle run to the ledger"""
        self.runs.append(run)
    
    def get_latest_run(self) -> OracleRun:
        """Get the most recent oracle run"""
        return self.runs[-1] if self.runs else None
    
    def get_run_by_id(self, run_id: str) -> OracleRun:
        """Get a specific oracle run by ID"""
        for run in self.runs:
            if run.run_id == run_id:
                return run
        return None
    
    def get_run_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get historical oracle runs"""
        return [run.to_dict() for run in self.runs[-limit:]]
    
    def verify_chain(self) -> bool:
        """
        Verify that the oracle run chain is intact (each run references previous run hash)
        
        Returns:
            True if chain is valid
        """
        for i in range(1, len(self.runs)):
            if self.runs[i].previous_run_hash != self.runs[i-1].current_run_hash:
                return False
        return True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert ledger to dictionary"""
        return {
            'total_runs': len(self.runs),
            'latest_run': self.get_latest_run().to_dict() if self.get_latest_run() else None,
            'chain_valid': self.verify_chain(),
            'runs': [run.to_dict() for run in self.runs]
        }


def create_oracle_run(
    input_data: Dict[str, Any],
    normalization_params: Dict[str, Any],
    scoring_params: Dict[str, Any],
    primitive_prices: Dict[str, float],
    data_sources: List[str],
    previous_run_hash: str = None,
    private_key: str = None
) -> OracleRun:
    """
    Create a new oracle run with full attestation
    
    Args:
        input_data: Input data for the oracle run
        normalization_params: Normalization parameters used
        scoring_params: Scoring parameters used
        primitive_prices: Computed primitive prices
        data_sources: List of data sources used
        previous_run_hash: Hash of previous run (for chain verification)
        private_key: Private key for signing (optional)
        
    Returns:
        OracleRun instance with full attestation
    """
    run = OracleRun()
    
    # Set input snapshot
    run.set_input_snapshot(input_data)
    
    # Set parameters
    run.set_normalization_params(normalization_params)
    run.set_scoring_params(scoring_params)
    
    # Set outputs
    run.set_primitive_prices(primitive_prices)
    run.set_data_sources(data_sources)
    
    # Set chain reference
    if previous_run_hash:
        run.set_previous_run_hash(previous_run_hash)
    
    # Compute run hash
    run.compute_run_hash()
    
    # Sign the run
    run.sign_run(private_key)
    
    return run
