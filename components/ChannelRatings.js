function ChannelRatings({ channel, user }) {
  const [rating, setRating] = React.useState(0);
  const [userRating, setUserRating] = React.useState(0);
  const [totalRatings, setTotalRatings] = React.useState(0);
  const [showRatingModal, setShowRatingModal] = React.useState(false);

  React.useEffect(() => {
    if (channel && user) {
      loadRatings();
    }
  }, [channel, user]);

  const loadRatings = async () => {
    try {
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const ratingsData = await window.trickleListObjects(`channel_ratings:${channel.id}`, 10, true);
      
      if (ratingsData && ratingsData.items && ratingsData.items.length > 0) {
        const avgRating = ratingsData.items.reduce((sum, r) => sum + (r.objectData?.rating || 0), 0) / ratingsData.items.length;
        setRating(avgRating.toFixed(1));
        setTotalRatings(ratingsData.items.length);
      }
      
      // Load user rating separately with another delay
      await new Promise(resolve => setTimeout(resolve, 100));
      const userRatingData = await window.trickleListObjects(`user_ratings:${user.objectId}`, 10, true);
      
      if (userRatingData && userRatingData.items) {
        const existingRating = userRatingData.items.find(r => r.objectData?.channelId === channel.id);
        if (existingRating) {
          setUserRating(existingRating.objectData.rating);
        }
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
      // Set default values on error
      setRating(0);
      setTotalRatings(0);
      setUserRating(0);
    }
  };

  const submitRating = async (newRating) => {
    try {
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await window.trickleCreateObject(`channel_ratings:${channel.id}`, {
        channelId: channel.id,
        channelName: channel.name,
        userId: user.objectId,
        rating: newRating,
        createdAt: new Date().toISOString()
      });

      // Add delay between operations
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await window.trickleCreateObject(`user_ratings:${user.objectId}`, {
        userId: user.objectId,
        channelId: channel.id,
        rating: newRating,
        createdAt: new Date().toISOString()
      });

      setUserRating(newRating);
      setShowRatingModal(false);
      
      // Reload ratings after a delay
      setTimeout(() => {
        loadRatings();
      }, 500);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('שגיאה בשמירת הדירוג. נסה שוב מאוחר יותר.');
    }
  };

  try {
    return (
      <div className="flex items-center space-x-2" data-name="channel-ratings" data-file="components/ChannelRatings.js">
        <div className="flex items-center">
          <div className="icon-star text-yellow-500 text-sm"></div>
          <span className="text-sm mr-1">{rating || 'N/A'}</span>
          <span className="text-xs text-gray-500">({totalRatings})</span>
        </div>
        
        {user && (
          <button
            className="text-xs bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded"
            onClick={() => setShowRatingModal(true)}
          >
            {userRating ? 'עדכן' : 'דרג'}
          </button>
        )}

        {showRatingModal && (
          <RatingModal
            currentRating={userRating}
            onClose={() => setShowRatingModal(false)}
            onSubmit={submitRating}
            channelName={channel.name}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('ChannelRatings component error:', error);
    return null;
  }
}

function RatingModal({ currentRating, onClose, onSubmit, channelName }) {
  const [selectedRating, setSelectedRating] = React.useState(currentRating);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-bold mb-4">דרג את {channelName}</h3>
        
        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              className={`text-2xl ${selectedRating >= star ? 'text-yellow-500' : 'text-gray-600'}`}
              onClick={() => setSelectedRating(star)}
            >
              <div className="icon-star"></div>
            </button>
          ))}
        </div>
        
        <div className="flex space-x-3">
          <button
            className="btn-primary flex-1"
            onClick={() => onSubmit(selectedRating)}
            disabled={selectedRating === 0}
          >
            שמור
          </button>
          <button className="btn-secondary flex-1" onClick={onClose}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}