// אין צורך ב-import, כל הפונקציות זמינות גלובלית

function EnhancedAuth({ isOpen, mode, onClose, onSuccess }) {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferences: {
      favoriteGenres: [],
      ageGroup: 'adult'
    }
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [step, setStep] = React.useState(1);

  const genres = ['action', 'comedy', 'drama', 'horror', 'romance', 'documentary', 'kids'];

  const handleGenreToggle = (genre) => {
    const currentGenres = formData.preferences.favoriteGenres;
    if (currentGenres.includes(genre)) {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          favoriteGenres: currentGenres.filter(g => g !== genre)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          favoriteGenres: [...currentGenres, genre]
        }
      }));
    }
  };

  const validateForm = () => {
    if (mode === 'register') {
      if (!formData.name.trim()) return 'שם מלא נדרש';
      if (formData.password !== formData.confirmPassword) return 'הסיסמאות אינן תואמות';
      if (formData.password.length < 8) return 'הסיסמה חייבת להכיל לפחות 8 תווים';
    }
    if (!formData.email.includes('@')) return 'כתובת דוא"ל לא תקינה';
    if (!formData.password) return 'סיסמה נדרשת';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const existingUsers = window.trickleListObjects('users', 100, true);
        const userExists = existingUsers.items.some(u => u.objectData.email === formData.email);
        
        if (userExists) {
          setError('משתמש עם כתובת דוא"ל זו כבר קיים');
          return;
        }

        const newUser = window.trickleCreateObject('users', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          subscription_type: 'basic',
          subscription_status: 'inactive',
          is_admin: false,
          viewing_preferences: JSON.stringify(formData.preferences),
          last_login: new Date().toISOString()
        });
        
        onSuccess(newUser.objectData);
      } else {
        const users = window.trickleListObjects('users', 100, true);
        const user = users.items.find(u => 
          u.objectData.email === formData.email && 
          u.objectData.password === formData.password
        );
        
        if (!user) {
          setError('כתובת דוא"ל או סיסמה שגויים');
          return;
        }

        await window.trickleUpdateObject('users', user.objectId, {
          ...user.objectData,
          last_login: new Date().toISOString()
        });
        
        onSuccess(user.objectData);
      }
    } catch (err) {
      setError('שגיאה במערכת, נסו שוב');
    } finally {
      setLoading(false);
    }
  };

  try {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-name="enhanced-auth" data-file="components/EnhancedAuth.js">
        <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {mode === 'register' ? (step === 1 ? 'הרשמה' : 'העדפות צפייה') : 'התחברות'}
            </h2>
            <button onClick={onClose}>
              <div className="icon-x text-xl"></div>
            </button>
          </div>
          
          {mode === 'register' && step === 2 ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">בחר את הז'אנרים המועדפים עליך:</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {genres.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    className={`p-3 rounded text-sm ${
                      formData.preferences.favoriteGenres.includes(genre)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handleGenreToggle(genre)}
                  >
                    {genre === 'action' ? 'אקשן' :
                     genre === 'comedy' ? 'קומדיה' :
                     genre === 'drama' ? 'דרמה' :
                     genre === 'horror' ? 'אימה' :
                     genre === 'romance' ? 'רומנטי' :
                     genre === 'documentary' ? 'דוקומנטרי' : 'ילדים'}
                  </button>
                ))}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">קבוצת גיל</label>
                <select
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                  value={formData.preferences.ageGroup}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: {...prev.preferences, ageGroup: e.target.value}
                  }))}
                >
                  <option value="kids">ילדים (עד 12)</option>
                  <option value="teen">בני נוער (13-17)</option>
                  <option value="adult">מבוגרים (18+)</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  חזור
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'מתחבר...' : 'סיים הרשמה'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (mode === 'register') {
                setStep(2);
              } else {
                handleSubmit(e);
              }
            }}>
              {mode === 'register' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">שם מלא</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">כתובת דוא"ל</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">סיסמה</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              
              {mode === 'register' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">אימות סיסמה</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              )}
              
              {error && (
                <div className="mb-4 text-red-500 text-sm">{error}</div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'טוען...' : (mode === 'register' ? 'המשך' : 'התחבר')}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('EnhancedAuth component error:', error);
    return null;
  }
}