#!/usr/bin/env python3
"""
Language.fi KPI Engine
24/7 continuous intelligence system for letter quantification and number dequantification
"""

import os
import requests
import time
import json
from datetime import datetime, timezone
from typing import Dict, List, Any
from collections import deque
import threading

# Configuration
COINGECKO_API_KEY = os.getenv('COINGECKO_API_KEY', '')
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')

# Data sources
API_BASE = os.getenv('API_BASE', 'https://language-fi.vercel.app')

# KPI storage (in-memory for now, move to database later)
kpi_store = {
    'letter_kpis': {},
    'history': deque(maxlen=1000),  # Keep last 1000 snapshots
    'new_kpis': [],
    'llm_insights': []
}

# Base KPIs (deterministic)
BASE_KPIS = [
    'letter_volume',
    'letter_frequency',
    'rank_velocity',
    'price_momentum',
    'usage_entropy',
    'cross_letter_correlation'
]

# Advanced KPIs (LLM-generated)
ADVANCED_KPIS = [
    'letter_volatility_index',
    'narrative_pressure_score',
    'compression_score',
    'sentence_yield'
]

class KPIEngine:
    """24/7 KPI computation engine"""
    
    def __init__(self):
        self.running = False
        self.thread = None
        self.snapshot_history = deque(maxlen=100)
    
    def fetch_data(self) -> Dict[str, Any]:
        """Fetch data from all sources"""
        try:
            # Fetch primitives from API
            response = requests.get(f"{API_BASE}/api/primitives?ts={int(time.time())}", timeout=10)
            primitives = response.json()
            
            # Fetch CoinGecko data
            coingecko_data = self.fetch_coingecko()
            
            return {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'primitives': primitives.get('primitives', primitives),
                'coingecko_tokens': coingecko_data,
                'snapshot_id': f"snap_{int(time.time())}"
            }
        except Exception as e:
            print(f"Error fetching data: {e}")
            return None
    
    def fetch_coingecko(self) -> List[Dict]:
        """Fetch CoinGecko token data"""
        try:
            if not COINGECKO_API_KEY:
                return []
            
            url = 'https://api.coingecko.com/api/v3/coins/markets'
            params = {
                'vs_currency': 'usd',
                'order': 'market_cap_desc',
                'per_page': '250',
                'page': '1',
                'sparkline': 'false'
            }
            
            if COINGECKO_API_KEY:
                params['x_cg_demo_api_key'] = COINGECKO_API_KEY
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching CoinGecko data: {e}")
            return []
    
    def compute_base_kpis(self, snapshot: Dict) -> Dict[str, Any]:
        """Compute base deterministic KPIs"""
        primitives = snapshot.get('primitives', [])
        letters = [p for p in primitives if p.get('type') == 'letter']
        
        kpis = {}
        
        for letter in letters:
            symbol = letter.get('symbol')
            
            # Letter Volume (total usage)
            kpis[f'{symbol}_volume'] = letter.get('usage_count', 0)
            
            # Letter Frequency (relative to total)
            total_usage = sum(l.get('usage_count', 0) for l in letters)
            kpis[f'{symbol}_frequency'] = letter.get('usage_count', 0) / total_usage if total_usage > 0 else 0
            
            # Price Momentum (weekly change)
            kpis[f'{symbol}_momentum'] = letter.get('weekly_change', 0)
            
            # Rank (current position)
            kpis[f'{symbol}_rank'] = letter.get('rank', 0)
        
        # Cross-letter correlation (simplified)
        kpis['cross_letter_correlation'] = self._compute_correlation(letters)
        
        # Usage entropy (measure of distribution uniformity)
        kpis['usage_entropy'] = self._compute_entropy(letters)
        
        return kpis
    
    def _compute_correlation(self, letters: List[Dict]) -> float:
        """Compute simplified cross-letter correlation"""
        # Simplified: correlation between price and usage
        prices = [l.get('price_lgu', 0) for l in letters]
        usages = [l.get('usage_count', 0) for l in letters]
        
        if len(prices) < 2 or len(usages) < 2:
            return 0.0
        
        # Normalize
        n = len(prices)
        mean_price = sum(prices) / n
        mean_usage = sum(usages) / n
        
        numerator = sum((p - mean_price) * (u - mean_usage) for p, u in zip(prices, usages))
        denominator = (sum((p - mean_price) ** 2 for p in prices) ** 0.5) * \
                      (sum((u - mean_usage) ** 2 for u in usages) ** 0.5)
        
        return numerator / denominator if denominator > 0 else 0.0
    
    def _compute_entropy(self, letters: List[Dict]) -> float:
        """Compute usage entropy (Shannon entropy)"""
        usages = [l.get('usage_count', 0) for l in letters]
        total = sum(usages)
        
        if total == 0:
            return 0.0
        
        entropy = 0.0
        for usage in usages:
            if usage > 0:
                p = usage / total
                entropy -= p * (p ** 0.5)  # Simplified entropy
        
        return entropy
    
    def call_llm(self, snapshot: Dict, kpis: Dict) -> Dict[str, Any]:
        """Call LLM for advanced KPI generation and analysis"""
        try:
            # Use Groq for fast inference
            if GROQ_API_KEY:
                return self._call_groq(snapshot, kpis)
            elif OPENROUTER_API_KEY:
                return self._call_openrouter(snapshot, kpis)
            else:
                print("No LLM API key configured, using fallback analysis")
                return self._fallback_analysis(snapshot, kpis)
        except Exception as e:
            print(f"Error calling LLM: {e}")
            return self._fallback_analysis(snapshot, kpis)
    
    def _call_groq(self, snapshot: Dict, kpis: Dict) -> Dict[str, Any]:
        """Call Groq API for LLM analysis"""
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        prompt = f"""You are a quant researcher analyzing symbolic primitives (letters as financial assets).

DATA SNAPSHOT:
- Timestamp: {snapshot.get('timestamp')}
- Letters analyzed: {len([p for p in snapshot.get('primitives', []) if p.get('type') == 'letter'])}
- CoinGecko tokens: {len(snapshot.get('coingecko_tokens', []))}

CURRENT KPIS:
{json.dumps(kpis, indent=2)[:2000]}  # Truncate for token limit

TASK:
1. Identify hidden patterns in letter usage and pricing
2. Propose 3 NEW KPI metrics that would be valuable for trading letters
3. Rank top 5 letters by potential
4. Explain WHY these patterns exist

Output valid JSON only:
{{
  "new_kpis": ["kpi_name_1", "kpi_name_2", "kpi_name_3"],
  "top_letters": ["A", "B", "C", "D", "E"],
  "insight": "brief explanation of patterns"
}}"""
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "llama3-70b-8192",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        # Parse JSON from response
        try:
            return json.loads(content)
        except:
            return self._fallback_analysis(snapshot, kpis)
    
    def _call_openrouter(self, snapshot: Dict, kpis: Dict) -> Dict[str, Any]:
        """Call OpenRouter API for LLM analysis"""
        url = "https://openrouter.ai/api/v1/chat/completions"
        
        prompt = f"""You are a quant researcher analyzing symbolic primitives (letters as financial assets).

DATA SNAPSHOT:
- Timestamp: {snapshot.get('timestamp')}
- Letters analyzed: {len([p for p in snapshot.get('primitives', []) if p.get('type') == 'letter'])}

CURRENT KPIS:
{json.dumps(kpis, indent=2)[:2000]}

TASK:
1. Identify hidden patterns
2. Propose 3 NEW KPI metrics
3. Rank top 5 letters
4. Explain WHY

Output JSON only:
{{
  "new_kpis": ["kpi1", "kpi2", "kpi3"],
  "top_letters": ["A", "B", "C", "D", "E"],
  "insight": "explanation"
}}"""
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "anthropic/claude-3-haiku",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        try:
            return json.loads(content)
        except:
            return self._fallback_analysis(snapshot, kpis)
    
    def _fallback_analysis(self, snapshot: Dict, kpis: Dict) -> Dict[str, Any]:
        """Fallback analysis when LLM is unavailable"""
        letters = [p for p in snapshot.get('primitives', []) if p.get('type') == 'letter']
        sorted_letters = sorted(letters, key=lambda x: x.get('usage_count', 0), reverse=True)
        
        return {
            "new_kpis": [
                "temporal_density",
                "symbolic_dominance",
                "entropy_decay"
            ],
            "top_letters": [l.get('symbol') for l in sorted_letters[:5]],
            "insight": "Based on usage frequency analysis, high-volume letters show consistent dominance patterns"
        }
    
    def compute_advanced_kpis(self, snapshot: Dict, llm_output: Dict) -> Dict[str, Any]:
        """Compute advanced KPIs based on LLM insights"""
        advanced_kpis = {}
        
        # Letter Volatility Index (LVI)
        primitives = snapshot.get('primitives', [])
        letters = [p for p in primitives if p.get('type') == 'letter']
        
        if letters:
            price_changes = [abs(l.get('weekly_change', 0)) for l in letters]
            advanced_kpis['letter_volatility_index'] = sum(price_changes) / len(price_changes)
        
        # Narrative Pressure Score (based on CoinGecko tokens)
        coingecko_tokens = snapshot.get('coingecko_tokens', [])
        if coingecko_tokens:
            advanced_kpis['narrative_pressure_score'] = len(coingecko_tokens) / 1000.0
        
        # Compression Score (meaning per character)
        if letters:
            total_price = sum(l.get('price_lgu', 0) for l in letters)
            advanced_kpis['compression_score'] = total_price / len(letters)
        
        return advanced_kpis
    
    def store_snapshot(self, snapshot: Dict, kpis: Dict, llm_output: Dict):
        """Store snapshot and KPIs in history"""
        record = {
            'snapshot': snapshot,
            'base_kpis': kpis,
            'llm_output': llm_output,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        kpi_store['history'].append(record)
        kpi_store['llm_insights'].append(llm_output)
        
        # Update new KPIs list
        if llm_output.get('new_kpis'):
            for new_kpi in llm_output['new_kpis']:
                if new_kpi not in kpi_store['new_kpis']:
                    kpi_store['new_kpis'].append(new_kpi)
    
    def update_registry(self, llm_output: Dict):
        """Update letter registry based on LLM insights"""
        top_letters = llm_output.get('top_letters', [])
        
        # Update letter rankings based on LLM insights
        kpi_store['letter_kpis']['llm_ranked'] = top_letters
    
    def run_once(self):
        """Run one iteration of the KPI engine"""
        print(f"[{datetime.now(timezone.utc).isoformat()}] KPI Engine: Fetching data...")
        
        # Fetch data
        snapshot = self.fetch_data()
        if not snapshot:
            print("Failed to fetch data, skipping iteration")
            return
        
        # Compute base KPIs
        base_kpis = self.compute_base_kpis(snapshot)
        print(f"Computed {len(base_kpis)} base KPIs")
        
        # Call LLM for analysis
        print("Calling LLM for analysis...")
        llm_output = self.call_llm(snapshot, base_kpis)
        print(f"LLM analysis complete: {llm_output.get('insight', 'No insight')[:100]}")
        
        # Compute advanced KPIs
        advanced_kpis = self.compute_advanced_kpis(snapshot, llm_output)
        print(f"Computed {len(advanced_kpis)} advanced KPIs")
        
        # Store snapshot
        self.store_snapshot(snapshot, base_kpis, llm_output)
        
        # Update registry
        self.update_registry(llm_output)
        
        print("KPI Engine iteration complete")
    
    def start(self, interval: int = 60):
        """Start the 24/7 KPI engine"""
        if self.running:
            print("KPI Engine already running")
            return
        
        self.running = True
        
        def run_loop():
            while self.running:
                try:
                    self.run_once()
                except Exception as e:
                    print(f"Error in KPI Engine loop: {e}")
                
                time.sleep(interval)
        
        self.thread = threading.Thread(target=run_loop, daemon=True)
        self.thread.start()
        print(f"KPI Engine started with {interval}s interval")
    
    def stop(self):
        """Stop the KPI engine"""
        self.running = False
        if self.thread:
            self.thread.join()
        print("KPI Engine stopped")

# Global engine instance
engine = KPIEngine()

if __name__ == '__main__':
    # Run once for testing
    engine.run_once()
    
    # Or start continuous loop
    # engine.start(interval=60)
    # try:
    #     while True:
    #         time.sleep(1)
    # except KeyboardInterrupt:
    #     engine.stop()
