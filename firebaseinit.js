// Initialize Firebase
var config = {
  apiKey: "AIzaSyCGGkWapbg9KdPmCe8BvljppP7tEk16E7w",
  authDomain: "interqueue-a0fc6.firebaseapp.com",
  databaseURL: "https://interqueue-a0fc6.firebaseio.com",
  storageBucket: "interqueue-a0fc6.appspot.com",
  messagingSenderId: "324399876701"
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