#!/usr/bin/env python3
"""
Language.fi KPI Engine
24/7 continuous intelligence system for letter quantification and number dequantification
"""

import os
import requests
import time
import json
import sqlite3
from datetime import datetime, timezone
from typing import Dict, List, Any
from collections import deque
import threading
import hashlib

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

# Disable CoinMarketCap if no API key
DISABLE_CMC = not COINMARKETCAP_API_KEY
if DISABLE_CMC:
    print("CoinMarketCap disabled - no API key configured")

# Data sources
API_BASE = os.getenv('API_BASE', 'https://language-fi.vercel.app')

# Database
DB_PATH = os.getenv('DB_PATH', 'kpi_history.db')

def init_database():
    """Initialize SQLite database for KPI history persistence"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # KPI history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS kpi_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            snapshot_id TEXT NOT NULL,
            kpi_data TEXT NOT NULL,
            letter_prices TEXT NOT NULL,
            char_attribution TEXT NOT NULL,
            token_letter_stats TEXT NOT NULL,
            total_tokens INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Price history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            letter TEXT NOT NULL,
            price REAL NOT NULL,
            volume INTEGER NOT NULL,
            frequency REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # LLM analysis history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS llm_analysis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            analysis_data TEXT NOT NULL,
            new_kpis TEXT NOT NULL,
            oracleification_analysis TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Evolution history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS evolution_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            evolution_data TEXT NOT NULL,
            price_evolution TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def save_kpi_snapshot(snapshot_id: str, timestamp: str, kpis: Dict, prices: Dict, attribution: Dict, stats: Dict, total_tokens: int):
    """Save KPI snapshot to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO kpi_history (snapshot_id, timestamp, kpi_data, letter_prices, char_attribution, token_letter_stats, total_tokens)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        snapshot_id,
        timestamp,
        json.dumps(kpis),
        json.dumps(prices),
        json.dumps(attribution),
        json.dumps(stats),
        total_tokens
    ))
    
    conn.commit()
    conn.close()

def save_price_history(timestamp: str, letter: str, price: float, volume: int, frequency: float):
    """Save price history to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO price_history (timestamp, letter, price, volume, frequency)
        VALUES (?, ?, ?, ?, ?)
    ''', (timestamp, letter, price, volume, frequency))
    
    conn.commit()
    conn.close()

def save_llm_analysis(timestamp: str, analysis: Dict, new_kpis: List, oracleification: Dict):
    """Save LLM analysis to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO llm_analysis_history (timestamp, analysis_data, new_kpis, oracleification_analysis)
        VALUES (?, ?, ?, ?)
    ''', (
        timestamp,
        json.dumps(analysis),
        json.dumps(new_kpis),
        json.dumps(oracleification)
    ))
    
    conn.commit()
    conn.close()

def save_evolution_history(timestamp: str, evolution: Dict, price_evolution: Dict):
    """Save evolution history to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO evolution_history (timestamp, evolution_data, price_evolution)
        VALUES (?, ?, ?)
    ''', (timestamp, json.dumps(evolution), json.dumps(price_evolution)))
    
    conn.commit()
    conn.close()

def get_kpi_history(limit: int = 100) -> List[Dict]:
    """Get KPI history from database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT snapshot_id, timestamp, kpi_data, letter_prices, char_attribution, total_tokens
        FROM kpi_history
        ORDER BY created_at DESC
        LIMIT ?
    ''', (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            'snapshot_id': row[0],
            'timestamp': row[1],
            'kpi_data': json.loads(row[2]),
            'letter_prices': json.loads(row[3]),
            'char_attribution': json.loads(row[4]),
            'total_tokens': row[5]
        }
        for row in rows
    ]

def get_price_history(letter: str = None, limit: int = 100) -> List[Dict]:
    """Get price history from database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if letter:
        cursor.execute('''
            SELECT timestamp, letter, price, volume, frequency
            FROM price_history
            WHERE letter = ?
            ORDER BY created_at DESC
            LIMIT ?
        ''', (letter.upper(), limit))
    else:
        cursor.execute('''
            SELECT timestamp, letter, price, volume, frequency
            FROM price_history
            ORDER BY created_at DESC
            LIMIT ?
        ''', (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            'timestamp': row[0],
            'letter': row[1],
            'price': row[2],
            'volume': row[3],
            'frequency': row[4]
        }
        for row in rows
    ]

