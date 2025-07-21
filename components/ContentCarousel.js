function ContentCarousel({ title, content, onPlayContent }) {
  const getVisibleItems = () => {
    if (typeof window === 'undefined') return 5;
    if (window.innerWidth < 640) return 2; // mobile
    if (window.innerWidth < 768) return 3; // tablet
    if (window.innerWidth < 1024) return 4; // desktop
    return 5; // large screens
  };

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [visibleItems, setVisibleItems] = React.useState(getVisibleItems());
  
  React.useEffect(() => {
    const handleResize = () => setVisibleItems(getVisibleItems());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  try {
    if (!content || content.length === 0) {
      return null;
    }

    const maxIndex = Math.max(0, content.length - visibleItems);

    const nextSlide = () => {
      setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
    };

    const prevSlide = () => {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    };

    return (
      <div className="mb-8" data-name="content-carousel" data-file="components/ContentCarousel.js">
        <h2 className="text-2xl font-bold mb-4 px-6">{title}</h2>
        <div className="relative group">
          {currentIndex > 0 && (
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevSlide}
            >
              <div className="icon-chevron-right text-2xl text-white"></div>
            </button>
          )}
          
          {currentIndex < maxIndex && (
            <button 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextSlide}
            >
              <div className="icon-chevron-left text-2xl text-white"></div>
            </button>
          )}
          
          <div className="overflow-hidden px-6">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(${currentIndex * (100 / visibleItems)}%)` }}
            >
              {content.map((item, index) => (
                <div 
                  key={`${item.objectId}_${index}`} 
                  className={`flex-none px-1 sm:px-2 ${
                    visibleItems === 2 ? 'w-1/2' :
                    visibleItems === 3 ? 'w-1/3' :
                    visibleItems === 4 ? 'w-1/4' : 'w-1/5'
                  }`}
                >
                  <div 
                    className="content-card group relative"
                    onClick={() => onPlayContent(item.objectData)}
                  >
                    <img 
                      src={item.objectData.thumbnail} 
                      alt={item.objectData.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="icon-play text-3xl text-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate">{item.objectData.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">{item.objectData.year}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ContentCarousel component error:', error);
    return null;
  }
}