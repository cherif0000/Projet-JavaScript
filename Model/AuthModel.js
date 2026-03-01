/* 
   MODEL : AuthModel.js
   Gere toute la logique d'authentification Firebase :
   inscription, connexion, deconnexion, etat de l'utilisateur.
 */

var AuthModel = {

  /**
   * Inscrit un nouvel utilisateur avec email/mot de passe.
   * Cree aussi un document profil dans Firestore.
   * @param {string} name - Nom complet
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} User Firebase
   */
  register: function (name, email, password) {
    return auth.createUserWithEmailAndPassword(email, password)
      .then(function (userCredential) {
        var user = userCredential.user;

        // Mettre a jour le displayName
        return user.updateProfile({ displayName: name }).then(function () {
          // Creer un document profil dans Firestore
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
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} User Firebase
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
   * @returns {object|null}
   */
  getCurrentUser: function () {
    return auth.currentUser;
  },

  /**
   * Ecoute les changements d'etat d'authentification.
   * @param {function} callback - recoit (user) ou (null)
   */
  onAuthStateChanged: function (callback) {
    // Retourner le unsubscribe pour stopper le listener apres usage
    return auth.onAuthStateChanged(callback);
  }
};