/* 
   VIEW : BuilderView.js
   Gere l'affichage du formulaire de construction de CV et
   le rendu en temps reel de la preview A4.
   Utilise jQuery pour la manipulation du DOM.
 */

var BuilderView = {

  /**
    Remplit le formulaire avec les donnees d'un CV existant.
    @param {object} cvData
   */
  populateForm: function (cvData) {
    var pi = cvData.personalInfo || {};
    $("#input-fullname").val(pi.fullName || "");
    $("#input-jobtitle").val(pi.jobTitle || "");
    $("#input-email").val(pi.email || "");
    $("#input-phone").val(pi.phone || "");
    $("#input-address").val(pi.address || "");
    $("#input-about").val(pi.about || "");

    // Photo
    if (pi.photo) {
      BuilderView._currentPhotoData = pi.photo;
      BuilderView._showPhotoPreview(pi.photo);
    }

    // Experiences
    $("#experiences-container").empty();
    $.each(cvData.experiences || [], function (i, exp) {
      BuilderView.addExperienceItem(exp, i);
    });

    // Education
    $("#education-container").empty();
    $.each(cvData.education || [], function (i, edu) {
      BuilderView.addEducationItem(edu, i);
    });

    // Competences
    $("#input-skills").val((cvData.skills || []).join(", "));

    // Langues
    $("#languages-container").empty();
    $.each(cvData.languages || [], function (i, lang) {
      BuilderView.addLanguageItem(lang, i);
    });
  },

  /**
   * Collecte toutes les donnees du formulaire.
   * @returns {object} cvData
   */
  /** Stocke la photo en base64 */
  _currentPhotoData: "",

  collectFormData: function () {
    var data = {
      personalInfo: {
        fullName: $.trim($("#input-fullname").val()),
        jobTitle: $.trim($("#input-jobtitle").val()),
        email: $.trim($("#input-email").val()),
        phone: $.trim($("#input-phone").val()),
        address: $.trim($("#input-address").val()),
        photo: BuilderView._currentPhotoData || "",
        about: $.trim($("#input-about").val())
      },
      experiences: BuilderView._collectRepeatableItems("#experiences-container", ["title", "company", "date", "description"]),
      education: BuilderView._collectRepeatableItems("#education-container", ["degree", "school", "date", "description"]),
      skills: $.trim($("#input-skills").val()).split(",").map(function (s) { return $.trim(s); }).filter(Boolean),
      languages: BuilderView._collectRepeatableItems("#languages-container", ["name", "level"])
    };
    return data;
  },

  /**
   * Met a jour la preview en temps reel.
   * @param {object} cvData
   */
  updatePreview: function (cvData) {
    var $preview = $("#cv-preview-content");
    if ($preview.length === 0) return;

    var pi = cvData.personalInfo || {};
    var initials = (pi.fullName || "?").split(" ").map(function (n) { return n[0]; }).join("").toUpperCase().slice(0, 2);

    var html = '';

    // ---- HEADER ----
    html += '<div class="cv-preview__header">';
    if (pi.photo) {
      html += '  <img class="cv-preview__photo" src="' + pi.photo + '" alt="Photo de ' + BuilderView._esc(pi.fullName || 'profil') + '">';
    } else {
      html += '  <div class="cv-preview__photo--placeholder">' + initials + '</div>';
    }
    html += '  <div>';
    html += '    <h1 class="cv-preview__name">' + (BuilderView._esc(pi.fullName) || "Votre Nom") + '</h1>';
    html += '    <p class="cv-preview__job">' + (BuilderView._esc(pi.jobTitle) || "Votre Poste") + '</p>';
    html += '    <div class="cv-preview__contact">';
    if (pi.email) {
      html += '      <span class="cv-preview__contact-item">';
      html += '        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
      html += '        ' + BuilderView._esc(pi.email);
      html += '      </span>';
    }
    if (pi.phone) {
      html += '      <span class="cv-preview__contact-item">';
      html += '        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
      html += '        ' + BuilderView._esc(pi.phone);
      html += '      </span>';
    }
    if (pi.address) {
      html += '      <span class="cv-preview__contact-item">';
      html += '        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
      html += '        ' + BuilderView._esc(pi.address);
      html += '      </span>';
    }
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    // ---- PROFIL ----
    if (pi.about) {
      html += '<div class="cv-section">';
      html += '  <h2 class="cv-section__title">Profil</h2>';
      html += '  <p class="cv-about">' + BuilderView._esc(pi.about) + '</p>';
      html += '</div>';
    }

    // ---- EXPERIENCES ----
    if (cvData.experiences && cvData.experiences.length > 0) {
      html += '<div class="cv-section">';
      html += '  <h2 class="cv-section__title">Experience Professionnelle</h2>';
      $.each(cvData.experiences, function (i, exp) {
        html += '<div class="cv-entry">';
        html += '  <div class="cv-entry__header">';
        html += '    <span class="cv-entry__title">' + BuilderView._esc(exp.title) + '</span>';
        html += '    <span class="cv-entry__date">' + BuilderView._esc(exp.date) + '</span>';
        html += '  </div>';
        html += '  <p class="cv-entry__subtitle">' + BuilderView._esc(exp.company) + '</p>';
        if (exp.description) {
          html += '  <p class="cv-entry__desc">' + BuilderView._esc(exp.description) + '</p>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    // ---- FORMATION ----
    if (cvData.education && cvData.education.length > 0) {
      html += '<div class="cv-section">';
      html += '  <h2 class="cv-section__title">Formation</h2>';
      $.each(cvData.education, function (i, edu) {
        html += '<div class="cv-entry">';
        html += '  <div class="cv-entry__header">';
        html += '    <span class="cv-entry__title">' + BuilderView._esc(edu.degree) + '</span>';
        html += '    <span class="cv-entry__date">' + BuilderView._esc(edu.date) + '</span>';
        html += '  </div>';
        html += '  <p class="cv-entry__subtitle">' + BuilderView._esc(edu.school) + '</p>';
        if (edu.description) {
          html += '  <p class="cv-entry__desc">' + BuilderView._esc(edu.description) + '</p>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    // ---- COMPETENCES ----
    if (cvData.skills && cvData.skills.length > 0) {
      html += '<div class="cv-section">';
      html += '  <h2 class="cv-section__title">Competences</h2>';
      html += '  <div class="cv-skills">';
      $.each(cvData.skills, function (i, s) {
        html += '<span class="cv-skill-tag">' + BuilderView._esc(s) + '</span>';
      });
      html += '  </div>';
      html += '</div>';
    }

    // ---- LANGUES ----
    if (cvData.languages && cvData.languages.length > 0) {
      html += '<div class="cv-section">';
      html += '  <h2 class="cv-section__title">Langues</h2>';
      html += '  <div class="cv-languages">';
      $.each(cvData.languages, function (i, l) {
        html += '<span class="cv-lang">';
        html += '  <span class="cv-lang__name">' + BuilderView._esc(l.name) + '</span>';
        if (l.level) {
          html += ' - <span class="cv-lang__level">' + BuilderView._esc(l.level) + '</span>';
        }
        html += '</span>';
      });
      html += '  </div>';
      html += '</div>';
    }

    $preview.html(html);
  },

  /* ----- REPEATABLE ITEMS : EXPERIENCES ----- */

  addExperienceItem: function (data, index) {
    var $container = $("#experiences-container");
    if ($container.length === 0) return;
    var idx = (index !== undefined) ? index : $container.children().length;

    var $item = $(
      '<div class="repeatable-item" data-index="' + idx + '">'
      + '<button type="button" class="repeatable-item__remove btn-remove-item" aria-label="Supprimer cette experience">'
      +   '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>'
      + '</button>'
      + '<div class="form-row">'
      +   '<div class="form-group">'
      +     '<label>Poste</label>'
      +     '<input type="text" class="form-input" data-field="title" value="' + BuilderView._esc((data && data.title) || "") + '" placeholder="Developpeur Web">'
      +   '</div>'
      +   '<div class="form-group">'
      +     '<label>Entreprise</label>'
      +     '<input type="text" class="form-input" data-field="company" value="' + BuilderView._esc((data && data.company) || "") + '" placeholder="Nom de l\'entreprise">'
      +   '</div>'
      + '</div>'
      + '<div class="form-row">'
      +   '<div class="form-group">'
      +     '<label>Periode</label>'
      +     '<input type="text" class="form-input" data-field="date" value="' + BuilderView._esc((data && data.date) || "") + '" placeholder="Jan 2022 - Present">'
      +   '</div>'
      +   '<div class="form-group">'
      +     '<label>Description</label>'
      +     '<textarea class="form-input" data-field="description" placeholder="Decrivez vos responsabilites...">' + BuilderView._esc((data && data.description) || "") + '</textarea>'
      +   '</div>'
      + '</div>'
      + '</div>'
    );

    $container.append($item);
  },

  /* ----- REPEATABLE ITEMS : EDUCATION ----- */

  addEducationItem: function (data, index) {
    var $container = $("#education-container");
    if ($container.length === 0) return;
    var idx = (index !== undefined) ? index : $container.children().length;

    var $item = $(
      '<div class="repeatable-item" data-index="' + idx + '">'
      + '<button type="button" class="repeatable-item__remove btn-remove-item" aria-label="Supprimer cette formation">'
      +   '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>'
      + '</button>'
      + '<div class="form-row">'
      +   '<div class="form-group">'
      +     '<label>Diplome</label>'
      +     '<input type="text" class="form-input" data-field="degree" value="' + BuilderView._esc((data && data.degree) || "") + '" placeholder="Licence Informatique">'
      +   '</div>'
      +   '<div class="form-group">'
      +     '<label>Etablissement</label>'
      +     '<input type="text" class="form-input" data-field="school" value="' + BuilderView._esc((data && data.school) || "") + '" placeholder="Nom de l\'universite">'
      +   '</div>'
      + '</div>'
      + '<div class="form-row">'
      +   '<div class="form-group">'
      +     '<label>Periode</label>'
      +     '<input type="text" class="form-input" data-field="date" value="' + BuilderView._esc((data && data.date) || "") + '" placeholder="2019 - 2022">'
      +   '</div>'
      +   '<div class="form-group">'
      +     '<label>Description</label>'
      +     '<textarea class="form-input" data-field="description" placeholder="Details sur la formation...">' + BuilderView._esc((data && data.description) || "") + '</textarea>'
      +   '</div>'
      + '</div>'
      + '</div>'
    );

    $container.append($item);
  },

  /* ----- REPEATABLE ITEMS : LANGUAGES ----- */

  addLanguageItem: function (data, index) {
    var $container = $("#languages-container");
    if ($container.length === 0) return;
    var idx = (index !== undefined) ? index : $container.children().length;

    var $item = $(
      '<div class="repeatable-item" data-index="' + idx + '">'
      + '<button type="button" class="repeatable-item__remove btn-remove-item" aria-label="Supprimer cette langue">'
      +   '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>'
      + '</button>'
      + '<div class="form-row">'
      +   '<div class="form-group">'
      +     '<label>Langue</label>'
      +     '<input type="text" class="form-input" data-field="name" value="' + BuilderView._esc((data && data.name) || "") + '" placeholder="Francais">'
      +   '</div>'
      +   '<div class="form-group">'
      +     '<label>Niveau</label>'
      +     '<input type="text" class="form-input" data-field="level" value="' + BuilderView._esc((data && data.level) || "") + '" placeholder="Courant, B2, Natif...">'
      +   '</div>'
      + '</div>'
      + '</div>'
    );

    $container.append($item);
  },

  /* ----- HELPERS INTERNES ----- */

  _collectRepeatableItems: function (containerSelector, fields) {
    var items = [];
    $(containerSelector).find(".repeatable-item").each(function () {
      var $item = $(this);
      var data = {};
      $.each(fields, function (i, field) {
        var $input = $item.find('[data-field="' + field + '"]');
        data[field] = $input.length ? $.trim($input.val()) : "";
      });
      items.push(data);
    });
    return items;
  },

  _esc: function (str) {
    if (!str) return "";
    return $("<div>").text(str).html();
  },

  /**
   * Gere l'upload de photo depuis un input file.
   * Lit le fichier, le compresse via canvas pour rester sous la limite
   * Firestore, et met a jour le preview.
   * @param {File} file
   */
  handlePhotoUpload: function (file) {
    if (!file) return;

    // Validation type
    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      Toast.show("Format non supporte. Utilisez JPG, PNG ou WebP.", "error");
      return;
    }

    // Validation taille (5 Mo max pour le fichier original)
    if (file.size > 5 * 1024 * 1024) {
      Toast.show("La photo ne doit pas depasser 5 Mo.", "error");
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        // Redimensionner pour garder une taille raisonnable (max 200x200)
        var MAX = 200;
        var w = img.width;
        var h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }

        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        // Compresser en JPEG qualite 0.7 (~15-40 Ko)
        var compressed = canvas.toDataURL("image/jpeg", 0.7);

        BuilderView._currentPhotoData = compressed;
        BuilderView._showPhotoPreview(compressed);

        // Mettre a jour la preview du CV
        var data = BuilderView.collectFormData();
        BuilderView.updatePreview(data);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  /**
   * Affiche la photo dans le cercle de preview du formulaire.
   * @param {string} src - URL ou base64 de l'image
   */
  _showPhotoPreview: function (src) {
    var $preview = $("#photo-preview");
    if ($preview.length === 0) return;

    $preview.html('<img src="' + src + '" alt="Photo de profil">');
    $("#photo-upload-zone").addClass("has-photo");
    $("#btn-remove-photo").removeClass("hidden");
    $(".photo-upload__text").text("Photo importee avec succes");
  },

  /**
   * Supprime la photo.
   */
  removePhoto: function () {
    BuilderView._currentPhotoData = "";
    var $preview = $("#photo-preview");
    $preview.html('<span class="photo-upload__placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></span>');
    $("#photo-upload-zone").removeClass("has-photo");
    $("#btn-remove-photo").addClass("hidden");
    $(".photo-upload__text").text("Cliquez ou deposez votre photo ici");
    $("#input-photo").val("");

    // Mettre a jour la preview du CV
    var data = BuilderView.collectFormData();
    BuilderView.updatePreview(data);
  }
};
