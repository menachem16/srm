function ReminderSystem({ user }) {
  const [reminders, setReminders] = React.useState([]);
  const [showReminderModal, setShowReminderModal] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      checkReminders();
      const interval = setInterval(checkReminders, 60000); // בדיקה כל דקה
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkReminders = async () => {
    try {
      const userPrefs = await trickleListObjects(`user_preferences:${user.objectId}`, 1, true);
      const reminderSettings = userPrefs.items[0]?.objectData.reminderSettings;
      
      if (reminderSettings) {
        const settings = JSON.parse(reminderSettings);
        if (settings.enableReminders) {
          await checkWatchingProgress();
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  };

  const checkWatchingProgress = async () => {
    try {
      const lastActivity = localStorage.getItem(`lastActivity_${user.objectId}`);
      if (lastActivity) {
        const lastTime = new Date(lastActivity);
        const now = new Date();
        const hoursSinceLastActivity = (now - lastTime) / (1000 * 60 * 60);
        
        if (hoursSinceLastActivity >= 24) {
          const queue = await trickleListObjects(`watch_queue:${user.objectId}`, 5, false);
          if (queue.items.length > 0) {
            setReminders([{
              id: 'watch_reminder',
              title: 'זמן לחזור לצפות!',
              message: `יש לך ${queue.items.length} תכנים בתור הצפייה שלך`,
              type: 'watch_reminder'
            }]);
            setShowReminderModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking watching progress:', error);
    }
  };

  const dismissReminder = async (reminderId) => {
    try {
      await trickleCreateObject(`notifications:${user.objectId}`, {
        title: 'תזכורת צפייה',
        message: 'זמן לחזור לצפות בתכנים שלך!',
        type: 'reminder',
        isRead: false
      });
      
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      setShowReminderModal(false);
      localStorage.setItem(`lastActivity_${user.objectId}`, new Date().toISOString());
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  const updateLastActivity = () => {
    if (user) {
      localStorage.setItem(`lastActivity_${user.objectId}`, new Date().toISOString());
    }
  };

  React.useEffect(() => {
    // עדכון פעילות אחרונה בכל פעולה
    const handleActivity = () => updateLastActivity();
    document.addEventListener('click', handleActivity);
    document.addEventListener('scroll', handleActivity);
    
    return () => {
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('scroll', handleActivity);
    };
  }, [user]);

  try {
    if (!showReminderModal || reminders.length === 0) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-name="reminder-system" data-file="components/ReminderSystem.js">
        <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="text-center">
              <div className="icon-bell text-4xl text-yellow-500 mb-4"></div>
              <h3 className="text-xl font-bold mb-2">{reminder.title}</h3>
              <p className="text-gray-300 mb-6">{reminder.message}</p>
              <div className="flex space-x-3">
                <button 
                  className="btn-primary flex-1"
                  onClick={() => {
                    dismissReminder(reminder.id);
                    window.location.hash = '#queue';
                  }}
                >
                  לתור הצפייה
                </button>
                <button 
                  className="btn-secondary flex-1"
                  onClick={() => dismissReminder(reminder.id)}
                >
                  בסדר
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('ReminderSystem component error:', error);
    return null;
  }
}