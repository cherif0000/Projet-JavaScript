/*    CONTROLLER : BuilderController.js
   Gere la logique du constructeur de CV : chargement des
   donnees, sauvegarde, preview en temps reel, ajout/suppression
   d'items repetables, et export PDF. */

var BuilderController = {

  currentUser: null,
  currentCVId: null,
  debounceTimer: null,

  /**
   * Initialise le builder.
   * Verifie l'auth, charge le CV si edition, ecoute les inputs.
   */
  init: function () {
    AuthController.requireAuth(function (user) {
      BuilderController.currentUser = user;

      // Verifier si on edite un CV existant
      var params = new URLSearchParams(window.location.search);
      var cvId = params.get("id");
      var shouldExport = params.get("export") === "true";

      if (cvId) {
        BuilderController.currentCVId = cvId;
        BuilderController.loadCV(cvId).then(function () {
          if (shouldExport) {
            setTimeout(function () { BuilderController.exportPDF(); }, 500);
          }
        });
      } else {
        // Nouveau CV : afficher la preview vide
        BuilderView.updatePreview(CVModel.createEmptyCV());
      }

      // Ecouter tous les changements dans le formulaire (live preview)
      BuilderController.setupLivePreview();

      // Binding des boutons
      $(document).on("click", "#save-btn", function () {
        BuilderController.saveCV();
      });
      $(document).on("click", "#export-btn", function () {
        BuilderController.exportPDF();
      });
      $(document).on("click", "#btn-back", function () {
        BuilderController.goBack();
      });
      $(document).on("click", "#btn-builder-logout", function () {
        AuthController.logout();
      });
      $(document).on("click", "#btn-add-experience", function () {
        BuilderController.addExperience();
      });
      $(document).on("click", "#btn-add-education", function () {
        BuilderController.addEducation();
      });
      $(document).on("click", "#btn-add-language", function () {
        BuilderController.addLanguage();
      });

      // Photo upload
      $(document).on("change", "#input-photo", function () {
        var file = this.files && this.files[0];
        if (file) {
          BuilderView.handlePhotoUpload(file);
        }
      });
      $(document).on("click", "#btn-remove-photo", function (e) {
        e.preventDefault();
        e.stopPropagation();
        BuilderView.removePhoto();
      });

      // Drag and drop pour la photo
      var $uploadZone = $("#photo-upload-zone");
      $uploadZone.on("dragover", function (e) {
        e.preventDefault();
        $(this).addClass("drag-over");
      });
      $uploadZone.on("dragleave drop", function (e) {
        e.preventDefault();
        $(this).removeClass("drag-over");
      });
      $uploadZone.on("drop", function (e) {
        e.preventDefault();
        var files = e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files;
        if (files && files[0]) {
          BuilderView.handlePhotoUpload(files[0]);
        }
      });

      // Suppression d'items via delegation
      $(document).on("click", ".btn-remove-item", function () {
        BuilderController.removeItem(this);
      });
    });
  },

  /**
   * Charge un CV existant depuis Firestore et remplit le formulaire.
   * @param {string} cvId
   * @returns {Promise}
   */
  loadCV: function (cvId) {
    return CVModel.getCVById(BuilderController.currentUser.uid, cvId)
      .then(function (cv) {
        if (cv) {
          BuilderView.populateForm(cv);
          BuilderView.updatePreview(cv);
        } else {
          Toast.show("CV introuvable.", "error");
          window.location.href = "dashboard.html";
        }
      })
      .catch(function (error) {
        Toast.show("Erreur lors du chargement du CV.", "error");
        console.error("Erreur loadCV:", error);
      });
  },

  /**
   * Configure la preview en temps reel.
   * Ecoute les events input sur tout le formulaire avec jQuery.
   */
  setupLivePreview: function () {
    $("#builder-form").on("input", function () {
      clearTimeout(BuilderController.debounceTimer);
      BuilderController.debounceTimer = setTimeout(function () {
        var data = BuilderView.collectFormData();
        BuilderView.updatePreview(data);
      }, 150);
    });
  },

  /**
   * Sauvegarde le CV dans Firestore.
   */
  saveCV: function () {
    var $btn = $("#save-btn");
    $btn.prop("disabled", true).html('<span class="spinner"></span> Sauvegarde...');

    var cvData = BuilderView.collectFormData();

    CVModel.saveCV(BuilderController.currentUser.uid, BuilderController.currentCVId, cvData)
      .then(function (savedId) {
        BuilderController.currentCVId = savedId;

        // Mettre a jour l'URL sans recharger la page
        if (window.location.search.indexOf("id=") === -1) {
          var newUrl = "builder.html?id=" + savedId;
          window.history.replaceState({}, "", newUrl);
        }

        Toast.show("CV sauvegarde avec succes !", "success");
      })
      .catch(function (error) {
        Toast.show("Erreur lors de la sauvegarde.", "error");
        console.error("Erreur saveCV:", error);
      })
      .finally(function () {
        $btn.prop("disabled", false).html(
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>'
          + ' Sauvegarder'
        );
      });
  },

  /**
   * Exporte le CV en PDF via window.print().
   */
  exportPDF: function () {
    window.print();
  },

  /**
   * Ajoute une nouvelle experience.
   */
  addExperience: function () {
    BuilderView.addExperienceItem();
    BuilderController.triggerPreviewUpdate();
  },

  /**
   * Ajoute une nouvelle formation.
   */
  addEducation: function () {
    BuilderView.addEducationItem();
    BuilderController.triggerPreviewUpdate();
  },

  /**
   * Ajoute une nouvelle langue.
   */
  addLanguage: function () {
    BuilderView.addLanguageItem();
    BuilderController.triggerPreviewUpdate();
  },

  /**
   * Supprime un element repetable (experience, formation, langue).
   * @param {HTMLElement} btn - Le bouton de suppression
   */
  removeItem: function (btn) {
    $(btn).closest(".repeatable-item").remove();
    BuilderController.triggerPreviewUpdate();
  },

  /**
   * Declenche une mise a jour de la preview.
   */
  triggerPreviewUpdate: function () {
    var data = BuilderView.collectFormData();
    BuilderView.updatePreview(data);
  },

  /**
   * Retour au dashboard.
   */
  goBack: function () {
    window.location.href = "dashboard.html";
  }
};
