import React from 'react';

function NotificationSystem({ user, notifications, onUpdate }) {
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (notifications) {
      const unread = notifications.filter(n => !n.objectData.isRead).length;
      setUnreadCount(unread);
    }
  }, [notifications]);

  React.useEffect(() => {
    if (user) {
      checkForNewNotifications();
    }
  }, [user]);

  const checkForNewNotifications = async () => {
    try {
      console.log('Notification system ready');
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const notification = notifications.find(n => n.objectId === notificationId);
      if (notification) {
        await trickleUpdateObject(`notifications:${user.objectId}`, notificationId, {
          ...notification.objectData,
          isRead: true
        });
        onUpdate();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.objectData.isRead);
      for (const notification of unreadNotifications) {
        await trickleUpdateObject(`notifications:${user.objectId}`, notification.objectId, {
          ...notification.objectData,
          isRead: true
        });
      }
      onUpdate();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  try {
    return (
      <div className="relative" data-name="notification-system" data-file="components/NotificationSystem.js">
        <button
          className="relative p-2 text-gray-300 hover:text-white"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <div className="icon-bell text-xl"></div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute left-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">התראות</h3>
                {unreadCount > 0 && (
                  <button
                    className="text-sm text-blue-400 hover:text-blue-300"
                    onClick={markAllAsRead}
                  >
                    סמן הכל כנקרא
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  אין התראות חדשות
                </div>
              ) : (
                notifications.slice(0, 10).map(notification => (
                  <div
                    key={notification.objectId}
                    className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 ${
                      !notification.objectData.isRead ? 'bg-blue-900 bg-opacity-30' : ''
                    }`}
                    onClick={() => markAsRead(notification.objectId)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{notification.objectData.title}</h4>
                        <p className="text-xs text-gray-300 mt-1">{notification.objectData.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString('he-IL')}
                        </p>
                      </div>
                      {!notification.objectData.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('NotificationSystem component error:', error);
    return null;
  }
}

export default NotificationSystem;
