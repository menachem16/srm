function PersonalPlaylist({ user, onPlayChannel }) {
  const [playlists, setPlaylists] = React.useState([]);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      loadPlaylists();
    }
  }, [user]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 200));
      const playlistsData = await trickleListObjects(`playlists:${user.objectId}`, 20, true);
      
      if (playlistsData && playlistsData.items) {
        setPlaylists(playlistsData.items);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (name, description) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      await trickleCreateObject(`playlists:${user.objectId}`, {
        userId: user.objectId,
        name: name,
        description: description,
        channels: [],
        createdAt: new Date().toISOString()
      });
      
      loadPlaylists();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('שגיאה ביצירת רשימת ההשמעה');
    }
  };

  const deletePlaylist = async (playlistId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק רשימת השמעה זו?')) {
      try {
        await trickleDeleteObject(`playlists:${user.objectId}`, playlistId);
        loadPlaylists();
        if (selectedPlaylist?.objectId === playlistId) {
          setSelectedPlaylist(null);
        }
      } catch (error) {
        console.error('Error deleting playlist:', error);
      }
    }
  };

  try {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-20" data-name="personal-playlist" data-file="components/PersonalPlaylist.js">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">רשימות השמעה אישיות</h1>
          <button 
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="icon-plus text-lg ml-2"></div>
            רשימה חדשה
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
            <p className="text-gray-400">טוען רשימות השמעה...</p>
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12">
            <div className="icon-list text-6xl text-gray-600 mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">אין רשימות השמעה עדיין</h2>
            <p className="text-gray-400">צור רשימות השמעה מותאמות אישית לערוצים שלך</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map(playlist => (
              <div key={playlist.objectId} className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{playlist.objectData.name}</h3>
                    <p className="text-gray-400 text-sm">{playlist.objectData.description}</p>
                  </div>
                  <button
                    onClick={() => deletePlaylist(playlist.objectId)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <div className="icon-trash text-lg"></div>
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {playlist.objectData.channels?.length || 0} ערוצים
                  </span>
                  <button 
                    className="btn-secondary text-sm"
                    onClick={() => setSelectedPlaylist(playlist)}
                  >
                    צפה
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <CreatePlaylistModal 
            onClose={() => setShowCreateModal(false)}
            onCreate={createPlaylist}
          />
        )}

        {selectedPlaylist && (
          <PlaylistDetailsModal 
            playlist={selectedPlaylist}
            onClose={() => setSelectedPlaylist(null)}
            onPlayChannel={onPlayChannel}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('PersonalPlaylist component error:', error);
    return null;
  }
}

function CreatePlaylistModal({ onClose, onCreate }) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">רשימת השמעה חדשה</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">שם הרשימה</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">תיאור (אופציונלי)</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            />
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="btn-primary flex-1">צור</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlaylistDetailsModal({ playlist, onClose, onPlayChannel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">{playlist.objectData.name}</h2>
            <p className="text-gray-400">{playlist.objectData.description}</p>
          </div>
          <button onClick={onClose}>
            <div className="icon-x text-xl"></div>
          </button>
        </div>
        
        <div className="text-center py-8">
          <div className="icon-music text-6xl text-gray-600 mb-4"></div>
          <p className="text-gray-400">רשימת השמעה ריקה</p>
          <p className="text-gray-500 text-sm">הוסף ערוצים לרשימה זו</p>
        </div>
      </div>
    </div>
  );
}
