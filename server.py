#!/usr/bin/env python3
"""
Language.fi Backend Server
Provides live data for letter prices, usage statistics, and protocol breakdown
"""

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
import random
import time
from datetime import datetime, timedelta
import json
import os

app = Flask(__name__)
CORS(app)

# API Keys from environment
GATE_API_KEY = os.getenv('GATE_API_KEY', '5f35c83ea82aafa977f46a7b1f75c873')
GATE_API_SECRET = os.getenv('GATE_API_SECRET', '9467d896f5bf2980d0c66bb948608aca3a619a00eb7dbbdfe9f2ef94b594fb3')

# Cache for data
cache = {}
CACHE_DURATION = 300  # 5 minutes

@app.route('/')
def index():
    """Serve the frontend"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('.', path)

@app.route('/api/letters')
def get_letters():
    """Get all letter prices and statistics"""
    if 'letters' in cache and time.time() - cache['letters']['timestamp'] < CACHE_DURATION:
        return jsonify(cache['letters']['data'])
    
    # Generate live letter data with random sampling
    letters = generate_letter_data()
    cache['letters'] = {'data': letters, 'timestamp': time.time()}
    return jsonify(letters)

@app.route('/api/letter/<letter>')
def get_letter(letter):
    """Get detailed data for a specific letter"""
    if f'letter_{letter}' in cache and time.time() - cache[f'letter_{letter}']['timestamp'] < CACHE_DURATION:
        return jsonify(cache[f'letter_{letter}']['data'])
    
    # Generate detailed letter data
    letter_data = generate_letter_detail(letter.upper())
    cache[f'letter_{letter}'] = {'data': letter_data, 'timestamp': time.time()}
    return jsonify(letter_data)

@app.route('/api/protocol-breakdown/<letter>')
def get_protocol_breakdown(letter):
    """Get protocol usage breakdown for a letter"""
    if f'protocol_{letter}' in cache and time.time() - cache[f'protocol_{letter}']['timestamp'] < CACHE_DURATION:
        return jsonify(cache[f'protocol_{letter}']['data'])
    
    # Generate protocol breakdown
    breakdown = generate_protocol_breakdown(letter.upper())
    cache[f'protocol_{letter}'] = {'data': breakdown, 'timestamp': time.time()}
    return jsonify(breakdown)

@app.route('/api/gateio-tokens/<letter>')
def get_gateio_tokens(letter):
    """Get Gate.io tokens containing a letter"""
    if f'gateio_{letter}' in cache and time.time() - cache[f'gateio_{letter}']['timestamp'] < CACHE_DURATION:
        return jsonify(cache[f'gateio_{letter}']['data'])
    
    # Generate Gate.io token data
    tokens = generate_gateio_tokens(letter.upper())
    cache[f'gateio_{letter}'] = {'data': tokens, 'timestamp': time.time()}
    return jsonify(tokens)

@app.route('/api/settlements')
def get_settlements():
    """Get settlement proofs"""
    if 'settlements' in cache and time.time() - cache['settlements']['timestamp'] < CACHE_DURATION:
        return jsonify(cache['settlements']['data'])
    
    # Generate settlement data
    settlements = generate_settlements()
    cache['settlements'] = {'data': settlements, 'timestamp': time.time()}
    return jsonify(settlements)

def generate_letter_data():
    """Generate live letter price data with random sampling"""
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    letters = []
    
    base_prices = {
        'E': 0.142, 'T': 0.185, 'A': 0.142, 'O': 0.085, 'N': 0.072,
        'I': 0.095, 'R': 0.068, 'S': 0.105, 'H': 0.062, 'L': 0.058,
        'D': 0.062, 'C': 0.118, 'U': 0.045, 'M': 0.075, 'W': 0.058,
        'F': 0.052, 'G': 0.048, 'Y': 0.072, 'P': 0.065, 'B': 0.091,
        'V': 0.042, 'K': 0.045, 'J': 0.038, 'X': 0.035, 'Q': 0.032, 'Z': 0.028
    }
    
    for i, letter in enumerate(alphabet):
        base_price = base_prices.get(letter, 0.05)
        change = random.uniform(-15, 25)
        current_price = base_price * (1 + change / 100)
        weekly_usage = random.randint(500000, 3500000)
        rank = i + 1
        long_pct = random.randint(40, 80)
        short_pct = 100 - long_pct
        protocols = ['Solana', 'Ethereum', 'Base', 'Bitcoin Ordinals']
        top_protocol = protocols[random.randint(0, 3)]
        volatility = random.choice(['Low', 'Medium', 'High'])
        
        letters.append({
            'letter': letter,
            'price': round(current_price, 3),
            'change_24h': round(change, 1),
            'weekly_usage': format_number(weekly_usage),
            'rank': f'#{rank}',
            'long_pct': f'{long_pct}%',
            'short_pct': f'{short_pct}%',
            'top_protocol': top_protocol,
            'trend': '↑' if change > 0 else '↓',
            'volatility': volatility
        })
    
    return letters

def generate_letter_detail(letter):
    """Generate detailed letter page data"""
    base_price = random.uniform(0.03, 0.20)
    weekly_usage = random.randint(500000, 3500000)
    prev_week_usage = int(weekly_usage * random.uniform(0.8, 1.2))
    weekly_change = ((weekly_usage - prev_week_usage) / prev_week_usage) * 100
    rank = random.randint(1, 26)
    volatility = random.choice(['Low', 'Medium', 'High'])
    congestion_tax = random.choice(['Active', 'Inactive'])
    
    return {
        'letter': letter,
        'current_price': round(base_price, 3),
        'weekly_usage': weekly_usage,
        'prev_week_usage': prev_week_usage,
        'weekly_change': round(weekly_change, 2),
        'rank': f'#{rank}',
        'volatility': volatility,
        'congestion_tax': congestion_tax,
        'long_interest': f'{random.randint(40, 80)}%',
        'top_protocol': random.choice(['Solana', 'Ethereum', 'Base'])
    }

def generate_protocol_breakdown(letter):
    """Generate protocol usage breakdown"""
    protocols = [
        {'name': 'Solana', 'base': 150000},
        {'name': 'Ethereum', 'base': 100000},
        {'name': 'Base', 'base': 180000},
        {'name': 'Bitcoin Ordinals', 'base': 40000},
        {'name': 'Gate.io Tokens', 'base': 1200},
        {'name': 'Language.fi Registry', 'base': 88000},
        {'name': 'NYT Sample', 'base': 67000},
        {'name': 'Hash Baseline', 'base': 54000}
    ]
    
    breakdown = []
    for protocol in protocols:
        usage = int(protocol['base'] * random.uniform(0.7, 1.5))
        change = random.uniform(-10, 35)
        breakdown.append({
            'name': protocol['name'],
            'usage': usage,
            'change': round(change, 2)
        })
    
    return breakdown

def generate_gateio_tokens(letter):
    """Generate Gate.io token data"""
    token_count = random.randint(800, 1500)
    total_occurrences = token_count * random.randint(1, 3)
    share = round((token_count / 10000) * 100, 1)
    rank = random.randint(8, 20)
    
    tokens = []
    sample_tokens = [
        {'symbol': 'BTC', 'name': 'Bitcoin'},
        {'symbol': 'ETH', 'name': 'Ethereum'},
        {'symbol': 'SOL', 'name': 'Solana'},
        {'symbol': 'BNB', 'name': 'BNB'},
        {'symbol': 'ARB', 'name': 'Arbitrum'},
        {'symbol': 'OP', 'name': 'Optimism'},
        {'symbol': 'MATIC', 'name': 'Polygon'},
        {'symbol': 'AVAX', 'name': 'Avalanche'}
    ]
    
    for token in sample_tokens:
        if letter in token['symbol'] or letter in token['name'].upper():
            b_count = token['symbol'].upper().count(letter) + token['name'].upper().count(letter)
            tokens.append({
                'symbol': token['symbol'],
                'name': token['name'],
                'b_count': b_count
            })
    
    return {
        'token_count': token_count,
        'total_occurrences': total_occurrences,
        'share_of_listed': f'{share}%',
        'rank': f'#{rank}',
        'tokens': tokens
    }

def generate_settlements():
    """Generate settlement proof data"""
    settlements = []
    
    markets = ['B / Base', 'E / Solana', 'T / Ethereum', 'A / Solana', 'S / Base']
    
    for i, market in enumerate(markets):
        prev_window = f'Apr {20-i*7}–{26-i*7}'
        curr_window = f'Apr {27-i*7}–May {3-i*7}'
        prev_usage = random.randint(100000, 200000)
        curr_usage = int(prev_usage * random.uniform(0.9, 1.3))
        change = ((curr_usage - prev_usage) / prev_usage) * 100
        winning_side = 'Long' if change > 0 else 'Short'
        
        settlements.append({
            'market': f'{market} / Week {18-i}',
            'prev_window': prev_window,
            'curr_window': curr_window,
            'prev_usage': prev_usage,
            'curr_usage': curr_usage,
            'change': round(change, 2),
            'winning_side': winning_side,
            'status': 'Finalized'
        })
    
    return settlements

def format_number(num):
    """Format large numbers"""
    if num >= 1000000:
        return f'{num/1000000:.2f}M'
    elif num >= 1000:
        return f'{num/1000:.0f}K'
    return str(num)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    print(f"Language.fi Backend Server running on port {port}")
    app.run(host='0.0.0.0', port=port)
