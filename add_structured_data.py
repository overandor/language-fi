#!/usr/bin/env python3
"""
Add structured data (JSON-LD) to all HTML files
"""

import os
import re

# Structured data for each page
structured_data_templates = {
    'index.html': '''    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Language.fi — Neomorphic Linguistic Oracle Dashboard",
        "description": "Real-time linguistic primitive oracle dashboard with live market data from CoinGecko. Track letter and number pricing, usage metrics, and attribution samples.",
        "url": "https://language-fi.vercel.app/",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web Browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "author": {
            "@type": "Organization",
            "name": "Language.fi"
        }
    }
    </script>''',
    'claim.html': '''    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Claim — Language.fi Oracle",
        "description": "Claim your linguistic primitive oracle artifacts on Language.fi. Mint proof-of-value tokens for letter and number primitives.",
        "url": "https://language-fi.vercel.app/claim.html",
        "author": {
            "@type": "Organization",
            "name": "Language.fi"
        }
    }
    </script>''',
    'dashboard_neomorphic.html': '''    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Dashboard — Language.fi Market Data",
        "description": "Real-time market data dashboard for linguistic primitives. Track live letter and number pricing from CoinGecko.",
        "url": "https://language-fi.vercel.app/dashboard_neomorphic.html",
        "author": {
            "@type": "Organization",
            "name": "Language.fi"
        }
    }
    </script>''',
    'kpi_dashboard.html': '''    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "KPI Dashboard — Language.fi Metrics",
        "description": "KPI oracle dashboard tracking linguistic primitive metrics. Real-time usage data, attribution samples, and performance indicators.",
        "url": "https://language-fi.vercel.app/kpi_dashboard.html",
        "author": {
            "@type": "Organization",
            "name": "Language.fi"
        }
    }
    </script>'''
}

oracle_template = '''    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Oracle {letter} — Language.fi Letter Primitive",
        "description": "Letter {letter} oracle with real-time pricing and attribution samples. Track {letter} primitive market data and usage metrics.",
        "url": "https://language-fi.vercel.app/oracle_{letter}.html",
        "author": {{
            "@type": "Organization",
            "name": "Language.fi"
        }}
    }}
    </script>'''

def add_structured_data(filepath, letter=None):
    """Add structured data to an HTML file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if structured data already exists
    if 'application/ld+json' in content:
        print(f"Skipping {filepath} - Structured data already exists")
        return
    
    filename = os.path.basename(filepath)
    
    if filename in structured_data_templates:
        structured_data = structured_data_templates[filename]
    elif letter:
        structured_data = oracle_template.format(letter=letter)
    else:
        print(f"Skipping {filepath} - No template found")
        return
    
    # Insert structured data after canonical link
    canonical_pattern = r'(<link rel="canonical" href="[^"]+">)'
    content = re.sub(canonical_pattern, r'\1\n' + structured_data, content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Updated {filepath}")

def main():
    """Add structured data to all pages"""
    # Pages with predefined templates
    for filename in ['index.html', 'claim.html', 'dashboard_neomorphic.html', 'kpi_dashboard.html']:
        filepath = f'/Users/alep/Downloads/language-fi/{filename}'
        if os.path.exists(filepath):
            add_structured_data(filepath)
    
    # Oracle pages
    letters = ['A', 'E', 'T', 'O', 'N', 'I', 'S', 'R', 'H', 'L', 'D', 'C']
    for letter in letters:
        filepath = f'/Users/alep/Downloads/language-fi/oracle_{letter}.html'
        if os.path.exists(filepath):
            add_structured_data(filepath, letter=letter)

if __name__ == '__main__':
    main()
