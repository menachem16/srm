window.AuthUtils = {
  register: async function({ email, password, name }) {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await userCredential.user.updateProfile({ displayName: name });
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  login: async function(email, password) {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  logout: async function() {
    await firebase.auth().signOut();
  },
  getCurrentUser: function() {
    return firebase.auth().currentUser;
  }
};
