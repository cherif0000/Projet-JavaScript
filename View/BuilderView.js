/*
   VIEW : BuilderView.js
   Gere l'affichage du formulaire de construction de CV et
   le rendu en temps reel de la preview A4.
   Supporte 5 styles differents.
*/

var BuilderView = {

  _currentPhotoData: "",
  _currentStyle: 1,   // style actif (1 a 5)

  /**
    Definit le style actif et met a jour la classe CSS de la preview.
   * @param {number} style
   */
  setStyle: function (style) {
    BuilderView._currentStyle = style || 1;
    var $preview = $("#cv-preview-content");
    $preview.attr("class", "cv-preview cv-preview--s" + BuilderView._currentStyle);
  },

  /**
   * Remplit le formulaire avec les donnees d'un CV existant.
   */
  populateForm: function (cvData) {
    var pi = cvData.personalInfo || {};
    $("#input-fullname").val(pi.fullName || "");
    $("#input-jobtitle").val(pi.jobTitle || "");
    $("#input-email").val(pi.email || "");
    $("#input-phone").val(pi.phone || "");
    $("#input-address").val(pi.address || "");
    $("#input-about").val(pi.about || "");

    if (pi.photo) {
      BuilderView._currentPhotoData = pi.photo;
      BuilderView._showPhotoPreview(pi.photo);
    }

    $("#experiences-container").empty();
    $.each(cvData.experiences || [], function (i, exp) {
      BuilderView.addExperienceItem(exp, i);
    });

    $("#education-container").empty();
    $.each(cvData.education || [], function (i, edu) {
      BuilderView.addEducationItem(edu, i);
    });

    $("#input-skills").val((cvData.skills || []).join(", "));

    $("#languages-container").empty();
    $.each(cvData.languages || [], function (i, lang) {
      BuilderView.addLanguageItem(lang, i);
    });
  },

  /**
   * Collecte toutes les donnees du formulaire.
   */
  collectFormData: function () {
    return {
      personalInfo: {
        fullName: $.trim($("#input-fullname").val()),
        jobTitle: $.trim($("#input-jobtitle").val()),
        email:    $.trim($("#input-email").val()),
        phone:    $.trim($("#input-phone").val()),
        address:  $.trim($("#input-address").val()),
        photo:    BuilderView._currentPhotoData || "",
        about:    $.trim($("#input-about").val())
      },
      experiences: BuilderView._collectRepeatableItems("#experiences-container", ["title","company","date","description"]),
      education:   BuilderView._collectRepeatableItems("#education-container",   ["degree","school","date","description"]),
      skills:      $.trim($("#input-skills").val()).split(",").map(function(s){ return $.trim(s); }).filter(Boolean),
      languages:   BuilderView._collectRepeatableItems("#languages-container",   ["name","level"])
    };
  },

  /**
   * Met a jour la preview en temps reel selon le style actif.
   */
  updatePreview: function (cvData) {
    var $preview = $("#cv-preview-content");
    if ($preview.length === 0) return;

    // Appliquer la classe du style
    $preview.attr("class", "cv-preview cv-preview--s" + BuilderView._currentStyle);

    var html = "";
    switch (BuilderView._currentStyle) {
      case 2:  html = BuilderView._renderStyle2(cvData); break;
      case 3:  html = BuilderView._renderStyle3(cvData); break;
      case 4:  html = BuilderView._renderStyle4(cvData); break;
      case 5:  html = BuilderView._renderStyle5(cvData); break;
      default: html = BuilderView._renderStyle1(cvData); break;
    }

    $preview.html(html);
  },

  /* ============================================================
     STYLE 1 — Classique Pro (bleu professionnel)
     ============================================================ */
  _renderStyle1: function (cvData) {
    var pi = cvData.personalInfo || {};
    var initials = (pi.fullName || "?").split(" ").map(function(n){ return n[0]; }).join("").toUpperCase().slice(0,2);
    var html = "";

    // Header
    html += '<div class="s1-header">';
    if (pi.photo) {
      html += '<img class="s1-photo" src="' + pi.photo + '" alt="Photo">';
    } else {
      html += '<div class="s1-photo-placeholder">' + initials + '</div>';
    }
    html += '<div class="s1-header-info">';
    html += '  <h1 class="s1-name">' + (BuilderView._esc(pi.fullName) || "Votre Nom") + '</h1>';
    html += '  <p class="s1-job">' + (BuilderView._esc(pi.jobTitle) || "Votre Poste") + '</p>';
    html += '  <div class="s1-contact">';
    if (pi.email)   html += '<span class="s1-ci">' + BuilderView._iconMail()   + BuilderView._esc(pi.email)   + '</span>';
    if (pi.phone)   html += '<span class="s1-ci">' + BuilderView._iconPhone()  + BuilderView._esc(pi.phone)   + '</span>';
    if (pi.address) html += '<span class="s1-ci">' + BuilderView._iconPin()    + BuilderView._esc(pi.address) + '</span>';
    html += '  </div>';
    html += '</div></div>';

    // Profil
    if (pi.about) {
      html += '<div class="s1-section"><h2 class="s1-section-title">Profil</h2>';
      html += '<p class="s1-about">' + BuilderView._esc(pi.about) + '</p></div>';
    }
    // Experiences
    if (cvData.experiences && cvData.experiences.length > 0) {
      html += '<div class="s1-section"><h2 class="s1-section-title">Experience Professionnelle</h2>';
      $.each(cvData.experiences, function(i, exp) {
        html += '<div class="s1-entry">';
        html += '<div class="s1-entry-header"><span class="s1-entry-title">' + BuilderView._esc(exp.title) + '</span><span class="s1-entry-date">' + BuilderView._esc(exp.date) + '</span></div>';
        html += '<p class="s1-entry-sub">' + BuilderView._esc(exp.company) + '</p>';
        if (exp.description) html += '<p class="s1-entry-desc">' + BuilderView._esc(exp.description) + '</p>';
        html += '</div>';
      });
      html += '</div>';
    }
    // Formation
    if (cvData.education && cvData.education.length > 0) {
      html += '<div class="s1-section"><h2 class="s1-section-title">Formation</h2>';
      $.each(cvData.education, function(i, edu) {
        html += '<div class="s1-entry">';
        html += '<div class="s1-entry-header"><span class="s1-entry-title">' + BuilderView._esc(edu.degree) + '</span><span class="s1-entry-date">' + BuilderView._esc(edu.date) + '</span></div>';
        html += '<p class="s1-entry-sub">' + BuilderView._esc(edu.school) + '</p>';
        if (edu.description) html += '<p class="s1-entry-desc">' + BuilderView._esc(edu.description) + '</p>';
        html += '</div>';
      });
      html += '</div>';
    }
    // Competences
    if (cvData.skills && cvData.skills.length > 0) {
      html += '<div class="s1-section"><h2 class="s1-section-title">Competences</h2><div class="s1-skills">';
      $.each(cvData.skills, function(i, s) {
        html += '<span class="s1-skill-tag">' + BuilderView._esc(s) + '</span>';
      });
      html += '</div></div>';
    }
    // Langues
    if (cvData.languages && cvData.languages.length > 0) {
      html += '<div class="s1-section"><h2 class="s1-section-title">Langues</h2><div class="s1-langs">';
      $.each(cvData.languages, function(i, l) {
        html += '<span class="s1-lang"><strong>' + BuilderView._esc(l.name) + '</strong>';
        if (l.level) html += ' — ' + BuilderView._esc(l.level);
        html += '</span>';
      });
      html += '</div></div>';
    }
    return html;
  },

  /* ============================================================
     STYLE 2 — Sidebar Moderne (colonne sombre a gauche)
     ============================================================ */
  _renderStyle2: function (cvData) {
    var pi = cvData.personalInfo || {};
    var initials = (pi.fullName || "?").split(" ").map(function(n){ return n[0]; }).join("").toUpperCase().slice(0,2);
    var html = '<div class="s2-wrapper">';

    // Sidebar gauche
    html += '<div class="s2-sidebar">';
    if (pi.photo) {
      html += '<img class="s2-photo" src="' + pi.photo + '" alt="Photo">';
    } else {
      html += '<div class="s2-photo-placeholder">' + initials + '</div>';
    }
    html += '<h1 class="s2-name">' + (BuilderView._esc(pi.fullName) || "Votre Nom") + '</h1>';
    html += '<p class="s2-job">' + (BuilderView._esc(pi.jobTitle) || "Votre Poste") + '</p>';

    // Contact
    html += '<div class="s2-divider"></div>';
    html += '<div class="s2-sec"><h3 class="s2-sec-title">Contact</h3>';
    if (pi.email)   html += '<p class="s2-contact-item">' + BuilderView._iconMail()  + BuilderView._esc(pi.email)   + '</p>';
    if (pi.phone)   html += '<p class="s2-contact-item">' + BuilderView._iconPhone() + BuilderView._esc(pi.phone)   + '</p>';
    if (pi.address) html += '<p class="s2-contact-item">' + BuilderView._iconPin()   + BuilderView._esc(pi.address) + '</p>';
    html += '</div>';

    // Competences dans sidebar
    if (cvData.skills && cvData.skills.length > 0) {
      html += '<div class="s2-divider"></div>';
      html += '<div class="s2-sec"><h3 class="s2-sec-title">Competences</h3>';
      $.each(cvData.skills, function(i, s) {
        html += '<div class="s2-skill-label">' + BuilderView._esc(s) + '</div>';
        html += '<div class="s2-skill-bar"><div class="s2-skill-fill"></div></div>';
      });
      html += '</div>';
    }
    // Langues dans sidebar
    if (cvData.languages && cvData.languages.length > 0) {
      html += '<div class="s2-divider"></div>';
      html += '<div class="s2-sec"><h3 class="s2-sec-title">Langues</h3>';
      $.each(cvData.languages, function(i, l) {
        html += '<p class="s2-lang-item"><strong>' + BuilderView._esc(l.name) + '</strong>';
        if (l.level) html += '<br><span>' + BuilderView._esc(l.level) + '</span>';
        html += '</p>';
      });
      html += '</div>';
    }
    html += '</div>'; // /sidebar

    // Contenu principal
    html += '<div class="s2-main">';
    if (pi.about) {
      html += '<div class="s2-main-section"><h2 class="s2-main-title">Profil</h2>';
      html += '<p class="s2-about">' + BuilderView._esc(pi.about) + '</p></div>';
    }
    if (cvData.experiences && cvData.experiences.length > 0) {
      html += '<div class="s2-main-section"><h2 class="s2-main-title">Experience Professionnelle</h2>';
      $.each(cvData.experiences, function(i, exp) {
        html += '<div class="s2-entry">';
        html += '<div class="s2-entry-header"><span class="s2-entry-title">' + BuilderView._esc(exp.title) + '</span><span class="s2-entry-date">' + BuilderView._esc(exp.date) + '</span></div>';
        html += '<p class="s2-entry-sub">' + BuilderView._esc(exp.company) + '</p>';
        if (exp.description) html += '<p class="s2-entry-desc">' + BuilderView._esc(exp.description) + '</p>';
        html += '</div>';
      });
      html += '</div>';
    }
    if (cvData.education && cvData.education.length > 0) {
      html += '<div class="s2-main-section"><h2 class="s2-main-title">Formation</h2>';
      $.each(cvData.education, function(i, edu) {
        html += '<div class="s2-entry">';
        html += '<div class="s2-entry-header"><span class="s2-entry-title">' + BuilderView._esc(edu.degree) + '</span><span class="s2-entry-date">' + BuilderView._esc(edu.date) + '</span></div>';
        html += '<p class="s2-entry-sub">' + BuilderView._esc(edu.school) + '</p>';
        if (edu.description) html += '<p class="s2-entry-desc">' + BuilderView._esc(edu.description) + '</p>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>'; // /main
    html += '</div>'; // /wrapper
    return html;
  },

  /* ============================================================
     STYLE 3 — Minimaliste (noir et blanc, epure)
     ============================================================ */
  _renderStyle3: function (cvData) {
    var pi = cvData.personalInfo || {};
    var initials = (pi.fullName || "?").split(" ").map(function(n){ return n[0]; }).join("").toUpperCase().slice(0,2);
    var html = "";

    // Header minimaliste avec photo
    html += '<div class="s3-header">';
    html += '<div class="s3-header-inner">';

    // Photo ou initiales
    if (pi.photo) {
      html += '<img class="s3-photo" src="' + pi.photo + '" alt="Photo">';
    } else {
      html += '<div class="s3-photo-placeholder">' + initials + '</div>';
    }

    // Texte
    html += '<div class="s3-header-text">';
    html += '<h1 class="s3-name">' + (BuilderView._esc(pi.fullName) || "Votre Nom") + '</h1>';
    html += '<p class="s3-job">' + (BuilderView._esc(pi.jobTitle) || "") + '</p>';
    html += '<div class="s3-contact">';
    if (pi.email)   html += '<span>' + BuilderView._esc(pi.email)   + '</span>';
    if (pi.phone)   html += '<span>' + BuilderView._esc(pi.phone)   + '</span>';
    if (pi.address) html += '<span>' + BuilderView._esc(pi.address) + '</span>';
    html += '</div>';
    html += '</div>'; // /s3-header-text

    html += '</div>'; // /s3-header-inner
    html += '<hr class="s3-hr">';
    html += '</div>';

    // Sections
    if (pi.about) {
      html += '<div class="s3-section"><h2 class="s3-section-title">PROFIL</h2>';
      html += '<p class="s3-text">' + BuilderView._esc(pi.about) + '</p></div>';
    }
    if (cvData.experiences && cvData.experiences.length > 0) {
      html += '<div class="s3-section"><h2 class="s3-section-title">EXPERIENCE</h2>';
      $.each(cvData.experiences, function(i, exp) {
        html += '<div class="s3-entry">';
        html += '<div class="s3-entry-header"><span class="s3-entry-title">' + BuilderView._esc(exp.title) + '</span><span class="s3-entry-date">' + BuilderView._esc(exp.date) + '</span></div>';
        if (exp.company) html += '<p class="s3-entry-sub">' + BuilderView._esc(exp.company) + '</p>';
        if (exp.description) html += '<p class="s3-text">' + BuilderView._esc(exp.description) + '</p>';
        html += '</div>';
      });
      html += '</div>';
    }
    if (cvData.education && cvData.education.length > 0) {
      html += '<div class="s3-section"><h2 class="s3-section-title">FORMATION</h2>';
      $.each(cvData.education, function(i, edu) {
        html += '<div class="s3-entry">';
        html += '<div class="s3-entry-header"><span class="s3-entry-title">' + BuilderView._esc(edu.degree) + '</span><span class="s3-entry-date">' + BuilderView._esc(edu.date) + '</span></div>';
        if (edu.school) html += '<p class="s3-entry-sub">' + BuilderView._esc(edu.school) + '</p>';
        if (edu.description) html += '<p class="s3-text">' + BuilderView._esc(edu.description) + '</p>';
        html += '</div>';
      });
      html += '</div>';
    }
    if (cvData.skills && cvData.skills.length > 0) {
      html += '<div class="s3-section"><h2 class="s3-section-title">COMPETENCES</h2>';
      html += '<p class="s3-skills-inline">' + $.map(cvData.skills, function(s){ return BuilderView._esc(s); }).join(" &nbsp;·&nbsp; ") + '</p>';
      html += '</div>';
    }
    if (cvData.languages && cvData.languages.length > 0) {
      html += '<div class="s3-section"><h2 class="s3-section-title">LANGUES</h2><div class="s3-langs">';
      $.each(cvData.languages, function(i, l) {
        html += '<span class="s3-lang"><strong>' + BuilderView._esc(l.name) + '</strong>';
        if (l.level) html += ' (' + BuilderView._esc(l.level) + ')';
        html += '</span>';
      });
      html += '</div></div>';
    }
    return html;
  },

  /* ============================================================
     STYLE 4 — Creatif Timeline (gradient bleu ocean, timeline)
     ============================================================ */
  _renderStyle4: function (cvData) {
    var pi = cvData.personalInfo || {};
    var initials = (pi.fullName || "?").split(" ").map(function(n){ return n[0]; }).join("").toUpperCase().slice(0,2);
    var tagColors = ["s4-tag-blue","s4-tag-green","s4-tag-orange","s4-tag-purple","s4-tag-teal"];
    var html = "";

    // Header gradient
    html += '<div class="s4-header">';
    if (pi.photo) {
      html += '<img class="s4-photo" src="' + pi.photo + '" alt="Photo">';
    } else {
      html += '<div class="s4-photo-placeholder">' + initials + '</div>';
    }
    html += '<div class="s4-header-text">';
    html += '<h1 class="s4-name">' + (BuilderView._esc(pi.fullName) || "Votre Nom") + '</h1>';
    html += '<p class="s4-job">' + (BuilderView._esc(pi.jobTitle) || "Votre Poste") + '</p>';
    html += '</div></div>';

    // Barre de contact
    html += '<div class="s4-contact-bar">';
    if (pi.email)   html += '<span class="s4-ci">' + BuilderView._iconMail()  + BuilderView._esc(pi.email)   + '</span>';
    if (pi.phone)   html += '<span class="s4-ci">' + BuilderView._iconPhone() + BuilderView._esc(pi.phone)   + '</span>';
    if (pi.address) html += '<span class="s4-ci">' + BuilderView._iconPin()   + BuilderView._esc(pi.address) + '</span>';
    html += '</div>';

    // Corps 2 colonnes
    html += '<div class="s4-body">';

    // Colonne gauche
    html += '<div class="s4-left">';
    if (pi.about) {
      html += '<div class="s4-section"><h2 class="s4-section-title">Profil</h2>';
      html += '<p class="s4-about">' + BuilderView._esc(pi.about) + '</p></div>';
    }
    if (cvData.skills && cvData.skills.length > 0) {
      html += '<div class="s4-section"><h2 class="s4-section-title">Competences</h2><div class="s4-tags">';
      $.each(cvData.skills, function(i, s) {
        html += '<span class="s4-tag ' + tagColors[i % tagColors.length] + '">' + BuilderView._esc(s) + '</span>';
      });
      html += '</div></div>';
    }
    if (cvData.languages && cvData.languages.length > 0) {
      html += '<div class="s4-section"><h2 class="s4-section-title">Langues</h2>';
      $.each(cvData.languages, function(i, l) {
        html += '<p class="s4-lang"><strong>' + BuilderView._esc(l.name) + '</strong>';
        if (l.level) html += ' — ' + BuilderView._esc(l.level);
        html += '</p>';
      });
      html += '</div>';
    }
    html += '</div>'; // /left

    // Colonne droite (timeline)
    html += '<div class="s4-right">';
    if (cvData.experiences && cvData.experiences.length > 0) {
      html += '<div class="s4-section"><h2 class="s4-section-title">Experience Professionnelle</h2>';
      html += '<div class="s4-timeline">';
      $.each(cvData.experiences, function(i, exp) {
        html += '<div class="s4-tl-item">';
        html += '<div class="s4-tl-dot"></div>';
        html += '<div class="s4-tl-content">';
        html += '<div class="s4-tl-header"><span class="s4-tl-title">' + BuilderView._esc(exp.title) + '</span><span class="s4-tl-date">' + BuilderView._esc(exp.date) + '</span></div>';
        html += '<p class="s4-tl-sub">' + BuilderView._esc(exp.company) + '</p>';
        if (exp.description) html += '<p class="s4-tl-desc">' + BuilderView._esc(exp.description) + '</p>';
        html += '</div></div>';
      });
      html += '</div></div>';
    }
    if (cvData.education && cvData.education.length > 0) {
      html += '<div class="s4-section"><h2 class="s4-section-title">Formation</h2>';
      html += '<div class="s4-timeline">';
      $.each(cvData.education, function(i, edu) {
        html += '<div class="s4-tl-item">';
        html += '<div class="s4-tl-dot"></div>';
        html += '<div class="s4-tl-content">';
        html += '<div class="s4-tl-header"><span class="s4-tl-title">' + BuilderView._esc(edu.degree) + '</span><span class="s4-tl-date">' + BuilderView._esc(edu.date) + '</span></div>';
        html += '<p class="s4-tl-sub">' + BuilderView._esc(edu.school) + '</p>';
        if (edu.description) html += '<p class="s4-tl-desc">' + BuilderView._esc(edu.description) + '</p>';
        html += '</div></div>';
      });
      html += '</div></div>';
    }
    html += '</div>'; // /right
    html += '</div>'; // /body
    return html;
  },

  /* ============================================================
     STYLE 5 — Elegant Prestige (nuit + or, 2 colonnes)
     ============================================================ */
  _renderStyle5: function (cvData) {
    var pi = cvData.personalInfo || {};
    var html = "";

    // Header nuit
    html += '<div class="s5-header">';
    if (pi.photo) {
      html += '<img class="s5-photo" src="' + pi.photo + '" alt="Photo">';
    }
    html += '<div class="s5-header-text">';
    html += '<h1 class="s5-name">' + (BuilderView._esc(pi.fullName) || "VOTRE NOM").toUpperCase() + '</h1>';
    html += '<p class="s5-job">' + (BuilderView._esc(pi.jobTitle) || "") + '</p>';
    html += '<div class="s5-contact">';
    if (pi.email)   html += '<span class="s5-ci">' + BuilderView._esc(pi.email)   + '</span>';
    if (pi.phone)   html += '<span class="s5-ci">' + BuilderView._esc(pi.phone)   + '</span>';
    if (pi.address) html += '<span class="s5-ci">' + BuilderView._esc(pi.address) + '</span>';
    html += '</div>';
    html += '</div></div>';
    html += '<div class="s5-gold-line"></div>';

    // Corps 2 colonnes
    html += '<div class="s5-body">';

    // Colonne gauche
    html += '<div class="s5-left">';
    if (cvData.skills && cvData.skills.length > 0) {
      html += '<div class="s5-section"><h2 class="s5-section-title">Competences</h2><div class="s5-skills">';
      $.each(cvData.skills, function(i, s) {
        html += '<span class="s5-skill-tag">' + BuilderView._esc(s) + '</span>';
      });
      html += '</div></div>';
    }
    if (cvData.languages && cvData.languages.length > 0) {
      html += '<div class="s5-section"><h2 class="s5-section-title">Langues</h2>';
      $.each(cvData.languages, function(i, l) {
        html += '<div class="s5-lang">';
        html += '<span class="s5-lang-name">' + BuilderView._esc(l.name) + '</span>';
        if (l.level) html += '<span class="s5-lang-level">' + BuilderView._esc(l.level) + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>'; // /left

    // Colonne droite
    html += '<div class="s5-right">';
    if (pi.about) {
      html += '<div class="s5-section"><h2 class="s5-section-title">Profil</h2>';
      html += '<p class="s5-about">' + BuilderView._esc(pi.about) + '</p></div>';
    }
    if (cvData.experiences && cvData.experiences.length > 0) {
      html += '<div class="s5-section"><h2 class="s5-section-title">Experience Professionnelle</h2>';
      $.each(cvData.experiences, function(i, exp) {
        html += '<div class="s5-entry">';
        html += '<div class="s5-entry-header"><span class="s5-entry-title">' + BuilderView._esc(exp.title) + '</span><span class="s5-entry-date">' + BuilderView._esc(exp.date) + '</span></div>';
        html += '<p class="s5-entry-sub">' + BuilderView._esc(exp.company) + '</p>';
        if (exp.description) html += '<p class="s5-entry-desc">' + BuilderView._esc(exp.description) + '</p>';
        html += '</div>';
      });
      html += '</div>';
    }
    if (cvData.education && cvData.education.length > 0) {
      html += '<div class="s5-section"><h2 class="s5-section-title">Formation</h2>';
      $.each(cvData.education, function(i, edu) {
        html += '<div class="s5-entry">';
        html += '<div class="s5-entry-header"><span class="s5-entry-title">' + BuilderView._esc(edu.degree) + '</span><span class="s5-entry-date">' + BuilderView._esc(edu.date) + '</span></div>';
        html += '<p class="s5-entry-sub">' + BuilderView._esc(edu.school) + '</p>';
        if (edu.description) html += '<p class="s5-entry-desc">' + BuilderView._esc(edu.description) + '</p>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>'; // /right
    html += '</div>'; // /body
    return html;
  },

  /* ============================================================
     SVG ICONES HELPERS
     ============================================================ */
  _iconMail: function () {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:3px"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
  },
  _iconPhone: function () {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:3px"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  },
  _iconPin: function () {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:3px"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  },

  /* ============================================================
     REPEATABLE ITEMS
     ============================================================ */
  addExperienceItem: function (data, index) {
    var $container = $("#experiences-container");
    if ($container.length === 0) return;
    var idx = (index !== undefined) ? index : $container.children().length;
    var $item = $(
      '<div class="repeatable-item" data-index="' + idx + '">'
      + '<button type="button" class="repeatable-item__remove btn-remove-item" aria-label="Supprimer">'
      +   '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>'
      + '</button>'
      + '<div class="form-row">'
      +   '<div class="form-group"><label>Poste</label><input type="text" class="form-input" data-field="title" value="' + BuilderView._esc((data && data.title) || "") + '" placeholder="Developpeur Web"></div>'
      +   '<div class="form-group"><label>Entreprise</label><input type="text" class="form-input" data-field="company" value="' + BuilderView._esc((data && data.company) || "") + '" placeholder="Nom de l\'entreprise"></div>'
      + '</div>'
      + '<div class="form-row">'
      +   '<div class="form-group"><label>Periode</label><input type="text" class="form-input" data-field="date" value="' + BuilderView._esc((data && data.date) || "") + '" placeholder="Jan 2022 - Present"></div>'
      +   '<div class="form-group"><label>Description</label><textarea class="form-input" data-field="description" placeholder="Decrivez vos responsabilites...">' + BuilderView._esc((data && data.description) || "") + '</textarea></div>'
      + '</div>'
      + '</div>'
    );
    $container.append($item);
  },

  addEducationItem: function (data, index) {
    var $container = $("#education-container");
    if ($container.length === 0) return;
    var idx = (index !== undefined) ? index : $container.children().length;
    var $item = $(
      '<div class="repeatable-item" data-index="' + idx + '">'
      + '<button type="button" class="repeatable-item__remove btn-remove-item" aria-label="Supprimer">'
      +   '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>'
      + '</button>'
      + '<div class="form-row">'
      +   '<div class="form-group"><label>Diplome</label><input type="text" class="form-input" data-field="degree" value="' + BuilderView._esc((data && data.degree) || "") + '" placeholder="Licence Informatique"></div>'
      +   '<div class="form-group"><label>Etablissement</label><input type="text" class="form-input" data-field="school" value="' + BuilderView._esc((data && data.school) || "") + '" placeholder="Nom de l\'universite"></div>'
      + '</div>'
      + '<div class="form-row">'
      +   '<div class="form-group"><label>Periode</label><input type="text" class="form-input" data-field="date" value="' + BuilderView._esc((data && data.date) || "") + '" placeholder="2019 - 2022"></div>'
      +   '<div class="form-group"><label>Description</label><textarea class="form-input" data-field="description" placeholder="Details sur la formation...">' + BuilderView._esc((data && data.description) || "") + '</textarea></div>'
      + '</div>'
      + '</div>'
    );
    $container.append($item);
  },

  addLanguageItem: function (data, index) {
    var $container = $("#languages-container");
    if ($container.length === 0) return;
    var idx = (index !== undefined) ? index : $container.children().length;
    var $item = $(
      '<div class="repeatable-item" data-index="' + idx + '">'
      + '<button type="button" class="repeatable-item__remove btn-remove-item" aria-label="Supprimer">'
      +   '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>'
      + '</button>'
      + '<div class="form-row">'
      +   '<div class="form-group"><label>Langue</label><input type="text" class="form-input" data-field="name" value="' + BuilderView._esc((data && data.name) || "") + '" placeholder="Francais"></div>'
      +   '<div class="form-group"><label>Niveau</label><input type="text" class="form-input" data-field="level" value="' + BuilderView._esc((data && data.level) || "") + '" placeholder="Courant, B2, Natif..."></div>'
      + '</div>'
      + '</div>'
    );
    $container.append($item);
  },

  /* ============================================================
     HELPERS INTERNES
     ============================================================ */
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

  handlePhotoUpload: function (file) {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      Toast.show("Format non supporte. Utilisez JPG, PNG ou WebP.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Toast.show("La photo ne doit pas depasser 5 Mo.", "error");
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        var MAX = 200;
        var w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        var compressed = canvas.toDataURL("image/jpeg", 0.7);
        BuilderView._currentPhotoData = compressed;
        BuilderView._showPhotoPreview(compressed);
        BuilderView.updatePreview(BuilderView.collectFormData());
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  _showPhotoPreview: function (src) {
    var $preview = $("#photo-preview");
    if ($preview.length === 0) return;
    $preview.html('<img src="' + src + '" alt="Photo de profil">');
    $("#photo-upload-zone").addClass("has-photo");
    $("#btn-remove-photo").removeClass("hidden");
    $(".photo-upload__text").text("Photo importee avec succes");
  },

  removePhoto: function () {
    BuilderView._currentPhotoData = "";
    $("#photo-preview").html('<span class="photo-upload__placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></span>');
    $("#photo-upload-zone").removeClass("has-photo");
    $("#btn-remove-photo").addClass("hidden");
    $(".photo-upload__text").text("Cliquez ou deposez votre photo ici");
    $("#input-photo").val("");
    BuilderView.updatePreview(BuilderView.collectFormData());
  }
};