function AdvancedRecommendations({ user, onPlayChannel }) {
  const [recommendations, setRecommendations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [recommendationType, setRecommendationType] = React.useState('smart');

  React.useEffect(() => {
    if (user) {
      generateRecommendations();
    }
  }, [user, recommendationType]);

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      
      if (recommendationType === 'smart') {
        await generateSmartRecommendations();
      } else if (recommendationType === 'trending') {
        await generateTrendingRecommendations();
      } else {
        await generatePersonalizedRecommendations();
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSmartRecommendations = async () => {
    try {
      const [favorites, ratings] = await Promise.all([
        window.trickleListObjects(`iptv_favorites:${user.objectId}`, 10, true),
        window.trickleListObjects(`user_ratings:${user.objectId}`, 10, true)
      ]);
      
      if (favorites.items?.length === 0 && ratings.items?.length === 0) {
        setRecommendations([]);
        return;
      }
      
      const favoriteCategories = favorites.items?.map(f => f.objectData.category) || [];
      const highRatedChannels = ratings.items?.filter(r => r.objectData.rating >= 4) || [];
      
      // Generate recommendations based on user data
      const recommendations = favoriteCategories.slice(0, 3).map((category, index) => ({
        id: `smart_${index}`,
        name: `המלצה חכמה ב${category}`,
        category: category,
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIGZpbGw9IiNGRjQ0NDQiPjx0ZXh0IHg9IjQwIiB5PSIzNSIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFJPC90ZXh0Pjwvc3ZnPgo='
      }));
      
      setRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating smart recommendations:', error);
      setRecommendations([]);
    }
  };

  const generateTrendingRecommendations = async () => {
    try {
      const ratingsData = await window.trickleListObjects('channel_ratings', 50, true);
      if (ratingsData && ratingsData.items && ratingsData.items.length > 0) {
        const channelRatings = {};
        ratingsData.items.forEach(rating => {
          const channelId = rating.objectData.channelId;
          if (!channelRatings[channelId]) {
            channelRatings[channelId] = {
              name: rating.objectData.channelName,
              totalRating: 0,
              count: 0
            };
          }
          channelRatings[channelId].totalRating += rating.objectData.rating;
          channelRatings[channelId].count += 1;
        });
        
        const trending = Object.entries(channelRatings)
          .map(([id, data]) => ({
            id,
            name: data.name,
            category: 'פופולרי',
            logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIGZpbGw9IiNGRkFBMDAiPjx0ZXh0IHg9IjQwIiB5PSIzNSIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkhPVDwvdGV4dD48L3N2Zz4K',
            avgRating: data.totalRating / data.count
          }))
          .sort((a, b) => b.avgRating - a.avgRating)
          .slice(0, 6);
        
        setRecommendations(trending);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error loading trending data:', error);
      setRecommendations([]);
    }
  };

  const generatePersonalizedRecommendations = async () => {
    try {
      const favorites = await window.trickleListObjects(`iptv_favorites:${user.objectId}`, 10, true);
      if (favorites && favorites.items && favorites.items.length > 0) {
        const favoriteCategories = favorites.items.map(f => f.objectData.category);
        const uniqueCategories = [...new Set(favoriteCategories)];
        
        const personalizedChannels = uniqueCategories.slice(0, 4).map((category, index) => ({
          id: `personal_${index}`,
          name: `המלצה ב${category}`,
          category: category,
          logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIGZpbGw9IiM0N0Y0N0YiPjx0ZXh0IHg9IjQwIiB5PSIzNSIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFJPC90ZXh0Pjwvc3ZnPgo='
        }));
        
        setRecommendations(personalizedChannels);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      setRecommendations([]);
    }
  };

  try {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-20" data-name="advanced-recommendations" data-file="components/AdvancedRecommendations.js">
        <h1 className="text-3xl font-bold mb-6">מנוע המלצות מתקדם</h1>
        
        <div className="flex space-x-4 mb-6">
          <button 
            className={`px-4 py-2 rounded ${recommendationType === 'smart' ? 'bg-red-600' : 'bg-gray-700'}`}
            onClick={() => setRecommendationType('smart')}
          >
            המלצות חכמות
          </button>
          <button 
            className={`px-4 py-2 rounded ${recommendationType === 'trending' ? 'bg-red-600' : 'bg-gray-700'}`}
            onClick={() => setRecommendationType('trending')}
          >
            טרנדים
          </button>
          <button 
            className={`px-4 py-2 rounded ${recommendationType === 'ai' ? 'bg-red-600' : 'bg-gray-700'}`}
            onClick={() => setRecommendationType('ai')}
          >
            בינה מלאכותית
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
            <p className="text-gray-400">מכין המלצות...</p>
          </div>
        ) : (
          <div className="responsive-grid">
            {recommendations.map((channel) => (
              <div 
                key={channel.id}
                className="content-card group relative cursor-pointer"
                onClick={() => onPlayChannel(channel, null)}
              >
                <img 
                  src={channel.logo} 
                  alt={channel.name}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <div className="icon-play text-3xl text-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{channel.name}</h3>
                  <p className="text-xs text-gray-400">{channel.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('AdvancedRecommendations component error:', error);
    return null;
  }
}