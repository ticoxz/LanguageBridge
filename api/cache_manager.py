import hashlib
import time
from collections import OrderedDict
from typing import Optional, Dict, Any

class TranslationCache:
    """LRU Cache for translations with TTL support."""
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 86400):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self.hits = 0
        self.misses = 0
    
    def _make_key(self, text: str, source_lang: str = "auto", target_lang: str = "auto") -> str:
        """Generate cache key from text and languages."""
        content = f"{text}|{source_lang}|{target_lang}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def get(self, text: str, source_lang: str = "auto", target_lang: str = "auto") -> Optional[Dict[str, Any]]:
        """Get cached translation if exists and not expired."""
        key = self._make_key(text, source_lang, target_lang)
        
        if key not in self.cache:
            self.misses += 1
            return None
        
        entry = self.cache[key]
        
        # Check if expired
        if time.time() - entry["timestamp"] > self.ttl_seconds:
            del self.cache[key]
            self.misses += 1
            return None
        
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        self.hits += 1
        return entry["data"]
    
    def set(self, text: str, data: Dict[str, Any], source_lang: str = "auto", target_lang: str = "auto"):
        """Store translation in cache."""
        key = self._make_key(text, source_lang, target_lang)
        
        # Remove oldest if at capacity
        if len(self.cache) >= self.max_size and key not in self.cache:
            self.cache.popitem(last=False)
        
        self.cache[key] = {
            "data": data,
            "timestamp": time.time()
        }
        self.cache.move_to_end(key)
    
    def clear(self):
        """Clear all cache entries."""
        self.cache.clear()
        self.hits = 0
        self.misses = 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.1f}%"
        }

# Global cache instance
translation_cache = TranslationCache()
