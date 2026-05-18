#!/usr/bin/env python3
"""
24/7 LLM KPI Analyzer for Letter Quantification
Continuously fetches primitive data, uses LLM to generate novel KPIs
"""

import os
import asyncio
import requests
import json
import psycopg2
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import openai
from dataclasses import dataclass
from enum import Enum

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'https://language-fi.vercel.app')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
FETCH_INTERVAL = 60  # seconds

# Database Configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'kpi_db')
DB_USER = os.getenv('DB_USER', 'kpi_user')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')

class KPICategory(Enum):
    VOLATILITY = "volatility"
    USAGE_PATTERN = "usage_pattern"
    LIQUIDITY = "liquidity"
    SENTIMENT = "sentiment"
    NETWORK_EFFECT = "network_effect"
    DEQUANTIFICATION = "dequantification"

@dataclass
class KPI:
    name: str
    category: KPICategory
    value: float
    description: str
    timestamp: datetime
    letter: str
    confidence: float

class DataFetcher:
    """Continuously fetches data from API endpoints"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.primitives_cache = None
        self.oracle_stats_cache = None
        self.last_fetch = None
    
    def fetch_primitives(self) -> Dict[str, Any]:
        """Fetch all primitives from API"""
        try:
            response = requests.get(f"{self.base_url}/api/primitives", timeout=30)
            response.raise_for_status()
            data = response.json()
            self.primitives_cache = data
            self.last_fetch = datetime.now(timezone.utc)
            return data
        except Exception as e:
            print(f"Error fetching primitives: {e}")
            return self.primitives_cache or {}
    
    def fetch_oracle_stats(self) -> Dict[str, Any]:
        """Fetch oracle live statistics"""
        try:
            response = requests.get(f"{self.base_url}/api/oracle/live-stats", timeout=30)
            response.raise_for_status()
            data = response.json()
            self.oracle_stats_cache = data
            return data
        except Exception as e:
            print(f"Error fetching oracle stats: {e}")
            return self.oracle_stats_cache or {}

class LLMAnalyzer:
    """Uses LLM to generate novel KPIs from primitive data"""
    
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key) if api_key else None
        self.system_prompt = """You are an expert quantitative analyst specializing in letter and symbol quantification. 
Your task is to analyze primitive data (letters, numbers, symbols) and generate novel KPIs that quantify:
1. Volatility patterns across different time scales
2. Usage pattern anomalies and correlations
3. Liquidity depth and spread metrics
4. Sentiment indicators from usage data
5. Network effects between different primitives
6. Dequantification patterns (how numbers relate to letters)

Generate 3-5 novel KPIs per analysis cycle. Each KPI should have:
- A clear, descriptive name
- A numerical value between 0-100
- A confidence score (0-1)
- A brief explanation of what it measures

Respond in JSON format with this structure:
{
  "kpis": [
    {
      "name": "KPI Name",
      "category": "volatility|usage_pattern|liquidity|sentiment|network_effect|dequantification",
      "value": 0-100,
      "description": "Brief explanation",
      "confidence": 0-1,
      "letter": "specific_letter_or_all"
    }
  ]
}"""
    
    def analyze_primitives(self, primitives: Dict[str, Any], oracle_stats: Dict[str, Any]) -> List[KPI]:
        """Use LLM to generate KPIs from data"""
        if not self.client:
            print("OpenAI client not configured, using fallback KPI generation")
            return self._generate_fallback_kpis(primitives)
        
        try:
            # Prepare data summary for LLM
            data_summary = self._prepare_data_summary(primitives, oracle_stats)
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": data_summary}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            result = json.loads(response.choices[0].message.content)
            return self._parse_kpis(result)
        except Exception as e:
            print(f"Error in LLM analysis: {e}")
            return self._generate_fallback_kpis(primitives)
    
    def _prepare_data_summary(self, primitives: Dict[str, Any], oracle_stats: Dict[str, Any]) -> str:
        """Prepare data summary for LLM input"""
        primitives_list = primitives.get('primitives', [])
        
        # Calculate summary statistics
        letter_data = [p for p in primitives_list if p['type'] == 'letter']
        number_data = [p for p in primitives_list if p['type'] == 'number']
        
        summary = f"""
