import { trickleListObjects, trickleCreateObject, trickleUpdateObject, trickleDeleteObject } from './database';

const AuthUtils = {
  // Simple encryption for credentials (basic security)
  encrypt: (text) => {
    return btoa(text);
  },
  
  decrypt: (encodedText) => {
    try {
      return atob(encodedText);
    } catch (error) {
      return '';
    }
  },

  // Validate email format
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  validatePassword: (password) => {
    if (password.length < 6) {
      return { valid: false, message: 'הסיסמה חייבת להכיל לפחות 6 תווים' };
    }
    return { valid: true, message: '' };
  },

  // רישום משתמש חדש עם validation משופר
  register: async (userData) => {
    try {
      // Validate input
      if (!userData.email || !userData.password || !userData.name) {
        return {
          success: false,
          error: 'יש למלא את כל השדות הנדרשים'
        };
      }

      if (!AuthUtils.validateEmail(userData.email)) {
        return {
          success: false,
          error: 'כתובת אימייל לא תקינה'
        };
      }

      const passwordValidation = AuthUtils.validatePassword(userData.password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.message
        };
      }

      // Check if user already exists
      const existingUsers = await trickleListObjects('user', 100, false);
      const userExists = existingUsers.items.some(u => u.objectData.email === userData.email);
      
      if (userExists) {
        return {
          success: false,
          error: 'משתמש עם כתובת אימייל זו כבר קיים'
        };
      }

      const user = await trickleCreateObject('user', {
        email: userData.email,
        password: AuthUtils.encrypt(userData.password),
        name: userData.name.trim(),
        createdAt: new Date().toISOString(),
        isActive: true
      });
      
      return {
        success: true,
        user: user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'שגיאה ברישום המשתמש'
      };
    }
  },

  // כניסה למערכת עם validation משופר
  login: async (email, password) => {
    try {
      if (!email || !password) {
        return {
          success: false,
          error: 'יש למלא אימייל וסיסמה'
        };
      }

      if (!AuthUtils.validateEmail(email)) {
        return {
          success: false,
          error: 'כתובת אימייל לא תקינה'
        };
      }

      const users = await trickleListObjects('user', 100, false);
      const user = users.items.find(u => 
        u.objectData.email === email && 
        AuthUtils.decrypt(u.objectData.password) === password &&
        u.objectData.isActive
      );

      if (user) {
        return {
          success: true,
          user: user
        };
      } else {
        return {
          success: false,
          error: 'אימייל או סיסמה שגויים'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'שגיאה בהתחברות'
      };
    }
  }
};
