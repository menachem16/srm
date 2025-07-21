function SmartRecommendations({ user, onPlayChannel }) {
  const [recommendations, setRecommendations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [favorites, setFavorites] = React.useState([]);

  React.useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      await loadFavorites();
      await generateRecommendations();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const favData = await trickleListObjects(`iptv_favorites:${user.objectId}`, 100, true);
      setFavorites(favData.items);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const generateRecommendations = async () => {
    try {
      if (favorites.length === 0) {
        setRecommendations(getDefaultRecommendations());
        return;
      }

      const systemPrompt = `אתה מערכת המלצות חכמה לערוצי IPTV. בהתבסס על ערוצים מועדפים של המשתמש, המלץ על ערוצים דומים.

ערוצים מועדפים של המשתמש:
${favorites.map(fav => `- ${fav.objectData.name} (קטגוריה: ${fav.objectData.category})`).join('\n')}

המלץ על 8 ערוצים בקטגוריות דומות שיכולים לעניין את המשתמש.`;

      const userPrompt = 'צור רשימה של 8 ערוצים מומלצים';
      
      const aiResponse = await invokeAIAgent(systemPrompt, userPrompt);
      const recommendedChannels = parseAIRecommendations(aiResponse);
      setRecommendations(recommendedChannels);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      setRecommendations(getDefaultRecommendations());
    }
  };

  const parseAIRecommendations = (aiResponse) => {
    const lines = aiResponse.split('\n').filter(line => line.trim());
    return lines.slice(0, 8).map((line, index) => {
      const cleanLine = line.replace(/^\d+\.?\s*-?\s*/, '');
      const parts = cleanLine.split('(');
      const name = parts[0]?.trim() || `ערוץ מומלץ ${index + 1}`;
      const category = parts[1]?.replace(')', '').trim() || 'כללי';
      
      return {
        id: `rec_${index}`,
        name: name,
        category: category,
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA4MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNDc0NzQ3Ii8+Cjx0ZXh0IHg9IjQwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+מומלץ</text></svg>',
        url: `https://demo-stream.com/${name.replace(/\s+/g, '_')}`,
        country: 'Unknown'
      };
    });
  };

  const getDefaultRecommendations = () => {
    return [];
  };

  try {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-20" data-name="smart-recommendations" data-file="components/SmartRecommendations.js">
        <h1 className="text-3xl font-bold mb-6">המלצות אישיות</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
            <p className="text-gray-400">יוצר המלצות אישיות...</p>
          </div>
        ) : (
          <>
            <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">
                {favorites.length > 0 
                  ? `המלצות בהתבסס על ${favorites.length} הערוצים המועדפים שלך`
                  : 'המלצות כלליות - הוסף ערוצים למועדפים להמלצות אישיות'
                }
              </h3>
              <p className="text-sm text-gray-300">
                המלצות אלה נוצרו על ידי בינה מלאכותית בהתבסס על העדפותיך
              </p>
            </div>

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
                    <div className="mt-1 flex items-center">
                      <div className="icon-star text-yellow-500 text-xs"></div>
                      <span className="text-xs text-gray-500 mr-1">מומלץ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button 
                className="btn-primary"
                onClick={generateRecommendations}
              >
                <div className="icon-refresh-cw text-lg ml-2"></div>
                חדש המלצות
              </button>
            </div>
          </>
        )}
      </div>
    );
  } catch (error) {
    console.error('SmartRecommendations component error:', error);
    return null;
  }
}