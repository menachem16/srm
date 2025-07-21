function ReviewSystem({ user }) {
  const [reviews, setReviews] = React.useState([]);
  const [showWriteReview, setShowWriteReview] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [user]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 200));
      const reviewsData = await trickleListObjects('channel_reviews', 20, true);
      
      if (reviewsData && reviewsData.items) {
        setReviews(reviewsData.items);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (reviewData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      await trickleCreateObject('channel_reviews', {
        userId: user.objectId,
        userName: user.objectData?.name || 'משתמש',
        channelName: reviewData.channelName,
        rating: reviewData.rating,
        review: reviewData.review,
        createdAt: new Date().toISOString(),
        likes: 0
      });
      
      loadReviews();
      setShowWriteReview(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('שגיאה בשליחת הביקורת');
    }
  };

  try {
    return (
      <div className="max-w-4xl mx-auto px-6 pt-20" data-name="review-system" data-file="components/ReviewSystem.js">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">ביקורות ערוצים</h1>
          <button 
            className="btn-primary"
            onClick={() => setShowWriteReview(true)}
          >
            <div className="icon-plus text-lg ml-2"></div>
            כתוב ביקורת
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
            <p className="text-gray-400">טוען ביקורות...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="icon-message-square text-6xl text-gray-600 mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">אין ביקורות עדיין</h2>
            <p className="text-gray-400">היה הראשון לכתוב ביקורת על ערוץ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.objectId} className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{review.objectData.channelName}</h3>
                    <p className="text-sm text-gray-400">
                      ביקורת של {review.objectData.userName} • {new Date(review.createdAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <div 
                        key={star}
                        className={`icon-star ${star <= review.objectData.rating ? 'text-yellow-500' : 'text-gray-600'}`}
                      ></div>
                    ))}
                  </div>
                </div>
                <p className="text-gray-300">{review.objectData.review}</p>
              </div>
            ))}
          </div>
        )}

        {showWriteReview && (
          <WriteReviewModal 
            onClose={() => setShowWriteReview(false)}
            onSubmit={submitReview}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('ReviewSystem component error:', error);
    return null;
  }
}

function WriteReviewModal({ onClose, onSubmit }) {
  const [formData, setFormData] = React.useState({
    channelName: '',
    rating: 0,
    review: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.channelName && formData.rating > 0 && formData.review.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">כתוב ביקורת</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="שם הערוץ"
            required
            value={formData.channelName}
            onChange={(e) => setFormData({...formData, channelName: e.target.value})}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
          
          <div>
            <label className="block text-sm font-medium mb-2">דירוג</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`text-2xl ${formData.rating >= star ? 'text-yellow-500' : 'text-gray-600'}`}
                  onClick={() => setFormData({...formData, rating: star})}
                >
                  <div className="icon-star"></div>
                </button>
              ))}
            </div>
          </div>
          
          <textarea
            placeholder="כתוב את הביקורת שלך..."
            required
            rows="4"
            value={formData.review}
            onChange={(e) => setFormData({...formData, review: e.target.value})}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
          
          <div className="flex space-x-3">
            <button type="submit" className="btn-primary flex-1">פרסם</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}