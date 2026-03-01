/* 
   VIEW : AuthView.js
   Gere l'affichage et les interactions des pages
   d'authentification (login et inscription).
 */

var AuthView = {

  /**
    Initialise les ecouteurs du formulaire de connexion.
    @param {function} onSubmit - callback(email, password)
   */
  initLogin: function (onSubmit) {
    $("#login-form").on("submit", function (e) {
      e.preventDefault();
      var email = $.trim($("#login-email").val());
      var password = $("#login-password").val();
      onSubmit(email, password);
    });
  },

  /**
    Initialise les ecouteurs du formulaire d'inscription.
    @param {function} onSubmit - callback(name, email, password)
   */
  initRegister: function (onSubmit) {
    $("#register-form").on("submit", function (e) {
      e.preventDefault();
      var name = $.trim($("#register-name").val());
      var email = $.trim($("#register-email").val());
      var password = $("#register-password").val();
      var confirm = $("#register-confirm").val();

      // Validation cote client
      if (password !== confirm) {
        AuthView.showError("register-error", "Les mots de passe ne correspondent pas.");
        return;
      }
      if (password.length < 6) {
        AuthView.showError("register-error", "Le mot de passe doit contenir au moins 6 caracteres.");
        return;
      }

      onSubmit(name, email, password);
    });
  },

  /**
   * Affiche un message d'erreur dans un element specifique.
    @param {string} elementId
    @param {string} message
   */
  showError: function (elementId, message) {
    $("#" + elementId).text(message).removeClass("hidden");
  },

  /**
   * Cache un message d'erreur.
    @param {string} elementId
   */
  hideError: function (elementId) {
    $("#" + elementId).text("").addClass("hidden");
  },

  /**
   * Active/desactive l'etat de chargement du bouton.
    @param {string} btnId
    @param {boolean} loading
   */
  setLoading: function (btnId, loading) {
    var $btn = $("#" + btnId);
    if ($btn.length === 0) return;

    if (loading) {
      $btn.prop("disabled", true);
      $btn.data("original-text", $btn.html());
      $btn.html('<span class="spinner"></span> Chargement...');
    } else {
      $btn.prop("disabled", false);
      $btn.html($btn.data("original-text") || "Valider");
    }
  }
};