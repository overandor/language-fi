#!/usr/bin/env python3
"""
Add performance monitoring to all HTML files
"""

import os
import re

perf_script = '''    <!-- Performance Monitoring -->
    <script src="performance.js"></script>
'''

def add_performance(filepath):
    """Add performance monitoring to an HTML file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if performance monitoring already exists
    if 'performance.js' in content:
        print(f"Skipping {filepath} - Performance monitoring already exists")
        return
    
    # Insert performance monitoring after analytics script
    analytics_pattern = r'(<!-- Google Analytics -->.*?</script>\s*</script>)'
    if re.search(analytics_pattern, content, re.DOTALL):
        content = re.sub(analytics_pattern, r'\1\n' + perf_script, content, flags=re.DOTALL)
    else:
        # Insert after the last script tag in head
        head_pattern = r'(</head>)'
        content = re.sub(head_pattern, perf_script + r'\1', content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Updated {filepath}")

def main():
    """Add performance monitoring to all HTML files"""
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
            add_performance(filepath)
        else:
            print(f"File not found: {filepath}")

if __name__ == '__main__':
    main()
