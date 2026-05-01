#!/usr/bin/env python3
"""
Anti-Manipulation Model
Implements safeguards against data manipulation including source weighting, allowlist, duplicate detection, anomaly detection, and time-weighted smoothing.
"""

from typing import Dict, List, Any, Set
from datetime import datetime, timezone
import hashlib
from collections import defaultdict


class SourceWeighting:
    """Manages source quality tiers and weights"""
    
    def __init__(self):
        # Source quality tiers
        self.tiers = {
            'tier1': {'weight': 1.0, 'sources': ['coingecko', 'coinmarketcap']},
            'tier2': {'weight': 0.8, 'sources': ['gateio', 'binance']},
            'tier3': {'weight': 0.6, 'sources': ['newspaper', 'medium', 'wikipedia']},
            'tier4': {'weight': 0.4, 'sources': ['social_media', 'forums']}
        }
        
        # Source allowlist (only these sources are allowed)
        self.allowlist = set()
        for tier_sources in self.tiers.values():
            self.allowlist.update(tier_sources['sources'])
    
    def get_source_weight(self, source: str) -> float:
        """Get weight for a specific source"""
        for tier_name, tier_data in self.tiers.items():
            if source.lower() in tier_data['sources']:
                return tier_data['weight']
        return 0.0  # Unknown sources get zero weight
    
    def is_source_allowed(self, source: str) -> bool:
        """Check if source is in allowlist"""
        return source.lower() in self.allowlist
    
    def calculate_weighted_score(self, data_points: List[Dict[str, Any]]) -> float:
        """
        Calculate weighted score from multiple data points
        
        Args:
            data_points: List of data points with 'source' and 'value' keys
            
        Returns:
            Weighted average score
        """
        total_weight = 0.0
        weighted_sum = 0.0
        
        for point in data_points:
            source = point.get('source', '')
            value = point.get('value', 0)
            
            if not self.is_source_allowed(source):
                continue
            
            weight = self.get_source_weight(source)
            weighted_sum += value * weight
            total_weight += weight
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0


class DuplicateDetector:
    """Detects duplicate or near-duplicate data entries"""
    
    def __init__(self, similarity_threshold: float = 0.95):
        self.similarity_threshold = similarity_threshold
        self.seen_hashes: Set[str] = set()
        self.seen_content: Dict[str, int] = defaultdict(int)
    
    def _hash_content(self, content: str) -> str:
        """Generate hash of content for comparison"""
        return hashlib.sha256(content.lower().encode()).hexdigest()
    
    def is_duplicate(self, content: str, source: str) -> bool:
        """
        Check if content is a duplicate
        
        Args:
            content: Content to check
            source: Source of the content
            
        Returns:
            True if duplicate detected
        """
        content_hash = self._hash_content(content)
        
        # Check exact hash match
        if content_hash in self.seen_hashes:
            return True
        
        # Check for near-duplicate by content frequency
        content_key = content.lower().strip()
        if self.seen_content[content_key] >= 3:
            return True
        
        # Record this content
        self.seen_hashes.add(content_hash)
        self.seen_content[content_key] += 1
        
        return False
    
    def get_duplicate_stats(self) -> Dict[str, int]:
        """Get statistics on duplicate detection"""
        return {
            'total_hashes': len(self.seen_hashes),
            'total_content_items': sum(self.seen_content.values()),
            'unique_content': len(self.seen_content),
            'duplicates_filtered': sum(count - 1 for count in self.seen_content.values() if count > 1)
        }


class AnomalyDetector:
    """Detects anomalous data patterns that may indicate manipulation"""
    
    def __init__(self, z_threshold: float = 3.0):
        self.z_threshold = z_threshold
        self.historical_values: List[float] = []
        self.max_history_size = 1000
    
    def add_value(self, value: float):
        """Add a value to historical data"""
        self.historical_values.append(value)
        if len(self.historical_values) > self.max_history_size:
            self.historical_values.pop(0)
    
    def calculate_z_score(self, value: float) -> float:
        """Calculate z-score for a value"""
        if len(self.historical_values) < 2:
            return 0.0
        
        mean = sum(self.historical_values) / len(self.historical_values)
        variance = sum((x - mean) ** 2 for x in self.historical_values) / len(self.historical_values)
        std = variance ** 0.5
        
        if std == 0:
            return 0.0
        
        return (value - mean) / std
    
    def is_anomalous(self, value: float) -> bool:
        """Check if value is anomalous"""
        z_score = self.calculate_z_score(value)
        return abs(z_score) > self.z_threshold
    
    def detect_sudden_spikes(self, values: List[float]) -> List[int]:
        """
        Detect sudden spikes in a sequence of values
        
        Args:
            values: List of values to check
            
        Returns:
            Indices of anomalous values
        """
        anomalies = []
        
        for i, value in enumerate(values):
            # Add value to history first
            self.add_value(value)
            
            # Check if anomalous
            if self.is_anomalous(value):
                anomalies.append(i)
        
        return anomalies


