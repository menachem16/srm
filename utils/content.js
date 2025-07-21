const ContentUtils = {
  filterByCategory: (content, category) => {
    if (category === 'all') return content;
    return content.filter(item => item.objectData.category === category);
  },

  searchContent: (content, searchTerm) => {
    if (!searchTerm) return content;
    return content.filter(item => 
      item.objectData.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.objectData.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.objectData.actors.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  sortByRating: (content) => {
    return [...content].sort((a, b) => b.objectData.rating - a.objectData.rating);
  },

  sortByYear: (content) => {
    return [...content].sort((a, b) => b.objectData.year - a.objectData.year);
  },

  getActiveContent: (content) => {
    return content.filter(item => item.objectData.isActive);
  },

  getRecommendations: (content, currentContent, limit = 5) => {
    if (!currentContent) return content.slice(0, limit);
    
    const sameCategory = content.filter(item => 
      item.objectData.category === currentContent.category && 
      item.objectId !== currentContent.objectId
    );
    
    return sameCategory.slice(0, limit);
  }
};

function ContentForm({ content, onClose, onSuccess }) {
  const [formData, setFormData] = React.useState({
    title: content?.objectData.title || '',
    description: content?.objectData.description || '',
    category: content?.objectData.category || 'action',
    thumbnail: content?.objectData.thumbnail || '',
    videoUrl: content?.objectData.videoUrl || '',
    rating: content?.objectData.rating || 5,
    actors: content?.objectData.actors || '',
    year: content?.objectData.year || new Date().getFullYear(),
    duration: content?.objectData.duration || 90,
    isActive: content?.objectData.isActive ?? true
  });
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (content) {
        await trickleUpdateObject('content', content.objectId, formData);
      } else {
        await trickleCreateObject('content', formData);
      }
      onSuccess();
    } catch (error) {
      alert('שגיאה בשמירת התוכן');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {content ? 'עריכת תוכן' : 'הוספת תוכן חדש'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">שם התוכן</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">תיאור</label>
            <textarea
              required
              rows="3"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">קטגוריה</label>
              <select
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="action">אקשן</option>
                <option value="comedy">קומדיה</option>
                <option value="drama">דרמה</option>
                <option value="horror">אימה</option>
                <option value="romance">רומנטי</option>
                <option value="documentary">דוקומנטרי</option>
                <option value="kids">ילדים</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">שנה</label>
              <input
                type="number"
                required
                min="1900"
                max="2030"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'שומר...' : 'שמור'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}