#!/usr/bin/env python3
"""
Language.fi KPI Oracle System
Measures real letter KPIs from public endpoints - NO API KEYS
"""

import os
import json
import requests
import time
import random
import string
from datetime import datetime, timezone
from collections import Counter
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# KPI data cache
kpi_cache = {
    'letter_kpis': {},
    'number_kpis': {},
    'sample_sources': [],
    'last_updated': None
}

# Public endpoints (NO API KEYS REQUIRED)
PUBLIC_ENDPOINTS = [
    {
        'name': 'Wikipedia Random',
        'url': 'https://en.wikipedia.org/api/rest_v1/page/random/summary',
        'type': 'json',
        'extract_fields': ['title', 'extract']
    },
    {
        'name': 'GitHub Trending',
        'url': 'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&per_page=10',
        'type': 'json',
        'extract_fields': ['items', 'name', 'description']
    },
    {
        'name': 'Reddit Hot',
        'url': 'https://www.reddit.com/hot.json?limit=25',
        'type': 'json',
        'extract_fields': ['data', 'children', 'title', 'selftext']
    },
    {
        'name': 'NewsAPI Demo',
        'url': 'https://newsapi.org/v2/top-headlines?country=us&apiKey=demo',
        'type': 'json',
        'extract_fields': ['articles', 'title', 'description']
    },
    {
        'name': 'PokeAPI Pokemon',
        'url': 'https://pokeapi.co/api/v2/pokemon?limit=20',
        'type': 'json',
        'extract_fields': ['results', 'name']
    },
    {
        'name': 'OpenLibrary Random',
        'url': 'https://openlibrary.org/api/random?format=json',
        'type': 'json',
        'extract_fields': ['title', 'description']
    },
    {
        'name': 'JSONPlaceholder Posts',
        'url': 'https://jsonplaceholder.typicode.com/posts',
        'type': 'json',
        'extract_fields': ['title', 'body']
    },
    {
        'name': 'Quote Garden Random',
        'url': 'https://api.quotable.io/random',
        'type': 'json',
        'extract_fields': ['content', 'author']
    },
    {
        'name': 'CoinGecko Coins',
        'url': 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1',
        'type': 'json',
        'extract_fields': ['name', 'symbol']
    },
    {
        'name': 'Binance Tickers',
        'url': 'https://api.binance.com/api/v3/ticker/24hr',
        'type': 'json',
        'extract_fields': ['symbol']
    }
]

def extract_text_from_response(data, extract_fields):
    """Recursively extract text from JSON response based on fields"""
    text_parts = []
    
    def extract_recursive(obj, fields, current_depth=0):
        if current_depth >= len(fields):
            return
        
        field = fields[current_depth]
        
        if isinstance(obj, dict):
            if field in obj:
                value = obj[field]
                if isinstance(value, str):
                    text_parts.append(value)
                elif isinstance(value, (dict, list)):
                    extract_recursive(value, fields, current_depth + 1)
        elif isinstance(obj, list) and obj:
            for item in obj[:10]:
                extract_recursive(item, fields, current_depth)
    
    extract_recursive(data, extract_fields)
    return ' '.join(text_parts)

def fetch_from_public_endpoint(endpoint_config):
    """Fetch data from a public endpoint"""
    try:
        response = requests.get(endpoint_config['url'], timeout=5)
        if response.status_code == 200:
            if endpoint_config['type'] == 'json':
                data = response.json()
                text = extract_text_from_response(data, endpoint_config['extract_fields'])
                return text, endpoint_config['name']
            else:
                return response.text, endpoint_config['name']
    except Exception as e:
        print(f"Error fetching from {endpoint_config['name']}: {e}")
    return None, endpoint_config['name']

def count_characters(text):
    """Count occurrences of each letter and number in text"""
    letter_counts = Counter()
    number_counts = Counter()
    
    text = text.lower()
    for char in text:
        if char in string.ascii_lowercase:
            letter_counts[char] += 1
        elif char in string.digits:
            number_counts[char] += 1
    
    return letter_counts, number_counts

def calculate_kpi(char, counts, total_chars, sample_sources):
    """Calculate KPIs for a character"""
    if total_chars == 0:
        return {
            'frequency_per_1k': 0,
            'sample_prevalence_pct': 0,
            'source_diversity': 0,
            'count': 0
        }
    
    frequency = counts.get(char, 0)
    frequency_per_1k = (frequency / total_chars) * 1000
    
    # Sample prevalence: % of samples containing this character
    samples_with_char = sum(1 for source in sample_sources if char in source.lower())
    sample_prevalence_pct = (samples_with_char / len(sample_sources)) * 100 if sample_sources else 0
    
    # Source diversity: number of unique endpoints containing this character
    source_diversity = len(set(s for s in sample_sources if char in s.lower()))
    
    return {
        'frequency_per_1k': frequency_per_1k,
        'sample_prevalence_pct': sample_prevalence_pct,
        'source_diversity': source_diversity,
        'count': frequency
    }

