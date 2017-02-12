var queueId = $m.query('q');
var admins = undefined;

if (queueId) {
  $('#queueJoin').addClass('hidden');
  $('#requestPush').removeClass('hidden');
  $('#queue').removeClass('hidden');

  var queueRef = firebase.database().ref('queues/' + queueId);
  var dataRef = firebase.database().ref('queues/' + queueId + '/data');
  var adminRef = firebase.database().ref('queues/' + queueId + '/admins');
  var inQueue = false;
  var isAdmin = false;

  queueRef.child('name').on('value', function (data) {
    if (data.val() == null) {
      $m.query('q', '');
      window.location.reload()
    }

    var header = $('#header');
    console.log(data.val());
    if (data.val() && data.val().trim().length) {
      header.find('h1').text('InterQueue:');
      header.find('h2').text(data.val());
    } else {
      header.find('h1').text('InterQueue');
      header.find('h2').text('');
    }
  });

  dataRef.once('value').then(function (queueSnapshot) {
    var cache = {};
    dataRef.on('child_changed', function (data) {
      var cached = cache[data.key];
      if (cached.name != data.val().name || cached.timestamp != data.val().timestamp) {
        $('#qi_' + data.key).attr('timestamp', data.val().timestamp);
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

    dataRef.orderByChild('timestamp').on('child_added', function (data) {
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

    dataRef.on('child_removed', function (data) {
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

  adminRef.on('value', function (data) {
    console.log(data.val());
    admins = data.val();
    if (firebase.auth().currentUser && data.val()[firebase.auth().currentUser.uid]) {
      setAdmin(true);
    } else {
      setAdmin(false);
    }
  });

  function setAdmin(admin) {
    if (admin) {
      isAdmin = true;

      $('#queue').find('li').each(function (index, value) {
        if ((!firebase.auth().currentUser) || $(value).id.substring(3) != firebase.auth().currentUser.uid)
          $(value).append($('<button>X</button>'));
        $('button', $(value)).click(function () {
          dataRef.child(data.key).remove();
        });
      });
    } else {
      isAdmin = false;

      $('#queue').find('li').each(function (index, value) {
        if ((!firebase.auth().currentUser) || $(value).id.substring(3) != firebase.auth().currentUser.uid)
          $('button', $(value)).remove();
      })
    }
  }

  function ownThisItem(data) {
    return firebase.auth().currentUser && (data.key == firebase.auth().currentUser.uid);
  }

  function lastBefore(timestamp) {
    var ret = undefined;
    var li = $('#queue').find('li');

    $.each(li, function (index, value) {
      if ($(value).attr('timestamp') < timestamp)
        ret = $(value);
    });

    console.log(ret);

    return ret;
  }

  function isSorted() {
    var lastValue = undefined;
    var ret = true;

    $('#queue').find('li').each(function (index, value) {
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
      '<li id="qi_' + data.key + '" timestamp="' + data.val().timestamp + '">' +
      '<span>' + data.val().name + '</span>' +
      ((isAdmin || ownThisItem(data)) ? '<button>X</button>' : '') +
      '</li>');
    $('button', newLi).click(function () {
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
    setTimeout(function () {
      if (callback) {
        callback(data);
      }
    }, 1000);
  }

  function removeElem(data, callback) {
    $('#qi_' + data.key).addClass('deleting');
    setTimeout(function () {
      $('#qi_' + data.key).remove();
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
      }).then(function (data) {
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
  goToState(SIGNED_OUT);
} else {

  function joinRoom(code) {
    var queueCode = code || $('#joinInput').val();
    console.log('trying to join', queueCode);
    firebase.database().ref('queues/'+queueCode+'/name').once('value', function (data) {
      if (data.val() == null) {
        $('#joinFeedback').text('Invalid queue code.');
      } else {
        $m.query('q', queueCode);
        window.location.reload();
      }
    });
  }

  $('#joinRoomButton').click(joinRoom);
  $('#joinInput').keyup(function(ev) {
    if (ev.keyCode == 13) joinRoom();
  });

  if ($m.query('iknowwhatiamdoing') == true) {
    $('#queueCreateForm').submit(function (e) {
      e.preventDefault();
      e.returnValue = false;

      if (!firebase.auth().currentUser) {
        $m.query('iknowwhatiamdoing', null);
        window.location.reload();
      }

      var code = $('#createCode').val();
      var name = $('#createName').val();

      if (code && code.length && name && name.length && name.length < 32) {
        var authval = {};
        authval[firebase.auth().currentUser.uid] = 1;
        firebase.database().ref('queues/' + code + '/admins')
          .set(authval)
          .then(function() {
            firebase.database().ref('queues/' + code + '/name')
              .set(name)
              .then(function() {
                joinRoom(code);
              });
          });
      }
    });

    $('#queueCreate').removeClass('hidden');
  }
}


firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    $('#signInButton').addClass('hidden');
    $('#signOutButton').removeClass('hidden');
    $('#signInUserName').text(user.displayName).removeClass('hidden');
    // $('#requestPush').removeClass('hidden');

    if (user.photoURL)
      $('#signInUserPhoto').attr('src', user.photoURL).removeClass('hidden');

    if (queueId) goToState(inQueue ? IN_QUEUE : NOT_IN_QUEUE);
  } else {
    $('#signInButton').removeClass('hidden');
    $('#signOutButton').addClass('hidden');
    $('#signInUserName').text('').addClass('hidden');
    $('#signInUserPhoto').attr('src', '').addClass('hidden');
    $('#queue li buttosn').remove();

    if (queueId) goToState(SIGNED_OUT);
  }
});