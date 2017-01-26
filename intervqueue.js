var queueId = 'test_queue';
var queueRef = firebase.database().ref('queues/'+queueId);
var dataRef = firebase.database().ref('queues/'+queueId+'/data');
var inQueue = false;

queueRef.child('name').on('value', function(data) {
  var header = $('#header');
  if (data.val() && data.val().trim().length) {
    header.find('h1').text('IntervQueue:');
    header.find('h2').text(data.val());
  } else {
    header.find('h1').text('IntervQueue');
    header.find('h2').text('');
  }
});

dataRef.once('value').then(function(queueSnapshot) {
  var cache = {};
  dataRef.on('child_changed', function(data) {
    var cached = cache[data.key];
    if (cached.name != data.val().name || cached.timestamp != data.val().timestamp) {
      $('#qi_'+data.key).attr('timestamp', data.val().timestamp);
      if (cached.name != data.val().name || !isSorted()) {
        removeElem(data, addElem);
        console.log(isSorted());
      }
    }
    cache[data.key] = {
      name: data.val().name,
      timestamp: data.val().timestamp
    };
  });

  dataRef.orderByChild('timestamp').on('child_added', function(data) {
    cache[data.key] = {
      name: data.val().name,
      timestamp: data.val().timestamp
    };

    addElem(data);

    if (ownThisItem(data)) {
      inQueue = true;

      if (firebase.auth().currentUser)
        goToState(IN_QUEUE)
    }
  });

  dataRef.on('child_removed', function(data) {
    removeElem(data);
    cache[data.key] = undefined;

    data.ref.off('child_changed');

    if (ownThisItem(data)) {
      inQueue = false;

      if (firebase.auth().currentUser)
        goToState(NOT_IN_QUEUE)
    }
  });
});

function ownThisItem(data) {
  return firebase.auth().currentUser && (data.key == firebase.auth().currentUser.uid);
}
function lastBefore(timestamp) {
  var ret = undefined;
  var li = $('#queue').find('li');

  $.each(li, function(index, value) {
    if ( $(value).attr('timestamp') < timestamp )
      ret = $(value);
  });

  console.log(ret);

  return ret;
}
function isSorted() {
  var lastValue = undefined;
  var ret = true;

  $('#queue').find('li').each(function(index, value) {
    if (lastValue && $(value).attr('timestamp') < lastValue) {
      console.log($(value).attr('timestamp'), lastValue)
      ret = false;
    }
    lastValue = $(value).attr('timestamp');
  });

  return ret;
}
function insert(data) {
  var last = lastBefore(data.val().timestamp);

  var newLi = $(
    '<li id="qi_'+data.key+'" timestamp="'+data.val().timestamp+'">' +
      '<span>'+data.val().name+'</span>' +
      ((ownThisItem(data)) ? '<button>X</button>':'') +
    '</li>');
  $('button', newLi).click(function() {
    dataRef.child(data.key).remove();
  });

  // console.log(last);

  if (last)
    last.after(newLi);
  else
    $('#queue').prepend(newLi);
}

function addElem(data, callback) {
  insert(data);
  setTimeout(function() {
    if (callback) {
      callback(data);
    }
  }, 1000);
}
function removeElem(data, callback) {
  $('#qi_'+data.key).addClass('deleting');
  setTimeout(function() {
    $('#qi_'+data.key).remove();
    if (callback) {
      callback(data);
    }
  }, 1000);
}

function joinQueue() {
  if (firebase.auth().currentUser) {
    dataRef.child(firebase.auth().currentUser.uid).set({
      name: firebase.auth().currentUser.displayName,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(function(data) {
      console.log(data);
      // data.remove();
    });
  }
}
$('#requestPushButton').click(joinQueue);

var SIGNED_OUT = 0;
var NOT_IN_QUEUE = 1;
var IN_QUEUE = 2;

function goToState(state) {
  if (state == SIGNED_OUT) {
    $('#welcomeText').text("Use the button above to sign in to a Google account.");
    $('#requestPushButton').prop('disabled', true);
  } else if (state == NOT_IN_QUEUE) {
    $('#welcomeText').text("Below is the waiting list. If you are not here when you are called, you will be dropped from the queue.");
    $('#requestPushButton').prop('disabled', false);
  } else {
    $('#welcomeText').text("You are in the queue! Click the 'X' to remove yourself from the queue.");
    $('#requestPushButton').prop('disabled', true);
  }
}

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    $('#signInButton').addClass('hidden');
    $('#signOutButton').removeClass('hidden');
    $('#signInUserName').text(user.displayName).removeClass('hidden');
    $('#requestPush').removeClass('hidden');

    if (user.photoURL)
      $('#signInUserPhoto').attr('src', user.photoURL).removeClass('hidden');

    goToState(inQueue ? IN_QUEUE : NOT_IN_QUEUE);
  } else {
    $('#signInButton').removeClass('hidden');
    $('#signOutButton').addClass('hidden');
    $('#signInUserName').text('').addClass('hidden');
    $('#signInUserPhoto').attr('src', '').addClass('hidden');
    $('#queue li button').remove();

    goToState(SIGNED_OUT);
  }
});
goToState(SIGNED_OUT);