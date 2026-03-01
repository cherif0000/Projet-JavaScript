/* 
   VIEW : AuthView.js
   Gere l'affichage et les interactions des pages
   d'authentification (login et inscription).
 */

var AuthView = {

  /* ---- Regex de validation ---- */
  REGEX_EMAIL:    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  REGEX_PASSWORD: /^.{6,}$/,                              // minimum 6 caracteres (regle projet)
  REGEX_PHONE_SN: /^(\+221|221)?(70|75|76|77|78)\d{7}$/, // format senegalais

  /**
   * Initialise les ecouteurs du formulaire de connexion.
   @param {function} onSubmit - callback(email, password)
   */
  initLogin: function (onSubmit) {
    $("#login-email").on("input", function () {
      AuthView._validateEmail("login-email", "login-email-error");
    });
    $("#login-password").on("input", function () {
      AuthView._validatePassword("login-password", "login-password-error");
    });

    $("#login-form").on("submit", function (e) {
      e.preventDefault();
      var email    = $.trim($("#login-email").val());
      var password = $("#login-password").val();

      var emailOk    = AuthView._validateEmail("login-email", "login-email-error");
      var passwordOk = AuthView._validatePassword("login-password", "login-password-error");

      if (!emailOk || !passwordOk) return;

      onSubmit(email, password);
    });
  },

  /**
   * Initialise les ecouteurs du formulaire d'inscription.
   * @param {function} onSubmit - callback(name, email, password)
   */
  initRegister: function (onSubmit) {
    $("#register-email").on("input", function () {
      AuthView._validateEmail("register-email", "register-email-error");
    });
    $("#register-password").on("input", function () {
      AuthView._validatePassword("register-password", "register-password-error");
      if ($("#register-confirm").val().length > 0) {
        AuthView._validateConfirm();
      }
    });
    $("#register-confirm").on("input", function () {
      AuthView._validateConfirm();
    });

    $("#register-form").on("submit", function (e) {
      e.preventDefault();
      var name     = $.trim($("#register-name").val());
      var email    = $.trim($("#register-email").val());
      var password = $("#register-password").val();

      /* Validation champs obligatoires */
      if (!name) {
        AuthView._showFieldError("register-name", "register-name-error", "Le nom complet est requis.");
        return;
      }
      AuthView._clearFieldError("register-name", "register-name-error");

      var emailOk    = AuthView._validateEmail("register-email", "register-email-error");
      var passwordOk = AuthView._validatePassword("register-password", "register-password-error");
      var confirmOk  = AuthView._validateConfirm();

      if (!emailOk || !passwordOk || !confirmOk) return;

      onSubmit(name, email, password);
    });
  },

  /* ---- Helpers de validation ---- */

  _validateEmail: function (inputId, errorId) {
    var val = $.trim($("#" + inputId).val());
    if (!val) {
      AuthView._showFieldError(inputId, errorId, "L'adresse email est requise.");
      return false;
    }
    if (!AuthView.REGEX_EMAIL.test(val)) {
      AuthView._showFieldError(inputId, errorId, "Adresse email invalide.");
      return false;
    }
    AuthView._clearFieldError(inputId, errorId);
    return true;
  },

  _validatePassword: function (inputId, errorId) {
    var val = $("#" + inputId).val();
    if (!val) {
      AuthView._showFieldError(inputId, errorId, "Le mot de passe est requis.");
      return false;
    }
    if (!AuthView.REGEX_PASSWORD.test(val)) {
      AuthView._showFieldError(inputId, errorId, "Le mot de passe doit contenir au moins 6 caracteres.");
      return false;
    }
    AuthView._clearFieldError(inputId, errorId);
    return true;
  },

  _validateConfirm: function () {
    var pass    = $("#register-password").val();
    var confirm = $("#register-confirm").val();
    if (!confirm) {
      AuthView._showFieldError("register-confirm", "register-confirm-error", "Veuillez confirmer votre mot de passe.");
      return false;
    }
    if (confirm !== pass) {
      AuthView._showFieldError("register-confirm", "register-confirm-error", "Les mots de passe ne correspondent pas.");
      return false;
    }
    AuthView._clearFieldError("register-confirm", "register-confirm-error");
    return true;
  },

  /**
   * Valide un numero de telephone au format senegalais.
    Utilise par BuilderView pour le champ telephone du CV.
    @param {string} val
    @returns {boolean}
   */
  validatePhoneSN: function (val) {
    if (!val) return true; // champ optionnel
    var clean = val.replace(/\s/g, "");
    return AuthView.REGEX_PHONE_SN.test(clean);
  },

  _showFieldError: function (inputId, errorId, msg) {
    $("#" + inputId).addClass("input--error");
    var $err = $("#" + errorId);
    if ($err.length === 0) {
      $("<p>", { id: errorId, class: "field-error", role: "alert" })
        .text(msg)
        .insertAfter("#" + inputId);
    } else {
      $err.text(msg).removeClass("hidden");
    }
  },

  _clearFieldError: function (inputId, errorId) {
    $("#" + inputId).removeClass("input--error");
    $("#" + errorId).addClass("hidden").text("");
  },

  showError: function (elementId, message) {
    $("#" + elementId).text(message).removeClass("hidden");
  },

  hideError: function (elementId) {
    $("#" + elementId).text("").addClass("hidden");
  },

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
