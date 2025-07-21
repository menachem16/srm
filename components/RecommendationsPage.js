function RecommendationsPage({ user, content }) {
  const [recommendations, setRecommendations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    generateRecommendations();
  }, [user, content]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const personalizedRecs = await RecommendationUtils.generatePersonalizedRecommendations(user, content);
      setRecommendations(personalizedRecs);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setRecommendations(content.slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  try {
    return (
      <div className="max-w-7xl mx-auto px-6" data-name="recommendations-page" data-file="components/RecommendationsPage.js">
        <h1 className="text-3xl font-bold mb-6">המלצות אישיות עבורך</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
            <p className="text-gray-400">מכין המלצות אישיות...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-300 mb-8">
              המלצות אלה מבוססות על ההעדפות שלך, הדירוגים שנתת והתכנים שהוספת למועדפים
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.map((item) => (
                <div key={item.objectId} className="content-card">
                  <img 
                    src={item.objectData.thumbnail} 
                    alt={item.objectData.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{item.objectData.title}</h3>
                    <p className="text-xs text-gray-400">{item.objectData.year}</p>
                    <div className="flex items-center mt-1">
                      <div className="icon-star text-yellow-500 text-xs"></div>
                      <span className="text-xs ml-1">{item.objectData.rating}</span>
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
                רענן המלצות
              </button>
            </div>
          </>
        )}
      </div>
    );
  } catch (error) {
    console.error('RecommendationsPage component error:', error);
    return null;
  }
}