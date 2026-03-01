/* UTILITAIRE : Toast.js
   Systeme de notifications toast simple avec jQuery.
*/

var Toast = {

  /**
   * Affiche une notification toast.
   * @param {string} message
   * @param {string} type - "success" | "error" | "info"
   */
  show: function (message, type) {
    type = type || "info";

    var $container = $(".toast-container");
    if ($container.length === 0) {
      $container = $('<div class="toast-container" role="status" aria-live="polite"></div>');
      $("body").append($container);
    }

    var $toast = $('<div class="toast toast--' + type + '"></div>').text(message);
    $container.append($toast);

    // Suppression automatique apres 3 secondes
    setTimeout(function () {
      $toast.remove();
    }, 3000);
  }
};
