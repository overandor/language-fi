#!/usr/bin/env python3
"""
Tests for anti_manipulation module
Tests source weighting, duplicate detection, anomaly detection, and time-weighted smoothing
"""

import unittest
from datetime import datetime, timezone
from anti_manipulation import (
    SourceWeighting,
    DuplicateDetector,
    AnomalyDetector,
    TimeWeightedSmoothing,
    AntiManipulationEngine
)


class TestSourceWeighting(unittest.TestCase):
    """Test SourceWeighting class"""

    def setUp(self):
        """Set up test fixtures"""
        self.weighting = SourceWeighting()

    def test_get_source_weight_tier1(self):
        """Test Tier 1 source weight"""
        weight = self.weighting.get_source_weight('coingecko')
        self.assertEqual(weight, 1.0)

    def test_get_source_weight_tier2(self):
        """Test Tier 2 source weight"""
        weight = self.weighting.get_source_weight('gateio')
        self.assertEqual(weight, 0.8)

    def test_get_source_weight_tier3(self):
        """Test Tier 3 source weight"""
        weight = self.weighting.get_source_weight('newspaper')
        self.assertEqual(weight, 0.6)

    def test_get_source_weight_unknown(self):
        """Test unknown source weight"""
        weight = self.weighting.get_source_weight('unknown_source')
        self.assertEqual(weight, 0.0)

    def test_is_source_allowed(self):
        """Test source allowlist"""
        self.assertTrue(self.weighting.is_source_allowed('coingecko'))
        self.assertTrue(self.weighting.is_source_allowed('gateio'))
        self.assertFalse(self.weighting.is_source_allowed('unknown_source'))

    def test_calculate_weighted_score(self):
        """Test weighted score calculation"""
        data_points = [
            {'source': 'coingecko', 'value': 100},
            {'source': 'gateio', 'value': 80},
            {'source': 'newspaper', 'value': 60}
        ]
        score = self.weighting.calculate_weighted_score(data_points)
        self.assertGreater(score, 0)
        self.assertLess(score, 100)


class TestDuplicateDetector(unittest.TestCase):
    """Test DuplicateDetector class"""

    def setUp(self):
        """Set up test fixtures"""
        self.detector = DuplicateDetector()

    def test_first_occurrence_not_duplicate(self):
        """Test first occurrence is not duplicate"""
        is_dup = self.detector.is_duplicate('test content', 'source1')
        self.assertFalse(is_dup)

    def test_exact_duplicate_detection(self):
        """Test exact duplicate detection"""
        content = 'test content'
        self.detector.is_duplicate(content, 'source1')
        is_dup = self.detector.is_duplicate(content, 'source2')
        self.assertTrue(is_dup)

    def test_near_duplicate_detection(self):
        """Test near-duplicate detection by frequency"""
        content = 'test content'
        for i in range(4):
            self.detector.is_duplicate(content, f'source{i}')
        is_dup = self.detector.is_duplicate(content, 'source5')
        self.assertTrue(is_dup)

    def test_get_duplicate_stats(self):
        """Test duplicate statistics"""
        self.detector.is_duplicate('content1', 'source1')
        self.detector.is_duplicate('content1', 'source2')
        self.detector.is_duplicate('content2', 'source3')
        
        stats = self.detector.get_duplicate_stats()
        self.assertEqual(stats['total_hashes'], 2)
        self.assertEqual(stats['unique_content'], 2)


class TestAnomalyDetector(unittest.TestCase):
    """Test AnomalyDetector class"""

    def setUp(self):
        """Set up test fixtures"""
        self.detector = AnomalyDetector(z_threshold=3.0)

    def test_add_value(self):
        """Test adding values to history"""
        self.detector.add_value(100)
        self.assertEqual(len(self.detector.historical_values), 1)

    def test_calculate_z_score_insufficient_data(self):
        """Test z-score with insufficient data"""
        z_score = self.detector.calculate_z_score(100)
        self.assertEqual(z_score, 0.0)

    def test_calculate_z_score(self):
        """Test z-score calculation"""
        for i in range(10):
            self.detector.add_value(100)
        
        z_score = self.detector.calculate_z_score(100)
        self.assertEqual(z_score, 0.0)

    def test_is_anomalous_normal_value(self):
        """Test normal value is not anomalous"""
        for i in range(10):
            self.detector.add_value(100)
        
        is_anomalous = self.detector.is_anomalous(101)
        self.assertFalse(is_anomalous)

    def test_is_anomalous_extreme_value(self):
        """Test extreme value is anomalous"""
        for i in range(10):
            self.detector.add_value(100)
        
        is_anomalous = self.detector.is_anomalous(500)
        self.assertTrue(is_anomalous)

    def test_detect_sudden_spikes(self):
        """Test sudden spike detection"""
        values = [100] * 10 + [500]
        anomalies = self.detector.detect_sudden_spikes(values)
        self.assertGreater(len(anomalies), 0)


