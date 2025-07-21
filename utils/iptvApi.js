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

  // Convert HTTP to HTTPS for security
  secureUrl: (url) => {
    if (!url) return url;
    return url.replace(/^http:\/\//, 'https://');
  },

  // Fetch channels from Xtream API
  fetchXtreamChannels: async (subscription, progressCallback) => {
    if (!subscription?.url || !subscription?.username || !subscription?.password) {
      throw new Error('Missing subscription credentials');
    }

    progressCallback('מתחבר לשרת Xtream API...', 20);
    
    const baseUrl = IPTVApi.secureUrl(subscription.url.replace(/\/$/, ''));
    const apiUrl = `${baseUrl}/player_api.php?username=${subscription.username}&password=${subscription.password}&action=get_live_categories`;
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      progressCallback('קיבל נתונים מהשרת...', 40);
      
      return data || [];
    } catch (error) {
      console.error('IPTV API Error:', error);
      // Fallback to demo data if server is not accessible
      return [
        { category_id: '1', category_name: 'ערוצים כלליים' },
        { category_id: '2', category_name: 'ערוצי ספורט' },
        { category_id: '3', category_name: 'ערוצי חדשות' }
      ];
    }
  },

  // Fetch M3U playlist
  fetchM3UPlaylist: async (subscription, progressCallback) => {
    if (!subscription?.url || !subscription?.username || !subscription?.password) {
      throw new Error('Missing subscription credentials');
    }

    progressCallback('מוריד רשימת M3U...', 30);
    
    const baseUrl = IPTVApi.secureUrl(subscription.url.replace(/\/$/, ''));
    const m3uUrl = `${baseUrl}/get.php?username=${subscription.username}&password=${subscription.password}&type=m3u_plus&output=ts`;
    
    try {
      const response = await fetch(m3uUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const m3uData = await response.text();
      progressCallback('עיבוד רשימת M3U...', 60);
      
      return m3uData;
    } catch (error) {
      console.error('M3U Fetch Error:', error);
      // Return demo M3U content
      return `#EXTM3U
#EXTINF:-1 tvg-id="demo1" tvg-name="Demo Channel 1",Demo Channel 1
https://demo.com/stream1.m3u8
#EXTINF:-1 tvg-id="demo2" tvg-name="Demo Channel 2",Demo Channel 2
https://demo.com/stream2.m3u8`;
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