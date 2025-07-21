function VideoPlayer({ content, onBack, user }) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const videoRef = React.useRef(null);
  const playerRef = React.useRef(null);

  React.useEffect(() => {
    if (user && content && isPlaying) {
      trackViewingHistory();
    }
  }, [user, content, isPlaying]);

  React.useEffect(() => {
    if (isPlaying && videoRef.current) {
      initializePlayer();
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.dispose === 'function') {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [isPlaying, content]);

  const trackViewingHistory = async () => {
    try {
      await trickleCreateObject(`viewing_history:${user.objectId}`, {
        userId: user.objectId,
        contentId: content.objectId,
        title: content.title,
        thumbnail: content.thumbnail,
        watchTime: 0,
        totalDuration: content.duration
      });
    } catch (error) {
      console.error('Error tracking viewing history:', error);
    }
  };

  const initializePlayer = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (videoRef.current && content.videoUrl && window.videojs) {
        playerRef.current = window.videojs(videoRef.current, {
          controls: true,
          autoplay: true,
          preload: 'auto',
          fluid: true,
          sources: [{
            src: content.videoUrl,
            type: content.videoUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'
          }]
        });

        playerRef.current.on('loadedmetadata', () => {
          console.log('Video metadata loaded');
          setIsLoading(false);
        });

        playerRef.current.on('error', () => {
          const error = playerRef.current.error();
          console.error('Video.js error:', error);
          setError('שגיאה בהזרמת הווידאו');
          setIsLoading(false);
        });
      } else {
        setError('לא נמצא URL תקין לווידאו');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Video loading error:', err);
      setError(`שגיאה בטעינת הווידאו: ${err.message}`);
      setIsLoading(false);
    }
  };

  try {
    if (!content) return null;

    return (
      <div className="min-h-screen bg-black" data-name="video-player" data-file="components/VideoPlayer.js">
        <div className="relative">
          <button 
            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2"
            onClick={onBack}
          >
            <div className="icon-arrow-right text-white text-xl"></div>
          </button>
          
          <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
            {!isPlaying ? (
              <div className="text-center">
                <img 
                  src={content.thumbnail} 
                  alt={content.title}
                  className="max-w-2xl mx-auto mb-6 rounded"
                />
                <h1 className="text-4xl font-bold mb-4">{content.title}</h1>
                <button 
                  className="btn-primary text-xl px-8 py-4 flex items-center mx-auto"
                  onClick={() => setIsPlaying(true)}
                >
                  <div className="icon-play text-2xl ml-2"></div>
                  התחל צפייה
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isLoading && (
                  <div className="absolute text-center">
                    <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
                    <p className="text-gray-300">טוען וידאו...</p>
                  </div>
                )}
                {error && (
                  <div className="absolute text-center">
                    <div className="icon-alert-circle text-4xl text-red-500 mb-4"></div>
                    <p className="text-red-400 mb-4">{error}</p>
                    <button className="btn-primary" onClick={initializePlayer}>
                      נסה שוב
                    </button>
                  </div>
                )}
                <div data-vjs-player style={{ display: isLoading || error ? 'none' : 'block', width: '100%', height: '100%' }}>
                  <video ref={videoRef} className="video-js vjs-default-skin" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {!isPlaying && (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">תיאור</h2>
                <p className="text-gray-300 mb-6">{content.description}</p>
                
                <div className="space-y-2">
                  <p><span className="font-semibold">שנה:</span> {content.year}</p>
                  <p><span className="font-semibold">משך:</span> {content.duration} דקות</p>
                  <p><span className="font-semibold">קטגוריה:</span> {content.category}</p>
                  <p><span className="font-semibold">שחקנים:</span> {content.actors}</p>
                </div>
              </div>
              
              <div>
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <div className="icon-star text-yellow-500 text-xl"></div>
                    <span className="text-xl font-bold ml-2">{content.rating}</span>
                    <span className="text-gray-400 mr-1">/10</span>
                  </div>
                  <p className="text-sm text-gray-400">דירוג המשתמשים</p>
                </div>
                
                <div className="space-y-2">
                  <button 
                    className="w-full btn-secondary text-sm"
                    onClick={() => setShowComments(!showComments)}
                  >
                    <div className="icon-message-circle text-sm ml-1"></div>
                    {showComments ? 'הסתר תגובות' : 'הצג תגובות'}
                  </button>
                  {user && <ContentActions content={content} user={user} />}
                </div>
              </div>
            </div>
            
            {showComments && (
              <div className="mt-8">
                <CommentsSection contentId={content.objectId} user={user} />
              </div>
            )}
            
            <UserReviews contentId={content.objectId} user={user} />
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('VideoPlayer component error:', error);
    return null;
  }
}