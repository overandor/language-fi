"""
Gating Rules Service
Enforces per-wallet caps, rate limits, and anti-farming rules
"""

import os
from typing import Dict, Optional
from datetime import datetime, timedelta
from collections import defaultdict

# Gating configuration
DAILY_CAP = int(os.getenv("DAILY_CAP", "10000"))  # Max LGU per wallet per day
WEEKLY_CAP = int(os.getenv("WEEKLY_CAP", "50000"))  # Max LGU per wallet per week
MAX_SUBMISSIONS_PER_DAY = int(os.getenv("MAX_SUBMISSIONS_PER_DAY", "10"))  # Max artifacts per day
MIN_TIME_BETWEEN_SUBMISSIONS = int(os.getenv("MIN_TIME_BETWEEN_SUBMISSIONS", "300"))  # Seconds

# Blacklisted wallets (in production, load from database/config)
BLACKLISTED_WALLETS = set()

# Suspicious activity thresholds
SUSPICIOUS_SUBMISSION_THRESHOLD = 20  # Submissions per hour
SUSPICIOUS_SCORE_THRESHOLD = 0.3  # Average score below this triggers review


class GatingRulesService:
    """Service for enforcing gating rules and anti-farming measures"""
    
    def __init__(self):
        # In production, use Redis or database for distributed tracking
        self.wallet_daily_mints = defaultdict(float)
        self.wallet_weekly_mints = defaultdict(float)
        self.wallet_daily_submissions = defaultdict(int)
        self.wallet_last_submission = defaultdict(datetime)
        self.wallet_hourly_submissions = defaultdict(list)
    
    def check_submission_allowed(
        self,
        wallet_address: str,
        mint_amount: float
    ) -> tuple[bool, Optional[str]]:
        """
        Check if submission is allowed based on gating rules
        Returns (allowed, reason)
        """
        # Check blacklist
        if wallet_address in BLACKLISTED_WALLETS:
            return False, "Wallet is blacklisted"
        
        # Check daily cap
        if not self._check_daily_cap(wallet_address, mint_amount):
            return False, f"Daily cap exceeded ({DAILY_CAP} LGU)"
        
        # Check weekly cap
        if not self._check_weekly_cap(wallet_address, mint_amount):
            return False, f"Weekly cap exceeded ({WEEKLY_CAP} LGU)"
        
        # Check submission rate
        if not self._check_submission_rate(wallet_address):
            return False, "Too many submissions. Please wait."
        
        # Check suspicious activity
        if self._check_suspicious_activity(wallet_address):
            return False, "Account flagged for suspicious activity"
        
        return True, None
    
    def _check_daily_cap(self, wallet_address: str, mint_amount: float) -> bool:
        """Check if wallet has exceeded daily mint cap"""
        today = datetime.utcnow().date()
        key = f"{wallet_address}:{today}"
        
        daily_total = self.wallet_daily_mints.get(key, 0)
        return daily_total + mint_amount <= DAILY_CAP
    
    def _check_weekly_cap(self, wallet_address: str, mint_amount: float) -> bool:
        """Check if wallet has exceeded weekly mint cap"""
        week_start = self._get_week_start()
        key = f"{wallet_address}:{week_start}"
        
        weekly_total = self.wallet_weekly_mints.get(key, 0)
        return weekly_total + mint_amount <= WEEKLY_CAP
    
    def _check_submission_rate(self, wallet_address: str) -> bool:
        """Check if wallet is submitting too frequently"""
        now = datetime.utcnow()
        
        # Check minimum time between submissions
        last_submission = self.wallet_last_submission.get(wallet_address)
        if last_submission:
            time_since_last = (now - last_submission).total_seconds()
            if time_since_last < MIN_TIME_BETWEEN_SUBMISSIONS:
                return False
        
        # Check daily submission count
        today = datetime.utcnow().date()
        daily_key = f"{wallet_address}:{today}"
        daily_count = self.wallet_daily_submissions.get(daily_key, 0)
        if daily_count >= MAX_SUBMISSIONS_PER_DAY:
            return False
        
        return True
    
    def _check_suspicious_activity(self, wallet_address: str) -> bool:
        """Check for suspicious activity patterns"""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        
        # Check hourly submission rate
        hourly_submissions = [
            ts for ts in self.wallet_hourly_submissions.get(wallet_address, [])
            if ts > hour_ago
        ]
        
        if len(hourly_submissions) >= SUSPICIOUS_SUBMISSION_THRESHOLD:
            return True
        
        return False
    
    def record_submission(
        self,
        wallet_address: str,
        mint_amount: float,
        score: float
    ):
        """Record a successful submission for tracking"""
        now = datetime.utcnow()
        
        # Update daily mints
        today = datetime.utcnow().date()
        daily_key = f"{wallet_address}:{today}"
        self.wallet_daily_mints[daily_key] = self.wallet_daily_mints.get(daily_key, 0) + mint_amount
        
        # Update weekly mints
        week_start = self._get_week_start()
        weekly_key = f"{wallet_address}:{week_start}"
        self.wallet_weekly_mints[weekly_key] = self.wallet_weekly_mints.get(weekly_key, 0) + mint_amount
        
        # Update submission count
        self.wallet_daily_submissions[daily_key] = self.wallet_daily_submissions.get(daily_key, 0) + 1
        
        # Update last submission time
        self.wallet_last_submission[wallet_address] = now
        
        # Update hourly submissions
        self.wallet_hourly_submissions[wallet_address].append(now)
        
        # Clean old hourly submissions
        hour_ago = now - timedelta(hours=1)
        self.wallet_hourly_submissions[wallet_address] = [
            ts for ts in self.wallet_hourly_submissions[wallet_address]
            if ts > hour_ago
        ]
    
    def get_wallet_stats(self, wallet_address: str) -> Dict:
        """Get statistics for a wallet"""
        today = datetime.utcnow().date()
        week_start = self._get_week_start()
        
        daily_mints = self.wallet_daily_mints.get(f"{wallet_address}:{today}", 0)
        weekly_mints = self.wallet_weekly_mints.get(f"{wallet_address}:{week_start}", 0)
        daily_submissions = self.wallet_daily_submissions.get(f"{wallet_address}:{today}", 0)
        
        return {
            "daily_mints": daily_mints,
            "weekly_mints": weekly_mints,
            "daily_submissions": daily_submissions,
            "daily_remaining": max(0, DAILY_CAP - daily_mints),
            "weekly_remaining": max(0, WEEKLY_CAP - weekly_mints),
            "submissions_remaining": max(0, MAX_SUBMISSIONS_PER_DAY - daily_submissions)
        }
    
    def _get_week_start(self) -> str:
        """Get the start of the current week (Monday)"""
        now = datetime.utcnow()
        days_since_monday = now.weekday()  # Monday is 0
        week_start = now - timedelta(days=days_since_monday)
        return week_start.date().isoformat()
    
    def reset_daily_limits(self):
        """Reset daily limits (call this daily via cron)"""
        yesterday = (datetime.utcnow() - timedelta(days=1)).date()
        
        # Clean up old daily records
        keys_to_delete = [
            key for key in self.wallet_daily_mints.keys()
            if key.endswith(f":{yesterday}")
        ]
        for key in keys_to_delete:
            del self.wallet_daily_mints[key]
        
        keys_to_delete = [
            key for key in self.wallet_daily_submissions.keys()
            if key.endswith(f":{yesterday}")
        ]
        for key in keys_to_delete:
            del self.wallet_daily_submissions[key]
    
    def add_to_blacklist(self, wallet_address: str):
        """Add wallet to blacklist"""
        BLACKLISTED_WALLETS.add(wallet_address)
    
    def remove_from_blacklist(self, wallet_address: str):
        """Remove wallet from blacklist"""
        BLACKLISTED_WALLETS.discard(wallet_address)


# Singleton instance
_gating_service = None

def get_gating_service() -> GatingRulesService:
    """Get singleton gating service instance"""
    global _gating_service
    if _gating_service is None:
        _gating_service = GatingRulesService()
    return _gating_service
