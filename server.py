#!/usr/bin/env python3
"""
Language.fi Backend Server
Provides live data for letter prices, usage statistics, and protocol breakdown
"""

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import random
import time
from datetime import datetime
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

@app.route('/api/stake-sentence', methods=['POST'])
def stake_sentence():
    """Stake a sentence for stillness mining"""
    data = request.get_json()
    sentence = data.get('sentence', '').upper()
    
    if not sentence:
        return jsonify({'error': 'Sentence required'}), 400
    
    # Generate sentence staking data
    staking_data = generate_sentence_stake(sentence)
    return jsonify(staking_data)

@app.route('/api/sentence/<sentence_hash>')
def get_sentence_stake(sentence_hash):
    """Get staking data for a specific sentence"""
    if f'sentence_{sentence_hash}' in cache and time.time() - cache[f'sentence_{sentence_hash}']['timestamp'] < CACHE_DURATION:
        return jsonify(cache[f'sentence_{sentence_hash}']['data'])
    
    # Generate sentence staking data
    staking_data = generate_sentence_stake(sentence_hash)
    cache[f'sentence_{sentence_hash}'] = {'data': staking_data, 'timestamp': time.time()}
    return jsonify(staking_data)

@app.route('/api/space-price')
def get_space_price():
    """Get SPACE character price and stats"""
    if 'space_price' in cache and time.time() - cache['space_price']['timestamp'] < CACHE_DURATION:
        return jsonify(cache['space_price']['data'])
    
    # Generate SPACE character data
    space_data = generate_space_data()
    cache['space_price'] = {'data': space_data, 'timestamp': time.time()}
    return jsonify(space_data)

@app.route('/api/calculate-sentence-price', methods=['POST'])
def calculate_sentence_price():
    """Calculate minting price for a sentence"""
    data = request.get_json()
    sentence = data.get('sentence', '').upper()
    
    if not sentence:
        return jsonify({'error': 'Sentence required'}), 400
    
    # Calculate price based on character costs
    price_data = calculate_sentence_price_data(sentence)
    return jsonify(price_data)

@app.route('/api/transfer-sentence', methods=['POST'])
def transfer_sentence():
    """Transfer sentence with stillness reset"""
    data = request.get_json()
    sentence_hash = data.get('sentence_hash')
    transfer_type = data.get('transfer_type', 'hard')  # 'hard' or 'vaulted'
    
    if not sentence_hash:
        return jsonify({'error': 'Sentence hash required'}), 400
    
    # Generate transfer result
    transfer_data = generate_transfer_result(sentence_hash, transfer_type)
    return jsonify(transfer_data)

@app.route('/api/sentence-leaderboard')
def get_sentence_leaderboard():
    """Get ranked list of staked sentences"""
    if 'leaderboard' in cache and time.time() - cache['leaderboard']['timestamp'] < CACHE_DURATION:
        return jsonify(cache['leaderboard']['data'])
    
    # Generate leaderboard data
    leaderboard = generate_sentence_leaderboard()
    cache['leaderboard'] = {'data': leaderboard, 'timestamp': time.time()}
    return jsonify(leaderboard)

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
    
    # Generate primitive details
    primitive = generate_primitive_detail(symbol_upper)
    cache[cache_key] = {'data': primitive, 'timestamp': time.time()}
    return jsonify(primitive)

@app.route('/api/sentences/quote', methods=['POST'])
def quote_sentence():
    """Get sentence pricing quote with character breakdown"""
    data = request.get_json()
    sentence = data.get('sentence', '').upper()
    
    if not sentence:
        return jsonify({'error': 'Sentence required'}), 400
    
    # Generate sentence quote
    quote = generate_sentence_quote(sentence)
    return jsonify(quote)

@app.route('/api/staking/sentence-score', methods=['POST'])
def calculate_staking_score():
    """Calculate staking score for a sentence"""
    data = request.get_json()
    sentence_id = data.get('sentence_id')
    sentence = data.get('sentence', '').upper()
    staked_since = data.get('staked_since')
    last_moved_at = data.get('last_moved_at')
    
    if not sentence:
        return jsonify({'error': 'Sentence required'}), 400
    
    # Calculate staking score
    score = calculate_sentence_staking_score(sentence_id, sentence, staked_since, last_moved_at)
    return jsonify(score)

@app.route('/api/oracle/snapshot')
def get_oracle_snapshot():
    """Get oracle snapshot for settlement proof"""
    if 'oracle_snapshot' in cache and time.time() - cache['oracle_snapshot']['timestamp'] < CACHE_DURATION:
        return jsonify(cache['oracle_snapshot']['data'])
    
    # Generate oracle snapshot
    snapshot = generate_oracle_snapshot()
    cache['oracle_snapshot'] = {'data': snapshot, 'timestamp': time.time()}
    return jsonify(snapshot)

