/*
   VIEW : DashboardView.js
   Gere l'affichage du tableau de bord : liste des CVs,
   etat vide, actions (editer, supprimer), et modale de
   confirmation de suppression.
   Utilise jQuery pour la manipulation du DOM.
 */

var DashboardView = {

  /**
   * Affiche la liste des CVs dans la grille.
    @param {Array} cvs - Liste des CVs
   */
  renderCVList: function (cvs) {
    var $grid = $("#cv-grid");
    var $emptyState = $("#empty-state");

    if (cvs.length === 0) {
      $grid.empty();
      $emptyState.removeClass("hidden");
      return;
    }

    $emptyState.addClass("hidden");

    var html = "";
    $.each(cvs, function (i, cv) {
      var name = (cv.personalInfo && cv.personalInfo.fullName) || "Sans nom";
      var job = (cv.personalInfo && cv.personalInfo.jobTitle) || "Poste non defini";
      var skills = (cv.skills || []).slice(0, 4);
      var date = cv.updatedAt
        ? new Date(cv.updatedAt.seconds * 1000).toLocaleDateString("fr-FR", {
            day: "numeric", month: "short", year: "numeric"
          })
        : "Recemment";

      var tagsHtml = "";
      $.each(skills, function (j, s) {
        tagsHtml += '<span class="cv-card__tag">' + DashboardView.escapeHtml(s) + '</span>';
      });
      if (cv.skills && cv.skills.length > 4) {
        tagsHtml += '<span class="cv-card__tag">+' + (cv.skills.length - 4) + '</span>';
      }

      html += ''
        + '<article class="cv-card" data-id="' + cv.id + '">'
        +   '<div class="cv-card__header">'
        +     '<div>'
        +       '<h3 class="cv-card__name">' + DashboardView.escapeHtml(name) + '</h3>'
        +       '<p class="cv-card__date">Modifie le ' + date + '</p>'
        +     '</div>'
        +   '</div>'
        +   '<p class="cv-card__job">' + DashboardView.escapeHtml(job) + '</p>'
        +   '<div class="cv-card__tags">' + tagsHtml + '</div>'
        +   '<div class="cv-card__actions">'
        +     '<button class="btn btn--primary btn--sm btn-edit" data-id="' + cv.id + '">'
        +       '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>'
        +       ' Modifier'
        +     '</button>'
        +     '<button class="btn btn--outline btn--sm btn-export" data-id="' + cv.id + '">'
        +       '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>'
        +       ' PDF'
        +     '</button>'
        +     '<button class="btn btn--danger btn--sm btn-delete" data-id="' + cv.id + '" data-name="' + DashboardView.escapeHtml(name) + '">'
        +       '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>'
        +       ' Supprimer'
        +     '</button>'
        +   '</div>'
        + '</article>';
    });

    $grid.html(html);

    // Binding des boutons via delegation jQuery
    $grid.off("click", ".btn-edit").on("click", ".btn-edit", function () {
      DashboardController.editCV($(this).data("id"));
    });
    $grid.off("click", ".btn-export").on("click", ".btn-export", function () {
      DashboardController.exportCV($(this).data("id"));
    });
    $grid.off("click", ".btn-delete").on("click", ".btn-delete", function () {
      DashboardController.confirmDelete($(this).data("id"), $(this).data("name"));
    });
  },

  /**
   * Affiche une modale de confirmation de suppression.
   * @param {string} cvId
   * @param {string} cvName
   * @param {function} onConfirm
   */
  showDeleteModal: function (cvId, cvName, onConfirm) {
    // Supprimer un eventuel ancien modal
    $("#delete-modal").remove();

    var $modal = $(
      '<div id="delete-modal" class="modal-overlay">'
      + '<div class="modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">'
      +   '<h3 class="modal__title" id="modal-title">Supprimer ce CV ?</h3>'
      +   '<p class="modal__text">'
      +     'Etes-vous sur de vouloir supprimer le CV de <strong>' + DashboardView.escapeHtml(cvName) + '</strong> ? '
      +     'Cette action est irreversible.'
      +   '</p>'
      +   '<div class="modal__actions">'
      +     '<button class="btn btn--outline" id="modal-cancel">Annuler</button>'
      +     '<button class="btn btn--danger" id="modal-confirm">Supprimer</button>'
      +   '</div>'
      + '</div>'
      + '</div>'
    );

    $("body").append($modal);

    $("#modal-cancel").on("click", function () { $modal.remove(); });
    $modal.on("click", function (e) {
      if ($(e.target).is($modal)) $modal.remove();
    });
    $("#modal-confirm").on("click", function () {
      $modal.remove();
      onConfirm(cvId);
    });
  },

  /**
   * Met a jour le nom de l'utilisateur dans la navbar.
   * @param {string} name
   */
  setUserName: function (name) {
    $("#user-name").text(name);
  },

  /**
   * Echappe le HTML pour eviter les injections XSS.
   * @param {string} str
   * @returns {string}
   */
  escapeHtml: function (str) {
    if (!str) return "";
    return $("<div>").text(str).html();
  }
};
