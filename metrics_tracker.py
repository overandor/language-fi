#!/usr/bin/env python3
"""
Usage Metrics Tracker
Tracks active users, API calls, registered assets, and revenue
"""

from typing import Dict, List, Any
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import json


class MetricsTracker:
    """Tracks usage metrics for the Language.fi protocol"""
    
    def __init__(self):
        self.api_calls = defaultdict(int)
        self.active_users = set()
        self.user_activity = defaultdict(list)
        self.registered_assets = defaultdict(int)
        self.revenue = defaultdict(float)
        self.session_starts = defaultdict(datetime)
        
    def track_api_call(self, endpoint: str, user_id: str = None):
        """
        Track an API call
        
        Args:
            endpoint: API endpoint called
            user_id: User identifier (optional)
        """
        self.api_calls[endpoint] += 1
        
        if user_id:
            self.active_users.add(user_id)
            self.user_activity[user_id].append({
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'endpoint': endpoint
            })
    
    def track_asset_registration(self, asset_type: str, user_id: str = None):
        """
        Track asset registration
        
        Args:
            asset_type: Type of asset (word, sentence, etc.)
            user_id: User identifier (optional)
        """
        self.registered_assets[asset_type] += 1
        
        if user_id:
            self.active_users.add(user_id)
    
    def track_revenue(self, revenue_type: str, amount: float, user_id: str = None):
        """
        Track revenue
        
        Args:
            revenue_type: Type of revenue (api, registration, royalty)
            amount: Revenue amount
            user_id: User identifier (optional)
        """
        self.revenue[revenue_type] += amount
        
        if user_id:
            self.active_users.add(user_id)
    
    def start_session(self, user_id: str):
        """
        Start a user session
        
        Args:
            user_id: User identifier
        """
        self.session_starts[user_id] = datetime.now(timezone.utc)
        self.active_users.add(user_id)
    
    def end_session(self, user_id: str):
        """
        End a user session
        
        Args:
            user_id: User identifier
        """
        if user_id in self.session_starts:
            del self.session_starts[user_id]
    
    def get_active_user_count(self, time_window_minutes: int = 30) -> int:
        """
        Get count of active users within time window
        
        Args:
            time_window_minutes: Time window in minutes
            
        Returns:
            Count of active users
        """
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=time_window_minutes)
        active_count = 0
        
        for user_id, activities in self.user_activity.items():
            recent_activities = [
                a for a in activities 
                if datetime.fromisoformat(a['timestamp']) >= cutoff_time
            ]
            if recent_activities:
                active_count += 1
        
        return active_count
    
    def get_api_call_stats(self, endpoint: str = None) -> Dict[str, int]:
        """
        Get API call statistics
        
        Args:
            endpoint: Specific endpoint (optional)
            
        Returns:
            Dictionary of API call counts
        """
        if endpoint:
            return {endpoint: self.api_calls.get(endpoint, 0)}
        return dict(self.api_calls)
    
    def get_total_api_calls(self) -> int:
        """Get total API calls across all endpoints"""
        return sum(self.api_calls.values())
    
    def get_registered_assets_stats(self, asset_type: str = None) -> Dict[str, int]:
        """
        Get registered asset statistics
        
        Args:
            asset_type: Specific asset type (optional)
            
        Returns:
            Dictionary of asset counts
        """
        if asset_type:
            return {asset_type: self.registered_assets.get(asset_type, 0)}
        return dict(self.registered_assets)
    
    def get_total_registered_assets(self) -> int:
        """Get total registered assets"""
        return sum(self.registered_assets.values())
    
    def get_revenue_stats(self, revenue_type: str = None) -> Dict[str, float]:
        """
        Get revenue statistics
        
        Args:
            revenue_type: Specific revenue type (optional)
            
        Returns:
            Dictionary of revenue amounts
        """
        if revenue_type:
            return {revenue_type: self.revenue.get(revenue_type, 0.0)}
        return dict(self.revenue)
    
    def get_total_revenue(self) -> float:
        """Get total revenue"""
        return sum(self.revenue.values())
    
    def get_repeat_users(self, days: int = 7) -> int:
        """
        Get count of repeat users within time window
        
        Args:
            days: Time window in days
            
        Returns:
            Count of repeat users
        """
        cutoff_time = datetime.now(timezone.utc) - timedelta(days=days)
        repeat_count = 0
        
        for user_id, activities in self.user_activity.items():
            if len(activities) > 1:
                # Check if activities span multiple days
                first_activity = datetime.fromisoformat(activities[0]['timestamp'])
                if first_activity >= cutoff_time:
                    repeat_count += 1
        
        return repeat_count
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive metrics summary
        
        Returns:
            Dictionary of all metrics
        """
        return {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'active_users_30min': self.get_active_user_count(30),
            'active_users_24h': self.get_active_user_count(1440),
            'total_api_calls': self.get_total_api_calls(),
            'api_calls_by_endpoint': self.get_api_call_stats(),
            'total_registered_assets': self.get_total_registered_assets(),
            'registered_assets_by_type': self.get_registered_assets_stats(),
            'total_revenue': self.get_total_revenue(),
            'revenue_by_type': self.get_revenue_stats(),
            'repeat_users_7d': self.get_repeat_users(7),
            'repeat_users_30d': self.get_repeat_users(30),
            'current_sessions': len(self.session_starts)
        }
    
    def reset_metrics(self):
        """Reset all metrics (use with caution)"""
        self.api_calls = defaultdict(int)
        self.active_users = set()
        self.user_activity = defaultdict(list)
        self.registered_assets = defaultdict(int)
        self.revenue = defaultdict(float)
        self.session_starts = defaultdict(datetime)
    
    def export_metrics(self, filepath: str):
        """
        Export metrics to file
        
        Args:
            filepath: Path to export file
        """
        metrics = self.get_metrics_summary()
        with open(filepath, 'w') as f:
            json.dump(metrics, f, indent=2)


# Global metrics tracker instance
metrics_tracker = MetricsTracker()


def get_metrics_summary() -> Dict[str, Any]:
    """Get global metrics summary"""
    return metrics_tracker.get_metrics_summary()


def track_api_call(endpoint: str, user_id: str = None):
    """Track API call globally"""
    metrics_tracker.track_api_call(endpoint, user_id)


def track_asset_registration(asset_type: str, user_id: str = None):
    """Track asset registration globally"""
    metrics_tracker.track_asset_registration(asset_type, user_id)


def track_revenue(revenue_type: str, amount: float, user_id: str = None):
    """Track revenue globally"""
    metrics_tracker.track_revenue(revenue_type, amount, user_id)
