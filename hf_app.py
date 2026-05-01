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
from flask import Flask, jsonify
from flask_cors import CORS

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

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

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
