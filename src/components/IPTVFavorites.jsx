import React from 'react';
import { trickleListObjects, trickleDeleteObject } from '../utils/database';

function IPTVFavorites({ user, onPlayChannel }) {
  const [favorites, setFavorites] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favData = await trickleListObjects(`iptv_favorites:${user.objectId}`, 100, true);
      setFavorites(favData.items);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      await trickleDeleteObject(`iptv_favorites:${user.objectId}`, favoriteId);
      loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  try {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-20" data-name="iptv-favorites" data-file="components/IPTVFavorites.js">
        <h1 className="text-3xl font-bold mb-6">ערוצים מועדפים</h1>
        {loading ? (
          <div className="text-center py-12">
            <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
            <p className="text-gray-400">טוען מועדפים...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="icon-heart text-6xl text-gray-600 mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">אין ערוצים מועדפים</h2>
            <p className="text-gray-400">הוסף ערוצים למועדפים כדי לראות אותם כאן</p>
          </div>
        ) : (
          <div className="responsive-grid">
            {favorites.map((favorite) => (
              <div key={favorite.objectId} className="content-card group relative">
                <img
                  src={favorite.objectData.logo}
                  alt={favorite.objectData.name}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <div className="flex space-x-2">
                    <button
                      className="bg-red-600 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onPlayChannel(favorite.objectData, null)}
                    >
                      <div className="icon-play text-white text-xl"></div>
                    </button>
                    <button
                      className="bg-gray-600 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFavorite(favorite.objectId)}
                    >
                      <div className="icon-trash text-white text-sm"></div>
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{favorite.objectData.name}</h3>
                  <p className="text-xs text-gray-400">{favorite.objectData.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('IPTVFavorites component error:', error);
    return null;
  }
}

export default IPTVFavorites;
