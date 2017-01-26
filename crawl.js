require("jsdom").env("", function(err, window) {
	if (err) throw err;

	var $ = require("jquery")(window);

	$.get("http://google.com").success(function(res){console.log(data)});

})