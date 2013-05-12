var urlToAnchor = (function() {
	'use strict';
	var urlToAnchor = {
		replace : function ( text ) {
			var htmlTagRegEx = /^<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)$/ig,
			urlRegEx = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

			// If tags is found in incomming text
			// return incomming text to prevent double replacements
			// and honor authors wishes
			if ( htmlTagRegEx.test(text) ) {
				return text;
			} else {
				return text.replace(urlRegEx, '<a href="$1">$1</a>');
			}
		}
	};

	return urlToAnchor;
})();