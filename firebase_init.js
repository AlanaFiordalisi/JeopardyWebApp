// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// (could go in login.html)
const firebaseConfig = {
    apiKey: "AIzaSyBrNvPRJcYcnsluTBmrZUPKVhpFS729BZk",
    authDomain: "comp426-jeopardy.firebaseapp.com",
    projectId: "comp426-jeopardy",
    storageBucket: "comp426-jeopardy.appspot.com",
    messagingSenderId: "58052781715",
    appId: "1:58052781715:web:441adc1692f0db98724f66",
    measurementId: "G-H9Q7G18BSE",
    databaseURL: "https://comp426-jeopardy-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
export const fb = firebase.initializeApp(firebaseConfig);