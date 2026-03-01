/*
   CONTROLLER : DashboardController.js
   Gere la logique du tableau de bord : chargement des CVs,
   suppression, navigation vers l'editeur et export PDF.
*/

var DashboardController = {

  currentUser: null,

  /**
   * Initialise le dashboard.
   * Verifie l'authentification puis charge les CVs.
   */
  init: function () {
    AuthController.requireAuth(function (user) {
      DashboardController.currentUser = user;
      DashboardView.setUserName(user.displayName || "Utilisateur");
      DashboardController.loadCVs();

      // Binding du bouton de deconnexion
      $(document).on("click", "#btn-logout", function () {
        AuthController.logout();
      });

      // Binding du bouton nouveau CV
      $(document).on("click", "#btn-new-cv", function () {
        DashboardController.createNewCV();
      });
    });
  },

  /**
   * Charge et affiche la liste des CVs.
   */
  loadCVs: function () {
    CVModel.getAllCVs(DashboardController.currentUser.uid)
      .then(function (cvs) {
        DashboardView.renderCVList(cvs);
      })
      .catch(function (error) {
        Toast.show("Erreur lors du chargement des CVs.", "error");
        console.error("Erreur loadCVs:", error);
      });
  },

  /**
   * Redirige vers le builder pour creer un nouveau CV.
   */
  createNewCV: function () {
    window.location.href = "builder.html";
  },

  /**
   * Redirige vers le builder pour editer un CV existant.
   * @param {string} cvId
   */
  editCV: function (cvId) {
    window.location.href = "builder.html?id=" + cvId;
  },

  /**
   * Affiche la modale de confirmation de suppression.
   * @param {string} cvId
   * @param {string} cvName
   */
  confirmDelete: function (cvId, cvName) {
    DashboardView.showDeleteModal(cvId, cvName, function (id) {
      CVModel.deleteCV(DashboardController.currentUser.uid, id)
        .then(function () {
          Toast.show("CV supprime avec succes.", "success");
          DashboardController.loadCVs();
        })
        .catch(function (error) {
          Toast.show("Erreur lors de la suppression.", "error");
          console.error("Erreur deleteCV:", error);
        });
    });
  },

  /**
   * Exporte un CV en PDF.
   * @param {string} cvId
   */
  exportCV: function (cvId) {
    window.location.href = "builder.html?id=" + cvId + "&export=true";
  }
};