def validate_llm_output(llm_output: Dict) -> Dict:
    """Validate LLM output to prevent hallucinations and ensure data integrity"""
    validated = llm_output.copy()
    warnings = []
    
    # Validate new_kpis structure
    if 'new_kpis' in llm_output:
        valid_kpis = []
        for kpi in llm_output['new_kpis']:
            if isinstance(kpi, dict):
                # Check required fields
                if 'name' in kpi and 'formula' in kpi:
                    # Validate name is a string and not empty
                    if isinstance(kpi['name'], str) and len(kpi['name'].strip()) > 0:
                        # Validate formula is a string and not empty
                        if isinstance(kpi['formula'], str) and len(kpi['formula'].strip()) > 0:
                            valid_kpis.append(kpi)
                        else:
                            warnings.append(f"Invalid formula for KPI: {kpi.get('name', 'unknown')}")
                    else:
                        warnings.append(f"Invalid name for KPI")
                else:
                    warnings.append("KPI missing required fields (name, formula)")
            else:
                warnings.append("KPI is not a dictionary")
        validated['new_kpis'] = valid_kpis
    
    # Validate oracleification_analysis structure
    if 'oracleification_analysis' in llm_output:
        analysis = llm_output['oracleification_analysis']
        if isinstance(analysis, dict):
            # Validate most_oracleified_letters is a list of strings
            if 'most_oracleified_letters' in analysis:
                letters = analysis['most_oracleified_letters']
                if isinstance(letters, list):
                    valid_letters = [l for l in letters if isinstance(l, str) and len(l) == 1 and l.isalpha()]
                    if len(valid_letters) != len(letters):
                        warnings.append(f"Filtered invalid letters: {len(letters) - len(valid_letters)}")
                    validated['oracleification_analysis']['most_oracleified_letters'] = valid_letters
                else:
                    warnings.append("most_oracleified_letters is not a list")
                    validated['oracleification_analysis']['most_oracleified_letters'] = []
            
            # Validate source_diversity_scores are numeric
            if 'source_diversity_scores' in analysis:
                scores = analysis['source_diversity_scores']
                if isinstance(scores, dict):
                    valid_scores = {}
                    for k, v in scores.items():
                        if isinstance(v, (int, float)) and 0 <= v <= 1:
                            valid_scores[k] = v
                        else:
                            warnings.append(f"Invalid score for {k}: {v}")
                    validated['oracleification_analysis']['source_diversity_scores'] = valid_scores
        else:
            warnings.append("oracleification_analysis is not a dictionary")
            validated['oracleification_analysis'] = {}
    
    # Validate momentum_letters
    if 'momentum_letters' in llm_output:
        letters = llm_output['momentum_letters']
        if isinstance(letters, list):
            valid_letters = [l for l in letters if isinstance(l, str) and len(l) == 1 and l.isalpha()]
            if len(valid_letters) != len(letters):
                warnings.append(f"Filtered invalid momentum letters: {len(letters) - len(valid_letters)}")
            validated['momentum_letters'] = valid_letters
        else:
            warnings.append("momentum_letters is not a list")
            validated['momentum_letters'] = []
    
    # Validate trend_analysis is a string
    if 'trend_analysis' in llm_output:
        if not isinstance(llm_output['trend_analysis'], str):
            warnings.append("trend_analysis is not a string")
            validated['trend_analysis'] = ""
    
    # Add validation metadata
    validated['validation'] = {
        'warnings': warnings,
        'original_kpi_count': len(llm_output.get('new_kpis', [])),
        'validated_kpi_count': len(validated.get('new_kpis', [])),
        'validation_timestamp': datetime.now(timezone.utc).isoformat()
    }
    
    if warnings:
        print(f"LLM validation warnings: {warnings}")
    
    return validated

# Market feedback loop storage
market_feedback_store = {
    'price_adjustments': deque(maxlen=100),
    'user_signals': deque(maxlen=1000),
    'market_volatility': deque(maxlen=100)
}

def record_market_signal(letter: str, signal_type: str, strength: float, source: str = 'system'):
    """Record a market signal for price adjustment feedback"""
    market_feedback_store['user_signals'].append({
        'letter': letter,
        'signal_type': signal_type,
        'strength': strength,
        'source': source,
        'timestamp': datetime.now(timezone.utc).isoformat()
    })

