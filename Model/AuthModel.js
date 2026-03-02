/* 
   MODEL : AuthModel.js
   Gere toute la logique d'authentification Firebase :
   inscription, connexion, deconnexion, etat de l'utilisateur.
 */

var AuthModel = {

  /**
   * Inscrit un nouvel utilisateur avec email/mot de passe.
   * Cree aussi un document profil dans Firestore.
   */
  register: function (name, email, password) {
    return auth.createUserWithEmailAndPassword(email, password)
      .then(function (userCredential) {
        var user = userCredential.user;
        return user.updateProfile({ displayName: name }).then(function () {
          return db.collection("users").doc(user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }).then(function () {
          return user;
        });
      });
  },

  /**
   * Connecte un utilisateur existant.
   */
  login: function (email, password) {
    return auth.signInWithEmailAndPassword(email, password)
      .then(function (userCredential) {
        return userCredential.user;
      });
  },

  /**
   * Deconnecte l'utilisateur courant.
   */
  logout: function () {
    return auth.signOut();
  },

  /**
   * Retourne l'utilisateur actuellement connecte (ou null).
   */
  getCurrentUser: function () {
    return auth.currentUser;
  },

  /**
   * Ecoute les changements d'etat d'authentification.
   * IMPORTANT : retourne le unsubscribe pour stopper le listener.
   * @param {function} callback - recoit (user) ou (null)
   * @returns {function} unsubscribe
   */
  onAuthStateChanged: function (callback) {
    return auth.onAuthStateChanged(callback); // ← RETURN obligatoire
  }
};