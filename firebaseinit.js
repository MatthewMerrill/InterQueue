// Initialize Firebase
var config = {
  apiKey: "AIzaSyA5nz5tMmf164t8mgeP0piNt5bsUkWoHM4",
  authDomain: "intervqueue.firebaseapp.com",
  databaseURL: "https://intervqueue.firebaseio.com",
  storageBucket: "intervqueue.appspot.com",
  messagingSenderId: "318022245793"
};
firebase.initializeApp(config);

var provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/plus.login');
provider.setCustomParameters({
  'login_hint': 'user@example.com'
});

$(document).ready(function () {
  $('#signInButton').click(function() {
    firebase.auth().signInWithRedirect(provider);
  });
  $('#signOutButton').click(function() {
    firebase.auth().signOut();
  });
});