def generate_all_primitives():
    """Generate all primitives (letters, numbers, spaces, symbols)"""
    primitives = []
    
    # Letters A-Z
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for letter in alphabet:
        primitives.append(generate_primitive_base(letter, 'letter'))
    
    # Numbers 0-9
    for num in '0123456789':
        primitives.append(generate_primitive_base(num, 'number'))
    
    # SPACE
    primitives.append(generate_primitive_base('SPACE', 'separator'))
    
    # Symbols
    symbols = ['.', '!', '?', '-', '_', '@', '#']
    for symbol in symbols:
        primitives.append(generate_primitive_base(symbol, 'symbol'))
    
    return {
        'updated_at': datetime.utcnow().isoformat() + 'Z',
        'primitives': primitives
    }

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
        'rank': 1
    }

def generate_primitive_detail(symbol):
    """Generate detailed primitive data with oracle breakdown"""
    base_prices = {
        'E': 0.142, 'T': 0.185, 'A': 0.142, 'O': 0.085, 'N': 0.072,
        'I': 0.095, 'R': 0.068, 'S': 0.105, 'H': 0.062, 'L': 0.058,
        'D': 0.062, 'C': 0.118, 'U': 0.045, 'M': 0.075, 'W': 0.058,
        'F': 0.052, 'G': 0.048, 'Y': 0.072, 'P': 0.065, 'B': 0.091,
        'V': 0.042, 'K': 0.045, 'J': 0.038, 'X': 0.035, 'Q': 0.032, 'Z': 0.028,
        'SPACE': 0.061,
        '0': 0.041, '1': 0.043, '2': 0.037, '3': 0.039, '4': 0.038,
        '5': 0.040, '6': 0.035, '7': 0.033, '8': 0.036, '9': 0.034
    }
    
    base_price = base_prices.get(symbol, 0.03)
    previous_price = base_price * random.uniform(0.85, 1.15)
    weekly_change = (base_price - previous_price) / previous_price if previous_price > 0 else 0
    usage_current = random.randint(500000, 3500000)
    usage_previous = int(usage_current * random.uniform(0.8, 1.2))
    
    # Determine type
    if symbol == 'SPACE':
        primitive_type = 'separator'
    elif symbol.isdigit():
        primitive_type = 'number'
    else:
        primitive_type = 'letter'
    
    # Generate oracle source breakdown with specific weights
    solana_token_names = random.randint(10000, 50000)
    solana_nft_collections = random.randint(20000, 80000)
    solana_domains = random.randint(5000, 20000)
    languagefi_registry = random.randint(30000, 150000)
    gateio_listings = random.randint(500, 3000)
    
    # Calculate weighted usage
    weighted_usage = (
        solana_token_names * 0.25 +
        solana_nft_collections * 0.20 +
        solana_domains * 0.15 +
        languagefi_registry * 0.25 +
        gateio_listings * 0.15
    )
    
    # Oracle sources with weights
    oracle_sources = {
        'solana_token_names': {
            'occurrences': solana_token_names,
            'weight': 0.25,
            'source_id': 'sol_token_names_v1'
        },
        'solana_nft_collections': {
            'occurrences': solana_nft_collections,
            'weight': 0.20,
            'source_id': 'sol_nft_collections_v1'
        },
        'solana_domains': {
            'occurrences': solana_domains,
            'weight': 0.15,
            'source_id': 'sol_domains_v1'
        },
        'languagefi_registry': {
            'occurrences': languagefi_registry,
            'weight': 0.25,
            'source_id': 'langfi_registry_v1'
        },
        'gateio_token_listings': {
            'occurrences': gateio_listings,
            'weight': 0.15,
            'source_id': 'gateio_listings_v1'
        }
    }
    
    # Calculate oracle confidence based on sample size and source diversity
    total_sample = sum(s['occurrences'] for s in oracle_sources.values())
    source_diversity = len([s for s in oracle_sources.values() if s['occurrences'] > 1000])
    oracle_confidence = min(0.99, 0.85 + (total_sample / 1000000) * 0.1 + (source_diversity / 5) * 0.04)
    
    # Market result
    market_direction = 'up' if weekly_change > 0 else 'down'
    market_status = 'winning' if weekly_change > 0.05 else 'neutral'
    
    return {
        'symbol': symbol,
        'type': primitive_type,
        'price_lgu': round(base_price, 3),
        'previous_price_lgu': round(previous_price, 3),
        'weekly_change': round(weekly_change, 4),
        'usage_count_current_week': usage_current,
        'usage_count_previous_week': usage_previous,
        'rank': random.randint(1, 40),
        'volatility': random.choice(['low', 'medium', 'high']),
        'oracle_confidence': round(oracle_confidence, 3),
        'oracle_sources': oracle_sources,
        'weighted_usage': round(weighted_usage, 0),
        'market_result': {
            'direction': market_direction,
            'status': f'long_{symbol.lower()}_winning' if market_status == 'winning' else f'long_{symbol.lower()}_neutral'
        },
        'oracle_metadata': {
            'sample_size': total_sample,
            'window': 'weekly',
            'normalization_rules': 'uppercase, remove_special_chars, remove_duplicates',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'oracle_version': 'v1.0'
        }
    }

