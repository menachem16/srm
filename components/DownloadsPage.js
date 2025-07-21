// אין צורך ב-import, כל הפונקציות זמינות גלובלית

function DownloadsPage({ user }) {
  const [downloads, setDownloads] = React.useState([]);
  const [downloadQueue, setDownloadQueue] = React.useState([]);

  React.useEffect(() => {
    loadDownloads();
  }, [user]);

  const loadDownloads = async () => {
    try {
      const downloadsData = await trickleListObjects(`downloads:${user.objectId}`, 100, true);
      setDownloads(downloadsData.items);
    } catch (error) {
      console.error('Error loading downloads:', error);
    }
  };

  const startDownload = async (contentId, contentData) => {
    try {
      await trickleCreateObject(`downloads:${user.objectId}`, {
        userId: user.objectId,
        contentId: contentId,
        status: 'downloading',
        progress: 0,
        title: contentData.title,
        thumbnail: contentData.thumbnail,
        size: '1.2GB'
      });
      
      setDownloadQueue(prev => [...prev, contentId]);
      loadDownloads();
      
      setTimeout(() => {
        completeDownload(contentId);
      }, 3000);
    } catch (error) {
      console.error('Error starting download:', error);
    }
  };

  const completeDownload = async (contentId) => {
    try {
      const downloadItem = downloads.find(d => d.objectData.contentId === contentId);
      if (downloadItem) {
        await trickleUpdateObject(`downloads:${user.objectId}`, downloadItem.objectId, {
          ...downloadItem.objectData,
          status: 'completed',
          progress: 100
        });
      }
      setDownloadQueue(prev => prev.filter(id => id !== contentId));
      loadDownloads();
    } catch (error) {
      console.error('Error completing download:', error);
    }
  };

  const deleteDownload = async (downloadId) => {
    try {
      await trickleDeleteObject(`downloads:${user.objectId}`, downloadId);
      loadDownloads();
    } catch (error) {
      console.error('Error deleting download:', error);
    }
  };

  try {
    return (
      <div className="max-w-7xl mx-auto px-6" data-name="downloads-page" data-file="components/DownloadsPage.js">
        <h1 className="text-3xl font-bold mb-6">הורדות</h1>
        
        <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="icon-download text-blue-400 text-xl ml-3"></div>
            <div>
              <h3 className="font-semibold">הורדה לצפייה אופליין</h3>
              <p className="text-sm text-gray-300">הורד תכנים לצפייה ללא חיבור לאינטרנט</p>
            </div>
          </div>
        </div>

        {downloads.length === 0 ? (
          <div className="text-center py-12">
            <div className="icon-download text-6xl text-gray-600 mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">אין הורדות עדיין</h2>
            <p className="text-gray-400">התכנים שתוריד יופיעו כאן</p>
          </div>
        ) : (
          <div className="space-y-4">
            {downloads.map((download) => (
              <div key={download.objectId} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <img 
                    src={download.objectData.thumbnail} 
                    alt={download.objectData.title}
                    className="w-16 h-24 object-cover rounded ml-4"
                  />
                  <div>
                    <h3 className="font-semibold">{download.objectData.title}</h3>
                    <p className="text-sm text-gray-400">{download.objectData.size}</p>
                    <div className="flex items-center mt-2">
                      <div className={`w-2 h-2 rounded-full ml-2 ${
                        download.objectData.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm">
                        {download.objectData.status === 'completed' ? 'הושלם' : 'מוריד...'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {download.objectData.status === 'completed' && (
                    <button className="btn-primary text-sm">
                      <div className="icon-play text-sm ml-1"></div>
                      צפה
                    </button>
                  )}
                  <button 
                    className="btn-secondary text-sm"
                    onClick={() => deleteDownload(download.objectId)}
                  >
                    <div className="icon-trash text-sm"></div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('DownloadsPage component error:', error);
    return null;
  }
}