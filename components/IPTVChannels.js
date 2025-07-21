// אין צורך ב-import, כל הפונקציות זמינות גלובלית

function IPTVChannels({ user, onPlayChannel }) {
  const [subscriptions, setSubscriptions] = React.useState([]);
  const [selectedSubscription, setSelectedSubscription] = React.useState(null);
  const [channels, setChannels] = React.useState([]);
  const [categories, setCategories] = React.useState(['כל הקטגוריות']);
  const [filteredChannels, setFilteredChannels] = React.useState([]);
  const [loadingState, setLoadingState] = React.useState({
    isLoading: false,
    currentStep: '',
    progress: 0,
    error: null
  });
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showConnectionStatus, setShowConnectionStatus] = React.useState(false);
  const [abortController, setAbortController] = React.useState(null);

  React.useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user]);

  React.useEffect(() => {
    if (selectedSubscription) {
      loadChannels(selectedSubscription);
    }
  }, [selectedSubscription]);

  React.useEffect(() => {
    filterChannels();
  }, [channels, selectedCategory, searchTerm]);

  const loadSubscriptions = async () => {
    try {
      const subsData = await window.trickleListObjects(`iptv_subscription:${user.objectId}`, 10, true);
      const activeSubscriptions = subsData.items.filter(s => s.objectData.isActive);
      setSubscriptions(activeSubscriptions);
      
      if (activeSubscriptions.length > 0) {
        setSelectedSubscription(activeSubscriptions[0]);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const deleteSubscription = async (subscriptionId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק מנוי זה?')) {
      try {
        await window.trickleDeleteObject(`iptv_subscription:${user.objectId}`, subscriptionId);
        await loadSubscriptions();
        if (selectedSubscription?.objectId === subscriptionId) {
          setSelectedSubscription(null);
          setChannels([]);
        }
      } catch (error) {
        console.error('Error deleting subscription:', error);
        alert('שגיאה במחיקת המנוי');
      }
    }
  };

  const loadChannels = async (subscription) => {
    // Cancel previous request if exists
    if (abortController) {
      abortController.abort();
    }
    
    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    
    setLoadingState({
      isLoading: true,
      currentStep: 'מתחיל טעינה...',
      progress: 0,
      error: null
    });
    setChannels([]);
    setCategories(['כל הקטגוריות']);
    setShowConnectionStatus(true);
    
    try {
      console.log('Loading channels for subscription:', subscription?.objectData?.subscriptionName);
      
      // Progress callback with improved state management
      const progressCallback = (step, progress) => {
        if (!newAbortController.signal.aborted) {
          setLoadingState(prev => ({
            ...prev,
            currentStep: step,
            progress: Math.min(progress, 100)
          }));
        }
      };
      
      let liveStreams = [];
      
      // Method 1: Try Xtream API with retry
      try {
        progressCallback('מנסה Xtream API...', 10);
        liveStreams = await IPTVApi.retryWithBackoff(
          () => IPTVApi.fetchXtreamChannels(subscription?.objectData, progressCallback),
          2,
          1000
        );
        
        if (liveStreams && liveStreams.length > 0) {
          console.log(`Success with Xtream API: ${liveStreams.length} channels`);
          progressCallback('הצליח עם Xtream API', 60);
        } else {
          throw new Error('No channels from Xtream API');
        }
      } catch (xtreamError) {
        console.log(`Xtream API failed: ${xtreamError.message}, trying M3U playlist`);
        
        // Method 2: Try M3U playlist with retry
        try {
          progressCallback('מנסה M3U playlist...', 50);
          const m3uData = await IPTVApi.retryWithBackoff(
            () => IPTVApi.fetchM3UPlaylist(subscription?.objectData, progressCallback),
            2,
            1000
          );
          
          if (m3uData && typeof m3uData === 'string') {
            liveStreams = IPTVApi.parseM3U(m3uData);
            if (liveStreams && liveStreams.length > 0) {
              console.log(`Success with M3U playlist: ${liveStreams.length} channels`);
              progressCallback('הצליח עם M3U playlist', 70);
            } else {
              throw new Error('No channels parsed from M3U data');
            }
          } else {
            throw new Error('Invalid M3U data format');
          }
        } catch (m3uError) {
          console.log(`M3U failed: ${m3uError.message}`);
          throw new Error('לא ניתן לטעון ערוצים מהשרת');
        }
      }
      
      if (newAbortController.signal.aborted) return;
      
      progressCallback('מעבד נתונים...', 90);
      
      const formattedChannels = liveStreams.map((stream, index) => {
        const streamId = stream.id || stream.stream_id || `channel_${index}`;
        let streamUrl = '';
        
        try {
          streamUrl = IPTVApi.generateStreamUrl(subscription?.objectData, streamId, 'live');
        } catch (urlError) {
          console.warn('Failed to generate stream URL for channel:', stream.name, urlError.message);
          streamUrl = stream.url || '';
        }
        
        return {
          id: streamId,
          name: stream.name || `ערוץ ${index + 1}`,
          streamId: streamId,
          logo: stream.logo || stream.stream_icon || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA4MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VFY8L3RleHQ+Cjwvc3ZnPgo=',
          category: stream.category || stream.category_name || 'כללי',
          url: streamUrl,
          country: stream.country || 'Unknown'
        };
      });
      
      if (newAbortController.signal.aborted) return;
      
      console.log('Successfully loaded channels:', formattedChannels.length);
      setChannels(formattedChannels);
      
      const liveCategories = await IPTVApi.getLiveCategories(formattedChannels);
      const categoryNames = liveCategories.map(cat => cat.category_name);
      setCategories(['כל הקטגוריות', ...categoryNames]);
      
      progressCallback('הושלם בהצלחה!', 100);
      
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        currentStep: 'הושלם',
        progress: 100
      }));
      
    } catch (error) {
      if (!newAbortController.signal.aborted) {
        console.error('Error loading channels:', error);
        setChannels([]);
        setCategories(['כל הקטגוריות']);
        
        setLoadingState({
          isLoading: false,
          currentStep: 'שגיאה',
          progress: 0,
          error: `שגיאה בטעינת ערוצים: ${error.message}`
        });
      }
    } finally {
      if (!newAbortController.signal.aborted) {
        setTimeout(() => setShowConnectionStatus(false), 2000);
        setAbortController(null);
      }
    }
  };

  const filterChannels = () => {
    let filtered = channels;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ch => ch.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(ch => 
        ch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ch.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredChannels(filtered);
  };

  const handlePlayChannel = (channel) => {
    const streamUrl = IPTVApi.generateStreamUrl(
      selectedSubscription?.objectData, 
      channel.streamId || channel.id, 
      'live'
    );
    
    const videoData = {
      type: 'channel',
      data: {
        ...channel,
        url: streamUrl
      },
      subscription: selectedSubscription?.objectData
    };
    
    onPlayChannel(videoData.data, selectedSubscription?.objectData);
  };

  const addToFavorites = async (channel) => {
    try {
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const existingFavorites = await window.trickleListObjects(`iptv_favorites:${user.objectId}`, 20, true);
      
      if (existingFavorites && existingFavorites.items) {
        const alreadyFavorite = existingFavorites.items.some(fav => fav.objectData?.id === channel.id);
        
        if (alreadyFavorite) {
          alert('הערוץ כבר במועדפים');
          return;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 200));
      await window.trickleCreateObject(`iptv_favorites:${user.objectId}`, {
        userId: user.objectId,
        id: channel.id,
        name: channel.name,
        logo: channel.logo,
        category: channel.category,
        url: channel.url,
        country: channel.country
      });
      
      alert('הערוץ נוסף למועדפים');
    } catch (error) {
      console.error('Error adding to favorites:', error);
      alert('שגיאה בהוספה למועדפים. נסה שוב מאוחר יותר.');
    }
  };

  const scheduleRecording = async (channel) => {
    const title = prompt('שם התוכנית להקלטה:');
    if (!title) return;
    
    const date = prompt('תאריך (YYYY-MM-DD):');
    if (!date) return;
    
    const time = prompt('שעה (HH:MM):');
    if (!time) return;

    try {
      const scheduledTime = new Date(`${date}T${time}`);
      await window.trickleCreateObject(`scheduled_recordings:${user.objectId}`, {
        userId: user.objectId,
        title: title,
        channel: channel.name,
        channelUrl: channel.url,
        scheduledTime: scheduledTime.toISOString(),
        duration: 60,
        status: 'scheduled'
      });
      
      alert('הקלטה נוספה בהצלחה');
    } catch (error) {
      console.error('Error scheduling recording:', error);
      alert('שגיאה בתזמון הקלטה');
    }
  };

  try {
    if (!user) {
      return (
        <div className="max-w-7xl mx-auto px-6 pt-20 text-center">
          <p className="text-gray-400">יש להתחבר כדי לצפות בערוצים</p>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-6" data-name="iptv-channels" data-file="components/IPTVChannels.js">
        <h1 className="text-3xl font-bold mb-6">שידורים חיים</h1>
        
        <CORSHelper />
        
        {subscriptions.length === 0 ? (
          <div className="text-center py-12">
            <div className="icon-tv text-6xl text-gray-600 mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">אין מנויי IPTV פעילים</h2>
            <p className="text-gray-400">הוסף מנוי IPTV כדי לצפות בערוצים</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">ניהול מנויים</label>
              <div className="flex gap-4 items-center">
                <select
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded"
                  value={selectedSubscription?.objectId || ''}
                  onChange={(e) => {
                    const subscription = subscriptions.find(s => s.objectId === e.target.value);
                    setSelectedSubscription(subscription);
                  }}
                >
                  <option value="">בחר מנוי</option>
                  {subscriptions.map(sub => (
                    <option key={sub.objectId} value={sub.objectId}>
                      {sub.objectData.subscriptionName}
                    </option>
                  ))}
                </select>
                {selectedSubscription && (
                  <button
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
                    onClick={() => deleteSubscription(selectedSubscription.objectId)}
                  >
                    <div className="icon-trash text-sm"></div>
                  </button>
                )}
              </div>
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="חיפוש ערוצים..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <select
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">כל הקטגוריות</option>
                {categories.filter(cat => cat !== 'כל הקטגוריות').map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {loadingState.isLoading ? (
              <div className="text-center py-12">
                <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
                <p className="text-gray-400">{loadingState.currentStep}</p>
                <div className="w-64 bg-gray-700 rounded-full h-2 mx-auto mt-4">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${loadingState.progress}%` }}
                  ></div>
                </div>
                <p className="text-gray-500 text-sm mt-2">{loadingState.progress}%</p>
                
                {loadingState.progress > 0 && (
                  <button 
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
                    onClick={() => {
                      if (abortController) {
                        abortController.abort();
                        setLoadingState({ isLoading: false, currentStep: '', progress: 0, error: null });
                        setShowConnectionStatus(false);
                      }
                    }}
                  >
                    ביטול
                  </button>
                )}
              </div>
            ) : loadingState.error ? (
              <div className="text-center py-12">
                <div className="icon-alert-circle text-4xl text-red-500 mb-4"></div>
                <h2 className="text-xl font-semibold mb-2">שגיאה בטעינת ערוצים</h2>
                <p className="text-red-400 mb-4">{loadingState.error}</p>
                <div className="space-y-2">
                  <button 
                    className="btn-primary"
                    onClick={() => selectedSubscription && loadChannels(selectedSubscription)}
                  >
                    נסה שוב
                  </button>
                  <div className="text-sm text-gray-400">
                    <p>טיפים לפתרון בעיות:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>בדוק את פרטי החיבור (שם משתמש וסיסמה)</li>
                      <li>וודא שכתובת השרת נכונה</li>
                      <li>התקן הרחבת CORS בדפדפן</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : channels.length === 0 ? (
              <div className="text-center py-12">
                <div className="icon-alert-circle text-6xl text-red-500 mb-4"></div>
                <h2 className="text-xl font-semibold mb-2">לא הצלחתי לטעון ערוצים</h2>
                <p className="text-gray-400 mb-4">
                  בדוק את פרטי החיבור במנוי IPTV או נסה שוב
                </p>
                <button 
                  className="btn-primary"
                  onClick={() => selectedSubscription && loadChannels(selectedSubscription)}
                >
                  נסה שוב
                </button>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="text-center py-12">
                <div className="icon-search text-6xl text-gray-600 mb-4"></div>
                <h2 className="text-xl font-semibold mb-2">לא נמצאו ערוצים</h2>
                <p className="text-gray-400">נסה לשנות את הפילטרים או החיפוש</p>
              </div>
            ) : (
              <div className="responsive-grid">
                {filteredChannels.map((channel, index) => (
                  <div 
                    key={`${channel.id}_${index}_${channel.name}`}
                    className="content-card group relative cursor-pointer"
                    onClick={() => handlePlayChannel(channel)}
                  >
                    <img 
                      src={channel.logo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA4MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VFY8L3RleHQ+Cjwvc3ZnPgo='} 
                      alt={channel.name}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA4MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VFY8L3RleHQ+Cjwvc3ZnPgo=';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="icon-play text-3xl text-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-semibold text-sm">{channel.name}</h3>
                      <p className="text-xs text-gray-400">{channel.category}</p>
                      <p className="text-xs text-gray-500">{channel.country}</p>
                      <ChannelRatings channel={channel} user={user} />
                      <div className="mt-2 flex justify-between">
                        <button 
                          className="text-xs bg-gray-700 hover:bg-red-600 px-2 py-1 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToFavorites(channel);
                          }}
                        >
                          <div className="icon-heart text-xs"></div>
                        </button>
                        <button 
                          className="text-xs bg-gray-700 hover:bg-blue-600 px-2 py-1 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            scheduleRecording(channel);
                          }}
                        >
                          <div className="icon-video text-xs"></div>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <ConnectionStatus 
          isVisible={showConnectionStatus}
          onClose={() => setShowConnectionStatus(false)}
          currentMethod={loadingState.currentStep}
          progress={loadingState.progress}
        />
      </div>
    );
  } catch (error) {
    console.error('IPTVChannels component error:', error);
    return null;
  }
}
