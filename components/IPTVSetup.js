function IPTVSetup({ user }) {
  const [formData, setFormData] = React.useState({
    subscriptionName: '',
    username: 'VKVYMBLIXV',
    password: 'LKZ8RRZMLV',
    url: 'http://line.ottcst.net:80'
  });
  const [loading, setLoading] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await window.trickleCreateObject(`iptv_subscription:${user.objectId}`, {
        userId: user.objectId,
        subscriptionName: formData.subscriptionName,
        username: formData.username,
        password: formData.password,
        url: formData.url,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      
      alert('מנוי IPTV נשמר בהצלחה!\n\nהמערכת תנסה מספר שיטות לטעינת הערוצים. אם תהיה בעיה, ייוצגו ערוצי דמה.');
      
      setFormData({
        subscriptionName: '',
        username: 'VKVYMBLIXV',
        password: 'LKZ8RRZMLV',
        url: 'http://line.ottcst.net:80'
      });
    } catch (error) {
      alert('שגיאה בשמירת פרטי המנוי');
    } finally {
      setLoading(false);
    }
  };

  try {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-20" data-name="iptv-setup" data-file="components/IPTVSetup.js">
        <h1 className="text-3xl font-bold mb-6">הגדרת מנוי IPTV</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם המנוי</label>
              <input
                type="text"
                required
                placeholder="למשל: מנוי בזק"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                value={formData.subscriptionName}
                onChange={(e) => setFormData({...formData, subscriptionName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">כתובת שרת</label>
              <input
                type="text"
                required
                placeholder="http://line.ottcst.net:80"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">שם משתמש</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">סיסמה</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'שומר...' : 'שמור מנוי'}
            </button>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('IPTVSetup component error:', error);
    return null;
  }
}