def update_kpi_data():
    """Update KPI data from public endpoints"""
    global kpi_cache
    
    letter_counts = Counter()
    number_counts = Counter()
    sample_sources = []
    
    print(f"Starting KPI sampling at {datetime.now()}")
    
    for endpoint_config in PUBLIC_ENDPOINTS:
        text, source_name = fetch_from_public_endpoint(endpoint_config)
        if text:
            lc, nc = count_characters(text)
            letter_counts.update(lc)
            number_counts.update(nc)
            sample_sources.append(source_name)
            print(f"Fetched from {source_name}: {len(text)} chars")
        time.sleep(0.3)  # Rate limiting
    
    total_chars = sum(letter_counts.values()) + sum(number_counts.values())
    print(f"Total characters analyzed: {total_chars}")
    print(f"Unique sources: {len(set(sample_sources))}")
    
    # Calculate KPIs for all letters
    letter_kpis = {}
    for letter in string.ascii_lowercase:
        letter_kpis[letter] = calculate_kpi(letter, letter_counts, total_chars, sample_sources)
    
    # Calculate KPIs for all numbers
    number_kpis = {}
    for number in string.digits:
        number_kpis[number] = calculate_kpi(number, number_counts, total_chars, sample_sources)
    
    # Update cache
    kpi_cache['letter_kpis'] = letter_kpis
    kpi_cache['number_kpis'] = number_kpis
    kpi_cache['sample_sources'] = list(set(sample_sources))
    kpi_cache['last_updated'] = datetime.now(timezone.utc).isoformat()
    
    return True

@app.route('/api/kpi/all', methods=['GET'])
def get_all_kpis():
    """Get all KPIs"""
    if kpi_cache['last_updated'] is None:
        update_kpi_data()
    
    return jsonify({
        'letters': kpi_cache['letter_kpis'],
        'numbers': kpi_cache['number_kpis'],
        'sample_sources': kpi_cache['sample_sources'],
        'last_updated': kpi_cache['last_updated']
    })

@app.route('/api/kpi/letters')
def get_letter_kpis():
    """Get KPIs for letters only"""
    if kpi_cache['last_updated'] is None:
        update_kpi_data()
    
    return jsonify({
        'letters': kpi_cache['letter_kpis'],
        'last_updated': kpi_cache['last_updated']
    })

@app.route('/api/kpi/numbers')
def get_number_kpis():
    """Get KPIs for numbers only"""
    if kpi_cache['last_updated'] is None:
        update_kpi_data()
    
    return jsonify({
        'numbers': kpi_cache['number_kpis'],
        'last_updated': kpi_cache['last_updated']
    })

@app.route('/api/kpi/<character>')
def get_character_kpi(character):
    """Get KPI for a specific character"""
    if kpi_cache['last_updated'] is None:
        update_kpi_data()
    
    char_upper = character.upper()
    
    if char_upper in kpi_cache['letter_kpis']:
        return jsonify({
            'character': char_upper,
            'type': 'letter',
            'kpi': kpi_cache['letter_kpis'][char_upper],
            'last_updated': kpi_cache['last_updated']
        })
    elif char_upper in kpi_cache['number_kpis']:
        return jsonify({
            'character': char_upper,
            'type': 'number',
            'kpi': kpi_cache['number_kpis'][char_upper],
            'last_updated': kpi_cache['last_updated']
        })
    else:
        return jsonify({'error': 'Character not found'}), 404

@app.route('/api/kpi/update', methods=['POST'])
def update_kpi():
    """Force update KPI data"""
    success = update_kpi_data()
    if success:
        return jsonify({
            'status': 'success',
            'last_updated': kpi_cache['last_updated'],
            'sample_sources': kpi_cache['sample_sources']
        })
    else:
        return jsonify({'error': 'Failed to update KPI data'}), 500

@app.route('/api/kpi/sources')
def get_sources():
    """Get list of available public endpoints"""
    return jsonify({
        'sources': [{'name': e['name'], 'url': e['url']} for e in PUBLIC_ENDPOINTS],
        'total_sources': len(PUBLIC_ENDPOINTS)
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'data_source': 'Public endpoints (no API keys)',
        'last_updated': kpi_cache['last_updated']
    })

if __name__ == '__main__':
    # Initial KPI calculation
    update_kpi_data()
    
    # Run Flask app
    app.run(host='0.0.0.0', port=7862)