class TimeWeightedSmoothing:
    """Applies time-weighted smoothing to reduce noise and manipulation impact"""
    
    def __init__(self, decay_factor: float = 0.1):
        self.decay_factor = decay_factor
        self.smoothed_values: Dict[str, float] = {}
        self.last_update: Dict[str, datetime] = {}
    
    def smooth_value(self, key: str, raw_value: float, timestamp: datetime = None) -> float:
        """
        Apply time-weighted smoothing to a value
        
        Args:
            key: Identifier for the value (e.g., primitive symbol)
            raw_value: New raw value
            timestamp: Timestamp of the value (defaults to now)
            
        Returns:
            Smoothed value
        """
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)
        
        if key not in self.smoothed_values:
            # First value, no smoothing
            self.smoothed_values[key] = raw_value
            self.last_update[key] = timestamp
            return raw_value
        
        # Calculate time decay
        time_delta = (timestamp - self.last_update[key]).total_seconds() / 3600  # hours
        time_decay = self.decay_factor ** time_delta
        
        # Apply smoothing
        smoothed = (time_decay * self.smoothed_values[key]) + ((1 - time_decay) * raw_value)
        
        # Update state
        self.smoothed_values[key] = smoothed
        self.last_update[key] = timestamp
        
        return smoothed
    
    def get_smoothed_value(self, key: str) -> float:
        """Get the current smoothed value for a key"""
        return self.smoothed_values.get(key, 0.0)


class AntiManipulationEngine:
    """Main anti-manipulation engine combining all safeguards"""
    
    def __init__(self):
        self.source_weighting = SourceWeighting()
        self.duplicate_detector = DuplicateDetector()
        self.anomaly_detector = AnomalyDetector()
        self.time_smoother = TimeWeightedSmoothing()
        
        # Quarantine mode for suspicious data
        self.quarantine_mode = False
        self.quarantined_sources: Set[str] = set()
    
    def process_data_point(self, data_point: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single data point through all anti-manipulation checks
        
        Args:
            data_point: Data point with 'source', 'content', 'value', 'timestamp' keys
            
        Returns:
            Processed data point with manipulation flags
        """
        source = data_point.get('source', '')
        content = data_point.get('content', '')
        value = data_point.get('value', 0)
        timestamp = data_point.get('timestamp', datetime.now(timezone.utc))
        
        result = {
            'original': data_point.copy(),
            'flags': [],
            'processed_value': value,
            'accepted': True
        }
        
        # Check source allowlist
        if not self.source_weighting.is_source_allowed(source):
            result['flags'].append('source_not_allowed')
            result['accepted'] = False
            return result
        
        # Check quarantine
        if self.quarantine_mode and source in self.quarantined_sources:
            result['flags'].append('quarantined_source')
            result['accepted'] = False
            return result
        
        # Check for duplicates
        if self.duplicate_detector.is_duplicate(content, source):
            result['flags'].append('duplicate_content')
            result['accepted'] = False
            return result
        
        # Check for anomalies
        self.anomaly_detector.add_value(value)
        if self.anomaly_detector.is_anomalous(value):
            result['flags'].append('anomalous_value')
            # Still accept but flag for review
        
        # Apply source weighting
        source_weight = self.source_weighting.get_source_weight(source)
        weighted_value = value * source_weight
        result['source_weight'] = source_weight
        
        # Apply time-weighted smoothing
        key = f"{source}_{hashlib.sha256(content.encode()).hexdigest()[:8]}"
        smoothed_value = self.time_smoother.smooth_value(key, weighted_value, timestamp)
        result['processed_value'] = smoothed_value
        
        return result
    
    def process_batch(self, data_points: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Process a batch of data points
        
        Args:
            data_points: List of data points to process
            
        Returns:
            Batch processing results
        """
        results = []
        accepted = []
        rejected = []
        
        for data_point in data_points:
            result = self.process_data_point(data_point)
            results.append(result)
            
            if result['accepted']:
                accepted.append(result)
            else:
                rejected.append(result)
        
        return {
            'total_processed': len(data_points),
            'accepted_count': len(accepted),
            'rejected_count': len(rejected),
            'results': results,
            'duplicate_stats': self.duplicate_detector.get_duplicate_stats()
        }
    
    def enable_quarantine_mode(self):
        """Enable quarantine mode for suspicious data"""
        self.quarantine_mode = True
    
    def disable_quarantine_mode(self):
        """Disable quarantine mode"""
        self.quarantine_mode = False
    
    def quarantine_source(self, source: str):
        """Add a source to quarantine"""
        self.quarantined_sources.add(source.lower())
    
    def unquarantine_source(self, source: str):
        """Remove a source from quarantine"""
        self.quarantined_sources.discard(source.lower())
    
    def get_status(self) -> Dict[str, Any]:
        """Get current anti-manipulation engine status"""
        return {
            'quarantine_mode': self.quarantine_mode,
            'quarantined_sources': list(self.quarantined_sources),
            'duplicate_stats': self.duplicate_detector.get_duplicate_stats(),
            'anomaly_threshold': self.anomaly_detector.z_threshold,
            'decay_factor': self.time_smoother.decay_factor,
            'allowed_sources': list(self.source_weighting.allowlist)
        }
