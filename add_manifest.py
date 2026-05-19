#!/usr/bin/env python3
"""
Add PWA manifest link to all HTML files
"""

import os
import re

manifest_link = '''    <!-- PWA Manifest -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#ff6b35">
'''

def add_manifest(filepath):
    """Add PWA manifest link to an HTML file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if manifest link already exists
    if 'manifest.json' in content:
        print(f"Skipping {filepath} - Manifest link already exists")
        return
    
    # Insert manifest link after viewport meta tag
    viewport_pattern = r'(<meta name="viewport"[^>]+>)'
    if re.search(viewport_pattern, content):
        content = re.sub(viewport_pattern, r'\1\n' + manifest_link, content)
    else:
        # Insert after charset meta tag
        charset_pattern = r'(<meta charset="UTF-8">)'
        content = re.sub(charset_pattern, r'\1\n' + manifest_link, content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Updated {filepath}")

def main():
    """Add manifest link to all HTML files"""
    html_files = [
        'index.html',
        'landing_neomorphic.html',
        'claim.html',
        'dashboard_neomorphic.html',
        'kpi_dashboard.html',
        'oracle_A.html',
        'oracle_E.html',
        'oracle_T.html',
        'oracle_O.html',
        'oracle_N.html',
        'oracle_I.html',
        'oracle_S.html',
        'oracle_R.html',
        'oracle_H.html',
        'oracle_L.html',
        'oracle_D.html',
        'oracle_C.html'
    ]
    
    for filename in html_files:
        filepath = f'/Users/alep/Downloads/language-fi/{filename}'
        if os.path.exists(filepath):
            add_manifest(filepath)
        else:
            print(f"File not found: {filepath}")

if __name__ == '__main__':
    main()
