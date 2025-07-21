export const IPTVApi = {
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
    // Always use the Netlify proxy
    return `/proxy/${encodeURIComponent(url)}`;
  },

  // Helper to check if response is HTML error
  isHtmlError: (text) => {
    return text.trim().startsWith('<!DOCTYPE') || text.toLowerCase().includes('<html');
  },

  // Fetch channels from Xtream API
  fetchXtreamChannels: async (subscription, progressCallback) => {
    if (!subscription?.url || !subscription?.username || !subscription?.password) {
      throw new Error('Missing subscription credentials');
    }
    progressCallback('מתחבר לשרת Xtream API...', 20);
    const baseUrl = subscription.url.replace(/\/$/, '');
    const apiUrl = `${baseUrl}/player_api.php?username=${subscription.username}&password=${subscription.password}&action=get_live_streams`;
    const proxiedApiUrl = IPTVApi.getProxyUrl(apiUrl);
    try {
      const response = await IPTVApi.fetchWithTimeout(proxiedApiUrl, {}, 30000);
      const text = await response.text();
      if (IPTVApi.isHtmlError(text)) {
        throw new Error('שרת ה-IPTV לא מגיב או חוסם גישה (HTML error)');
      }
      try {
        const data = JSON.parse(text);
        progressCallback('קיבל נתונים מהשרת...', 40);
        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid response from server');
        }
        return data;
      } catch (jsonErr) {
        console.error('IPTV API JSON parse error:', jsonErr, text.slice(0, 200));
        throw new Error('שגיאה בפענוח נתוני Xtream API');
      }
    } catch (error) {
      console.error('IPTV API Error:', error);
      throw new Error('לא ניתן לטעון ערוצים מהשרת: ' + error.message);
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
    const proxiedM3uUrl = IPTVApi.getProxyUrl(m3uUrl);
    
    try {
      const response = await IPTVApi.fetchWithTimeout(proxiedM3uUrl, {}, 30000);
      const m3uData = await response.text();
      if (IPTVApi.isHtmlError(m3uData)) {
        throw new Error('שרת ה-IPTV לא מגיב או חוסם גישה (HTML error)');
      }
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
      throw new Error('לא ניתן לטעון את רשימת הערוצים: ' + error.message);
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
    let url = '';
    if (type === 'live') {
      url = `${baseUrl}/live/${subscription.username}/${subscription.password}/${streamId}.ts`;
    } else if (type === 'vod') {
      url = `${baseUrl}/movie/${subscription.username}/${subscription.password}/${streamId}.mp4`;
    } else if (type === 'series') {
      url = `${baseUrl}/series/${subscription.username}/${subscription.password}/${streamId}.mp4`;
    }
    return `/proxy/${encodeURIComponent(url)}`;
  },

  // Get live categories
  getLiveCategories: async (channels) => {
    const categories = [...new Set(channels.map(ch => ch.category))];
    return categories.map(cat => ({ category_name: cat }));
  },

  fetchXtreamVODStreams: async (subscription, progressCallback) => {
    if (!subscription?.url || !subscription?.username || !subscription?.password) {
      throw new Error('Missing subscription credentials');
    }
    progressCallback('מתחבר לשרת Xtream API (VOD)...', 20);
    const baseUrl = subscription.url.replace(/\/$/, '');
    const apiUrl = `${baseUrl}/player_api.php?username=${subscription.username}&password=${subscription.password}&action=get_vod_streams`;
    try {
      const response = await IPTVApi.tryBothProtocols(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      progressCallback('קיבל נתוני VOD מהשרת...', 40);
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid VOD response from server');
      }
      return data;
    } catch (error) {
      console.error('IPTV VOD API Error:', error);
      throw new Error('לא ניתן לטעון תכני VOD מהשרת');
    }
  }
};

// פונקציה מרכזית: נסה את כל שיטות החיבור במקביל ובחר את המוצלחת ביותר
export async function tryAllConnectionMethods(subscription, type = 'live', progressCallback) {
  const methods = [
    {
      name: 'xtream',
      fn: async () => {
        const data = await IPTVApi.fetchXtreamChannels(subscription, progressCallback);
        return Array.isArray(data) ? data : [];
      }
    },
    {
      name: 'm3u',
      fn: async () => {
        const m3uRaw = await IPTVApi.fetchM3UPlaylist(subscription, progressCallback);
        return IPTVApi.parseM3U(m3uRaw);
      }
    }
    // אפשר להוסיף כאן Proxy, VOD וכו' בעתיד
  ];
  // נסה קודם את השיטה שהצליחה בפעם הקודמת
  const lastSuccess = localStorage.getItem('iptv_last_success_method');
  if (lastSuccess) {
    const idx = methods.findIndex(m => m.name === lastSuccess);
    if (idx > 0) {
      const [method] = methods.splice(idx, 1);
      methods.unshift(method);
    }
  }
  // הרץ את כל השיטות במקביל עם timeout של 30 שניות
  const results = await Promise.allSettled(
    methods.map(m =>
      Promise.race([
        m.fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
      ]).then(
        res => ({ name: m.name, data: res }),
        err => ({ name: m.name, error: err })
      )
    )
  );
  // סנן הצלחות
  const successes = results
    .filter(r => r.value && r.value.data && Array.isArray(r.value.data) && r.value.data.length > 0)
    .map(r => r.value);
  if (successes.length > 0) {
    // שמור את השיטה המוצלחת
    localStorage.setItem('iptv_last_success_method', successes[0].name);
    return successes[0].data;
  }
  // אם אין הצלחות — זרוק שגיאה עם כל השגיאות
  throw new Error(
    'לא ניתן לטעון ערוצים:\n' +
      results.map(r => `${r.value?.name || ''}: ${r.value?.error || r.reason}`).join('\n')
  );
}