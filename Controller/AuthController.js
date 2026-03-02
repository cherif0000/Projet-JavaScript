/* CONTROLLER : AuthController.js
   Fait le lien entre AuthModel et AuthView.
   Gere la logique de connexion, inscription et redirection. 
*/

var AuthController = {

  /* Initialise la page de connexion. */
  initLogin: function () {
    AuthView.initLogin(function (email, password) {
      AuthView.hideError("login-error");
      AuthView.setLoading("login-btn", true);

      AuthModel.login(email, password)
        .then(function () {
          window.location.href = "dashboard.html";
        })
        .catch(function (error) {
          var msg = AuthController._translateError(error.code);
          AuthView.showError("login-error", msg);
        })
        .finally(function () {
          AuthView.setLoading("login-btn", false);
        });
    });
  },

  /* Initialise la page d'inscription. */
  initRegister: function () {
    AuthView.initRegister(function (name, email, password) {
      AuthView.hideError("register-error");
      AuthView.setLoading("register-btn", true);

      AuthModel.register(name, email, password)
        .then(function () {
          window.location.href = "dashboard.html";
        })
        .catch(function (error) {
          var msg = AuthController._translateError(error.code);
          AuthView.showError("register-error", msg);
        })
        .finally(function () {
          AuthView.setLoading("register-btn", false);
        });
    });
  },

  logout: function () {
    AuthModel.logout()
      .then(function () {
        sessionStorage.setItem("cv_just_logged_out", "true");
        window.location.href = "login.html";
      })
      .catch(function () {
        Toast.show("Erreur lors de la deconnexion.", "error");
      });
  },

  /**
   * Verifie si l'utilisateur est connecte.
    Pour les pages protegees (dashboard, builder).
   */
  requireAuth: function (callback) {
    var unsubscribe = AuthModel.onAuthStateChanged(function (user) {
      if (typeof unsubscribe === "function") unsubscribe();

      if (user) {
        callback(user);
      } else {
        window.location.href = "login.html";
      }
    });
  },

  /**
   * Pour les pages login/register :
   * - Si deja connecte → redirige vers dashboard
   * - Sinon → execute le callback (initLogin ou initRegister)
   * Se desabonne apres le premier appel — evite que le listener
   * reste actif et redirige apres la connexion.
   */
  redirectIfAuth: function (callback) {
    var justLoggedOut = sessionStorage.getItem("cv_just_logged_out") === "true";
    if (justLoggedOut) {
      sessionStorage.removeItem("cv_just_logged_out");
    }

    var unsubscribe = AuthModel.onAuthStateChanged(function (user) {
      // Stopper le listener immediatement apres le premier appel
      // Sans ca, le listener reste actif et redirige des que l'utilisateur
      // se connecte (comportement observe sur mobile)
      if (typeof unsubscribe === "function") unsubscribe();

      if (justLoggedOut) {
        if (user) {
          AuthModel.logout().then(function () {
            if (callback) callback();
          });
        } else {
          if (callback) callback();
        }
      } else {
        if (user) {
          // Session deja active → dashboard directement
          window.location.href = "dashboard.html";
        } else {
          // Pas connecte → afficher le formulaire
          if (callback) callback();
        }
      }
    });
  },

  _translateError: function (code) {
    var errors = {
      "auth/user-not-found":         "Aucun compte trouve avec cet email.",
      "auth/wrong-password":         "Mot de passe incorrect.",
      "auth/email-already-in-use":   "Cet email est deja utilise.",
      "auth/weak-password":          "Le mot de passe est trop faible (minimum 6 caracteres).",
      "auth/invalid-email":          "L'adresse email n'est pas valide.",
      "auth/too-many-requests":      "Trop de tentatives. Reessayez plus tard.",
      "auth/network-request-failed": "Erreur reseau. Verifiez votre connexion.",
      "auth/invalid-credential":     "Email ou mot de passe incorrect."
    };
    return errors[code] || "Une erreur est survenue. Veuillez reessayer.";
  }
};