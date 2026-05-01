#!/usr/bin/env python3
"""
Tests for oracle_run module
Tests reproducible oracle runs, hash verification, and chain integrity
"""

import unittest
from oracle_run import OracleRun, OracleLedger, create_oracle_run


class TestOracleRun(unittest.TestCase):
    """Test OracleRun class"""

    def setUp(self):
        """Set up test fixtures"""
        self.run = OracleRun()

    def test_generate_run_id(self):
        """Test run ID generation"""
        run_id = self.run.run_id
        self.assertTrue(run_id.startswith('run_'))
        self.assertTrue(len(run_id) > 4)

    def test_set_input_snapshot(self):
        """Test input snapshot and hash"""
        data = {'test': 'data', 'value': 42}
        hash_value = self.run.set_input_snapshot(data)
        self.assertTrue(hash_value)
        self.assertEqual(len(hash_value), 64)  # SHA-256 hex
        self.assertEqual(self.run.input_snapshot, data)

    def test_compute_run_hash(self):
        """Test run hash computation"""
        self.run.set_input_snapshot({'test': 'data'})
        self.run.set_normalization_params({'method': 'z-score'})
        self.run.set_scoring_params({'version': 'v1.0'})
        
        hash_value = self.run.compute_run_hash()
        self.assertTrue(hash_value)
        self.assertEqual(len(hash_value), 64)
        self.assertEqual(self.run.current_run_hash, hash_value)

    def test_sign_run(self):
        """Test run signing"""
        self.run.set_input_snapshot({'test': 'data'})
        self.run.compute_run_hash()
        
        signature = self.run.sign_run()
        self.assertTrue(signature)
        self.assertIn('signature', signature)

    def test_reproducibility(self):
        """Test reproducibility - same inputs produce same outputs"""
        run1 = OracleRun()
        run2 = OracleRun()
        
        data = {'test': 'data', 'value': 42}
        normalization = {'method': 'z-score'}
        scoring = {'version': 'v1.0'}
        
        run1.set_input_snapshot(data)
        run1.set_normalization_params(normalization)
        run1.set_scoring_params(scoring)
        run1.compute_run_hash()
        
        run2.set_input_snapshot(data)
        run2.set_normalization_params(normalization)
        run2.set_scoring_params(scoring)
        run2.compute_run_hash()
        
        self.assertEqual(run1.current_run_hash, run2.current_run_hash)
        self.assertTrue(run1.verify_reproducibility(run2))

    def test_non_reproducibility_different_inputs(self):
        """Test non-reproducibility with different inputs"""
        run1 = OracleRun()
        run2 = OracleRun()
        
        run1.set_input_snapshot({'test': 'data1'})
        run2.set_input_snapshot({'test': 'data2'})
        
        self.assertFalse(run1.verify_reproducibility(run2))

    def test_to_dict(self):
        """Test serialization to dictionary"""
        self.run.set_input_snapshot({'test': 'data'})
        self.run.compute_run_hash()
        self.run.sign_run()
        
        result = self.run.to_dict()
        self.assertIn('run_id', result)
        self.assertIn('timestamp', result)
        self.assertIn('current_run_hash', result)
        self.assertIn('signature', result)

    def test_get_attestation(self):
        """Test attestation generation"""
        self.run.set_input_snapshot({'test': 'data'})
        self.run.compute_run_hash()
        
        attestation = self.run.get_attestation()
        self.assertEqual(attestation['attestation_type'], 'oracle_run')
        self.assertIn('run_hash', attestation)
        self.assertIn('signature', attestation)


class TestOracleLedger(unittest.TestCase):
    """Test OracleLedger class"""

    def setUp(self):
        """Set up test fixtures"""
        self.ledger = OracleLedger()

    def test_add_run(self):
        """Test adding runs to ledger"""
        run = OracleRun()
        self.ledger.add_run(run)
        self.assertEqual(len(self.ledger.runs), 1)

    def test_get_latest_run(self):
        """Test getting latest run"""
        run1 = OracleRun()
        run2 = OracleRun()
        
        self.ledger.add_run(run1)
        self.ledger.add_run(run2)
        
        latest = self.ledger.get_latest_run()
        self.assertEqual(latest, run2)

    def test_get_latest_run_empty(self):
        """Test getting latest run from empty ledger"""
        latest = self.ledger.get_latest_run()
        self.assertIsNone(latest)

    def test_get_run_by_id(self):
        """Test getting run by ID"""
        run = OracleRun()
        self.ledger.add_run(run)
        
        retrieved = self.ledger.get_run_by_id(run.run_id)
        self.assertEqual(retrieved, run)

    def test_get_run_by_id_not_found(self):
        """Test getting non-existent run by ID"""
        retrieved = self.ledger.get_run_by_id('nonexistent')
        self.assertIsNone(retrieved)

    def test_get_run_history(self):
        """Test getting run history"""
        for i in range(5):
            run = OracleRun()
            self.ledger.add_run(run)
        
        history = self.ledger.get_run_history(limit=3)
        self.assertEqual(len(history), 3)

    def test_verify_chain_empty(self):
        """Test chain verification with empty ledger"""
        self.assertTrue(self.ledger.verify_chain())

    def test_verify_chain_single_run(self):
        """Test chain verification with single run"""
        run = OracleRun()
        self.ledger.add_run(run)
        self.assertTrue(self.ledger.verify_chain())

    def test_verify_chain_broken(self):
        """Test chain verification with broken chain"""
        run1 = OracleRun()
        run1.compute_run_hash()
        
        run2 = OracleRun()
        run2.set_previous_run_hash('wrong_hash')
        run2.compute_run_hash()
        
        self.ledger.add_run(run1)
        self.ledger.add_run(run2)
        
        self.assertFalse(self.ledger.verify_chain())

    def test_to_dict(self):
        """Test ledger serialization"""
        run = OracleRun()
        self.ledger.add_run(run)
        
        result = self.ledger.to_dict()
        self.assertIn('total_runs', result)
        self.assertIn('latest_run', result)
        self.assertIn('chain_valid', result)


class TestCreateOracleRun(unittest.TestCase):
    """Test create_oracle_run function"""

    def test_create_oracle_run(self):
        """Test creating oracle run with all parameters"""
        input_data = {'test': 'data'}
        normalization_params = {'method': 'z-score'}
        scoring_params = {'version': 'v1.0'}
        primitive_prices = {'A': 0.5, 'B': 0.3}
        data_sources = ['coingecko', 'gateio']
        
        run = create_oracle_run(
            input_data=input_data,
            normalization_params=normalization_params,
            scoring_params=scoring_params,
            primitive_prices=primitive_prices,
            data_sources=data_sources
        )
        
        self.assertIsInstance(run, OracleRun)
        self.assertEqual(run.input_snapshot, input_data)
        self.assertEqual(run.normalization_params, normalization_params)
        self.assertEqual(run.scoring_params, scoring_params)
        self.assertEqual(run.primitive_prices, primitive_prices)
        self.assertEqual(run.data_sources, data_sources)
        self.assertIsNotNone(run.current_run_hash)
        self.assertIsNotNone(run.signature)


if __name__ == '__main__':
    unittest.main()
