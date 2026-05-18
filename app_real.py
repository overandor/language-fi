#!/usr/bin/env python3
"""
Language.fi Real Data API Server
Uses ONLY real data from CoinGecko - no simulation, no mock data
"""

import os
import json
import requests
import time
from datetime import datetime, timezone
from collections import Counter
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Cache
cache = {}
CACHE_DURATION = 300

# Real data cache
real_data_cache = {
    'coingecko_tokens': None,
    'letter_counts': None,
    'letter_prices': None,
    'last_updated': None
}

def fetch_coingecko_tokens():
    """Fetch REAL token data from CoinGecko API"""
    try:
        url = 'https://api.coingecko.com/api/v3/coins/markets'
        headers = {'Accept': 'application/json'}
        
        params = {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': '250',
            'page': '1',
            'sparkline': 'false'
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        tokens = data if isinstance(data, list) else []
        
        return tokens
    except Exception as e:
        print(f"Error fetching CoinGecko data: {e}")
        return None

def count_letters_from_tokens(tokens):
    """Count letter occurrences from REAL token names and symbols"""
    if not tokens:
        return {}
    
    letter_counter = Counter()
    
    for token in tokens:
        # Count from symbol (e.g., "BTC" -> B:1, T:1, C:1)
        symbol = token.get('symbol', '').upper()
        for char in symbol:
            if char.isalpha():
                letter_counter[char] += 1
        
        # Count from name (e.g., "Bitcoin" -> B:1, I:1, T:1, C:1, O:1, I:1, N:1)
        name = token.get('name', '')
        for char in name:
            if char.isalpha():
                letter_counter[char.upper()] += 1
    
    return dict(letter_counter)

def calculate_real_prices(letter_counts, tokens):
    """Calculate REAL prices based on token market data and letter frequency"""
    if not letter_counts or not tokens:
        return {}
    
    # Calculate total market cap of all tokens
    total_market_cap = sum(token.get('market_cap', 0) or 0 for token in tokens)
    
    # Calculate total letter occurrences
    total_letters = sum(letter_counts.values())
    
    if total_letters == 0 or total_market_cap == 0:
        return {}
    
    # Base price per letter occurrence (market cap / total letters)
    base_value_per_occurrence = total_market_cap / total_letters
    
    # Calculate price for each letter
    letter_prices = {}
    for letter, count in letter_counts.items():
        # Price = occurrences * base value / scaling factor
        # Use a scaling factor to make prices reasonable (in LGU units)
        raw_price = count * base_value_per_occurrence
        scaled_price = raw_price / 1_000_000_000  # Scale to reasonable LGU values
        letter_prices[letter] = round(scaled_price, 6)
    
    return letter_prices

def get_real_letter_data(letter):
    """Get REAL data for a specific letter"""
    tokens = real_data_cache.get('coingecko_tokens')
    letter_counts = real_data_cache.get('letter_counts')
    letter_prices = real_data_cache.get('letter_prices')
    
    if not tokens or not letter_counts or not letter_prices:
        return None
    
    letter = letter.upper()
    
    # Find tokens containing this letter
    tokens_with_letter = []
    for token in tokens:
        symbol = token.get('symbol', '').upper()
        name = token.get('name', '')
        if letter in symbol or letter in name.upper():
            tokens_with_letter.append({
                'symbol': token.get('symbol', ''),
                'name': token.get('name', ''),
                'market_cap': token.get('market_cap', 0),
                'price': token.get('current_price', 0),
                '24h_change': token.get('price_change_percentage_24h', 0)
            })
    
    # Calculate real metrics
    count = letter_counts.get(letter, 0)
    price = letter_prices.get(letter, 0)
    
    # Calculate market cap of tokens containing this letter
    letter_market_cap = sum(t['market_cap'] for t in tokens_with_letter)
    
    # Calculate average 24h change
    avg_24h_change = sum(t['24h_change'] for t in tokens_with_letter) / len(tokens_with_letter) if tokens_with_letter else 0
    
    # Calculate rank based on count
    sorted_letters = sorted(letter_counts.items(), key=lambda x: x[1], reverse=True)
    rank = next((i for i, (l, c) in enumerate(sorted_letters) if l == letter), len(sorted_letters)) + 1
    
    return {
        'letter': letter,
        'count': count,
        'price': price,
        'rank': rank,
        'market_cap': letter_market_cap,
        '24h_change': round(avg_24h_change, 2),
        'token_count': len(tokens_with_letter),
        'tokens': tokens_with_letter[:10]  # Top 10 tokens
    }

def update_real_data():
    """Update all real data from CoinGecko"""
    tokens = fetch_coingecko_tokens()
    if not tokens:
        return False
    
    letter_counts = count_letters_from_tokens(tokens)
    letter_prices = calculate_real_prices(letter_counts, tokens)
    
    real_data_cache['coingecko_tokens'] = tokens
    real_data_cache['letter_counts'] = letter_counts
    real_data_cache['letter_prices'] = letter_prices
    real_data_cache['last_updated'] = datetime.now(timezone.utc).isoformat()
    
    print(f"Updated real data: {len(tokens)} tokens, {len(letter_counts)} letters")
    return True

@app.route('/api/real/primitives')
def get_real_primitives():
    """Get ALL real primitive data"""
    if real_data_cache['last_updated'] is None:
        if not update_real_data():
            return jsonify({'error': 'Failed to fetch real data'}), 500
    
    letter_counts = real_data_cache['letter_counts']
    letter_prices = real_data_cache['letter_prices']
    
    primitives = []
    for letter in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
        count = letter_counts.get(letter, 0)
        price = letter_prices.get(letter, 0)
        
        # Calculate rank
        sorted_letters = sorted(letter_counts.items(), key=lambda x: x[1], reverse=True)
        rank = next((i for i, (l, c) in enumerate(sorted_letters) if l == letter), len(sorted_letters)) + 1
        
        primitives.append({
            'symbol': letter,
            'type': 'letter',
            'price_lgu': price,
            'usage_count': count,
            'rank': rank,
            'weekly_change': 0  # Would need historical data for this
        })
    
    return jsonify({
        'primitives': primitives,
        'updated_at': real_data_cache['last_updated'],
        'total_tokens': len(real_data_cache['coingecko_tokens'])
    })

@app.route('/api/real/primitives/<letter>')
def get_real_primitive(letter):
    """Get real data for a specific letter"""
    if real_data_cache['last_updated'] is None:
        if not update_real_data():
            return jsonify({'error': 'Failed to fetch real data'}), 500
    
    data = get_real_letter_data(letter)
    if not data:
        return jsonify({'error': 'Letter not found'}), 404
    
    return jsonify(data)

@app.route('/api/real/letter/<letter>/tokens')
def get_letter_tokens(letter):
    """Get tokens containing a specific letter"""
    if real_data_cache['last_updated'] is None:
        if not update_real_data():
            return jsonify({'error': 'Failed to fetch real data'}), 500
    
    data = get_real_letter_data(letter)
    if not data:
        return jsonify({'error': 'Letter not found'}), 404
    
    return jsonify({
        'letter': letter,
        'tokens': data['tokens'],
        'count': data['token_count']
    })

@app.route('/api/real/stats')
def get_real_stats():
    """Get real statistics"""
    if real_data_cache['last_updated'] is None:
        if not update_real_data():
            return jsonify({'error': 'Failed to fetch real data'}), 500
    
    tokens = real_data_cache['coingecko_tokens']
    letter_counts = real_data_cache['letter_counts']
    letter_prices = real_data_cache['letter_prices']
    
    total_market_cap = sum(t.get('market_cap', 0) or 0 for t in tokens)
    total_volume = sum(t.get('total_volume', 0) or 0 for t in tokens)
    
    return jsonify({
        'total_tokens': len(tokens),
        'total_market_cap': total_market_cap,
        'total_volume': total_volume,
        'total_letters': sum(letter_counts.values()),
        'unique_letters': len(letter_counts),
        'updated_at': real_data_cache['last_updated']
    })

@app.route('/api/real/update', methods=['POST'])
def update_data():
    """Force update real data"""
    success = update_real_data()
    if success:
        return jsonify({
            'status': 'success',
            'updated_at': real_data_cache['last_updated']
        })
    else:
        return jsonify({'error': 'Failed to update data'}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'data_source': 'CoinGecko API'})

if __name__ == '__main__':
    # Initial data fetch
    update_real_data()
    
    # Run Flask app
    app.run(host='0.0.0.0', port=7861)