def calculate_market_feedback_adjustment(letter: str, current_price: float) -> float:
    """Calculate price adjustment based on market feedback signals"""
    # Get recent signals for this letter
    recent_signals = [
        s for s in market_feedback_store['user_signals']
        if s['letter'] == letter and
        (datetime.now(timezone.utc) - datetime.fromisoformat(s['timestamp'].replace('Z', '+00:00'))).total_seconds() < 3600
    ]
    
    if not recent_signals:
        return 0.0
    
    # Calculate weighted signal strength
    buy_signals = [s['strength'] for s in recent_signals if s['signal_type'] == 'buy']
    sell_signals = [s['strength'] for s in recent_signals if s['signal_type'] == 'sell']
    
    buy_strength = sum(buy_signals) if buy_signals else 0
    sell_strength = sum(sell_signals) if sell_signals else 0
    
    net_strength = buy_strength - sell_strength
    
    # Cap adjustment at ±20%
    adjustment = max(min(net_strength / 10, 0.2), -0.2)
    
    return adjustment

def apply_market_feedback_to_prices(prices: Dict[str, float]) -> Dict[str, float]:
    """Apply market feedback adjustments to prices"""
    adjusted_prices = {}
    
    for letter, price in prices.items():
        adjustment = calculate_market_feedback_adjustment(letter, price)
        adjusted_price = price * (1 + adjustment)
        adjusted_prices[letter] = round(adjusted_price, 4)
        
        # Record adjustment for tracking
        if abs(adjustment) > 0.01:  # Only record significant adjustments
            market_feedback_store['price_adjustments'].append({
                'letter': letter,
                'original_price': price,
                'adjusted_price': adjusted_price,
                'adjustment': adjustment,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
    
    return adjusted_prices

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
    """24/7 KPI computation engine with database persistence"""
    
    def __init__(self):
        self.running = False
        self.thread = None
        self.snapshot_history = deque(maxlen=100)
        # Initialize database on startup
        init_database()
    
    def fetch_data(self) -> Dict[str, Any]:
        """Fetch data from all sources (CoinGecko + no API keys)"""
        try:
            # Fetch primitives from API
            response = requests.get(f"{API_BASE}/api/primitives?ts={int(time.time())}", timeout=10)
            primitives = response.json()
            
            # Fetch from multiple data sources in parallel
            print("Fetching data from multiple sources...")
            
            # CoinGecko (demo key optional - works without key too)
            coingecko_data = self.fetch_coingecko()
            print(f"CoinGecko: {len(coingecko_data) if coingecko_data else 0} tokens")
            
            # CoinMarketCap (API key required)
            cmc_data = self.fetch_coinmarketcap()
            print(f"CoinMarketCap: {len(cmc_data) if cmc_data else 0} tokens")
            
            # Gate.io (no API key)
            gateio_data = self.fetch_gateio()
            print(f"Gate.io: {len(gateio_data) if gateio_data else 0} tokens")
            
            # Etherscan (API key required)
            etherscan_data = self.fetch_etherscan()
            print(f"Etherscan: {len(etherscan_data) if etherscan_data else 0} transactions")
            
            # Basescan (API key required)
            basescan_data = self.fetch_basescan()
            print(f"Basescan: {len(basescan_data) if basescan_data else 0} transactions")
            
            # Birdeye (no API key)
            birdeye_data = self.fetch_birdeye()
            print(f"Birdeye: {len(birdeye_data) if birdeye_data else 0} tokens")
            
            # Helius (API key required)
            helius_data = self.fetch_helius()
            print(f"Helius: {'connected' if helius_data else 'failed'}")
            
            # Dexscreener (no API key)
            dexscreener_data = self.fetch_dexscreener()
            print(f"Dexscreener: {len(dexscreener_data) if dexscreener_data else 0} pairs")
            
            # Solana RPC (public)
            solana_data = self.fetch_solana_rpc()
            print(f"Solana RPC: {'connected' if solana_data else 'failed'}")
            
            # Ethereum RPC (public)
            ethereum_data = self.fetch_ethereum_rpc()
            print(f"Ethereum RPC: {'connected' if ethereum_data else 'failed'}")
            
            # Base RPC (public)
            base_data = self.fetch_base_rpc()
            print(f"Base RPC: {'connected' if base_data else 'failed'}")
            
            # Jupiter Token List (public)
            jupiter_data = self.fetch_jupiter_token_list()
            print(f"Jupiter: {len(jupiter_data) if jupiter_data else 0} tokens")
            
            # Uniswap Token List (public)
            uniswap_data = self.fetch_uniswap_token_list()
            print(f"Uniswap: {len(uniswap_data) if uniswap_data else 0} tokens")
            
            # Wikipedia (public)
            wikipedia_data = self.fetch_wikipedia_data('cryptocurrency')
            print(f"Wikipedia: {len(wikipedia_data) if wikipedia_data else 0} results")
            
            return {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'primitives': primitives.get('primitives', primitives),
                'coingecko_tokens': coingecko_data,
                'coinmarketcap_tokens': cmc_data,
                'gateio_tokens': gateio_data,
                'etherscan_txs': etherscan_data,
                'basescan_txs': basescan_data,
                'birdeye_tokens': birdeye_data,
                'helius_data': helius_data,
                'dexscreener_pairs': dexscreener_data,
                'solana_rpc': solana_data,
                'ethereum_rpc': ethereum_data,
                'base_rpc': base_data,
                'jupiter_tokens': jupiter_data,
                'uniswap_tokens': uniswap_data,
                'wikipedia_results': wikipedia_data,
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
            # Fetch tickers
            tickers_url = 'https://api.gateio.ws/api/v4/spot/tickers'
            tickers = requests.get(tickers_url, timeout=30).json()
            
            return tickers if isinstance(tickers, list) else []
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
    
    def fetch_etherscan(self) -> List[Dict]:
        """Fetch Etherscan token data"""
        try:
            if not ETHERSCAN_API_KEY:
                return []
            
            url = 'https://api.etherscan.io/api'
            params = {
                'module': 'account',
                'action': 'tokentx',
                'address': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',  # WETH
                'apikey': ETHERSCAN_API_KEY
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get('result', []) if isinstance(data, dict) else []
        except Exception as e:
            print(f"Error fetching Etherscan data: {e}")
            return []
    
    def fetch_basescan(self) -> List[Dict]:
        """Fetch Basescan token data"""
        try:
            if not BASESCAN_API_KEY:
                return []
            
            url = 'https://api.basescan.org/api'
            params = {
                'module': 'account',
                'action': 'tokentx',
                'address': '0x4200000000000000000000000000000000000006',  # WETH on Base
                'apikey': BASESCAN_API_KEY
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get('result', []) if isinstance(data, dict) else []
        except Exception as e:
            print(f"Error fetching Basescan data: {e}")
            return []
    
    def fetch_birdeye(self) -> List[Dict]:
        """Fetch Birdeye token data"""
        try:
            url = 'https://public-api.birdeye.so/defi/tokenlist'
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get('data', {}).get('tokens', []) if isinstance(data, dict) else []
        except Exception as e:
            print(f"Error fetching Birdeye data: {e}")
            return []
    
    def fetch_helius(self) -> Dict[str, Any]:
        """Fetch Helius Solana data"""
        try:
            if not HELIUS_API_KEY:
                return {}
            
            url = f'https://api.helius.xyz/v0/token-metadata?api-key={HELIUS_API_KEY}'
            params = {
                'mintAddresses': ['So11111111111111111111111111111111111111112']  # SOL
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching Helius data: {e}")
            return {}
    
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
    
    def fetch_solana_rpc(self) -> Dict[str, Any]:
        """Fetch data from Solana public RPC"""
        try:
            url = 'https://api.mainnet-beta.solana.com'
            headers = {'Content-Type': 'application/json'}
            
            # Get recent block
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getLatestBlockhash"
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching Solana RPC data: {e}")
            return {}
    
    def fetch_ethereum_rpc(self) -> Dict[str, Any]:
        """Fetch data from Ethereum public RPC"""
        try:
            url = 'https://eth.llamarpc.com'  # Public Ethereum RPC
            headers = {'Content-Type': 'application/json'}
            
            # Get latest block
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_getBlockByNumber",
                "params": ["latest", False]
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching Ethereum RPC data: {e}")
            return {}
    
    def fetch_base_rpc(self) -> Dict[str, Any]:
        """Fetch data from Base public RPC"""
        try:
            url = 'https://mainnet.base.org'  # Public Base RPC
            headers = {'Content-Type': 'application/json'}
            
            # Get latest block
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_getBlockByNumber",
                "params": ["latest", False]
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching Base RPC data: {e}")
            return {}
    
    def fetch_jupiter_token_list(self) -> List[Dict]:
        """Fetch Jupiter token list (public)"""
        try:
            url = 'https://token.jup.ag/all'
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.json() if isinstance(response.json(), list) else []
        except Exception as e:
            print(f"Error fetching Jupiter token list: {e}")
            return []
    
    def fetch_uniswap_token_list(self) -> List[Dict]:
        """Fetch Uniswap token list (public)"""
        try:
            url = 'https://tokens.uniswap.org'
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.json().get('tokens', []) if isinstance(response.json(), dict) else []
        except Exception as e:
            print(f"Error fetching Uniswap token list: {e}")
            return []
    
    def fetch_wikipedia_data(self, query: str = 'cryptocurrency') -> List[Dict]:
        """Fetch Wikipedia data (public API)"""
        try:
            url = 'https://en.wikipedia.org/w/api.php'
            params = {
                'action': 'query',
                'list': 'search',
                'srsearch': query,
                'format': 'json',
                'utf8': '',
                'srlimit': '50'
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get('query', {}).get('search', []) if isinstance(data, dict) else []
        except Exception as e:
            print(f"Error fetching Wikipedia data: {e}")
            return []
    
    def count_characters_with_attribution(self, snapshot: Dict) -> Dict[str, Dict]:
        """Count character occurrences with source/topic attribution and timeline"""
        char_data = {}
        timestamp = datetime.now(timezone.utc)
        
        def add_char(char, source, topic, token_info=None):
            if char.isalnum() or char == ' ':
                char_upper = char.upper()
                if char_upper not in char_data:
                    char_data[char_upper] = {
                        'total_count': 0,
                        'sources': {},
                        'topics': {},
                        'tokens': {},
                        'timeline': []
                    }
                char_data[char_upper]['total_count'] += 1
                
                # Track source
                if source not in char_data[char_upper]['sources']:
                    char_data[char_upper]['sources'][source] = 0
                char_data[char_upper]['sources'][source] += 1
                
                # Track topic
                if topic not in char_data[char_upper]['topics']:
                    char_data[char_upper]['topics'][topic] = 0
                char_data[char_upper]['topics'][topic] += 1
                
                # Track token info (as dict for easier querying)
                if token_info:
                    token_key = token_info.get('symbol', token_info.get('name', 'unknown'))
                    if token_key not in char_data[char_upper]['tokens']:
                        char_data[char_upper]['tokens'][token_key] = 0
                    char_data[char_upper]['tokens'][token_key] += 1
        
        # Count from CoinGecko tokens with attribution
        coingecko_tokens = snapshot.get('coingecko_tokens', [])
        for token in coingecko_tokens:
            name = token.get('name', '').upper()
            symbol = token.get('symbol', '').upper()
            category = token.get('category', 'unknown')
            
            for char in name:
                add_char(char, 'CoinGecko', category, {'symbol': symbol, 'name': name})
            for char in symbol:
                add_char(char, 'CoinGecko', category, {'symbol': symbol, 'name': name})
        
        # Count from Gate.io tokens
        gateio_tokens = snapshot.get('gateio_tokens', [])
        for token in gateio_tokens:
            symbol = token.get('currency_pair', '').upper()
            for char in symbol:
                add_char(char, 'Gate.io', 'trading_pair', {'pair': symbol})
        
        # Count from CoinMarketCap tokens (skip if disabled)
        if not DISABLE_CMC:
            cmc_tokens = snapshot.get('coinmarketcap_tokens', [])
            for token in cmc_tokens:
                name = token.get('name', '').upper()
                symbol = token.get('symbol', '').upper()
                category = token.get('category', 'unknown')
                
                for char in name:
                    add_char(char, 'CoinMarketCap', category, {'symbol': symbol, 'name': name})
                for char in symbol:
                    add_char(char, 'CoinMarketCap', category, {'symbol': symbol, 'name': name})
        
        # Count from Dexscreener pairs
        dex_pairs = snapshot.get('dexscreener_pairs', [])
        for pair in dex_pairs:
            base_token = pair.get('baseToken', {}).get('symbol', '').upper()
            for char in base_token:
                add_char(char, 'Dexscreener', 'dex_pair', {'pair': base_token})
        
        # Count from Solana RPC domains
        solana_domains = snapshot.get('solana_domains', [])
        for domain in solana_domains:
            domain_name = domain.get('name', '').upper()
            for char in domain_name:
                add_char(char, 'Solana_RPC', 'domain', {'domain': domain_name})
        
        # Count from Solana NFT collections
        solana_nfts = snapshot.get('solana_nft_collections', [])
        for nft in solana_nfts:
            nft_name = nft.get('name', '').upper()
            for char in nft_name:
                add_char(char, 'Solana_RPC', 'nft', {'nft': nft_name})
        
        # Count from Solana token names
        solana_tokens = snapshot.get('solana_token_names', [])
        for token in solana_tokens:
            token_name = token.get('name', '').upper()
            for char in token_name:
                add_char(char, 'Solana_RPC', 'token', {'token': token_name})
        
        # Count from Wikipedia
        wiki_results = snapshot.get('wikipedia_results', [])
        for result in wiki_results:
            title = result.get('title', '').upper()
            snippet = result.get('snippet', '').upper()
            
            for char in title:
                add_char(char, 'Wikipedia', 'crypto_search', {'title': title})
            for char in snippet:
                add_char(char, 'Wikipedia', 'crypto_search', {'title': title})
        
        # Add timeline entries for each character
        for char_upper in char_data:
            char_data[char_upper]['timeline'].append({
                't': timestamp,
                'count': char_data[char_upper]['total_count']
            })
            # Keep only last 100 timeline entries
            if len(char_data[char_upper]['timeline']) > 100:
                char_data[char_upper]['timeline'] = char_data[char_upper]['timeline'][-100:]
        
        return char_data
    
    def calculate_entropy(self, distribution: Dict[str, int]) -> float:
        """Calculate Shannon entropy for a distribution"""
        if not distribution:
            return 0.0
        
        total = sum(distribution.values())
        if total == 0:
            return 0.0
        
        import math
        entropy = 0.0
        for count in distribution.values():
            if count > 0:
                probability = count / total
                entropy -= probability * math.log2(probability)
        
        return entropy
    
    def calculate_price_from_live_metrics(self, char_counts: Dict[str, int], letter: str, snapshot: Dict, char_data: Dict[str, Dict]) -> float:
        """Calculate letter price using multi-factor formula with entropy, velocity, and cross-source correlation"""
        letter = letter.upper()
        letter_data = char_data.get(letter, {})
        
        # Extract attribution data
        sources = letter_data.get('sources', {})
        topics = letter_data.get('topics', {})
        tokens = letter_data.get('tokens', {})
        timeline = letter_data.get('timeline', [])
        
        letter_count = char_counts.get(letter, 0)
        total_chars = sum(char_counts.values()) if char_counts else 1
        
        if total_chars == 0:
            return 0.01  # Base minimum price
        
        import math
        
        # Volume weight: log(total_count + 1)
        volume_weight = 0.4
        volume_component = math.log(letter_count + 1) * volume_weight
        
        # Source diversity weight: len(sources)
        source_diversity_weight = 0.2
        source_diversity_component = len(sources) * source_diversity_weight * 0.1
        
        # Topic entropy weight: entropy(topics)
        topic_entropy_weight = 0.15
        topic_entropy = self.calculate_entropy(topics)
        topic_entropy_component = topic_entropy * topic_entropy_weight
        
        # Velocity weight: delta_count / time_diff
        velocity_weight = 0.15
        if len(timeline) >= 2:
            delta_count = timeline[-1]['count'] - timeline[-2]['count']
            time_diff = (timeline[-1]['t'] - timeline[-2]['t']).total_seconds() / 60  # minutes
            velocity = delta_count / time_diff if time_diff > 0 else 0
            velocity_component = velocity * velocity_weight
        else:
            velocity_component = 0
        
        # Cross-source correlation weight: presence across multiple sources
        cross_source_weight = 0.1
        cross_source_component = min(len(sources) / 10, 1.0) * cross_source_weight
        
        # Combine all factors
        price = (
            volume_component +
            source_diversity_component +
            topic_entropy_component +
            velocity_component +
            cross_source_component
        )
        
        # Apply logarithmic scaling to prevent extreme values
        scaled_price = math.log(price + 1) * 0.5
        
        return round(max(scaled_price, 0.01), 4)
    
    def compute_base_kpis(self, snapshot: Dict) -> Dict[str, Any]:
        """Compute base deterministic KPIs from all data sources with pricing and attribution"""
        # Count characters with attribution
        char_data = self.count_characters_with_attribution(snapshot)
        
        primitives = snapshot.get('primitives', [])
        letters = [p for p in primitives if p.get('type') == 'letter']
        
        kpis = {}
        prices = {}
        
        # Store attribution data
        kpi_store['char_attribution'] = char_data
        
        # Token letter counting statistics
        token_letter_stats = {}
        total_tokens = 0
        
        for char, data in char_data.items():
            if char.isalpha() and len(char) == 1:
                token_letter_stats[char] = {
                    'total_count': data['total_count'],
                    'sources': data['sources'],
                    'topics': data['topics'],
                    'sample_tokens': data['tokens']
                }
                total_tokens += data['total_count']
        
        kpi_store['token_letter_stats'] = token_letter_stats
        kpi_store['total_tokens_analyzed'] = total_tokens
        
        for letter in letters:
            symbol = letter.get('symbol')
            
            # Letter Volume (total usage from all sources)
            letter_data = char_data.get(symbol.upper(), {})
            kpis[f'{symbol}_volume'] = letter_data.get('total_count', 0)
            
            # Letter Frequency (relative to total from all sources)
            total_chars = sum(d.get('total_count', 0) for d in char_data.values()) if char_data else 1
            kpis[f'{symbol}_frequency'] = letter_data.get('total_count', 0) / total_chars if total_chars > 0 else 0
            
            # Source distribution for this letter
            kpis[f'{symbol}_sources'] = letter_data.get('sources', {})
            
            # Topic distribution for this letter
            kpis[f'{symbol}_topics'] = letter_data.get('topics', {})
            
            # Calculate price based on live metrics
            char_counts = {char: data['total_count'] for char, data in char_data.items()}
            price = self.calculate_price_from_live_metrics(char_counts, symbol, snapshot)
            prices[symbol] = price
            kpis[f'{symbol}_price'] = price
            
            # Price Momentum (weekly change)
            kpis[f'{symbol}_momentum'] = letter.get('weekly_change', 0)
            
            # Rank (current position)
            kpis[f'{symbol}_rank'] = letter.get('rank', 0)
        
        # Store prices in global store for tracking
        kpi_store['letter_prices'] = prices
        
        # Cross-letter correlation (simplified)
        kpis['cross_letter_correlation'] = self._compute_correlation(letters)
        
        # Usage entropy (measure of distribution uniformity)
        char_counts = {char: data['total_count'] for char, data in char_data.items()}
        kpis['usage_entropy'] = self._compute_entropy_from_counts(char_counts)
        
        # Data source diversity
        kpis['data_sources_count'] = len([s for s in snapshot.keys() if 'tokens' in s or 'pairs' in s])
        
        # Price statistics
        if prices:
            kpis['price_mean'] = sum(prices.values()) / len(prices)
            kpis['price_std'] = (sum((p - kpis['price_mean']) ** 2 for p in prices.values()) / len(prices)) ** 0.5
            kpis['price_min'] = min(prices.values())
            kpis['price_max'] = max(prices.values())
        
        # Token statistics
        kpis['total_tokens_analyzed'] = total_tokens
        kpis['unique_letters_found'] = len([c for c in char_data.keys() if c.isalpha()])
        
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
        
        # Track price history specifically
        if 'letter_prices' in kpi_store:
            if 'price_history' not in kpi_store:
                kpi_store['price_history'] = deque(maxlen=100)
            
            kpi_store['price_history'].append({
                'prices': kpi_store['letter_prices'].copy(),
                'timestamp': timestamp
            })
    
    def compute_kpi_evolution(self):
        """Compute KPI evolution metrics (trends, velocity, acceleration) including price evolution"""
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
        
        # Compute price evolution specifically
        if 'price_history' in kpi_store and len(kpi_store['price_history']) >= 2:
            price_evolution = {}
            recent_prices = list(kpi_store['price_history'])[-10:]
            
            # Track each letter's price evolution
            all_letters = set()
            for price_record in recent_prices:
                all_letters.update(price_record['prices'].keys())
            
            for letter in all_letters:
                letter_prices = [record['prices'].get(letter, 0) for record in recent_prices if letter in record['prices']]
                
                if len(letter_prices) >= 2:
                    n = len(letter_prices)
                    velocity = (letter_prices[-1] - letter_prices[0]) / n if n > 0 else 0
                    change_percent = ((letter_prices[-1] - letter_prices[0]) / letter_prices[0] * 100) if letter_prices[0] != 0 else 0
                    
                    price_evolution[f'{letter}_price'] = {
                        'current_price': letter_prices[-1],
                        'velocity': velocity,
                        'change_percent': change_percent,
                        'trend': 'up' if velocity > 0 else 'down'
                    }
            
            evolution['price_evolution'] = price_evolution
        
        kpi_store['kpi_evolution'] = evolution
        return evolution
    
    def llm_reasoning_loop(self, evolution: Dict, current_kpis: Dict) -> Dict[str, Any]:
        """LLM reasoning loop to analyze KPI evolution and propose improvements"""
        try:
            if GROQ_API_KEY:
                raw_output = self._llm_reasoning_groq(evolution, current_kpis)
            elif OPENROUTER_API_KEY:
                raw_output = self._llm_reasoning_openrouter(evolution, current_kpis)
            else:
                return self._fallback_reasoning(evolution, current_kpis)
            
            # Validate LLM output to prevent hallucinations
            validated_output = validate_llm_output(raw_output)
            
            return validated_output
        except Exception as e:
            print(f"Error in LLM reasoning loop: {e}")
            return self._fallback_reasoning(evolution, current_kpis)
    
    def _llm_reasoning_groq(self, evolution: Dict, current_kpis: Dict) -> Dict[str, Any]:
        """LLM reasoning using Groq - generate infinite KPIs"""
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        # Get char attribution data
        char_attribution = kpi_store.get('char_attribution', {})
        
        # Get top evolving KPIs
        top_evolution = sorted(evolution.items(), key=lambda x: abs(x[1].get('velocity', 0)), reverse=True)[:5]
        
        # Get top letters by occurrence
        top_letters = sorted(char_attribution.items(), key=lambda x: x[1].get('total_count', 0), reverse=True)[:5]
        
        prompt = f"""You are a quant researcher analyzing letter primitives with infinite KPI generation.

LETTER ATTRIBUTION DATA (source, topic, tokens):
{json.dumps({k: v for k, v in list(char_attribution.items())[:5]}, indent=2)[:1000]}

TOP LETTERS BY OCCURRENCE:
{json.dumps([(k, v['total_count'], list(v['sources'].keys())[:3]) for k, v in top_letters], indent=2)[:800]}

KPI EVOLUTION DATA:
{json.dumps(dict(top_evolution), indent=2)[:1000]}

CURRENT KPIS:
{json.dumps({k: v for k, v in list(current_kpis.items())[:20]}, indent=2)[:1000]}

TASK - GENERATE INFINITE KPIS:
1. Analyze which topics/sources each letter appears in (oracleification)
2. Generate 10 NEW KPI metrics for each letter based on:
   - Source diversity (how many different sources)
   - Topic concentration (which topics dominate)
   - Token relationships (which tokens use this letter)
   - Cross-source correlation
   - Temporal patterns
3. For each new KPI, provide: name, formula, interpretation
4. Identify which letters are most "oracleified" (appear in most sources)
5. Suggest new KPI categories that could be generated continuously

Output JSON only:
{{
  "oracleification_analysis": {{
    "most_oracleified_letters": ["A", "E", "T"],
    "source_diversity_scores": {{"A": 0.8, "E": 0.7}},
    "topic_dominance": {{"A": "DeFi", "E": "meme"}}
  }},
  "new_kpis": [
    {{
      "letter": "A",
      "kpi_name": "source_diversity_index",
      "formula": "count(unique_sources) / total_sources",
      "interpretation": "measures how diverse sources are for this letter"
    }},
    ... generate 10 per letter for top 5 letters
  ],
  "emerging_trends": ["trend1", "trend2"],
  "momentum_letters": ["A", "B", "C"],
  "methodology_improvements": ["imp1", "imp2"],
  "suggested_kpi_categories": ["category1", "category2"]
}}"""
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "llama3-70b-8192",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 2000
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
        """Store snapshot and KPIs in history and database"""
        timestamp = datetime.now(timezone.utc).isoformat()
        snapshot_id = snapshot.get('snapshot_id', f"snap_{int(time.time())}")
        
        # Save to in-memory store
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
        
        # Save to database
        try:
            save_kpi_snapshot(
                snapshot_id,
                timestamp,
                kpis,
                kpi_store.get('letter_prices', {}),
                kpi_store.get('char_attribution', {}),
                kpi_store.get('token_letter_stats', {}),
                kpi_store.get('total_tokens_analyzed', 0)
            )
            
            # Save price history for each letter
            prices = kpi_store.get('letter_prices', {})
            for letter, price in prices.items():
                volume = kpis.get(f'{letter}_volume', 0)
                frequency = kpis.get(f'{letter}_frequency', 0)
                save_price_history(timestamp, letter, price, volume, frequency)
            
            print("Saved snapshot to database")
        except Exception as e:
            print(f"Error saving to database: {e}")
        
        return evolution
    
    def update_registry(self, llm_output: Dict):
        """Update letter registry based on LLM insights"""
        top_letters = llm_output.get('top_letters', [])
        
        # Update letter rankings based on LLM insights
        kpi_store['letter_kpis']['llm_ranked'] = top_letters
    
    def run_once(self):
        """Run one iteration of the KPI engine with database persistence"""
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
            
            # Save LLM analysis to database
            try:
                save_llm_analysis(
                    datetime.now(timezone.utc).isoformat(),
                    reasoning_output,
                    reasoning_output.get('new_kpis', []),
                    reasoning_output.get('oracleification_analysis', {})
                )
                print("Saved LLM analysis to database")
            except Exception as e:
                print(f"Error saving LLM analysis to database: {e}")
            
            # Save evolution to database
            try:
                save_evolution_history(
                    datetime.now(timezone.utc).isoformat(),
                    evolution,
                    evolution.get('price_evolution', {})
                )
                print("Saved evolution to database")
            except Exception as e:
                print(f"Error saving evolution to database: {e}")
        
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
