function IPTVOrgChannels({ onPlayChannel }) {
  const [channels, setChannels] = React.useState([]);
  const [filteredChannels, setFilteredChannels] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    loadChannels();
  }, []);

  React.useEffect(() => {
    filterChannels();
  }, [channels, selectedCategory, searchTerm]);

  const loadChannels = async () => {
    setLoading(true);
    try {
      console.log('Starting to load IPTV-org channels...');
      const iptvOrgChannels = await IPTVApi.getIPTVOrgContent();
      console.log('Raw channels received:', iptvOrgChannels.length);
      
      const formattedChannels = IPTVApi.convertIPTVOrgToAppFormat(iptvOrgChannels);
      console.log('Formatted channels:', formattedChannels.length);
      
      setChannels(formattedChannels);
      
      // יצירת רשימת קטגוריות
      const uniqueCategories = [...new Set(formattedChannels.map(ch => ch.category))];
      console.log('Categories found:', uniqueCategories);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading IPTV-org channels:', error);
      // במקרה של שגיאה, השתמש בנתוני דמה
      const mockChannels = IPTVApi.convertIPTVOrgToAppFormat(IPTVApi.getMockLiveStreams());
      setChannels(mockChannels);
      setCategories(['חדשות', 'ספורט', 'קולנוע', 'ילדים', 'מוזיקה', 'דוקומנטרי']);
    } finally {
      setLoading(false);
    }
  };

  const filterChannels = () => {
    let filtered = channels;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ch => ch.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(ch => 
        ch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ch.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredChannels(filtered);
  };

  try {
    return (
      <div className="max-w-7xl mx-auto px-6" data-name="iptv-org-channels" data-file="components/IPTVOrgChannels.js">
        <h1 className="text-3xl font-bold mb-6">ערוצי IPTV-org</h1>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="חיפוש ערוצים..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">כל הקטגוריות</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
            <p className="text-gray-400">טוען ערוצים...</p>
          </div>
        ) : (
          <div className="responsive-grid">
            {filteredChannels.map((channel, index) => (
              <div 
                key={`${channel.id}_${index}_${channel.name}`}
                className="content-card group relative cursor-pointer"
                onClick={() => onPlayChannel(channel, null)}
              >
                <img 
                  src={channel.logo} 
                  alt={channel.name}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <div className="icon-play text-3xl text-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{channel.name}</h3>
                  <p className="text-xs text-gray-400">{channel.category}</p>
                  <p className="text-xs text-gray-500">{channel.country || 'Unknown'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredChannels.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="icon-search text-6xl text-gray-600 mb-4"></div>
            <p className="text-gray-400">לא נמצאו ערוצים</p>
            <button 
              className="btn-primary mt-4"
              onClick={loadChannels}
            >
              נסה לטעון שוב
            </button>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            ערוצים מ-IPTV-org • נתונים מתעדכנים באופן אוטומטי
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('IPTVOrgChannels component error:', error);
    return null;
  }
}