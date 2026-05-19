#!/usr/bin/env python3
"""
Add SEO meta tags to all HTML files
"""

import os
import re

# Pages and their SEO data
pages_data = {
    'index.html': {
        'title': 'Language.fi — Neomorphic Linguistic Oracle Dashboard',
        'description': 'Real-time linguistic primitive oracle dashboard with live market data from CoinGecko. Track letter and number pricing, usage metrics, and attribution samples.',
        'keywords': 'linguistic oracle, language primitives, neomorphic dashboard, CoinGecko, letter pricing, number pricing, market data',
        'url': 'https://language-fi.vercel.app/'
    },
    'claim.html': {
        'title': 'Claim — Language.fi Oracle',
        'description': 'Claim your linguistic primitive oracle artifacts on Language.fi. Mint proof-of-value tokens for letter and number primitives.',
        'keywords': 'claim, mint, oracle artifacts, linguistic primitives, proof-of-value',
        'url': 'https://language-fi.vercel.app/claim.html'
    },
    'dashboard_neomorphic.html': {
        'title': 'Dashboard — Language.fi Market Data',
        'description': 'Real-time market data dashboard for linguistic primitives. Track live letter and number pricing from CoinGecko.',
        'keywords': 'dashboard, market data, real-time pricing, CoinGecko, letter pricing',
        'url': 'https://language-fi.vercel.app/dashboard_neomorphic.html'
    },
    'kpi_dashboard.html': {
        'title': 'KPI Dashboard — Language.fi Metrics',
        'description': 'KPI oracle dashboard tracking linguistic primitive metrics. Real-time usage data, attribution samples, and performance indicators.',
        'keywords': 'KPI dashboard, metrics, usage data, attribution samples, performance indicators',
        'url': 'https://language-fi.vercel.app/kpi_dashboard.html'
    },
    'oracle_A.html': {
        'title': 'Oracle A — Language.fi Letter Primitive',
        'description': 'Letter A oracle with real-time pricing and attribution samples. Track A primitive market data and usage metrics.',
        'keywords': 'oracle A, letter A, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_A.html'
    },
    'oracle_E.html': {
        'title': 'Oracle E — Language.fi Letter Primitive',
        'description': 'Letter E oracle with real-time pricing and attribution samples. Track E primitive market data and usage metrics.',
        'keywords': 'oracle E, letter E, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_E.html'
    },
    'oracle_T.html': {
        'title': 'Oracle T — Language.fi Letter Primitive',
        'description': 'Letter T oracle with real-time pricing and attribution samples. Track T primitive market data and usage metrics.',
        'keywords': 'oracle T, letter T, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_T.html'
    },
    'oracle_O.html': {
        'title': 'Oracle O — Language.fi Letter Primitive',
        'description': 'Letter O oracle with real-time pricing and attribution samples. Track O primitive market data and usage metrics.',
        'keywords': 'oracle O, letter O, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_O.html'
    },
    'oracle_N.html': {
        'title': 'Oracle N — Language.fi Letter Primitive',
        'description': 'Letter N oracle with real-time pricing and attribution samples. Track N primitive market data and usage metrics.',
        'keywords': 'oracle N, letter N, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_N.html'
    },
    'oracle_I.html': {
        'title': 'Oracle I — Language.fi Letter Primitive',
        'description': 'Letter I oracle with real-time pricing and attribution samples. Track I primitive market data and usage metrics.',
        'keywords': 'oracle I, letter I, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_I.html'
    },
    'oracle_S.html': {
        'title': 'Oracle S — Language.fi Letter Primitive',
        'description': 'Letter S oracle with real-time pricing and attribution samples. Track S primitive market data and usage metrics.',
        'keywords': 'oracle S, letter S, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_S.html'
    },
    'oracle_R.html': {
        'title': 'Oracle R — Language.fi Letter Primitive',
        'description': 'Letter R oracle with real-time pricing and attribution samples. Track R primitive market data and usage metrics.',
        'keywords': 'oracle R, letter R, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_R.html'
    },
    'oracle_H.html': {
        'title': 'Oracle H — Language.fi Letter Primitive',
        'description': 'Letter H oracle with real-time pricing and attribution samples. Track H primitive market data and usage metrics.',
        'keywords': 'oracle H, letter H, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_H.html'
    },
    'oracle_L.html': {
        'title': 'Oracle L — Language.fi Letter Primitive',
        'description': 'Letter L oracle with real-time pricing and attribution samples. Track L primitive market data and usage metrics.',
        'keywords': 'oracle L, letter L, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_L.html'
    },
    'oracle_D.html': {
        'title': 'Oracle D — Language.fi Letter Primitive',
        'description': 'Letter D oracle with real-time pricing and attribution samples. Track D primitive market data and usage metrics.',
        'keywords': 'oracle D, letter D, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_D.html'
    },
    'oracle_C.html': {
        'title': 'Oracle C — Language.fi Letter Primitive',
        'description': 'Letter C oracle with real-time pricing and attribution samples. Track C primitive market data and usage metrics.',
        'keywords': 'oracle C, letter C, linguistic primitive, letter pricing, attribution',
        'url': 'https://language-fi.vercel.app/oracle_C.html'
    }
}

def add_seo_meta(filepath, data):
    """Add SEO meta tags to an HTML file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if SEO meta tags already exist
    if '<meta name="description"' in content:
        print(f"Skipping {filepath} - SEO meta tags already exist")
        return
    
    # Find the title tag and add SEO meta tags after it
    title_pattern = r'(<title>.*?</title>)'
    seo_meta = f'''\\1
    <meta name="description" content="{data['description']}">
    <meta name="keywords" content="{data['keywords']}">
    <meta name="author" content="Language.fi">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{data['url']}">
    <meta property="og:title" content="{data['title']}">
    <meta property="og:description" content="{data['description']}">
    <meta property="og:image" content="https://language-fi.vercel.app/og-image.png">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{data['url']}">
    <meta property="twitter:title" content="{data['title']}">
    <meta property="twitter:description" content="{data['description']}">
    <meta property="twitter:image" content="https://language-fi.vercel.app/og-image.png">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="{data['url']}">'''
    
    content = re.sub(title_pattern, seo_meta, content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Updated {filepath}")

def main():
    """Add SEO meta tags to all pages"""
    for filename, data in pages_data.items():
        filepath = f'/Users/alep/Downloads/language-fi/{filename}'
        if os.path.exists(filepath):
            add_seo_meta(filepath, data)
        else:
            print(f"File not found: {filepath}")

if __name__ == '__main__':
    main()
