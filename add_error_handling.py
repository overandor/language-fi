#!/usr/bin/env python3
"""
Add production-grade error handling to JavaScript in HTML files
"""

import os
import re

def add_error_handling(filepath):
    """Add error handling to JavaScript in an HTML file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if error handling already exists
    if 'fetchWithRetry' in content:
        print(f"Skipping {filepath} - Error handling already exists")
        return
    
    # Find script tags and add error handling
    script_pattern = r'(<script>)(.*?)(</script>)'
    
    def enhance_script(match):
        script_start = match.group(1)
        script_content = match.group(2)
        script_end = match.group(3)
        
        # Add fetchWithRetry function if fetch is used
        if 'fetch(' in script_content and 'fetchWithRetry' not in script_content:
            error_handling = '''
const API_URL = 'https://luguog-language-fi-oracle-api.hf.space';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function fetchWithRetry(url, retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }
}

'''
            script_content = error_handling + script_content
        
        # Replace fetch calls with fetchWithRetry
        script_content = re.sub(r'fetch\(`([^`]+)`\)', r'fetchWithRetry(`\1`)', script_content)
        script_content = re.sub(r'fetch\("([^"]+)"\)', r'fetchWithRetry("\1")', script_content)
        
        return script_start + script_content + script_end
    
    content = re.sub(script_pattern, enhance_script, content, flags=re.DOTALL)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Updated {filepath}")

def main():
    """Add error handling to all HTML files with JavaScript"""
    html_files = [
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
            add_error_handling(filepath)
        else:
            print(f"File not found: {filepath}")

if __name__ == '__main__':
    main()
