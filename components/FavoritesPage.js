// אין צורך ב-import, כל הפונקציות זמינות גלובלית

function FavoritesPage({ user }) {
  const [activeTab, setActiveTab] = React.useState('favorites');
  const [favorites, setFavorites] = React.useState([]);
  const [watchlist, setWatchlist] = React.useState([]);
  const [content, setContent] = React.useState([]);

  React.useEffect(() => {
    loadUserLists();
    loadContent();
  }, [user]);

  const loadUserLists = async () => {
    try {
      const userFavorites = await trickleListObjects(`favorites:${user.objectId}`, 100, true);
      const favItems = userFavorites.items.filter(item => item.objectData.type === 'favorites');
      const watchItems = userFavorites.items.filter(item => item.objectData.type === 'watchlist');
      setFavorites(favItems);
      setWatchlist(watchItems);
    } catch (error) {
      console.error('Error loading user lists:', error);
    }
  };

  const loadContent = async () => {
    try {
      const contentData = await trickleListObjects('content', 100, true);
      setContent(contentData.items);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const getContentById = (contentId) => {
    return content.find(item => item.objectId === contentId)?.objectData;
  };

  try {
    const currentList = activeTab === 'favorites' ? favorites : watchlist;
    
    return (
      <div className="max-w-7xl mx-auto px-6" data-name="favorites-page" data-file="components/FavoritesPage.js">
        <h1 className="text-3xl font-bold mb-6">הרשימות שלי</h1>
        
        <div className="flex space-x-4 mb-6">
          <button 
            className={`px-4 py-2 rounded ${activeTab === 'favorites' ? 'bg-red-600' : 'bg-gray-700'}`}
            onClick={() => setActiveTab('favorites')}
          >
            מועדפים ({favorites.length})
          </button>
          <button 
            className={`px-4 py-2 rounded ${activeTab === 'watchlist' ? 'bg-red-600' : 'bg-gray-700'}`}
            onClick={() => setActiveTab('watchlist')}
          >
            רשימת צפייה ({watchlist.length})
          </button>
        </div>

        {currentList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {activeTab === 'favorites' ? 'אין תכנים במועדפים' : 'אין תכנים ברשימת הצפייה'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentList.map((item) => {
              const contentData = getContentById(item.objectData.contentId);
              if (!contentData) return null;
              
              return (
                <div key={item.objectId} className="content-card">
                  <img 
                    src={contentData.thumbnail} 
                    alt={contentData.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{contentData.title}</h3>
                    <p className="text-xs text-gray-400">{contentData.year}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('FavoritesPage component error:', error);
    return null;
  }
}