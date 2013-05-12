require.config({
	paths: {
		'super-simple-http-chat': '/scripts/lib/amd/super-simple-http-chat'
	}
});

/* == Main functionality =============================================== */
require(['super-simple-http-chat'], function ( sshc ) {
	'use strict';
	// WebSocket connection
	var host = window.location.hostname,
	connection = new WebSocket('ws://' + host + ':1337'),
	chat;

	// Do all when connections is made
	connection.onopen = function(){
		// Create chat
		chat = new sshc.Chat();

		// Config chat for this implementation
		chat.config = {
			messagesForm : document.getElementById('chat-form'), // Form with messages dialog
			messagesInput : document.getElementById('chat-input'), // [optional] The input field containing the message
			messagesList : document.getElementById('chat-list'), // Needs to be an <ul> or <ol>
			clientsList : document.getElementById('clients-list'), // Needs to be an <ul> or <ol>
			connection : this // The WebSocket connection to use
		};

		// Initiate chat
		chat.init();
	};

	// Leave chat
	document.getElementById('leave-chat').addEventListener('click', function(){
		var el = this,
		callback = function(el) {
			el.innerHTML = 'You left...';
		};

		chat.signOff(callback(el));
	}, false);
});