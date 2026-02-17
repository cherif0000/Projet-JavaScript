/* ============================================================
   MODEL : CVModel.js
   -----------------------------------------------------------
   Gere toutes les operations CRUD sur les CVs dans Firestore.
   Chaque CV est stocke dans : users/{uid}/cvs/{cvId}
   ============================================================ */

var CVModel = {

  /**
   * Cree un nouveau CV vide avec des valeurs par defaut.
   * @returns {object} Structure d'un CV vierge
   */
  createEmptyCV: function () {
    return {
      personalInfo: {
        fullName: "",
        jobTitle: "",
        email: "",
        phone: "",
        address: "",
        photo: "",
        about: ""
      },
      experiences: [],
      education: [],
      skills: [],
      languages: [],
      createdAt: null,
      updatedAt: null
    };
  },

  /**
   * Sauvegarde un CV dans Firestore (creation ou mise a jour).
   * @param {string} uid - ID utilisateur
   * @param {string|null} cvId - ID du CV (null = creation)
   * @param {object} cvData - Donnees du CV
   * @returns {Promise<string>} ID du CV sauvegarde
   */
  saveCV: function (uid, cvId, cvData) {
    var collection = db.collection("users").doc(uid).collection("cvs");
    var timestamp = firebase.firestore.FieldValue.serverTimestamp();

    if (cvId) {
      // Mise a jour
      var updateData = $.extend({}, cvData, { updatedAt: timestamp });
      return collection.doc(cvId).update(updateData).then(function () {
        return cvId;
      });
    } else {
      // Creation
      var createData = $.extend({}, cvData, {
        createdAt: timestamp,
        updatedAt: timestamp
      });
      return collection.add(createData).then(function (docRef) {
        return docRef.id;
      });
    }
  },

  /**
   * Recupere tous les CVs d'un utilisateur.
   * @param {string} uid
   * @returns {Promise<Array>} Liste des CVs avec leur ID
   */
  getAllCVs: function (uid) {
    return db.collection("users").doc(uid)
      .collection("cvs")
      .orderBy("updatedAt", "desc")
      .get()
      .then(function (snapshot) {
        var cvs = [];
        snapshot.forEach(function (doc) {
          cvs.push($.extend({ id: doc.id }, doc.data()));
        });
        return cvs;
      });
  },

  /**
   * Recupere un CV specifique par son ID.
   * @param {string} uid
   * @param {string} cvId
   * @returns {Promise<object|null>}
   */
  getCVById: function (uid, cvId) {
    return db.collection("users").doc(uid)
      .collection("cvs").doc(cvId).get()
      .then(function (doc) {
        if (doc.exists) {
          return $.extend({ id: doc.id }, doc.data());
        }
        return null;
      });
  },

  /**
   * Supprime un CV.
   * @param {string} uid
   * @param {string} cvId
   */
  deleteCV: function (uid, cvId) {
    return db.collection("users").doc(uid)
      .collection("cvs").doc(cvId).delete();
  }
};
