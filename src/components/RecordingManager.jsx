import React from 'react';
import { trickleListObjects, trickleCreateObject, trickleDeleteObject } from '../utils/database';

function RecordingManager({ user }) {
  const [recordings, setRecordings] = React.useState([]);
  const [scheduledRecordings, setScheduledRecordings] = React.useState([]);
  const [showScheduleModal, setShowScheduleModal] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      loadRecordings();
      loadScheduledRecordings();
    }
  }, [user]);

  const loadRecordings = async () => {
    try {
      const recordingsData = await trickleListObjects(`recordings:${user.objectId}`, 100, true);
      setRecordings(recordingsData.items);
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const loadScheduledRecordings = async () => {
    try {
      setLoading(true);
      const scheduledData = await trickleListObjects(`scheduled_recordings:${user.objectId}`, 100, true);
      setScheduledRecordings(scheduledData.items);
    } catch (error) {
      console.error('Error loading scheduled recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecording = async (recordingId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק הקלטה זו?')) {
      try {
        await trickleDeleteObject(`recordings:${user.objectId}`, recordingId);
        loadRecordings();
      } catch (error) {
        console.error('Error deleting recording:', error);
      }
    }
  };

  const cancelScheduledRecording = async (scheduleId) => {
    try {
      await trickleDeleteObject(`scheduled_recordings:${user.objectId}`, scheduleId);
      loadScheduledRecordings();
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  };

  try {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-20" data-name="recording-manager" data-file="components/RecordingManager.js">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">מנהל הקלטות</h1>
          <button
            className="btn-primary"
            onClick={() => setShowScheduleModal(true)}
          >
            <div className="icon-plus text-lg ml-2"></div>
            תזמן הקלטה
          </button>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="icon-loader text-4xl text-gray-400 animate-spin mb-4"></div>
            <p className="text-gray-400">טוען הקלטות...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold mb-4">הקלטות שמורות ({recordings.length})</h2>
              {recordings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="icon-video text-4xl text-gray-600 mb-2"></div>
                  <p className="text-gray-400">אין הקלטות שמורות</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recordings.map(recording => (
                    <div key={recording.objectId} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{recording.objectData.title}</h3>
                          <p className="text-sm text-gray-400">{recording.objectData.channel}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(recording.objectData.recordedAt).toLocaleString('he-IL')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="btn-primary text-sm">
                            <div className="icon-play text-sm ml-1"></div>
                            נגן
                          </button>
                          <button
                            className="btn-secondary text-sm"
                            onClick={() => deleteRecording(recording.objectId)}
                          >
                            <div className="icon-trash text-sm"></div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4">הקלטות מתוזמנות ({scheduledRecordings.length})</h2>
              {scheduledRecordings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="icon-clock text-4xl text-gray-600 mb-2"></div>
                  <p className="text-gray-400">אין הקלטות מתוזמנות</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledRecordings.map(schedule => (
                    <div key={schedule.objectId} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{schedule.objectData.title}</h3>
                          <p className="text-sm text-gray-400">{schedule.objectData.channel}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(schedule.objectData.scheduledTime).toLocaleString('he-IL')}
                          </p>
                        </div>
                        <button
                          className="btn-secondary text-sm"
                          onClick={() => cancelScheduledRecording(schedule.objectId)}
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {showScheduleModal && (
          <ScheduleRecordingModal
            user={user}
            onClose={() => setShowScheduleModal(false)}
            onSuccess={() => {
              loadScheduledRecordings();
              setShowScheduleModal(false);
            }}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('RecordingManager component error:', error);
    return null;
  }
}

function ScheduleRecordingModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = React.useState({
    title: '',
    channel: '',
    date: '',
    time: '',
    duration: 60
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const scheduledTime = new Date(`${formData.date}T${formData.time}`);
      await trickleCreateObject(`scheduled_recordings:${user.objectId}`, {
        userId: user.objectId,
        title: formData.title,
        channel: formData.channel,
        scheduledTime: scheduledTime.toISOString(),
        duration: formData.duration,
        status: 'scheduled'
      });
      onSuccess();
    } catch (error) {
      console.error('Error scheduling recording:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">תזמון הקלטה</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="שם התוכנית"
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="ערוץ"
            required
            value={formData.channel}
            onChange={(e) => setFormData({...formData, channel: e.target.value})}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
          <input
            type="time"
            required
            value={formData.time}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
          <input
            type="number"
            placeholder="משך בדקות"
            min="1"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
          <div className="flex space-x-3">
            <button type="submit" className="btn-primary flex-1">תזמן</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecordingManager;
