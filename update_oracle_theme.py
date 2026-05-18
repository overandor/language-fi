#!/usr/bin/env python3
"""
Update all oracle HTML files to dark orange theme
"""

import os
import re

# Dark orange theme replacements
replacements = [
    (r'background: linear-gradient\(135deg, #e0e5ec 0%, #f5f7fa 50%, #e8eef5 100%\);', 
     'background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);'),
    (r'color: #2d3748;', 'color: #e0e0e0;'),
    (r'color: #1a202c;', 'color: #ff6b35;'),
    (r'color: #718096;', 'color: #a0aec0;'),
    (r'background: #e0e5ec;', 'background: #1a1a2e;'),
    (r'box-shadow: \s*8px 8px 16px #b8bec7,\s*-8px -8px 16px #ffffff;', 
     'box-shadow: 8px 8px 16px #0f0f1a, -8px -8px 16px #252540, 0 0 30px rgba(255, 107, 53, 0.1);'),
    (r'box-shadow: \s*6px 6px 12px #b8bec7,\s*-6px -6px 12px #ffffff;', 
     'box-shadow: 6px 6px 12px #0f0f1a, -6px -6px 12px #252540, 0 0 20px rgba(255, 107, 53, 0.15);'),
    (r'box-shadow: \s*4px 4px 8px #b8bec7,\s*-4px -4px 8px #ffffff;', 
     'box-shadow: 4px 4px 8px #0f0f1a, -4px -4px 8px #252540, 0 0 15px rgba(255, 107, 53, 0.2);'),
    (r'box-shadow: \s*3px 3px 6px #b8bec7,\s*-3px -3px 6px #ffffff;', 
     'box-shadow: 3px 3px 6px #0f0f1a, -3px -3px 6px #252540, 0 0 10px rgba(255, 107, 53, 0.15);'),
    (r'box-shadow: \s*2px 2px 4px #b8bec7,\s*-2px -2px 4px #ffffff;', 
     'box-shadow: 2px 2px 4px #0f0f1a, -2px -2px 4px #252540, 0 0 10px rgba(255, 107, 53, 0.2);'),
    (r'background: linear-gradient\(135deg, #e8eef5 0%, #f5f7fa 100%\);', 
     'background: linear-gradient(135deg, #252540 0%, #1a1a2e 100%);'),
    (r'color: #4a5568;', 'color: #e0e0e0;'),
    (r'background: #48bb78;', 'background: #ff6b35;'),
    (r'border-bottom: 1px solid rgba\(0, 0, 0, 0\.05\);', 
     'border-bottom: 1px solid rgba(255, 107, 53, 0.1);'),
    (r'background: rgba\(255, 255, 255, 0\.3\);', 
     'background: rgba(255, 107, 53, 0.1);'),
    (r'border: 3px solid #e0e5ec;\s*border-top-color: #4a5568;', 
     'border: 3px solid #1a1a2e; border-top-color: #ff6b35;'),
    (r'color: #22543d;', 'color: #48bb78;'),
    (r'color: #742a2a;', 'color: #fc8181;'),
    (r'text-shadow: 8px 8px 16px #b8bec7, -8px -8px 16px #ffffff;', 
     'text-shadow: 8px 8px 16px #0f0f1a, -8px -8px 16px #252540, 0 0 30px rgba(255, 107, 53, 0.5);'),
    (r'text-shadow: 0 1px 2px rgba\(255, 255, 255, 0\.8\);', 
     'text-shadow: 0 0 20px rgba(255, 107, 53, 0.5);'),
]

# Oracle pages to update
oracle_pages = [
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

def update_file(filepath):
    """Update a single HTML file with dark orange theme"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Updated {filepath}")

def main():
    """Update all oracle pages"""
    for page in oracle_pages:
        filepath = f'/Users/alep/Downloads/language-fi/{page}'
        if os.path.exists(filepath):
            update_file(filepath)
        else:
            print(f"File not found: {filepath}")

if __name__ == '__main__':
    main()
