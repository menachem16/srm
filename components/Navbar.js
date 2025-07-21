function IPTVSettingsDropdown({ currentPage, onNavigate }) {
  const [showDropdown, setShowDropdown] = React.useState(false);
  
  const iptvPages = [
    { id: 'iptv-setup', name: 'הגדרות IPTV', icon: 'icon-settings' },
    { id: 'epg', name: 'מדריך תוכניות', icon: 'icon-tv' },
    { id: 'recordings', name: 'הקלטות', icon: 'icon-video' },
    { id: 'recommendations', name: 'המלצות', icon: 'icon-star' },
    { id: 'parental', name: 'בקרת הורים', icon: 'icon-shield' }
  ];

  const isActive = iptvPages.some(page => page.id === currentPage);

  return (
    <div className="relative">
      <button 
        className={`nav-link flex items-center ${isActive ? 'text-red-600' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        הגדרות IPTV
        <div className={`icon-chevron-down text-sm mr-1 transition-transform ${showDropdown ? 'rotate-180' : ''}`}></div>
      </button>
      
      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-lg min-w-48 py-2 z-50">
          {iptvPages.map(page => (
            <button
              key={page.id}
              className={`w-full text-right px-4 py-2 hover:bg-gray-700 flex items-center ${
                currentPage === page.id ? 'text-red-600 bg-gray-700' : ''
              }`}
              onClick={() => {
                onNavigate(page.id);
                setShowDropdown(false);
              }}
            >
              <div className={`${page.icon} text-sm ml-2`}></div>
              {page.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Navbar({ user, currentPage, onNavigate, onLogin, onLogout }) {
  try {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-black bg-opacity-90 backdrop-blur-sm z-50" data-name="navbar" data-file="components/Navbar.js">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8 space-x-reverse">
              <button 
                className="text-red-600 text-2xl font-bold"
                onClick={() => onNavigate('home')}
              >
                StreamPlatform
              </button>
              
              <div className="hidden md:flex items-center space-x-6 space-x-reverse">
                <button 
                  className={`nav-link ${currentPage === 'home' ? 'text-red-600' : ''}`}
                  onClick={() => onNavigate('home')}
                >
                  בית
                </button>
                
                {user && (
                  <>
                    <button 
                      className={`nav-link ${currentPage === 'iptv' ? 'text-red-600' : ''}`}
                      onClick={() => onNavigate('iptv')}
                    >
                      שידורים חיים
                    </button>
                    <button 
                      className={`nav-link ${currentPage === 'iptv-favorites' ? 'text-red-600' : ''}`}
                      onClick={() => onNavigate('iptv-favorites')}
                    >
                      מועדפים
                    </button>
                    <button 
                      className={`nav-link ${currentPage === 'playlists' ? 'text-red-600' : ''}`}
                      onClick={() => onNavigate('playlists')}
                    >
                      רשימות השמעה
                    </button>
                    <button 
                      className={`nav-link ${currentPage === 'reviews' ? 'text-red-600' : ''}`}
                      onClick={() => onNavigate('reviews')}
                    >
                      ביקורות
                    </button>
                    <IPTVSettingsDropdown 
                      currentPage={currentPage}
                      onNavigate={onNavigate}
                    />
                    <button 
                      className={`nav-link ${currentPage === 'profile' ? 'text-red-600' : ''}`}
                      onClick={() => onNavigate('profile')}
                    >
                      פרופיל
                    </button>
                    {user?.objectData?.isAdmin && (
                      <button 
                        className={`nav-link ${currentPage === 'admin' ? 'text-red-600' : ''}`}
                        onClick={() => onNavigate('admin')}
                      >
                        ניהול
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              {user && <RealTimeNotifications user={user} />}
              {user ? (
                <div className="flex items-center space-x-4 space-x-reverse">
                  <span className="text-sm">שלום, {user.objectData?.name || user.objectData?.email}</span>
                  <button 
                    onClick={onLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                  >
                    יציאה
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onLogin}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  התחברות
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  } catch (error) {
    console.error('Navbar component error:', error);
    return null;
  }
}
