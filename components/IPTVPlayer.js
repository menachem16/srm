function IPTVPlayer({ video, onBack }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [volume, setVolume] = React.useState(0.8);
  const [showControls, setShowControls] = React.useState(true);
  const [muted, setMuted] = React.useState(false);

  React.useEffect(() => {
    if (video && video.data && video.data.url) {
      console.log('Loading video URL:', video.data.url);
      setIsLoading(true);
      setError('');
    } else {
      setError('לא נמצא URL תקין לווידאו');
      setIsLoading(false);
    }
  }, [video]);

  const handleReady = () => {
    console.log('ReactPlayer ready');
    setIsLoading(false);
    setError('');
  };

  const handleError = (error) => {
    console.error('ReactPlayer error:', error);
    setError('שגיאה בהזרמת הווידאו. בדוק את החיבור או נסה ערוץ אחר.');
    setIsLoading(false);
  };

  const handleProgress = (progress) => {
    console.log('Progress:', progress);
  };

  const handleStart = () => {
    console.log('Video started');
    setIsPlaying(true);
  };

  const getStreamUrl = () => {
    if (!video || !video.data) return '';
    return video.data.url || '';
  };

  try {
    if (!video || !video.data) return null;

    return (
      <div className="min-h-screen bg-black" data-name="iptv-player" data-file="components/IPTVPlayer.js">
        <div className="relative">
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            <button 
              className="bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2"
              onClick={onBack}
            >
              <div className="icon-arrow-right text-white text-xl"></div>
            </button>
            <button 
              className="bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2"
              onClick={() => setShowControls(!showControls)}
            >
              <div className="icon-settings text-white text-xl"></div>
            </button>
          </div>
          
          <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
            {isLoading && (
              <div className="text-center">
                <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
                <p className="text-gray-300">טוען שידור...</p>
              </div>
            )}
            
            {error && (
              <div className="text-center">
                <div className="icon-alert-circle text-4xl text-red-500 mb-4"></div>
                <p className="text-red-400 mb-4">{error}</p>
                <button className="btn-primary" onClick={() => setError('')}>
                  נסה שוב
                </button>
              </div>
            )}
            
            {!isLoading && !error && getStreamUrl() && (
              <ReactPlayer
                url={getStreamUrl()}
                playing={isPlaying}
                controls={showControls}
                volume={volume}
                muted={muted}
                width="100%"
                height="100%"
                onReady={handleReady}
                onStart={handleStart}
                onError={handleError}
                onProgress={handleProgress}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onBuffer={() => console.log('Buffering...')}
                onBufferEnd={() => console.log('Buffer ended')}
                config={{
                  file: {
                    attributes: {
                      crossOrigin: 'anonymous',
                      playsInline: true
                    },
                    forceHLS: true
                  },
                  hls: {
                    enableWorker: false,
                    lowLatencyMode: true
                  }
                }}
              />
            )}
          </div>
        </div>
        
        {!isLoading && !error && video && video.data && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 px-4 py-2 rounded">
            <h3 className="text-white font-semibold">{video.data.name}</h3>
            <p className="text-gray-300 text-sm">
              {video.type === 'channel' ? 'שידור חי' : 'וידאו'}
            </p>
            <div className="flex items-center mt-2 space-x-2">
              <button
                onClick={() => setMuted(!muted)}
                className="text-white hover:text-gray-300"
              >
                <div className={`icon-${muted ? 'volume-x' : 'volume-2'} text-lg`}></div>
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:text-gray-300"
              >
                <div className={`icon-${isPlaying ? 'pause' : 'play'} text-lg`}></div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('IPTVPlayer component error:', error);
    return null;
  }
}