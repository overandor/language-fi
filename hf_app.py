#!/usr/bin/env python3
"""
Language.fi API Server for Hugging Face Spaces
Serves live letter and number primitive data with CoinGecko oracle
"""

import os
import requests
import random
import time
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

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
    'last_updated': None
}

def fetch_coingecko_tokens():
    """Fetch token data from CoinGecko API"""
    try:
        if COINGECKO_API_KEY:
            url = 'https://api.coingecko.com/api/v3/coins/list'
            headers = {
                'Accept': 'application/json',
                'x-cg-demo-api-key': COINGECKO_API_KEY
            }
        else:
            url = 'https://api.coingecko.com/api/v3/coins/list'
            headers = {
                'Accept': 'application/json'
            }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        tokens = data if isinstance(data, list) else []
        
        print(f"Fetched {len(tokens)} tokens from CoinGecko")
        return tokens
    except Exception as e:
        print(f"Error fetching CoinGecko data: {e}")
        return None

def count_characters_in_tokens(tokens):
    """Count character occurrences in token names"""
    char_counts = {}
    
    if not tokens:
        return char_counts
    
    for token in tokens:
        name = token.get('name', '').upper()
        symbol = token.get('symbol', '').upper()
        
        # Count characters in name
        for char in name:
            if char.isalnum() or char == ' ':
                char_counts[char] = char_counts.get(char, 0) + 1
        
        # Count characters in symbol
        for char in symbol:
            if char.isalnum():
                char_counts[char] = char_counts.get(char, 0) + 1
    
    return char_counts

def update_live_oracle_data():
    """Update oracle data from CoinGecko API"""
    global live_data_cache
    
    cg_tokens = fetch_coingecko_tokens()
    if cg_tokens:
        live_data_cache['coingecko_tokens'] = cg_tokens
    
    live_data_cache['last_updated'] = datetime.utcnow().isoformat()
    print(f"Live oracle data updated at {live_data_cache['last_updated']}")

def get_live_character_counts():
    """Get character counts from CoinGecko token data"""
    char_counts = {'total': {}}
    
    if live_data_cache.get('coingecko_tokens'):
        cg_counts = count_characters_in_tokens(live_data_cache['coingecko_tokens'])
        char_counts['total'] = cg_counts
    
    return char_counts

