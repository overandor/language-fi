#!/usr/bin/env python3
"""
Language.fi API Server for Hugging Face Spaces
Serves live letter and number primitive data with CoinGecko oracle
Docker SDK - Flask only, no Gradio
"""

import os
import requests
import random
import time
from datetime import datetime, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
from collections import defaultdict

# Flask app for API
app = Flask(__name__)
CORS(app)

# API Keys
COINGECKO_API_KEY = os.getenv('COINGECKO_API_KEY', '')

# Cache
cache = {}
CACHE_DURATION = 300

# Live data cache
live_data_cache = {
    'coingecko_tokens': None,
    'newspaper_articles': None,
    'medium_articles': None,
    'chain_data': {},
    'last_updated': None
}

def fetch_coingecko_tokens():
    """Fetch token data from CoinGecko API"""
    try:
        if not COINGECKO_API_KEY:
            print("CoinGecko API key not configured, using fallback data")
            return None
        
        url = 'https://api.coingecko.com/api/v3/coins/markets'
        headers = {
            'Accept': 'application/json'
        }
        
        params = {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': '250',
            'page': '1',
            'sparkline': 'false'
        }
        
        if COINGECKO_API_KEY:
            params['x_cg_demo_api_key'] = COINGECKO_API_KEY
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        tokens = data if isinstance(data, list) else []
        
        return tokens
    except Exception as e:
        print(f"Error fetching CoinGecko data: {e}")
        return None

def generate_primitive_base(symbol, primitive_type):
    """Generate base primitive data"""
    base_prices = {
        'E': 0.142, 'T': 0.185, 'A': 0.142, 'O': 0.085, 'N': 0.072,
        'I': 0.095, 'R': 0.068, 'S': 0.105, 'H': 0.062, 'L': 0.058,
        'D': 0.062, 'C': 0.118, 'U': 0.045, 'M': 0.075, 'W': 0.058,
        'F': 0.052, 'G': 0.048, 'Y': 0.072, 'P': 0.065, 'B': 0.091,
        'V': 0.042, 'K': 0.045, 'J': 0.038, 'X': 0.035, 'Q': 0.032, 'Z': 0.028,
        'SPACE': 0.061,
        '0': 0.041, '1': 0.043, '2': 0.037, '3': 0.039, '4': 0.038,
        '5': 0.040, '6': 0.035, '7': 0.033, '8': 0.036, '9': 0.034,
        '.': 0.015, '!': 0.018, '?': 0.016, '-': 0.012, '_': 0.014,
        '@': 0.022, '#': 0.020
    }
    
    base_price = base_prices.get(symbol, 0.03)
    weekly_change = random.uniform(-0.05, 0.20)
    usage_count = random.randint(200000, 4000000)
    
    return {
        'symbol': symbol,
        'type': primitive_type,
        'price_lgu': round(base_price * (1 + weekly_change), 3),
        'weekly_change': round(weekly_change, 3),
        'usage_count': usage_count,
        'rank': None
    }

def generate_all_primitives():
    """Generate all primitives with proper ranking"""
    primitives = []
    
    # Letters A-Z
    letter_primitives = []
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for letter in alphabet:
        letter_primitives.append(generate_primitive_base(letter, 'letter'))
    
    # Sort letters by usage count and assign ranks
    letter_primitives.sort(key=lambda x: x['usage_count'], reverse=True)
    for i, primitive in enumerate(letter_primitives):
        primitive['rank'] = i + 1
    
    primitives.extend(letter_primitives)
    
    # Numbers 0-9
    number_primitives = []
    for num in '0123456789':
        number_primitives.append(generate_primitive_base(num, 'number'))
    
    # Sort numbers by usage count and assign ranks
    number_primitives.sort(key=lambda x: x['usage_count'], reverse=True)
    for i, primitive in enumerate(number_primitives):
        primitive['rank'] = i + 27  # Letters are 1-26
    
    primitives.extend(number_primitives)
    
    # SPACE
    primitives.append(generate_primitive_base('SPACE', 'separator'))
    
    # Symbols
    symbols = ['.', '!', '?', '-', '_', '@', '#']
    for symbol in symbols:
        primitives.append(generate_primitive_base(symbol, 'symbol'))
    
    return {
        'primitives': primitives,
        'updated_at': datetime.now(timezone.utc).isoformat()
    }