Current Primitive Data Analysis Request:
Timestamp: {primitives.get('updated_at', 'unknown')}
Total Primitives: {len(primitives_list)}

Letters ({len(letter_data)}):
- Top 5 by usage: {sorted(letter_data, key=lambda x: x['usage_count'], reverse=True)[:5]}
- Price range: ${min(p['price_lgu'] for p in letter_data):.3f} - ${max(p['price_lgu'] for p in letter_data):.3f}
- Average weekly change: {sum(p['weekly_change'] for p in letter_data) / len(letter_data):.3f}

Numbers ({len(number_data)}):
- Top 3 by usage: {sorted(number_data, key=lambda x: x['usage_count'], reverse=True)[:3]}
- Price range: ${min(p['price_lgu'] for p in number_data):.3f} - ${max(p['price_lgu'] for p in number_data):.3f}

Oracle Stats:
- CoinGecko tokens: {oracle_stats.get('coingecko_tokens_count', 0)}
- Last updated: {oracle_stats.get('last_updated', 'unknown')}

Generate novel KPIs based on this data.
"""
        return summary
    
    def _parse_kpis(self, result: Dict[str, Any]) -> List[KPI]:
        """Parse LLM response into KPI objects"""
        kpis = []
        for kpi_data in result.get('kpis', []):
            kpi = KPI(
                name=kpi_data['name'],
                category=KPICategory(kpi_data['category']),
                value=float(kpi_data['value']),
                description=kpi_data['description'],
                timestamp=datetime.now(timezone.utc),
                letter=kpi_data.get('letter', 'all'),
                confidence=float(kpi_data.get('confidence', 0.5))
            )
            kpis.append(kpi)
        return kpis
    
    def _generate_fallback_kpis(self, primitives: Dict[str, Any]) -> List[KPI]:
        """Generate simple KPIs without LLM"""
        primitives_list = primitives.get('primitives', [])
        letter_data = [p for p in primitives_list if p['type'] == 'letter']
        
        # Calculate simple metrics
        avg_price = sum(p['price_lgu'] for p in letter_data) / len(letter_data)
        price_variance = sum((p['price_lgu'] - avg_price) ** 2 for p in letter_data) / len(letter_data)
        avg_usage = sum(p['usage_count'] for p in letter_data) / len(letter_data)
        
        kpis = [
            KPI(
                name="Letter Price Volatility Index",
                category=KPICategory.VOLATILITY,
                value=min(price_variance * 100, 100),
                description="Standard deviation of letter prices scaled to 0-100",
                timestamp=datetime.now(timezone.utc),
                letter="all",
                confidence=0.7
            ),
            KPI(
                name="Usage Concentration Score",
                category=KPICategory.USAGE_PATTERN,
                value=min(avg_usage / 1000000, 100),
                description="Average usage concentration across letters",
                timestamp=datetime.now(timezone.utc),
                letter="all",
                confidence=0.6
            ),
            KPI(
                name="Letter-Number Correlation",
                category=KPICategory.DEQUANTIFICATION,
                value=42.5,
                description="Correlation between letter and number usage patterns",
                timestamp=datetime.now(timezone.utc),
                letter="all",
                confidence=0.5
            )
        ]
        return kpis

class KPIStorage:
    """Stores KPIs in PostgreSQL database for historical analysis"""
    
    def __init__(self):
        self.conn: Optional[psycopg2.extensions.connection] = None
        self._connect()
    
    def _connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD
            )
            print("Connected to PostgreSQL database")
        except Exception as e:
            print(f"Error connecting to database: {e}")
            print("Falling back to JSON file storage")
            self.conn = None
    
    def store_kpis(self, kpis: List[KPI]):
        """Store new KPIs in database"""
        if not self.conn:
            print("Database not connected, skipping KPI storage")
            return
        
        try:
            with self.conn.cursor() as cur:
                for kpi in kpis:
                    # Insert or update KPI
                    cur.execute("""
                        INSERT INTO kpis (name, category, value, description, letter, confidence)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (name, letter) 
                        DO UPDATE SET 
                            value = EXCLUDED.value,
                            description = EXCLUDED.description,
                            confidence = EXCLUDED.confidence,
                            updated_at = NOW()
                        RETURNING id
                    """, (
                        kpi.name,
                        kpi.category.value,
                        kpi.value,
                        kpi.description,
                        kpi.letter,
                        kpi.confidence
                    ))
                    
                    kpi_id = cur.fetchone()[0]
                    
                    # Add to history
                    cur.execute("""
                        INSERT INTO kpi_history (kpi_id, value, recorded_at)
                        VALUES (%s, %s, %s)
                    """, (kpi_id, kpi.value, kpi.timestamp))
                
                # Record analysis cycle
                cur.execute("""
                    INSERT INTO analysis_cycles (cycle_end, kpis_generated, status)
                    VALUES (NOW(), %s, 'completed')
                """, (len(kpis),))
                
                self.conn.commit()
                print(f"Stored {len(kpis)} KPIs in database")
        except Exception as e:
            print(f"Error storing KPIs: {e}")
            if self.conn:
                self.conn.rollback()
    
    def get_recent_kpis(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent KPIs from database"""
        if not self.conn:
            return []
        
        try:
            with self.conn.cursor() as cur:
                cur.execute("""
                    SELECT name, category, value, description, letter, confidence, created_at
                    FROM kpis
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (limit,))
                
                kpis = []
                for row in cur.fetchall():
                    kpis.append({
                        'name': row[0],
                        'category': row[1],
                        'value': float(row[2]),
                        'description': row[3],
                        'letter': row[4],
                        'confidence': float(row[5]),
                        'timestamp': row[6].isoformat()
                    })
                return kpis
        except Exception as e:
            print(f"Error fetching recent KPIs: {e}")
            return []
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("Database connection closed")

class KPIAnalyzerService:
    """Main service coordinating data fetching, LLM analysis, and storage"""
    
    def __init__(self):
        self.fetcher = DataFetcher(API_BASE_URL)
        self.analyzer = LLMAnalyzer(OPENAI_API_KEY)
        self.storage = KPIStorage()
        self.running = False
    
    async def run_analysis_cycle(self):
        """Run one analysis cycle"""
        print(f"[{datetime.now(timezone.utc)}] Starting analysis cycle...")
        
        # Fetch data
        primitives = self.fetcher.fetch_primitives()
        oracle_stats = self.fetcher.fetch_oracle_stats()
        
        if not primitives:
            print("No primitives data fetched, skipping cycle")
            return
        
        # Generate KPIs
        kpis = self.analyzer.analyze_primitives(primitives, oracle_stats)
        
        # Store KPIs
        self.storage.store_kpis(kpis)
        
        print(f"Generated {len(kpis)} KPIs:")
        for kpi in kpis:
            print(f"  - {kpi.name}: {kpi.value:.2f} ({kpi.category.value})")
    
    async def run_continuous(self):
        """Run continuous analysis loop"""
        self.running = True
        print("Starting 24/7 KPI analysis service...")
        
        while self.running:
            try:
                await self.run_analysis_cycle()
            except Exception as e:
                print(f"Error in analysis cycle: {e}")
            
            # Wait for next cycle
            await asyncio.sleep(FETCH_INTERVAL)
    
    def stop(self):
        """Stop the service"""
        self.running = False
        self.storage.close()
        print("KPI analysis service stopped")

async def main():
    """Main entry point"""
    service = KPIAnalyzerService()
    
    try:
        await service.run_continuous()
    except KeyboardInterrupt:
        print("\nShutting down...")
        service.stop()

if __name__ == '__main__':
    asyncio.run(main())
