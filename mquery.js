/**
 * Created by merrillm on 12/17/16.
 */
var $m = function() {
  console.log('ayylmao');
}

$m.query = function(arg0, arg1) {
  var queryObj = {};
  var queryString = window.location.search;

  //console.log(queryString.substr(queryString.indexOf('?')+1).split("&"));
  queryString = queryString.substr(queryString.indexOf('?')+1);

  if (queryString.length) {
    queryString.split("&").forEach(function (elem) {
      var spl = elem.split("=");

      try {
        spl[1] = JSON.parse(spl[1]);
      } catch (err) {
      }

      queryObj[spl[0]] = spl[1];
    });
  }

  if (arguments.length === 0) {
    return queryObj;
  } else if (arguments.length === 1) {
    return queryObj[arg0];
  } else if (arguments.length===2) {
    queryObj[arg0] = arg1;
    queryString = '?' + Object.keys(queryObj).map(function(key) {
        console.log(key, queryObj[key]);
      var valueStr = (typeof queryObj[key] === 'string') ? queryObj[key] : JSON.stringify(queryObj[key]);
      return key+'='+valueStr;
    }).join("&");

    if (history.pushState) {
      var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + queryString;
      window.history.pushState({path:newurl},'',newurl);
    } else {
      window.location.search = queryString;
    }

  } else {
    throw new Error('Bad argument count');
  }
};

$m.spoiler = function(id, show) {
  if (arguments.length === 0) throw new Error('Bad argument count');
  if (show) {
    $('#'+id).removeClass('hidden');
    if ($m.spoiler.q[id])
      $m.query($m.spoiler.q[id], true);
  } else if (show === false){
    $('#'+id).addClass('hidden');
    if ($m.spoiler.q[id])
      $m.query($m.spoiler.q[id], false);
  } else {
    $('#'+id).toggleClass('hidden');
    if ($m.spoiler.q[id])
      $m.query($m.spoiler.q[id], !$m.query($m.spoiler.q[id]));
  }
};
$m.spoiler.q = {};
$m.spoilerFromQuery = function(id, queryParam) {
    if (!$m.query(queryParam||id))
        $('#'+id).addClass('hidden');
    $m.spoiler.q[id] = queryParam||id;
};

$(document).ready(function registerSpoilers(){
  $('[mm-spoiler]').each(function(i, e){
    console.log(e);
    $(e).click(function(){
      console.log($(e).attr('mm-spoiler'));
      $m.spoiler($(e).attr('mm-spoiler'));
    });
    if ($(e).attr('mm-spoilerquery'))
      $m.spoilerFromQuery($(e).attr('mm-spoiler'), $(e).attr('mm-spoilerquery'));
    else
      $m.spoiler($(e).attr('mm-spoiler'), false);
  });
});