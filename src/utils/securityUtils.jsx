// Security utilities for the IPTV application
const SecurityUtils = {
  // Simple encryption for sensitive data
  encrypt: (text) => {
    try {
      return btoa(unescape(encodeURIComponent(text)));
    } catch (error) {
      console.error('Encryption error:', error);
      return text;
    }
  },
  
  decrypt: (encodedText) => {
    try {
      return decodeURIComponent(escape(atob(encodedText)));
    } catch (error) {
      console.error('Decryption error:', error);
      return encodedText;
    }
  },

  // Sanitize input to prevent XSS
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>'"]/g, '')
      .trim();
  },

  // Validate URL format
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Rate limiting helper
  createRateLimiter: (maxRequests = 5, timeWindow = 60000) => {
    const requests = new Map();
    
    return (key) => {
      const now = Date.now();
      const userRequests = requests.get(key) || [];
      
      // Remove old requests outside time window
      const recentRequests = userRequests.filter(time => now - time < timeWindow);
      
      if (recentRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      recentRequests.push(now);
      requests.set(key, recentRequests);
      return true; // Request allowed
    };
  }
};