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
COINMARKETCAP_API_KEY = os.getenv('COINMARKETCAP_API_KEY', '')
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
ETHERSCAN_API_KEY = os.getenv('ETHERSCAN_API_KEY', '')
BASESCAN_API_KEY = os.getenv('BASESCAN_API_KEY', '')
ALCHEMY_API_KEY = os.getenv('ALCHEMY_API_KEY', '')
MORALIS_API_KEY = os.getenv('MORALIS_API_KEY', '')
COVALENT_API_KEY = os.getenv('COVALENT_API_KEY', '')
HELIUS_API_KEY = os.getenv('HELIUS_API_KEY', '')
NEWSAPI_API_KEY = os.getenv('NEWSAPI_API_KEY', '')
NYT_API_KEY = os.getenv('NYT_API_KEY', '')

# Data sources
API_BASE = os.getenv('API_BASE', 'https://language-fi.vercel.app')

# KPI storage (in-memory for now, move to database later)
kpi_store = {
    'letter_kpis': {},
    'history': deque(maxlen=1000),  # Keep last 1000 snapshots
    'new_kpis': [],
    'llm_insights': [],
    'historical_kpis': {},  # Historical tracking per letter/KPI
    'kpi_evolution': {},  # KPI evolution metrics
    'reasoning_history': deque(maxlen=500)  # LLM reasoning history
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
            
            # Fetch from multiple data sources in parallel
            print("Fetching data from multiple sources...")
            
            # CoinGecko
            coingecko_data = self.fetch_coingecko()
            print(f"CoinGecko: {len(coingecko_data) if coingecko_data else 0} tokens")
            
            # Gate.io
            gateio_data = self.fetch_gateio()
            print(f"Gate.io: {len(gateio_data) if gateio_data else 0} tokens")
            
            # CoinMarketCap
            cmc_data = self.fetch_coinmarketcap()
            print(f"CoinMarketCap: {len(cmc_data) if cmc_data else 0} tokens")
            
            # Dexscreener
            dexscreener_data = self.fetch_dexscreener()
            print(f"Dexscreener: {len(dexscreener_data) if dexscreener_data else 0} pairs")
            
            return {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'primitives': primitives.get('primitives', primitives),
                'coingecko_tokens': coingecko_data,
                'gateio_tokens': gateio_data,
                'coinmarketcap_tokens': cmc_data,
                'dexscreener_pairs': dexscreener_data,
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
    
    def fetch_gateio(self) -> List[Dict]:
        """Fetch Gate.io token data"""
        try:
            url = 'https://api.gateio.ws/api/v4/spot/tickers'
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data if isinstance(data, list) else []
        except Exception as e:
            print(f"Error fetching Gate.io data: {e}")
            return []
    
    def fetch_coinmarketcap(self) -> List[Dict]:
        """Fetch CoinMarketCap token data"""
        try:
            if not COINMARKETCAP_API_KEY:
                return []
            
            url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest'
            headers = {
                'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY
            }
            params = {
                'start': '1',
                'limit': '250',
                'convert': 'USD'
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get('data', []) if isinstance(data, dict) else []
        except Exception as e:
            print(f"Error fetching CoinMarketCap data: {e}")
            return []
    
    def fetch_dexscreener(self, query: str = '') -> List[Dict]:
        """Fetch Dexscreener DEX data"""
        try:
            if query:
                url = f'https://api.dexscreener.com/latest/dex/search?q={query}'
            else:
                url = 'https://api.dexscreener.com/latest/dex/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'  # WETH as default
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get('pairs', []) if isinstance(data, dict) else []
        except Exception as e:
            print(f"Error fetching Dexscreener data: {e}")
            return []
    
    def count_characters_from_all_sources(self, snapshot: Dict) -> Dict[str, int]:
        """Count character occurrences from all data sources"""
        char_counts = {}
        
        # Count from primitives (existing data)
        primitives = snapshot.get('primitives', [])
        for primitive in primitives:
            name = primitive.get('name', '').upper()
            symbol = primitive.get('symbol', '').upper()
            
            for char in name:
                if char.isalnum() or char == ' ':
                    char_counts[char] = char_counts.get(char, 0) + 1
            
            for char in symbol:
                if char.isalnum():
                    char_counts[char] = char_counts.get(char, 0) + 1
        
        # Count from CoinGecko tokens
        coingecko_tokens = snapshot.get('coingecko_tokens', [])
        for token in coingecko_tokens:
            name = token.get('name', '').upper()
            symbol = token.get('symbol', '').upper()
            
            for char in name:
                if char.isalnum() or char == ' ':
                    char_counts[char] = char_counts.get(char, 0) + 1
            
            for char in symbol:
                if char.isalnum():
                    char_counts[char] = char_counts.get(char, 0) + 1
        
        # Count from Gate.io tokens
        gateio_tokens = snapshot.get('gateio_tokens', [])
        for token in gateio_tokens:
            symbol = token.get('currency_pair', '').upper()
            for char in symbol:
                if char.isalnum():
                    char_counts[char] = char_counts.get(char, 0) + 1
        
        # Count from CoinMarketCap tokens
        cmc_tokens = snapshot.get('coinmarketcap_tokens', [])
        for token in cmc_tokens:
            name = token.get('name', '').upper()
            symbol = token.get('symbol', '').upper()
            
            for char in name:
                if char.isalnum() or char == ' ':
                    char_counts[char] = char_counts.get(char, 0) + 1
            
            for char in symbol:
                if char.isalnum():
                    char_counts[char] = char_counts.get(char, 0) + 1
        
        # Count from Dexscreener pairs
        dex_pairs = snapshot.get('dexscreener_pairs', [])
        for pair in dex_pairs:
            base_token = pair.get('baseToken', {})
            quote_token = pair.get('quoteToken', {})
            
            for token in [base_token, quote_token]:
                symbol = token.get('symbol', '').upper()
                for char in symbol:
                    if char.isalnum():
                        char_counts[char] = char_counts.get(char, 0) + 1
        
        return char_counts
    
    def compute_base_kpis(self, snapshot: Dict) -> Dict[str, Any]:
        """Compute base deterministic KPIs from all data sources"""
        # Count characters from all sources
        char_counts = self.count_characters_from_all_sources(snapshot)
        
        primitives = snapshot.get('primitives', [])
        letters = [p for p in primitives if p.get('type') == 'letter']
        
        kpis = {}
        
        for letter in letters:
            symbol = letter.get('symbol')
            
            # Letter Volume (total usage from all sources)
            kpis[f'{symbol}_volume'] = char_counts.get(symbol.upper(), 0)
            
            # Letter Frequency (relative to total from all sources)
            total_chars = sum(char_counts.values()) if char_counts else 1
            kpis[f'{symbol}_frequency'] = char_counts.get(symbol.upper(), 0) / total_chars if total_chars > 0 else 0
            
            # Price Momentum (weekly change)
            kpis[f'{symbol}_momentum'] = letter.get('weekly_change', 0)
            
            # Rank (current position)
            kpis[f'{symbol}_rank'] = letter.get('rank', 0)
        
        # Cross-letter correlation (simplified)
        kpis['cross_letter_correlation'] = self._compute_correlation(letters)
        
        # Usage entropy (measure of distribution uniformity)
        kpis['usage_entropy'] = self._compute_entropy_from_counts(char_counts)
        
        # Data source diversity
        kpis['data_sources_count'] = len([s for s in snapshot.keys() if 'tokens' in s or 'pairs' in s])
        
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
    
    def _compute_entropy_from_counts(self, char_counts: Dict[str, int]) -> float:
        """Compute usage entropy from character counts"""
        total = sum(char_counts.values())
        
        if total == 0:
            return 0.0
        
        entropy = 0.0
        for count in char_counts.values():
            if count > 0:
                p = count / total
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
    
    def track_historical_kpis(self, kpis: Dict, timestamp: str):
        """Track KPI values over time for historical analysis"""
        for kpi_name, kpi_value in kpis.items():
            if kpi_name not in kpi_store['historical_kpis']:
                kpi_store['historical_kpis'][kpi_name] = deque(maxlen=100)
            
            kpi_store['historical_kpis'][kpi_name].append({
                'value': kpi_value,
                'timestamp': timestamp
            })
    
    def compute_kpi_evolution(self):
        """Compute KPI evolution metrics (trends, velocity, acceleration)"""
        evolution = {}
        
        for kpi_name, history in kpi_store['historical_kpis'].items():
            if len(history) < 2:
                continue
            
            # Get recent values
            recent = list(history)[-10:]  # Last 10 data points
            values = [point['value'] for point in recent]
            
            # Calculate trend (linear regression slope)
            n = len(values)
            if n >= 2:
                x = list(range(n))
                sum_x = sum(x)
                sum_y = sum(values)
                sum_xy = sum(xi * yi for xi, yi in zip(x, values))
                sum_x2 = sum(xi ** 2 for xi in x)
                
                slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2) if (n * sum_x2 - sum_x ** 2) != 0 else 0
                
                # Calculate velocity (rate of change)
                velocity = (values[-1] - values[0]) / n if n > 0 else 0
                
                # Calculate acceleration (change in velocity)
                if n >= 3:
                    velocities = [(values[i] - values[i-1]) for i in range(1, n)]
                    acceleration = (velocities[-1] - velocities[0]) / len(velocities) if len(velocities) > 0 else 0
                else:
                    acceleration = 0
                
                evolution[kpi_name] = {
                    'trend': slope,
                    'velocity': velocity,
                    'acceleration': acceleration,
                    'current_value': values[-1],
                    'change_percent': ((values[-1] - values[0]) / values[0] * 100) if values[0] != 0 else 0,
                    'volatility': (max(values) - min(values)) / n if n > 0 else 0
                }
        
        kpi_store['kpi_evolution'] = evolution
        return evolution
    
    def llm_reasoning_loop(self, evolution: Dict, current_kpis: Dict) -> Dict[str, Any]:
        """LLM reasoning loop to analyze KPI evolution and propose improvements"""
        try:
            if GROQ_API_KEY:
                return self._llm_reasoning_groq(evolution, current_kpis)
            elif OPENROUTER_API_KEY:
                return self._llm_reasoning_openrouter(evolution, current_kpis)
            else:
                return self._fallback_reasoning(evolution, current_kpis)
        except Exception as e:
            print(f"Error in LLM reasoning loop: {e}")
            return self._fallback_reasoning(evolution, current_kpis)
    
    def _llm_reasoning_groq(self, evolution: Dict, current_kpis: Dict) -> Dict[str, Any]:
        """LLM reasoning using Groq"""
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        # Get top evolving KPIs
        top_evolution = sorted(evolution.items(), key=lambda x: abs(x[1].get('velocity', 0)), reverse=True)[:5]
        
        prompt = f"""You are a quant researcher analyzing KPI evolution for letter primitives.

KPI EVOLUTION DATA:
{json.dumps(dict(top_evolution), indent=2)[:1500]}

CURRENT KPIS:
{json.dumps(current_kpis, indent=2)[:1000]}

TASK:
1. Analyze the evolution patterns - which KPIs are accelerating/decelerating?
2. Identify emerging trends that weren't visible before
3. Propose 3 NEW KPI metrics to capture these trends
4. Recommend which letters are showing momentum
5. Suggest improvements to the existing KPI calculation methodology

Output JSON only:
{{
  "trend_analysis": "summary of evolution patterns",
  "emerging_trends": ["trend1", "trend2", "trend3"],
  "new_kpis": [
    {{"name": "kpi_name", "formula": "how to compute", "reason": "why valuable"}},
    ...
  ],
  "momentum_letters": ["A", "B", "C"],
  "methodology_improvements": ["improvement1", "improvement2"]
}}"""
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "llama3-70b-8192",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 800
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        try:
            return json.loads(content)
        except:
            return self._fallback_reasoning(evolution, current_kpis)
    
    def _llm_reasoning_openrouter(self, evolution: Dict, current_kpis: Dict) -> Dict[str, Any]:
        """LLM reasoning using OpenRouter"""
        url = "https://openrouter.ai/api/v1/chat/completions"
        
        top_evolution = sorted(evolution.items(), key=lambda x: abs(x[1].get('velocity', 0)), reverse=True)[:5]
        
        prompt = f"""You are a quant researcher analyzing KPI evolution.

EVOLUTION DATA:
{json.dumps(dict(top_evolution), indent=2)[:1500]}

TASK:
1. Analyze evolution patterns
2. Identify emerging trends
3. Propose 3 new KPIs with formulas
4. Recommend momentum letters
5. Suggest methodology improvements

Output JSON only:
{{
  "trend_analysis": "summary",
  "emerging_trends": ["trend1", "trend2"],
  "new_kpis": [
    {{"name": "kpi", "formula": "how", "reason": "why"}}
  ],
  "momentum_letters": ["A", "B"],
  "methodology_improvements": ["imp1"]
}}"""
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "anthropic/claude-3-haiku",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 800
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        try:
            return json.loads(content)
        except:
            return self._fallback_reasoning(evolution, current_kpis)
    
    def _fallback_reasoning(self, evolution: Dict, current_kpis: Dict) -> Dict[str, Any]:
        """Fallback reasoning when LLM unavailable"""
        # Identify top changing KPIs
        top_changes = sorted(evolution.items(), key=lambda x: abs(x[1].get('velocity', 0)), reverse=True)[:3]
        
        return {
            "trend_analysis": f"Top changing KPIs: {', '.join(k[0] for k in top_changes)}",
            "emerging_trends": ["volatility_concentration", "momentum_shift", "entropy_stabilization"],
            "new_kpis": [
                {"name": "trend_momentum", "formula": "velocity * acceleration", "reason": "captures directional strength"},
                {"name": "volatility_decay", "formula": "current_volatility / historical_avg", "reason": "measures volatility persistence"},
                {"name": "trend_convergence", "formula": "correlation_of_trends", "reason": "identifies synchronized movements"}
            ],
            "momentum_letters": ["A", "E", "T"],
            "methodology_improvements": ["add weighted moving averages", "implement anomaly detection"]
        }
    
    def store_snapshot(self, snapshot: Dict, kpis: Dict, llm_output: Dict):
        """Store snapshot and KPIs in history"""
        timestamp = datetime.now(timezone.utc).isoformat()
        
        record = {
            'snapshot': snapshot,
            'base_kpis': kpis,
            'llm_output': llm_output,
            'timestamp': timestamp
        }
        
        kpi_store['history'].append(record)
        kpi_store['llm_insights'].append(llm_output)
        
        # Track historical KPIs
        self.track_historical_kpis(kpis, timestamp)
        
        # Compute KPI evolution
        evolution = self.compute_kpi_evolution()
        
        # Update new KPIs list
        if llm_output.get('new_kpis'):
            for new_kpi in llm_output['new_kpis']:
                if new_kpi not in kpi_store['new_kpis']:
                    kpi_store['new_kpis'].append(new_kpi)
        
        return evolution
    
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
        
        # Call LLM for initial analysis
        print("Calling LLM for initial analysis...")
        llm_output = self.call_llm(snapshot, base_kpis)
        print(f"LLM analysis complete: {llm_output.get('insight', 'No insight')[:100]}")
        
        # Compute advanced KPIs
        advanced_kpis = self.compute_advanced_kpis(snapshot, llm_output)
        print(f"Computed {len(advanced_kpis)} advanced KPIs")
        
        # Store snapshot and compute evolution
        evolution = self.store_snapshot(snapshot, base_kpis, llm_output)
        print(f"Computed evolution for {len(evolution)} KPIs")
        
        # Run LLM reasoning loop on evolution
        if len(kpi_store['historical_kpis']) > 5:  # Only run if we have enough history
            print("Running LLM reasoning loop on KPI evolution...")
            reasoning_output = self.llm_reasoning_loop(evolution, base_kpis)
            kpi_store['reasoning_history'].append({
                'reasoning': reasoning_output,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
            print(f"Reasoning complete: {reasoning_output.get('trend_analysis', 'No analysis')[:100]}")
        
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
