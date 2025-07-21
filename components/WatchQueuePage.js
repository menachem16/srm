// אין צורך ב-import, כל הפונקציות זמינות גלובלית

function WatchQueuePage({ user, content }) {
  const [queue, setQueue] = React.useState([]);
  const [availableTime, setAvailableTime] = React.useState(120);
  const [suggestions, setSuggestions] = React.useState([]);

  React.useEffect(() => {
    loadQueue();
    generateSuggestions();
  }, [user, availableTime]);

  const loadQueue = async () => {
    try {
      const queueData = await trickleListObjects(`watch_queue:${user.objectId}`, 100, false);
      setQueue(queueData.items.filter(item => !item.objectData.isWatched));
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  };

  const generateSuggestions = async () => {
    try {
      const suitableContent = content.filter(item => 
        item.objectData.duration <= availableTime &&
        !queue.some(q => q.objectData.contentId === item.objectId)
      );
      
      const systemPrompt = `אתה מערכת המלצות חכמה לתור צפייה. המשתמש יש ${availableTime} דקות זמינות לצפייה.
      
בחר 3-5 תכנים המתאימים ביותר לזמן הזמין:
${suitableContent.map(c => `${c.objectId}: ${c.objectData.title} (${c.objectData.duration} דקות, ${c.objectData.category})`).join('\n')}

החזר רק רשימה של מזהי תכנים מופרדים בפסיקים.`;

      const userPrompt = `המלץ על תכנים לצפייה בזמן של ${availableTime} דקות`;
      const recommendations = await invokeAIAgent(systemPrompt, userPrompt);
      const contentIds = recommendations.split(',').map(id => id.trim());
      
      setSuggestions(suitableContent.filter(c => contentIds.includes(c.objectId)));
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions(content.filter(item => item.objectData.duration <= availableTime).slice(0, 5));
    }
  };

  const addToQueue = async (contentItem, priority = queue.length + 1) => {
    try {
      await trickleCreateObject(`watch_queue:${user.objectId}`, {
        userId: user.objectId,
        contentId: contentItem.objectId,
        priority: priority,
        estimatedTime: contentItem.objectData.duration,
        isWatched: false,
        addedDate: new Date().toISOString()
      });
      loadQueue();
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  };

  const removeFromQueue = async (queueId) => {
    try {
      await trickleDeleteObject(`watch_queue:${user.objectId}`, queueId);
      loadQueue();
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  };

  const getTotalTime = () => {
    return queue.reduce((total, item) => total + (item.objectData.estimatedTime || 0), 0);
  };

  try {
    return (
      <div className="max-w-7xl mx-auto px-6" data-name="watch-queue-page" data-file="components/WatchQueuePage.js">
        <h1 className="text-3xl font-bold mb-6">תור הצפייה החכם שלי</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">הגדרות צפייה</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">זמן זמין לצפייה (דקות)</label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={availableTime}
                  onChange={(e) => setAvailableTime(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                />
              </div>
              <div className="text-sm text-gray-400">
                זמן כולל בתור: {getTotalTime()} דקות
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">התור שלי ({queue.length})</h2>
              {queue.length === 0 ? (
                <p className="text-gray-400">התור ריק. הוסף תכנים מההמלצות</p>
              ) : (
                <div className="space-y-3">
                  {queue.map((item, index) => {
                    const contentData = content.find(c => c.objectId === item.objectData.contentId)?.objectData;
                    return (
                      <div key={item.objectId} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                        <div className="flex items-center">
                          <span className="text-sm bg-red-600 px-2 py-1 rounded ml-3">{index + 1}</span>
                          <div>
                            <div className="font-semibold">{contentData?.title}</div>
                            <div className="text-sm text-gray-400">{contentData?.duration} דקות</div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromQueue(item.objectId)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <div className="icon-x text-lg"></div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">המלצות חכמות</h2>
              <p className="text-sm text-gray-400 mb-4">
                תכנים המתאימים לזמן הזמין שלך ({availableTime} דקות)
              </p>
              
              <div className="space-y-4">
                {suggestions.map((item) => (
                  <div key={item.objectId} className="flex items-center justify-between bg-gray-700 p-4 rounded">
                    <div className="flex items-center">
                      <img 
                        src={item.objectData.thumbnail} 
                        alt={item.objectData.title}
                        className="w-16 h-24 object-cover rounded ml-4"
                      />
                      <div>
                        <h3 className="font-semibold">{item.objectData.title}</h3>
                        <p className="text-sm text-gray-400">{item.objectData.duration} דקות • {item.objectData.category}</p>
                        <div className="flex items-center mt-1">
                          <div className="icon-star text-yellow-500 text-sm"></div>
                          <span className="text-sm ml-1">{item.objectData.rating}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => addToQueue(item)}
                      className="btn-primary text-sm"
                    >
                      <div className="icon-plus text-sm ml-1"></div>
                      הוסף
                    </button>
                  </div>
                ))}
              </div>
              
              <button 
                className="w-full btn-secondary mt-4"
                onClick={generateSuggestions}
              >
                רענן המלצות
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('WatchQueuePage component error:', error);
    return null;
  }
}