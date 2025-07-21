function IPTVContent({ user, onPlayContent }) {
  const [subscriptions, setSubscriptions] = React.useState([]);
  const [content, setContent] = React.useState([]);
  const [selectedSubscription, setSelectedSubscription] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('movies');
  const [categories, setCategories] = React.useState([]);

  React.useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = async () => {
    try {
      const subsData = await trickleListObjects(`iptv_subscription:${user.objectId}`, 10, true);
      setSubscriptions(subsData.items.filter(s => s.objectData.isActive));
      
      if (subsData.items.length > 0) {
        setSelectedSubscription(subsData.items[0]);
        loadContent(subsData.items[0], activeTab);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const loadContent = async (subscription, type) => {
    setLoading(true);
    try {
      let iptvContent = [];
      let contentCategories = [];
      
      if (type === 'movies') {
        [iptvContent, contentCategories] = await Promise.all([
          IPTVApi.getVodStreams(subscription?.objectData),
          IPTVApi.getCategories(subscription?.objectData, 'vod')
        ]);
      } else if (type === 'series') {
        [iptvContent, contentCategories] = await Promise.all([
          IPTVApi.getSeriesStreams(subscription?.objectData),
          IPTVApi.getCategories(subscription?.objectData, 'series')
        ]);
      }
      
      setContent(iptvContent || []);
      setCategories(contentCategories || []);
      console.log(`Loaded ${iptvContent?.length || 0} ${type} items`);
    } catch (error) {
      console.error('Error loading content:', error);
      setContent([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (selectedSubscription) {
      loadContent(selectedSubscription, tab);
    }
  };

  const generateStreamUrl = (item, type) => {
    if (!selectedSubscription) return '';
    return IPTVApi.generateStreamUrl(
      selectedSubscription.objectData,
      item.stream_id || item.id,
      type
    );
  };

  try {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-20" data-name="iptv-content" data-file="components/IPTVContent.js">
        <h1 className="text-3xl font-bold mb-6">תוכן IPTV</h1>
        
        {subscriptions.length === 0 ? (
          <div className="text-center py-12">
            <div className="icon-film text-6xl text-gray-600 mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">אין מנויי IPTV</h2>
            <p className="text-gray-400">הוסף מנוי IPTV כדי לצפות בתכנים</p>
          </div>
        ) : (
          <>
            <div className="flex space-x-4 mb-6">
              <button 
                className={`px-4 py-2 rounded ${activeTab === 'movies' ? 'bg-red-600' : 'bg-gray-700'}`}
                onClick={() => handleTabChange('movies')}
              >
                סרטים
              </button>
              <button 
                className={`px-4 py-2 rounded ${activeTab === 'series' ? 'bg-red-600' : 'bg-gray-700'}`}
                onClick={() => handleTabChange('series')}
              >
                סדרות
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
                <p className="text-gray-400">טוען תוכן...</p>
              </div>
            ) : (
              <div className="responsive-grid">
                {content.map((item) => (
                  <div 
                    key={item.stream_id || item.id}
                    className="content-card group relative"
                    onClick={() => onPlayContent({
                      ...item,
                      url: generateStreamUrl(item, activeTab === 'movies' ? 'vod' : 'series'),
                      thumbnail: item.stream_icon || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIGZpbGw9IiM0NzQ3NDciPjx0ZXh0IHg9IjQwIiB5PSIzNSIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1PVklFPC90ZXh0Pjwvc3ZnPgo='
                    })}
                  >
                    <img 
                      src={item.stream_icon || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIGZpbGw9IiM0NzQ3NDciPjx0ZXh0IHg9IjQwIiB5PSIzNSIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1PVklFPC90ZXh0Pjwvc3ZnPgo='} 
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="icon-play text-4xl text-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-gray-400">{item.category_name || activeTab}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  } catch (error) {
    console.error('IPTVContent component error:', error);
    return null;
  }
}