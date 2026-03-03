
  //  firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCwH0OkU-Ztl0xn6sNt1HTZ5E7O9dstx8c",
    authDomain: "cv-pro-cherif.firebaseapp.com",
    projectId: "cv-pro-cherif",
    storageBucket: "cv-pro-cherif.firebasestorage.app",
    messagingSenderId: "668722104000",
    appId: "1:668722104000:web:b61ceb74ea9658db83cf25"
  };

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);

// References globales
const auth = firebase.auth();
const db = firebase.firestore();
