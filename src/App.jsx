import React, { useState, useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import IPTVChannels from './components/IPTVChannels'
import IPTVSetup from './components/IPTVSetup'
import IPTVFavorites from './components/IPTVFavorites'
import EPGGuide from './components/EPGGuide'
import RecordingManager from './components/RecordingManager'
import SmartRecommendations from './components/SmartRecommendations'
import NotificationSystem from './components/NotificationSystem'
import ParentalControls from './components/ParentalControls'
import UserProfile from './components/UserProfile'
import AdminPanel from './components/AdminPanel'
import PersonalPlaylist from './components/PersonalPlaylist'
import ReviewSystem from './components/ReviewSystem'
import IPTVPlayer from './components/IPTVPlayer'
import AuthModal from './components/AuthModal'

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      // Add delay and reduce limit to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      const notifData = await window.trickleListObjects(`notifications:${user.objectId}`, 20, true);
      
      if (notifData && notifData.items) {
        setNotifications(notifData.items);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const checkAuth = async () => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
    localStorage.removeItem('currentUser');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handlePlayChannel = (channel, subscription) => {
    setCurrentVideo({
      type: 'channel',
      data: channel,
      subscription: subscription
    });
    setCurrentPage('player');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Hero onNavigate={handleNavigate} />;
      case 'iptv':
        return user ? (
          <IPTVChannels user={user} onPlayChannel={handlePlayChannel} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">יש להתחבר כדי לצפות בערוצים</p>
          </div>
        );
      case 'iptv-setup':
        return user ? (
          <IPTVSetup user={user} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">יש להתחבר כדי להגדיר IPTV</p>
          </div>
        );
      case 'iptv-favorites':
        return user ? (
          <IPTVFavorites user={user} onPlayChannel={handlePlayChannel} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">יש להתחבר כדי לראות מועדפים</p>
          </div>
        );
      case 'epg':
        return user ? (
          <EPGGuide user={user} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">יש להתחבר כדי לראות מדריך תוכניות</p>
          </div>
        );
      case 'recordings':
        return user ? (
          <RecordingManager user={user} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">יש להתחבר כדי לראות הקלטות</p>
          </div>
        );
      case 'recommendations':
        return user ? (
          <SmartRecommendations user={user} onPlayChannel={handlePlayChannel} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">יש להתחבר כדי לראות המלצות</p>
          </div>
        );
      case 'notifications':
        return user ? (
          <NotificationSystem user={user} notifications={notifications} onUpdate={loadNotifications} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">יש להתחבר כדי לראות התראות</p>
          </div>
        );
      case 'parental':
        return user ? (
          <ParentalControls user={user} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">יש להתחבר כדי להגדיר בקרת הורים</p>
          </div>
        );
      case 'profile':
        return user ? (
          <UserProfile user={user} onUpdate={checkAuth} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">יש להתחבר כדי לראות פרופיל</p>
          </div>
        );
      case 'admin':
        return user && user.objectData?.isAdmin ? (
          <AdminPanel user={user} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">גישה מוגבלת למנהלים בלבד</p>
          </div>
        );
      case 'playlists':
        return user ? (
          <PersonalPlaylist user={user} onPlayChannel={handlePlayChannel} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">יש להתחבר כדי לראות רשימות השמעה</p>
          </div>
        );
      case 'reviews':
        return user ? (
          <ReviewSystem user={user} />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">יש להתחבר כדי לכתוב ביקורות</p>
          </div>
        );
      case 'player':
        return currentVideo ? (
          <IPTVPlayer 
            video={currentVideo} 
            onBack={() => setCurrentPage('iptv')} 
          />
        ) : (
          <div className="pt-20 text-center">
            <p className="text-gray-400">לא נבחר תוכן להצגה</p>
          </div>
        );
      default:
        return <Hero onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar 
        user={user}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogin={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />
      
      <main className="pt-16">
        {renderCurrentPage()}
      </main>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      )}

      {user && <NotificationSystem user={user} notifications={notifications} onUpdate={loadNotifications} />}
    </div>
  );
}

export default App; 