class TestTimeWeightedSmoothing(unittest.TestCase):
    """Test TimeWeightedSmoothing class"""

    def setUp(self):
        """Set up test fixtures"""
        self.smoother = TimeWeightedSmoothing(decay_factor=0.1)

    def test_smooth_value_first(self):
        """Test smoothing first value"""
        smoothed = self.smoother.smooth_value('key1', 100)
        self.assertEqual(smoothed, 100)

    def test_smooth_value_subsequent(self):
        """Test smoothing subsequent values"""
        self.smoother.smooth_value('key1', 100)
        smoothed = self.smoother.smooth_value('key1', 110)
        self.assertGreater(smoothed, 100)
        self.assertLess(smoothed, 110)

    def test_get_smoothed_value(self):
        """Test getting smoothed value"""
        self.smoother.smooth_value('key1', 100)
        value = self.smoother.get_smoothed_value('key1')
        self.assertEqual(value, 100)

    def test_get_smoothed_value_nonexistent(self):
        """Test getting smoothed value for nonexistent key"""
        value = self.smoother.get_smoothed_value('nonexistent')
        self.assertEqual(value, 0.0)


class TestAntiManipulationEngine(unittest.TestCase):
    """Test AntiManipulationEngine class"""

    def setUp(self):
        """Set up test fixtures"""
        self.engine = AntiManipulationEngine()

    def test_process_data_point_allowed(self):
        """Test processing allowed data point"""
        data_point = {
            'source': 'coingecko',
            'content': 'test content',
            'value': 100,
            'timestamp': datetime.now(timezone.utc)
        }
        result = self.engine.process_data_point(data_point)
        self.assertTrue(result['accepted'])

    def test_process_data_point_not_allowed(self):
        """Test processing disallowed data point"""
        data_point = {
            'source': 'unknown_source',
            'content': 'test content',
            'value': 100,
            'timestamp': datetime.now(timezone.utc)
        }
        result = self.engine.process_data_point(data_point)
        self.assertFalse(result['accepted'])
        self.assertIn('source_not_allowed', result['flags'])

    def test_process_data_point_duplicate(self):
        """Test processing duplicate content"""
        content = 'test content'
        data_point1 = {
            'source': 'coingecko',
            'content': content,
            'value': 100,
            'timestamp': datetime.now(timezone.utc)
        }
        data_point2 = {
            'source': 'gateio',
            'content': content,
            'value': 100,
            'timestamp': datetime.now(timezone.utc)
        }
        
        self.engine.process_data_point(data_point1)
        result = self.engine.process_data_point(data_point2)
        self.assertFalse(result['accepted'])
        self.assertIn('duplicate_content', result['flags'])

    def test_process_batch(self):
        """Test batch processing"""
        data_points = [
            {
                'source': 'coingecko',
                'content': 'content1',
                'value': 100,
                'timestamp': datetime.now(timezone.utc)
            },
            {
                'source': 'gateio',
                'content': 'content2',
                'value': 80,
                'timestamp': datetime.now(timezone.utc)
            }
        ]
        result = self.engine.process_batch(data_points)
        self.assertEqual(result['total_processed'], 2)
        self.assertEqual(result['accepted_count'], 2)
        self.assertEqual(result['rejected_count'], 0)

    def test_enable_quarantine_mode(self):
        """Test quarantine mode"""
        self.engine.enable_quarantine_mode()
        self.assertTrue(self.engine.quarantine_mode)

    def test_disable_quarantine_mode(self):
        """Test disabling quarantine mode"""
        self.engine.enable_quarantine_mode()
        self.engine.disable_quarantine_mode()
        self.assertFalse(self.engine.quarantine_mode)

    def test_quarantine_source(self):
        """Test quarantining a source"""
        self.engine.quarantine_source('coingecko')
        self.assertIn('coingecko', self.engine.quarantined_sources)

    def test_unquarantine_source(self):
        """Test unquarantining a source"""
        self.engine.quarantine_source('coingecko')
        self.engine.unquarantine_source('coingecko')
        self.assertNotIn('coingecko', self.engine.quarantined_sources)

    def test_process_data_point_quarantined(self):
        """Test processing quarantined source"""
        self.engine.enable_quarantine_mode()
        self.engine.quarantine_source('coingecko')
        
        data_point = {
            'source': 'coingecko',
            'content': 'test content',
            'value': 100,
            'timestamp': datetime.now(timezone.utc)
        }
        result = self.engine.process_data_point(data_point)
        self.assertFalse(result['accepted'])
        self.assertIn('quarantined_source', result['flags'])

    def test_get_status(self):
        """Test getting engine status"""
        status = self.engine.get_status()
        self.assertIn('quarantine_mode', status)
        self.assertIn('allowed_sources', status)
        self.assertIn('duplicate_stats', status)


if __name__ == '__main__':
    unittest.main()
