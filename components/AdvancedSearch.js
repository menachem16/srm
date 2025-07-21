function AdvancedSearch({ content, onResults }) {
  const [filters, setFilters] = React.useState({
    searchTerm: '',
    genre: 'all',
    year: 'all',
    rating: 0,
    type: 'all',
    sortBy: 'title'
  });
  const [results, setResults] = React.useState([]);

  React.useEffect(() => {
    performSearch();
  }, [filters, content]);

  const performSearch = () => {
    let filtered = content.filter(item => {
      const data = item.objectData;
      
      const matchesSearch = !filters.searchTerm || 
        data.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        data.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        data.actors?.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesGenre = filters.genre === 'all' || data.category === filters.genre;
      const matchesYear = filters.year === 'all' || data.year.toString() === filters.year;
      const matchesRating = data.rating >= filters.rating;
      const matchesType = filters.type === 'all' || 
        (filters.type === 'iptv' && data.isIPTV) ||
        (filters.type === 'regular' && !data.isIPTV);
      
      return matchesSearch && matchesGenre && matchesYear && matchesRating && matchesType;
    });

    // מיון התוצאות
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.objectData.rating - a.objectData.rating;
        case 'year':
          return b.objectData.year - a.objectData.year;
        case 'title':
        default:
          return a.objectData.title.localeCompare(b.objectData.title);
      }
    });

    setResults(filtered);
    onResults(filtered);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 30}, (_, i) => currentYear - i);

  try {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-6" data-name="advanced-search" data-file="components/AdvancedSearch.js">
        <h2 className="text-xl font-bold mb-4">חיפוש מתקדם</h2>
        
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium mb-2">חיפוש</label>
            <input
              type="text"
              placeholder="שם, שחקן או תיאור..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({...prev, searchTerm: e.target.value}))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">ז'אנר</label>
            <select
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              value={filters.genre}
              onChange={(e) => setFilters(prev => ({...prev, genre: e.target.value}))}
            >
              <option value="all">כל הז'אנרים</option>
              <option value="action">אקשן</option>
              <option value="comedy">קומדיה</option>
              <option value="drama">דרמה</option>
              <option value="horror">אימה</option>
              <option value="romance">רומנטי</option>
              <option value="documentary">דוקומנטרי</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">שנה</label>
            <select
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              value={filters.year}
              onChange={(e) => setFilters(prev => ({...prev, year: e.target.value}))}
            >
              <option value="all">כל השנים</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">דירוג מינימלי</label>
            <select
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              value={filters.rating}
              onChange={(e) => setFilters(prev => ({...prev, rating: parseFloat(e.target.value)}))}
            >
              <option value="0">הכל</option>
              <option value="5">5+ כוכבים</option>
              <option value="7">7+ כוכבים</option>
              <option value="8">8+ כוכבים</option>
              <option value="9">9+ כוכבים</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">מיון לפי</label>
            <select
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({...prev, sortBy: e.target.value}))}
            >
              <option value="title">שם</option>
              <option value="rating">דירוג</option>
              <option value="year">שנה</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-400">
          נמצאו {results.length} תוצאות
        </div>
      </div>
    );
  } catch (error) {
    console.error('AdvancedSearch component error:', error);
    return null;
  }
}