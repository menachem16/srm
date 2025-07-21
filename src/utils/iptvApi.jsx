const IPTVApi = {
  // Retry mechanism with exponential backoff
  retryWithBackoff: async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  },

  // Try both HTTP and HTTPS
  tryBothProtocols: async (url, options = {}, timeout = 60000) => {
    // נסה קודם את ה-URL המקורי
    try {
      const response = await IPTVApi.fetchWithTimeout(url, options, timeout);
      return response;
    } catch (error) {
      console.log('First attempt failed, trying alternative protocol...');
      
      // נסה את הפרוטוקול השני
      const alternativeUrl = url.startsWith('https://') 
        ? url.replace('https://', 'http://')
        : url.replace('http://', 'https://');
      
      return await IPTVApi.fetchWithTimeout(alternativeUrl, options, timeout);
    }
  },

  // Fetch with timeout
  fetchWithTimeout: async (url, options = {}, timeout = 60000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // בדוק אם זה URL של CORS-PROXY
      const finalUrl = url.includes('cors-proxy') ? url : IPTVApi.getProxyUrl(url);
      
      const response = await fetch(finalUrl, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },

  // Get proxy URL for HTTP resources
  getProxyUrl: (url) => {
    if (url.startsWith('https://')) return url;
    
    // השתמש ב-CORS Proxy עבור בקשות HTTP
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    return `${corsProxy}${encodeURIComponent(url)}`;
  },

  // Fetch channels from Xtream API
  fetchXtreamChannels: async (subscription, progressCallback) => {
    if (!subscription?.url || !subscription?.username || !subscription?.password) {
      throw new Error('Missing subscription credentials');
    }

    progressCallback('מתחבר לשרת Xtream API...', 20);
    
    const baseUrl = subscription.url.replace(/\/$/, '');
    const apiUrl = `${baseUrl}/player_api.php?username=${subscription.username}&password=${subscription.password}&action=get_live_categories`;
    
    try {
      const response = await IPTVApi.tryBothProtocols(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      progressCallback('קיבל נתונים מהשרת...', 40);
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response from server');
      }

      return data;
    } catch (error) {
      console.error('IPTV API Error:', error);
      throw new Error('לא ניתן לטעון ערוצים מהשרת');
    }
  },

  // Fetch M3U playlist
  fetchM3UPlaylist: async (subscription, progressCallback) => {
    if (!subscription?.url || !subscription?.username || !subscription?.password) {
      throw new Error('Missing subscription credentials');
    }

    progressCallback('מוריד רשימת M3U...', 30);
    
    const baseUrl = subscription.url.replace(/\/$/, '');
    const m3uUrl = `${baseUrl}/get.php?username=${subscription.username}&password=${subscription.password}&type=m3u_plus&output=ts`;
    
    try {
      const response = await IPTVApi.tryBothProtocols(m3uUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const m3uData = await response.text();
      if (!m3uData.includes('#EXTM3U')) {
        throw new Error('Invalid M3U playlist format');
      }

      // המר את כל כתובות ה-HTTP ל-HTTPS או דרך ה-proxy
      const processedM3U = m3uData.replace(
        /(https?:\/\/[^\s]+)/g,
        url => url.startsWith('https://') ? url : IPTVApi.getProxyUrl(url)
      );

      progressCallback('עיבוד רשימת M3U...', 60);
      return processedM3U;
    } catch (error) {
      console.error('M3U Fetch Error:', error);
      throw new Error('לא ניתן לטעון את רשימת הערוצים');
    }
  },

  // Parse M3U playlist
  parseM3U: (m3uData) => {
    const lines = m3uData.split('\n');
    const channels = [];
    let currentChannel = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        const match = line.match(/tvg-name="([^"]*)".*tvg-logo="([^"]*)".*group-title="([^"]*)".*,(.*)$/);
        if (match) {
          currentChannel = {
            id: `channel_${channels.length}`,
            name: match[4] || match[1] || `ערוץ ${channels.length + 1}`,
            logo: match[2] || '',
            category: match[3] || 'כללי'
          };
        }
      } else if (line.startsWith('http') && currentChannel.name) {
        currentChannel.url = line;
        channels.push(currentChannel);
        currentChannel = {};
      }
    }

    return channels;
  },

  // Generate stream URL
  generateStreamUrl: (subscription, streamId, type = 'live') => {
    if (!subscription?.url || !subscription?.username || !subscription?.password) {
      throw new Error('Missing subscription credentials');
    }

    const baseUrl = subscription.url.replace(/\/$/, '');
    
    if (type === 'live') {
      return `${baseUrl}/live/${subscription.username}/${subscription.password}/${streamId}.ts`;
    } else if (type === 'vod') {
      return `${baseUrl}/movie/${subscription.username}/${subscription.password}/${streamId}.mp4`;
    } else if (type === 'series') {
      return `${baseUrl}/series/${subscription.username}/${subscription.password}/${streamId}.mp4`;
    }
    
    return '';
  },

  // Get live categories
  getLiveCategories: async (channels) => {
    const categories = [...new Set(channels.map(ch => ch.category))];
    return categories.map(cat => ({ category_name: cat }));
  }
};