@app.route('/api/primitives')
def get_primitives():
    """Get all primitives (letters, numbers, spaces, symbols)"""
    if 'primitives' in cache and time.time() - cache['primitives']['timestamp'] < CACHE_DURATION:
        return jsonify(cache['primitives']['data'])
    
    # Generate all primitives
    primitives = generate_all_primitives()
    cache['primitives'] = {'data': primitives, 'timestamp': time.time()}
    return jsonify(primitives)

@app.route('/api/primitives/<symbol>')
def get_primitive(symbol):
    """Get single primitive details"""
    symbol_upper = symbol.upper()
    cache_key = f'primitive_{symbol_upper}'
    
    if cache_key in cache and time.time() - cache[cache_key]['timestamp'] < CACHE_DURATION:
        return jsonify(cache[cache_key]['data'])
    
    # Get all primitives and find the one we need
    all_data = generate_all_primitives()
    for primitive in all_data['primitives']:
        if primitive['symbol'] == symbol_upper:
            cache[cache_key] = {'data': primitive, 'timestamp': time.time()}
            return jsonify(primitive)
    
    return jsonify({'error': 'Primitive not found'}), 404

@app.route('/api/oracle/update', methods=['POST'])
def update_oracle():
    """Trigger an update of live oracle data"""
    try:
        tokens = fetch_coingecko_tokens()
        if tokens:
            live_data_cache['coingecko_tokens'] = tokens
            live_data_cache['last_updated'] = datetime.now(timezone.utc).isoformat()
            return jsonify({
                'status': 'success',
                'message': 'Oracle data updated',
                'last_updated': live_data_cache['last_updated']
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to fetch oracle data'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/oracle/live-stats')
def get_live_stats():
    """Get live oracle statistics"""
    return jsonify({
        'coingecko_tokens_count': len(live_data_cache['coingecko_tokens']) if live_data_cache['coingecko_tokens'] else 0,
        'last_updated': live_data_cache['last_updated']
    })

@app.route('/api/kpis')
def get_kpis():
    """Get current KPI data with live metrics"""
    try:
        from kpi_engine import kpi_store, get_kpi_history
        
        # Get latest from database
        kpi_history = get_kpi_history(limit=1)
        latest_db = kpi_history[0] if kpi_history else None
        
        return jsonify({
            'letter_kpis': kpi_store.get('letter_kpis', {}),
            'new_kpis': kpi_store.get('new_kpis', []),
            'llm_insights': kpi_store.get('llm_insights', []),
            'history_count': len(kpi_store.get('history', [])),
            'last_updated': kpi_store.get('history', [{}])[-1].get('timestamp') if kpi_store.get('history') else None,
            'char_attribution': kpi_store.get('char_attribution', {}),
            'token_letter_stats': kpi_store.get('token_letter_stats', {}),
            'total_tokens_analyzed': kpi_store.get('total_tokens_analyzed', 0),
            'letter_prices': kpi_store.get('letter_prices', {}),
            'kpi_evolution': kpi_store.get('kpi_evolution', {}),
            'latest_db_snapshot': latest_db
        })
    except ImportError:
        return jsonify({
            'letter_kpis': {},
            'new_kpis': [],
            'llm_insights': [],
            'history_count': 0,
            'last_updated': None,
            'status': 'KPI engine not available'
        })

@app.route('/api/kpis/history')
def get_kpi_history_endpoint():
    """Get KPI history from database"""
    try:
        from kpi_engine import get_kpi_history
        limit = int(request.args.get('limit', 100))
        history = get_kpi_history(limit=limit)
        return jsonify({'history': history, 'count': len(history)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/kpis/price-history')
def get_price_history_endpoint():
    """Get price history from database"""
    try:
        from kpi_engine import get_price_history
        letter = request.args.get('letter')
        limit = int(request.args.get('limit', 100))
        history = get_price_history(letter=letter, limit=limit)
        return jsonify({'history': history, 'count': len(history)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/kpis/start', methods=['POST'])
def start_kpi_engine():
    """Start the KPI engine"""
    try:
        from kpi_engine import engine
        engine.start(interval=60)
        return jsonify({'status': 'KPI engine started'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/analysis')
def get_analysis():
    """Get LLM analysis and oracleification insights"""
    try:
        from kpi_engine import kpi_store
        
        # Get latest reasoning
        reasoning_history = list(kpi_store.get('reasoning_history', []))
        latest_reasoning = reasoning_history[-1] if reasoning_history else None
        
        # Get oracleification analysis
        if latest_reasoning:
            oracleification = latest_reasoning.get('reasoning', {}).get('oracleification_analysis', {})
            new_kpis = latest_reasoning.get('reasoning', {}).get('new_kpis', [])
            trend_analysis = latest_reasoning.get('reasoning', {}).get('trend_analysis', '')
            momentum_letters = latest_reasoning.get('reasoning', {}).get('momentum_letters', [])
        else:
            oracleification = {}
            new_kpis = []
            trend_analysis = ''
            momentum_letters = []
        
        return jsonify({
            'oracleification_analysis': oracleification,
            'new_llm_kpis': new_kpis,
            'trend_analysis': trend_analysis,
            'momentum_letters': momentum_letters,
            'reasoning_timestamp': latest_reasoning.get('timestamp') if latest_reasoning else None,
            'char_attribution': kpi_store.get('char_attribution', {}),
            'token_letter_stats': kpi_store.get('token_letter_stats', {})
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analysis/history')
def get_analysis_history():
    """Get LLM analysis history"""
    try:
        from kpi_engine import kpi_store
        limit = int(request.args.get('limit', 50))
        history = list(kpi_store.get('reasoning_history', []))[:limit]
        return jsonify({'history': history, 'count': len(history)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/dashboard')
def dashboard():
    """Live metrics dashboard"""
    return '''
<!DOCTYPE html>
<html>
<head>
    <title>Language.fi KPI Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #0f0f0f; color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #1a1a1a; padding: 20px; border-radius: 8px; }
        h1 { color: #00ff88; }
        h2 { color: #00aaff; margin-top: 0; }
        .metric { font-size: 24px; font-weight: bold; color: #00ff88; }
        .label { color: #888; }
        button { background: #00ff88; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #00cc6a; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Language.fi KPI Dashboard</h1>
        <button onclick="fetchData()">Refresh Data</button>
        <div class="grid" id="metrics"></div>
        <div class="card" style="margin-top: 20px;">
            <canvas id="priceChart"></canvas>
        </div>
    </div>
    <script>
        let priceChart;
        
        async function fetchData() {
            const kpiRes = await fetch('/api/kpis');
            const kpiData = await kpiRes.json();
            
            const analysisRes = await fetch('/api/analysis');
            const analysisData = await analysisRes.json();
            
            updateMetrics(kpiData, analysisData);
            updatePriceChart(kpiData);
        }
        
        function updateMetrics(kpiData, analysisData) {
            const metricsDiv = document.getElementById('metrics');
            metricsDiv.innerHTML = '';
            
            const metrics = [
                { label: 'Total Tokens Analyzed', value: kpiData.total_tokens_analyzed || 0 },
                { label: 'Unique Letters Found', value: kpiData.unique_letters_found || 0 },
                { label: 'History Count', value: kpiData.history_count || 0 },
                { label: 'New LLM KPIs', value: analysisData.new_llm_kpis?.length || 0 },
                { label: 'Momentum Letters', value: analysisData.momentum_letters?.join(', ') || 'N/A' },
                { label: 'Last Updated', value: kpiData.last_updated || 'N/A' }
            ];
            
            metrics.forEach(m => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `<div class="label">${m.label}</div><div class="metric">${m.value}</div>`;
                metricsDiv.appendChild(card);
            });
        }
        
        function updatePriceChart(kpiData) {
            const prices = kpiData.letter_prices || {};
            const letters = Object.keys(prices);
            const values = Object.values(prices);
            
            if (priceChart) {
                priceChart.destroy();
            }
            
            priceChart = new Chart(document.getElementById('priceChart'), {
                type: 'bar',
                data: {
                    labels: letters,
                    datasets: [{
                        label: 'Letter Prices',
                        data: values,
                        backgroundColor: 'rgba(0, 255, 136, 0.6)',
                        borderColor: 'rgba(0, 255, 136, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        
        fetchData();
        setInterval(fetchData, 30000); // Refresh every 30 seconds
    </script>
</body>
</html>
    '''

@app.route('/api/kpis/historical')
def get_historical_kpis():
    """Get historical KPI data"""
    try:
        from kpi_engine import kpi_store
        return jsonify({
            'historical_kpis': dict(kpi_store.get('historical_kpis', {})),
            'kpi_evolution': kpi_store.get('kpi_evolution', {}),
            'reasoning_history': list(kpi_store.get('reasoning_history', []))
        })
    except ImportError:
        return jsonify({
            'historical_kpis': {},
            'kpi_evolution': {},
            'reasoning_history': [],
            'status': 'KPI engine not available'
        })

@app.route('/api/kpis/evolution')
def get_kpi_evolution():
    """Get KPI evolution metrics"""
    try:
        from kpi_engine import kpi_store
        return jsonify({
            'kpi_evolution': kpi_store.get('kpi_evolution', {}),
            'top_changing_kpis': sorted(
                kpi_store.get('kpi_evolution', {}).items(),
                key=lambda x: abs(x[1].get('velocity', 0)),
                reverse=True
            )[:10]
        })
    except ImportError:
        return jsonify({
            'kpi_evolution': {},
            'top_changing_kpis': [],
            'status': 'KPI engine not available'
        })

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

@app.route('/')
def serve_market_ui():
    """Serve the tokenization market UI"""
    try:
        with open('market_ui.html', 'r') as f:
            return f.read()
    except FileNotFoundError:
        return jsonify({'error': 'Market UI not found'}), 404

@app.route('/api/market/data')
def get_market_data():
    """Get comprehensive market data for the tokenization market"""
    try:
        from kpi_engine import engine, kpi_store
        
        # Fetch fresh data
        snapshot = engine.fetch_data()
        if not snapshot:
            return jsonify({'error': 'Failed to fetch market data'}), 500
        
        # Get current prices
        letter_prices = kpi_store.get('letter_prices', {})
        char_attribution = kpi_store.get('char_attribution', {})
        
        return jsonify({
            'snapshot': snapshot,
            'letter_prices': letter_prices,
            'char_attribution': char_attribution,
            'total_tokens_analyzed': kpi_store.get('total_tokens_analyzed', 0),
            'data_sources': {
                'coingecko': len(snapshot.get('coingecko_tokens', [])),
                'coinmarketcap': len(snapshot.get('coinmarketcap_tokens', [])),
                'gateio': len(snapshot.get('gateio_tokens', [])),
                'etherscan': len(snapshot.get('etherscan_txs', [])),
                'basescan': len(snapshot.get('basescan_txs', [])),
                'birdeye': len(snapshot.get('birdeye_tokens', [])),
                'helius': 1 if snapshot.get('helius_data') else 0,
                'dexscreener': len(snapshot.get('dexscreener_pairs', [])),
                'solana_rpc': 1 if snapshot.get('solana_rpc') else 0,
                'ethereum_rpc': 1 if snapshot.get('ethereum_rpc') else 0,
                'base_rpc': 1 if snapshot.get('base_rpc') else 0,
                'jupiter': len(snapshot.get('jupiter_tokens', [])),
                'uniswap': len(snapshot.get('uniswap_tokens', []))
            },
            'timestamp': snapshot.get('timestamp')
        })
    except ImportError:
        return jsonify({'error': 'KPI engine not available'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Fetch initial oracle data
    tokens = fetch_coingecko_tokens()
    if tokens:
        live_data_cache['coingecko_tokens'] = tokens
        live_data_cache['last_updated'] = datetime.now(timezone.utc).isoformat()
        print(f"Fetched {len(tokens)} tokens from CoinGecko")
        print(f"Live oracle data updated at {live_data_cache['last_updated']}")
    
    # Run Flask app
    app.run(host='0.0.0.0', port=7860)