def generate_sentence_quote(sentence):
    """Generate sentence pricing quote with character breakdown"""
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
    
    characters = []
    base_value = 0
    
    for char in sentence:
        char_key = 'SPACE' if char == ' ' else char.upper()
        unit_price = base_prices.get(char_key, 0.03)
        count = 1
        total = unit_price * count
        base_value += total
        
        characters.append({
            'symbol': char_key,
            'count': count,
            'unit_price_lgu': round(unit_price, 3),
            'total': round(total, 3)
        })
    
    return {
        'sentence': sentence,
        'characters': characters,
        'base_value_lgu': round(base_value, 3),
        'oracle_updated_at': datetime.utcnow().isoformat() + 'Z'
    }

def calculate_sentence_staking_score(sentence_id, sentence, staked_since, last_moved_at):
    """Calculate staking score using oracle-based pricing"""
    # Generate quote for base value
    quote = generate_sentence_quote(sentence)
    base_value = quote['base_value_lgu']
    
    # Calculate stillness
    stillness_days = 73
    stillness_multiplier = calculate_stillness_multiplier(stillness_days)
    
    # Calculate weekly performance
    weekly_performance = random.uniform(0.05, 0.15)
    
    # Calculate diversity multiplier
    unique_chars = len(set(sentence.replace(' ', '')))
    diversity_multiplier = calculate_rarity_bonus(unique_chars, len(sentence))
    
    # Anti-spam score
    spam_score = calculate_spam_score(sentence) / 100
    
    # Final score
    final_score = base_value * (1 + weekly_performance) * stillness_multiplier * diversity_multiplier * spam_score
    
    # Find top contributors
    char_counts = {}
    for char in sentence:
        char_key = 'SPACE' if char == ' ' else char.upper()
        char_counts[char_key] = char_counts.get(char_key, 0) + 1
    
    top_contributors = sorted(
        [{'symbol': k, 'contribution': v} for k, v in char_counts.items()],
        key=lambda x: x['contribution'],
        reverse=True
    )[:3]
    
    return {
        'sentence_id': sentence_id or f'sent_{random.randint(1000, 9999)}',
        'base_character_value_lgu': round(base_value, 3),
        'weekly_character_performance': round(weekly_performance, 3),
        'stillness_days': stillness_days,
        'stillness_multiplier': stillness_multiplier,
        'diversity_multiplier': diversity_multiplier,
        'anti_spam_score': round(spam_score, 2),
        'final_staking_score': round(final_score, 3),
        'top_contributors': top_contributors
    }

def generate_oracle_snapshot():
    """Generate oracle snapshot for settlement proof"""
    # Get all primitives with oracle data
    primitives = generate_all_primitives()['primitives']
    
    # Add oracle details to each primitive
    oracle_snapshot = {
        'snapshot_id': f'oracle_{random.randint(100000, 999999)}',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'window': 'weekly',
        'oracle_version': 'v1.0',
        'normalization_rules': 'uppercase, remove_special_chars, remove_duplicates',
        'source_weights': {
            'solana_token_names': 0.25,
            'solana_nft_collections': 0.20,
            'solana_domains': 0.15,
            'languagefi_registry': 0.25,
            'gateio_token_listings': 0.15
        },
        'total_sample_size': random.randint(500000, 5000000),
        'primitives': []
    }
    
    for primitive in primitives:
        symbol = primitive['symbol']
        detail = generate_primitive_detail(symbol)
        oracle_snapshot['primitives'].append({
            'symbol': symbol,
            'type': primitive['type'],
            'price_lgu': detail['price_lgu'],
            'weekly_change': detail['weekly_change'],
            'oracle_sources': detail['oracle_sources'],
            'weighted_usage': detail['weighted_usage'],
            'oracle_confidence': detail['oracle_confidence'],
            'market_result': detail['market_result']
        })
    
    return oracle_snapshot