def generate_primitive_data():
    """Generate primitive data with live CoinGecko character counts"""
    primitives = []
    
    # Get live character counts
    char_counts = get_live_character_counts()
    total_counts = char_counts['total']
    
    # Base prices
    base_prices = {
        'E': 0.142, 'T': 0.185, 'A': 0.142, 'O': 0.085, 'N': 0.072,
        'I': 0.095, 'R': 0.068, 'S': 0.105, 'H': 0.062, 'L': 0.058,
        'D': 0.062, 'C': 0.118, 'U': 0.045, 'M': 0.075, 'W': 0.058,
        'F': 0.052, 'G': 0.048, 'Y': 0.072, 'P': 0.065, 'B': 0.091,
        'V': 0.042, 'K': 0.045, 'J': 0.038, 'X': 0.035, 'Q': 0.032, 'Z': 0.028,
        'SPACE': 0.061
    }
    
    # Letters A-Z
    for i, letter in enumerate('ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
        count = total_counts.get(letter, 0)
        base_price = base_prices.get(letter, 0.05)
        change_24h = random.uniform(-15, 25)
        current_price = base_price * (1 + change_24h / 100)
        weekly_change = random.uniform(-10, 20)
        rank = i + 1
        
        primitives.append({
            'symbol': letter,
            'type': 'letter',
            'price_lgu': round(current_price, 3),
            'change_24h': round(change_24h, 1),
            'weekly_change': round(weekly_change, 3),
            'usage_count': count,
            'rank': rank,
            'volatility': random.choice(['Low', 'Medium', 'High']),
            'staking_weight': round(random.uniform(0.8, 1.2), 2),
            'data_source': 'live_coingecko' if count > 0 else 'simulated'
        })
    
    # SPACE
    space_count = total_counts.get(' ', 0)
    space_price = base_prices['SPACE']
    space_change = random.uniform(-5, 20)
    primitives.append({
        'symbol': 'SPACE',
        'type': 'separator',
        'price_lgu': round(space_price * (1 + space_change / 100), 3),
        'change_24h': round(space_change, 1),
        'weekly_change': round(random.uniform(-8, 25), 3),
        'usage_count': space_count,
        'rank': 1,
        'volatility': 'Medium',
        'staking_weight': 1.5,
        'data_source': 'live_coingecko' if space_count > 0 else 'simulated'
    })
    
    # Numbers 0-9
    number_base_prices = {
        '0': 0.041, '1': 0.045, '2': 0.037, '3': 0.039, '4': 0.036,
        '5': 0.038, '6': 0.035, '7': 0.033, '8': 0.040, '9': 0.034
    }
    
    for i, number in enumerate('0123456789'):
        count = total_counts.get(number, 0)
        base_price = number_base_prices.get(number, 0.04)
        change_24h = random.uniform(-10, 20)
        current_price = base_price * (1 + change_24h / 100)
        weekly_change = random.uniform(-8, 15)
        rank = 27 + i
        
        primitives.append({
            'symbol': number,
            'type': 'number',
            'price_lgu': round(current_price, 3),
            'change_24h': round(change_24h, 1),
            'weekly_change': round(weekly_change, 3),
            'usage_count': count,
            'rank': rank,
            'volatility': random.choice(['Low', 'Medium', 'High']),
            'staking_weight': round(random.uniform(0.7, 1.1), 2),
            'data_source': 'live_coingecko' if count > 0 else 'simulated'
        })
    
    # Symbols
    symbol_base_prices = {
        '.': 0.015, '!': 0.018, '?': 0.016, '-': 0.014,
        '_': 0.013, '@': 0.020, '#': 0.017
    }
    
    for i, symbol in enumerate('.!?-_@#'):
        count = total_counts.get(symbol, 0)
        base_price = symbol_base_prices.get(symbol, 0.016)
        change_24h = random.uniform(-8, 18)
        current_price = base_price * (1 + change_24h / 100)
        weekly_change = random.uniform(-6, 12)
        rank = 37 + i
        
        primitives.append({
            'symbol': symbol,
            'type': 'symbol',
            'price_lgu': round(current_price, 3),
            'change_24h': round(change_24h, 1),
            'weekly_change': round(weekly_change, 3),
            'usage_count': count,
            'rank': rank,
            'volatility': random.choice(['Low', 'Medium']),
            'staking_weight': round(random.uniform(0.6, 1.0), 2),
            'data_source': 'live_coingecko' if count > 0 else 'simulated'
        })
    
    # Sort by rank
    primitives.sort(key=lambda x: x['rank'])
    
    return {
        'updated_at': live_data_cache['last_updated'] or datetime.utcnow().isoformat() + 'Z',
        'primitives': primitives,
        'data_source': 'live_coingecko' if total_counts else 'simulated'
    }

@app.route('/')
def index():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'Language.fi API',
        'version': '1.0.0',
        'data_source': 'CoinGecko Oracle'
    })

@app.route('/api/primitives')
def get_primitives():
    """Get all primitives"""
    if 'primitives' in cache and time.time() - cache['primitives']['timestamp'] < CACHE_DURATION:
        return jsonify(cache['primitives']['data'])
    
    primitives = generate_primitive_data()
    cache['primitives'] = {'data': primitives, 'timestamp': time.time()}
    return jsonify(primitives)

@app.route('/api/primitives/<symbol>')
def get_primitive(symbol):
    """Get single primitive"""
    primitives = generate_primitive_data()
    for primitive in primitives['primitives']:
        if primitive['symbol'] == symbol.upper():
            return jsonify(primitive)
    return jsonify({'error': 'Primitive not found'}), 404

@app.route('/api/oracle/update', methods=['POST'])
def update_oracle():
    """Trigger oracle update from CoinGecko"""
    try:
        update_live_oracle_data()
        return jsonify({
            'success': True,
            'message': 'Oracle updated from CoinGecko',
            'last_updated': live_data_cache['last_updated']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/oracle/stats')
def get_oracle_stats():
    """Get oracle statistics"""
    char_counts = get_live_character_counts()
    return jsonify({
        'last_updated': live_data_cache['last_updated'],
        'coingecko_tokens_count': len(live_data_cache.get('coingecko_tokens', [])),
        'character_counts': char_counts['total'],
        'total_characters': sum(char_counts['total'].values()),
        'data_source': 'CoinGecko'
    })

# Initialize oracle on startup
print("Initializing CoinGecko oracle...")
update_live_oracle_data()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 7860))
    print(f"Language.fi API Server starting on port {port}")
    app.run(host='0.0.0.0', port=port)
