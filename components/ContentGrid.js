function ContentGrid({ content, onPlayContent }) {
  const [filteredContent, setFilteredContent] = React.useState(content);

  React.useEffect(() => {
    setFilteredContent(content);
  }, [content]);

  const handleAdvancedFilter = (results) => {
    setFilteredContent(results);
  };

  try {
    return (
      <div className="max-w-7xl mx-auto px-6" data-name="content-grid" data-file="components/ContentGrid.js">
        <h1 className="text-3xl font-bold mb-6">כל התכנים</h1>
        
        <AdvancedSearch content={content} onResults={handleAdvancedFilter} />

        <div className="responsive-grid">
          {filteredContent.map((item, index) => (
            <div 
              key={`${item.objectId}_${index}`}
              className="content-card group relative"
              onClick={() => onPlayContent(item.objectData)}
            >
              <img 
                src={item.objectData.thumbnail} 
                alt={item.objectData.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                <div className="icon-play text-4xl text-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{item.objectData.title}</h3>
                <p className="text-xs text-gray-400">{item.objectData.year}</p>
                <div className="flex items-center mt-1">
                  <div className="icon-star text-yellow-500 text-xs"></div>
                  <span className="text-xs ml-1">{item.objectData.rating}</span>
                  {item.objectData.isIPTV && (
                    <span className="bg-blue-600 text-xs px-1 rounded mr-1">IPTV</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <div className="icon-search text-6xl text-gray-600 mb-4"></div>
            <p className="text-gray-400">לא נמצאו תוצאות התואמות לחיפוש</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('ContentGrid component error:', error);
    return null;
  }
}
