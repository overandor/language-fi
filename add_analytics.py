#!/usr/bin/env python3
"""
Add Google Analytics to all HTML files
"""

import os
import re

ga_script = '''    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script src="analytics.js"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        if (typeof LanguageFiAnalytics !== 'undefined') {
            LanguageFiAnalytics.initAnalytics();
            LanguageFiAnalytics.trackPageView(document.title, window.location.href);
        }
    </script>
'''

def add_analytics(filepath):
    """Add Google Analytics to an HTML file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if analytics already exists
    if 'googletagmanager.com/gtag' in content:
        print(f"Skipping {filepath} - Analytics already exists")
        return
    
    # Insert analytics after canonical link or head
    canonical_pattern = r'(<link rel="canonical" href="[^"]+">)'
    if re.search(canonical_pattern, content):
        content = re.sub(canonical_pattern, r'\1\n' + ga_script, content)
    else:
        # Insert after the first script tag (structured data) or in head
        head_pattern = r'(</head>)'
        content = re.sub(head_pattern, ga_script + r'\1', content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Updated {filepath}")

def main():
    """Add analytics to all HTML files"""
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
            add_analytics(filepath)
        else:
            print(f"File not found: {filepath}")

if __name__ == '__main__':
    main()