def generate_letter_data():
    """Generate live letter price data with random sampling"""
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    letters = []
    
    base_prices = {
        'E': 0.142, 'T': 0.185, 'A': 0.142, 'O': 0.085, 'N': 0.072,
        'I': 0.095, 'R': 0.068, 'S': 0.105, 'H': 0.062, 'L': 0.058,
        'D': 0.062, 'C': 0.118, 'U': 0.045, 'M': 0.075, 'W': 0.058,
        'F': 0.052, 'G': 0.048, 'Y': 0.072, 'P': 0.065, 'B': 0.091,
        'V': 0.042, 'K': 0.045, 'J': 0.038, 'X': 0.035, 'Q': 0.032, 'Z': 0.028,
        'SPACE': 0.012
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
    
    # Add SPACE character
    space_price = base_prices['SPACE']
    space_change = random.uniform(-5, 20)
    space_usage = random.randint(800000, 2500000)
    space_long = random.randint(50, 75)
    
    letters.append({
        'letter': 'SPACE',
        'price': round(space_price * (1 + space_change / 100), 3),
        'change_24h': round(space_change, 1),
        'weekly_usage': format_number(space_usage),
        'rank': '#27',
        'long_pct': f'{space_long}%',
        'short_pct': f'{100 - space_long}%',
        'top_protocol': 'Solana',
        'trend': '↑' if space_change > 0 else '↓',
        'volatility': 'Medium'
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

def generate_space_data():
    """Generate SPACE character data"""
    return {
        'character': 'SPACE',
        'price': round(random.uniform(0.008, 0.018), 3),
        'change_24h': round(random.uniform(-5, 20), 1),
        'weekly_usage': format_number(random.randint(800000, 2500000)),
        'rank': '#4',
        'description': 'Linguistic separator token'
    }

def generate_sentence_stake(sentence):
    """Generate sentence staking data with stillness bonus"""
    # Count characters including spaces
    char_counts = {}
    for char in sentence:
        if char == ' ':
            char = 'SPACE'
        char_counts[char] = char_counts.get(char, 0) + 1
    
    # Generate character performance data
    char_performance = {}
    total_score = 0
    for char, count in char_counts.items():
        perf = random.uniform(-5, 15)
        char_performance[char] = {
            'count': count,
            'performance': round(perf, 1),
            'weight': round(count / len(sentence) * 100, 1)
        }
        total_score += perf * count
    
    # Calculate raw score
    raw_score = round(total_score / len(sentence), 2)
    
    # Generate stillness bonus (random days staked)
    days_staked = random.randint(0, 400)
    stillness_multiplier = calculate_stillness_multiplier(days_staked)
    
    # Calculate final score
    final_score = round(raw_score * stillness_multiplier, 3)
    
    # Calculate anti-spam score
    spam_score = calculate_spam_score(sentence)
    
    # Calculate rarity bonus
    unique_chars = len(char_counts)
    rarity_bonus = calculate_rarity_bonus(unique_chars, len(sentence))
    
    return {
        'sentence': sentence,
        'sentence_hash': f'st_{random.randint(100000, 999999)}',
        'character_counts': char_counts,
        'character_performance': char_performance,
        'raw_score': raw_score,
        'days_staked': days_staked,
        'stillness_multiplier': stillness_multiplier,
        'final_score': final_score,
        'spam_score': spam_score,
        'rarity_bonus': rarity_bonus,
        'space_exposure': round(char_counts.get('SPACE', 0) / len(sentence) * 100, 1),
        'top_character': max(char_performance.items(), key=lambda x: x[1]['performance'])[0],
        'weakest_character': min(char_performance.items(), key=lambda x: x[1]['performance'])[0]
    }

def calculate_stillness_multiplier(days_staked):
    """Calculate stillness multiplier based on days staked"""
    if days_staked < 7:
        return 1.00
    elif days_staked < 30:
        return 1.10
    elif days_staked < 90:
        return 1.25
    elif days_staked < 180:
        return 1.50
    elif days_staked < 365:
        return 2.00
    else:
        return 3.00

def calculate_spam_score(sentence):
    """Calculate anti-spam score (lower is better)"""
    score = 100
    
    # Repeated character penalty
    char_counts = {}
    for char in sentence:
        char_counts[char] = char_counts.get(char, 0) + 1
    
    for char, count in char_counts.items():
        if count > len(sentence) * 0.3:  # If any char is >30% of sentence
            score -= 30
    
    # Low diversity penalty
    if len(char_counts) < 3:
        score -= 20
    
    # Length penalty for very short sentences
    if len(sentence) < 5:
        score -= 10
    
    return max(0, score)

def calculate_rarity_bonus(unique_chars, total_length):
    """Calculate rarity bonus based on character diversity"""
    if unique_chars == total_length:
        return 1.20  # All unique characters
    elif unique_chars / total_length > 0.8:
        return 1.10
    elif unique_chars / total_length > 0.5:
        return 1.05
    else:
        return 1.00

def calculate_sentence_price_data(sentence):
    """Calculate minting price for a sentence"""
    # Base character prices
    base_prices = {
        'E': 0.142, 'T': 0.185, 'A': 0.142, 'O': 0.085, 'N': 0.072,
        'I': 0.095, 'R': 0.068, 'S': 0.105, 'H': 0.062, 'L': 0.058,
        'D': 0.062, 'C': 0.118, 'U': 0.045, 'M': 0.075, 'W': 0.058,
        'F': 0.052, 'G': 0.048, 'Y': 0.072, 'P': 0.065, 'B': 0.091,
        'V': 0.042, 'K': 0.045, 'J': 0.038, 'X': 0.035, 'Q': 0.032, 'Z': 0.028,
        'SPACE': 0.012
    }
    
    total_price = 0
    char_breakdown = {}
    
    for char in sentence:
        char_key = 'SPACE' if char == ' ' else char.upper()
        char_price = base_prices.get(char_key, 0.05)
        total_price += char_price
        
        if char_key not in char_breakdown:
            char_breakdown[char_key] = {'count': 0, 'price': char_price}
        char_breakdown[char_key]['count'] += 1
    
    # Add minting fee
    minting_fee = total_price * 0.05
    final_price = total_price + minting_fee
    
    return {
        'sentence': sentence,
        'base_price': round(total_price, 2),
        'minting_fee': round(minting_fee, 2),
        'final_price': round(final_price, 2),
        'character_breakdown': char_breakdown
    }

def generate_transfer_result(sentence_hash, transfer_type):
    """Generate transfer result with stillness handling"""
    # Simulate current staking state
    current_days_staked = random.randint(30, 200)
    current_multiplier = calculate_stillness_multiplier(current_days_staked)
    
    if transfer_type == 'hard':
        # Hard transfer: stillness resets
        new_multiplier = 1.00
        stillness_preserved = 0
    else:
        # Vaulted transfer: partial stillness preserved
        new_multiplier = current_multiplier * 0.5  # Preserve 50%
        stillness_preserved = 50
    
    return {
        'sentence_hash': sentence_hash,
        'transfer_type': transfer_type,
        'previous_stillness_days': current_days_staked,
        'previous_multiplier': current_multiplier,
        'new_stillness_days': 0 if transfer_type == 'hard' else current_days_staked,
        'new_multiplier': round(new_multiplier, 2),
        'stillness_preserved': f'{stillness_preserved}%',
        'transfer_complete': True
    }

def generate_sentence_leaderboard():
    """Generate ranked list of staked sentences"""
    sample_sentences = [
        'BUILD ON BASE',
        'LANGUAGE IS LIQUIDITY',
        'DEPLOY TO PROD',
        'SHIP FAST OFTEN',
        'CODE SHIP REPEAT',
        'STILLNESS MINING',
        'DIAMOND HANDS',
        'HODL THE BAG',
        'SPACE THE FINAL',
        'FRONTIER BASE'
    ]
    
    leaderboard = []
    for i, sentence in enumerate(sample_sentences):
        staking_data = generate_sentence_stake(sentence)
        leaderboard.append({
            'rank': i + 1,
            'sentence': sentence,
            'sentence_hash': staking_data['sentence_hash'],
            'weekly_score': staking_data['final_score'],
            'stillness_age': staking_data['days_staked'],
            'stillness_multiplier': staking_data['stillness_multiplier'],
            'space_exposure': staking_data['space_exposure'],
            'top_character': staking_data['top_character'],
            'weakest_character': staking_data['weakest_character'],
            'reward_eligible': staking_data['spam_score'] > 70
        })
    
    # Sort by score
    leaderboard.sort(key=lambda x: x['weekly_score'], reverse=True)
    
    # Update ranks
    for i, entry in enumerate(leaderboard):
        entry['rank'] = i + 1
    
    return leaderboard

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    print(f"Language.fi Backend Server running on port {port}")
    app.run(host='0.0.0.0', port=port)
