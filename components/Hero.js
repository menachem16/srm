function Hero({ onNavigate }) {
  try {
    return (
      <div className="relative min-h-screen" data-name="hero" data-file="components/Hero.js">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjA3MCIgaGVpZ2h0PSIxMzgwIiB2aWV3Qm94PSIwIDAgMjA3MCAxMzgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjA3MCIgaGVpZ2h0PSIxMzgwIiBmaWxsPSIjMTExODI3Ii8+CjwvZz4KPC9zdmc+Cg==)'
          }}
        ></div>
        
        <div className="relative z-10 flex items-center min-h-screen">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              פלטפורמת הסטרימינג
              <br />
              <span className="text-red-600">המתקדמת</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-300">
              צפו בערוצים חיים מכל העולם, סרטים וסדרות ברזולוציה גבוהה
              עם חוויית צפייה מותאמת אישית
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => onNavigate('iptv')}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <div className="icon-play text-xl"></div>
                התחל לצפות
              </button>
              
              <button 
                onClick={() => onNavigate('iptv-setup')}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <div className="icon-settings text-xl"></div>
                הגדר IPTV
              </button>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="icon-tv text-2xl text-white"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">ערוצים חיים</h3>
                <p className="text-gray-400">אלפי ערוצים מכל העולם</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="icon-film text-2xl text-white"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">סרטים וסדרות</h3>
                <p className="text-gray-400">ספרייה ענקית של תוכן</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="icon-smartphone text-2xl text-white"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">צפייה בכל מקום</h3>
                <p className="text-gray-400">תואם לכל המכשירים</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Hero component error:', error);
    return null;
  }
}