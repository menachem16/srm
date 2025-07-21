function PersonalizedRecommendations({ user, content, onPlayContent }) {
  const [recommendations, setRecommendations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user && content.length > 0) {
      generatePersonalizedRecommendations();
    }
  }, [user, content]);

  const generatePersonalizedRecommendations = async () => {
    setLoading(true);
    try {
      const userPrefs = await getUserPreferences();
      const watchHistory = await getWatchHistory();
      const userRatings = await getUserRatings();
      
      const systemPrompt = `אתה מערכת המלצות מתקדמת. נתח את נתוני המשתמש והמלץ על 8 תכנים.

נתוני משתמש:
- קטגוריות מועדפות: ${userPrefs.favoriteCategories?.join(', ') || 'לא זמין'}
- דירוג ממוצע: ${userPrefs.avgRating || 'לא זמין'}
- זמן צפייה כולל: ${userPrefs.totalWatchTime || 0} דקות
- תכנים שנצפו: ${watchHistory.map(h => h.title).join(', ')}
- תכנים שדורגו גבוה: ${userRatings.filter(r => r.rating >= 4).map(r => r.title).join(', ')}

תכנים זמינים:
${content.map(c => `${c.objectId}: ${c.objectData.title} (${c.objectData.category}, דירוג: ${c.objectData.rating})`).join('\n')}

החזר רק רשימה של 8 מזהי תכנים מופרדים בפסיקים.`;

      const userPrompt = 'המלץ על תכנים מותאמים אישית למשתמש זה';
      const aiRecommendations = await invokeAIAgent(systemPrompt, userPrompt);
      const contentIds = aiRecommendations.split(',').map(id => id.trim());
      
      const recommendedContent = content.filter(c => contentIds.includes(c.objectId));
      setRecommendations(recommendedContent);
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      setRecommendations(content.slice(0, 8));
    } finally {
      setLoading(false);
    }
  };

  const getUserPreferences = async () => {
    try {
      const prefsData = await trickleListObjects(`user_preferences:${user.objectId}`, 1, true);
      return prefsData.items[0]?.objectData || {};
    } catch (error) {
      return {};
    }
  };

  const getWatchHistory = async () => {
    try {
      const historyData = await trickleListObjects(`watch_history:${user.objectId}`, 20, true);
      return historyData.items.map(item => ({
        title: content.find(c => c.objectId === item.objectData.contentId)?.objectData.title
      }));
    } catch (error) {
      return [];
    }
  };

  const getUserRatings = async () => {
    try {
      const ratingsData = await trickleListObjects(`rating:${user.objectId}`, 50, true);
      return ratingsData.items.map(item => ({
        rating: item.objectData.rating,
        title: content.find(c => c.objectId === item.objectData.contentId)?.objectData.title
      }));
    } catch (error) {
      return [];
    }
  };

  try {
    if (!user || content.length === 0) return null;

    return (
      <div className="mb-8" data-name="personalized-recommendations" data-file="components/PersonalizedRecommendations.js">
        <h2 className="text-xl md:text-2xl font-bold mb-4 px-4 md:px-6">מיוחד עבורך</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="icon-loader text-2xl text-gray-400 animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-hidden px-4 md:px-6">
            <div className="responsive-grid">
              {recommendations.map((item, index) => (
                <div 
                  key={`${item.objectId}_rec_${index}`}
                  className="content-card group relative"
                  onClick={() => onPlayContent(item.objectData)}
                >
                  <img 
                    src={item.objectData.thumbnail} 
                    alt={item.objectData.title}
                    className="w-full h-32 sm:h-40 md:h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="icon-play text-2xl md:text-3xl text-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="p-2 md:p-3">
                    <h3 className="font-semibold text-xs md:text-sm truncate">{item.objectData.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{item.objectData.year}</p>
                    <div className="flex items-center mt-1">
                      <div className="icon-star text-yellow-500 text-xs"></div>
                      <span className="text-xs ml-1">{item.objectData.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('PersonalizedRecommendations component error:', error);
    return null;
  }
}