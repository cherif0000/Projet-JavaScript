var BuilderController = {

  currentUser: null,
  currentCVId: null,
  currentStyle: 1,       // style actif (1 a 5), par defaut Classique
  debounceTimer: null,
  localStorageKey: null,

  /**
   * Initialise le builder.
   */
  init: function () {
    AuthController.requireAuth(function (user) {
      BuilderController.currentUser = user;

      var params       = new URLSearchParams(window.location.search);
      var cvId         = params.get("id");
      var styleParam   = parseInt(params.get("style"), 10);
      var shouldExport = params.get("export") === "true";

      // Cle localStorage unique : uid + cvId (ou "new")
      BuilderController.localStorageKey = "cv_draft_" + user.uid + "_" + (cvId || "new");

      if (cvId) {
        // Edition d'un CV existant : charger depuis Firestore
        BuilderController.currentCVId = cvId;
        BuilderController.loadCV(cvId).then(function () {
          BuilderController._restoreFromLocalStorage();
          if (shouldExport) {
            setTimeout(function () { BuilderController.exportPDF(); }, 500);
          }
        });
      } else {
        // Nouveau CV : appliquer le style choisi dans le style-picker
        if (styleParam && styleParam >= 1 && styleParam <= 5) {
          BuilderController.currentStyle = styleParam;
        }
        BuilderView.setStyle(BuilderController.currentStyle);

        // On passe styleParam : si l'utilisateur vient du style-picker,
        // son choix est prioritaire sur le style sauvegarde dans le brouillon.
        var restored = BuilderController._restoreFromLocalStorage(styleParam || null);
        if (!restored) {
          BuilderView.updatePreview(CVModel.createEmptyCV());
        }
      }

      // Live preview + auto-save
      BuilderController.setupLivePreview();

      // Binding boutons
      $(document).on("click", "#save-btn",           function () { BuilderController.saveCV(); });
      $(document).on("click", "#export-btn",         function () { BuilderController.exportPDF(); });
      $(document).on("click", "#btn-back",           function () { BuilderController.goBack(); });
      $(document).on("click", "#btn-builder-logout", function () { AuthController.logout(); });
      $(document).on("click", "#btn-add-experience", function () { BuilderController.addExperience(); });
      $(document).on("click", "#btn-add-education",  function () { BuilderController.addEducation(); });
      $(document).on("click", "#btn-add-language",   function () { BuilderController.addLanguage(); });

      // Photo upload
      $(document).on("change", "#input-photo", function () {
        var file = this.files && this.files[0];
        if (file) { BuilderView.handlePhotoUpload(file); }
      });
      $(document).on("click", "#btn-remove-photo", function (e) {
        e.preventDefault(); e.stopPropagation();
        BuilderView.removePhoto();
      });

      // Drag and drop photo
      var $uploadZone = $("#photo-upload-zone");
      $uploadZone.on("dragover", function (e) { e.preventDefault(); $(this).addClass("drag-over"); });
      $uploadZone.on("dragleave drop", function (e) { e.preventDefault(); $(this).removeClass("drag-over"); });
      $uploadZone.on("drop", function (e) {
        e.preventDefault();
        var files = e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files;
        if (files && files[0]) { BuilderView.handlePhotoUpload(files[0]); }
      });

      // Suppression items repetables
      $(document).on("click", ".btn-remove-item", function () {
        BuilderController.removeItem(this);
      });

      // Validation en temps reel
      $(document).on("input", "#input-email", function () {
        BuilderController._validateBuilderEmail();
      });
      $(document).on("input", "#input-phone", function () {
        BuilderController._validateBuilderPhone();
      });
      $(document).on("input", "#input-fullname", function () {
        BuilderController._validateRequired("input-fullname", "error-fullname", "Le nom complet est requis.");
      });
    });
  },

  /* ============================================================
     VALIDATION
     ============================================================ */

  _validateBuilderEmail: function () {
    var val = $.trim($("#input-email").val());
    if (val && !AuthView.REGEX_EMAIL.test(val)) {
      BuilderController._showError("input-email", "error-email", "Adresse email invalide (ex: nom@domaine.com).");
      return false;
    }
    BuilderController._clearError("input-email", "error-email");
    return true;
  },

  _validateBuilderPhone: function () {
    var val = $("#input-phone").val().replace(/\s/g, "");
    if (val && !AuthView.validatePhoneSN(val)) {
      BuilderController._showError("input-phone", "error-phone",
        "Numero invalide. Format : +221 7X XXX XX XX");
      return false;
    }
    BuilderController._clearError("input-phone", "error-phone");
    return true;
  },

  _validateRequired: function (inputId, errorId, msg) {
    var val = $.trim($("#" + inputId).val());
    if (!val) {
      BuilderController._showError(inputId, errorId, msg);
      return false;
    }
    BuilderController._clearError(inputId, errorId);
    return true;
  },

  _validateAll: function () {
    var nameOk  = BuilderController._validateRequired("input-fullname", "error-fullname", "Le nom complet est requis.");
    var emailOk = BuilderController._validateBuilderEmail();
    var phoneOk = BuilderController._validateBuilderPhone();
    return nameOk && emailOk && phoneOk;
  },

  _showError: function (inputId, errorId, msg) {
    $("#" + inputId).addClass("input--error");
    var $err = $("#" + errorId);
    if ($err.length === 0) {
      $("<p>", { id: errorId, class: "field-error", role: "alert" })
        .text(msg).insertAfter("#" + inputId);
    } else {
      $err.text(msg).removeClass("hidden");
    }
  },

  _clearError: function (inputId, errorId) {
    $("#" + inputId).removeClass("input--error");
    $("#" + errorId).addClass("hidden").text("");
  },

  /* ============================================================
     LOCALSTORAGE
     ============================================================ */

  _saveToLocalStorage: function () {
    if (!BuilderController.localStorageKey) return;
    try {
      var data = BuilderView.collectFormData();
      data.style = BuilderController.currentStyle; // persister le style
      localStorage.setItem(
        BuilderController.localStorageKey,
        JSON.stringify({ savedAt: Date.now(), data: data })
      );
    } catch (e) {
      console.warn("localStorage indisponible:", e);
    }
  },

  _restoreFromLocalStorage: function (forceStyle) {
    if (!BuilderController.localStorageKey) return false;
    try {
      var raw = localStorage.getItem(BuilderController.localStorageKey);
      if (!raw) return false;

      var stored = JSON.parse(raw);
      if (!stored || !stored.data) return false;

      // Si un style a ete explicitement choisi dans le style-picker (forceStyle),
      // on le respecte et on ignore le style sauvegarde dans le brouillon.
      // Sinon, on restaure le style du brouillon.
      if (forceStyle && forceStyle >= 1 && forceStyle <= 5) {
        BuilderController.currentStyle = forceStyle;
        BuilderView.setStyle(forceStyle);
      } else if (stored.data.style) {
        BuilderController.currentStyle = stored.data.style;
        BuilderView.setStyle(BuilderController.currentStyle);
      }

      BuilderView.populateForm(stored.data);
      BuilderView.updatePreview(stored.data);

      var date = new Date(stored.savedAt);
      var hh = date.getHours().toString().padStart(2, "0");
      var mm = date.getMinutes().toString().padStart(2, "0");
      Toast.show("Brouillon restaure (derniere modif. a " + hh + "h" + mm + ")", "info");
      return true;
    } catch (e) {
      console.warn("Erreur restauration localStorage:", e);
      return false;
    }
  },

  _clearLocalStorage: function () {
    if (!BuilderController.localStorageKey) return;
    try { localStorage.removeItem(BuilderController.localStorageKey); } catch (e) {}
  },

  /* ============================================================
     CORE
     ============================================================ */

  loadCV: function (cvId) {
    return CVModel.getCVById(BuilderController.currentUser.uid, cvId)
      .then(function (cv) {
        if (cv) {
          // Restaurer le style sauvegarde dans le CV
          if (cv.style) {
            BuilderController.currentStyle = cv.style;
            BuilderView.setStyle(BuilderController.currentStyle);
          }
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

  setupLivePreview: function () {
    $("#builder-form").on("input change", function () {
      clearTimeout(BuilderController.debounceTimer);
      BuilderController.debounceTimer = setTimeout(function () {
        var data = BuilderView.collectFormData();
        BuilderView.updatePreview(data);
        BuilderController._saveToLocalStorage();
      }, 300);
    });
  },

  saveCV: function () {
    if (!BuilderController._validateAll()) {
      Toast.show("Veuillez corriger les erreurs avant de sauvegarder.", "error");
      return;
    }

    var $btn = $("#save-btn");
    $btn.prop("disabled", true).html('<span class="spinner"></span> Sauvegarde...');

    var cvData = BuilderView.collectFormData();
    cvData.style = BuilderController.currentStyle; // inclure le style dans les donnees

    CVModel.saveCV(BuilderController.currentUser.uid, BuilderController.currentCVId, cvData)
      .then(function (savedId) {
        BuilderController.currentCVId = savedId;

        var oldKey = BuilderController.localStorageKey;
        BuilderController.localStorageKey = "cv_draft_" + BuilderController.currentUser.uid + "_" + savedId;

        try { localStorage.removeItem(oldKey); } catch(e) {}
        BuilderController._clearLocalStorage();

        if (window.location.search.indexOf("id=") === -1) {
          window.history.replaceState({}, "", "builder.html?id=" + savedId);
        }

        Toast.show("CV sauvegarde avec succes !", "success");
        setTimeout(function () {
          window.location.href = "dashboard.html";
        }, 1500);
      })
      .catch(function (error) {
        Toast.show("Erreur lors de la sauvegarde.", "error");
        console.error("Erreur saveCV:", error);
      })
      .finally(function () {
        $btn.prop("disabled", false).html(
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>'
          + " Sauvegarder"
        );
      });
  },

exportPDF: function () {
  var element = document.getElementById("cv-preview-content");
  var nomCV = $("#input-fullname").val().trim() || "mon-cv";

  $(element).css("min-height", "unset");

  var options = {
    margin:      [0, 0, 0, 0],
    filename:    nomCV + ".pdf",
    image:       { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF:       { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak:   { mode: ["avoid-all", "css"] }
  };

  var $btn = $("#export-btn");
  $btn.prop("disabled", true).html('<span class="spinner"></span> Export...');

  html2pdf().set(options).from(element).save()
    .then(function () {
      // ← Remettre le min-height après l'export
      $(element).css("min-height", "297mm");
      $btn.prop("disabled", false).html("Exporter PDF");
      Toast.show("PDF téléchargé avec succès !", "success");
    });
},
  addExperience: function () {
    BuilderView.addExperienceItem();
    BuilderController.triggerPreviewUpdate();
  },

  addEducation: function () {
    BuilderView.addEducationItem();
    BuilderController.triggerPreviewUpdate();
  },

  addLanguage: function () {
    BuilderView.addLanguageItem();
    BuilderController.triggerPreviewUpdate();
  },

  removeItem: function (btn) {
    $(btn).closest(".repeatable-item").remove();
    BuilderController.triggerPreviewUpdate();
  },

  triggerPreviewUpdate: function () {
    var data = BuilderView.collectFormData();
    BuilderView.updatePreview(data);
    BuilderController._saveToLocalStorage();
  },

  goBack: function () {
    window.location.href = "dashboard.html";
  }
};