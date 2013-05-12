/*
super-simple-http-chat - v0.0.1 - 2013-05-12
* Copyright (c) 2013 Jacob Rudenstam; Licensed MIT
*/

var sshc = (function (document, window) {
	'use strict';
	/* == Message class =================================================== */
	var Message = function (text, client, recipiants) {
		this.type = 'message';
		this.author = client;
		this.text = text;
		this.recipiants = recipiants;
		this.timeStamp = new Date();
	};

	/* == Client class ===================================================== */
	var Client = function (email, color, imageUrl, connectionId) {
		this.id = email + ':' + connectionId;
		this.connectionId = connectionId;
		this.type = 'client';
		this.email = email;
		this.color = color ? color : this._setColor();
		this.imageUrl = imageUrl;
		this.muted = false;
	};

	Client.prototype._setColor = function () {
		var letters = 'cdef'.split(''),
			color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.round(Math.random() * 3)];
		}
		return color;
	};

	/* == Chat class ====================================================== */
	var Chat = function (connection, client) {
		this.config = {};
		this.client = client;
		this.clients = [];
		this.recipiants = [];
		this.originalTitle = document.title;
		this.unread = [];
		this.isActive = true;
	};

	Chat.prototype.urlToAnchor = function (text) {
		var htmlTagRegEx = /^<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)$/ig,
		urlRegEx = /(\b(https?|ftp|file):\/\/[A-Z0-9+&@#\/%?=~_|!:,.;]*[A-Z0-9+&@#\/%=~_|])/ig;

		// If tags is found in incomming text
		// return incomming text to prevent double replacements
		// and honor authors wishes
		if (htmlTagRegEx.test(text)) {
			return text;
		} else {
			return text.replace(urlRegEx, '<a href="$1">$1</a>');
		}
	};

	Chat.prototype.arrayIndexOf = function (a, fnc) {
		if (!fnc || typeof (fnc) !== 'function') {
			return -1;
		}

		if (!a || !a.length || a.length < 1) {
			return -1;
		}
			
		for (var i = 0; i < a.length; i++) {
			if (fnc(a[i])) {
				return i;
			}
		}

		return -1;
	};

	Chat.prototype.formattedTime = function (t) {
		var time = new Date(t);
		time.justify = {
			'hour': time.getHours(),
			'min': time.getMinutes(),
			'sec': time.getSeconds()
		};

		for (var i in time.justify) {
			if (time.justify[i].toString().length < 2) {
				time.justify[i] = '0'.concat(time.justify[i].toString());
			}
		}

		return time.justify.hour + ':' + time.justify.min + '.' + time.justify.sec;
	};

	// Print message to list
	Chat.prototype.appendMessage = function (data) {

		if (data.text) {
			data.text = this.urlToAnchor(data.text);
		}

		// Construct DOM element
		var li = document.createElement('li');
		li.innerHTML = '<div class="inner-wrapper clearfix"><span class="author"> <a href="mailto:' + data.author.email + '"> ' + data.author.email + '</a><span class="time"><i class="icon-time"></i> ' + this.formattedTime(data.timeStamp) + '</span></span><span class="message-body">' + data.text + '</span></div>';

		if (data.author.imageUrl) {
			var img = document.createElement('img');
			img.src = data.author.imageUrl;
			img.width = 40;
			img.height = 40;
			var span = li.getElementsByClassName('author')[0];
			span.insertBefore(img, span.firstChild);
		}

		// Set css to animate using css
		li.classList.add('collapsed');

		// Expand element when inserted
		li.addEventListener('DOMNodeInsertedIntoDocument', function () {
			this.classList.remove('collapsed');
			var css = {
				'background-color': data.author.color,
				'height': 'auto'
			};

			for (var i in css) {
				this.style[i] = css[i];
			}
		}, false);

		// Append to DOM
		li = this.config.messagesList.insertBefore(li, this.config.messagesList.firstChild);

		if (this.config.messagesList.children.length > 0) {
			this.config.messagesList.classList.remove('empty');
		}
	};

	// Save msg to ls
	Chat.prototype.saveMessage = function (evt, data) {
		var msgId = evt.timeStamp;
		window.localStorage.setItem(msgId, JSON.stringify(data));
	};

	// Send function (to control stringify)
	Chat.prototype.sendMessage = function (message) {

		// Try parse to JSON string
		var messageStr;
		try {
			messageStr = JSON.stringify(message);
		} catch (err) {
			window.console.log('This can\'t be stringifyed as JSON' + ' : ' + message);
			window.console.log(err);
		}

		this.config.connection.send(messageStr);
	};

	// Append client to list of clients
	Chat.prototype.appendClient = function ( data ) {
		// Construct DOM element
		var icon = data.muted ? 'icon-ban-circle' : 'icon-user',
		li = document.createElement('li');
		li.id = data.id;
		li.innerHTML = '<i class="' + icon + '"></i><span class="btn user-email" data-user-id="' + data.connectionId + '">' + data.email + '</span>';
		li.style.backgroundColor = data.color;

		// Append to DOM
		this.config.clientsList.insertBefore(li, this.config.clientsList.firstChild);

		// Add event listner
		li.addEventListener('click', this, false);
	};

	// Update title
	Chat.prototype.updateTitle = function (data) {
		if (!this.isActive) {
			this.unread.push(data);
			document.title = this.originalTitle + ' (' + this.unread.length + ')';
		}
	};

	// Remove client
	Chat.prototype.removeClient = function ( data ) {
		var li = document.getElementById(data.email);
		this.config.clientsList.removeChild(li);
	};

	// Update client
	Chat.prototype.updateClient = function ( data ) {
		// Construct DOM element
		var icon = data.muted ? 'icon-ban-circle' : 'icon-user',
		li = document.getElementById(data.id);
		li.innerHTML = '<i class="' + icon + '"></i><span class="btn user-email" data-user-id="' + data.connectionId + '">' + data.email + '</span>';
		li.style.backgroundColor = data.color;
	};

	// Submit msg
	Chat.prototype.messageToServer = function (evt) {

		// Prevent posting
		evt.preventDefault();
		var text = this.config.messagesInput.value;

		// Stop if value is none
		if (text.length < 1) {
			return;
		}

		// If there is no client set it
		if ( !this.client.email ) {
			// Construct JSON to pass to server
			this.client.email = text;
			this.sendMessage(this.client);

			// Empty input, set placeholder and return (don't broadcast)
			this.config.messagesInput.value = '';
			this.config.messagesInput.setAttribute('placeholder', 'Go ahead and type...');
			return;
		}

		// Pass message to server
		else {
			var message = new Message(text, this.client, this.recipiants);
			if ( message.recipiants.indexOf(this.client.connectionId) < 0 ) {
				message.recipiants.push(this.client.connectionId);
			}
			this.sendMessage(message);

			// Empty input
			this.config.messagesInput.value = '';
		}
	};

	Chat.prototype.messageFromServer = function ( evt ) {
		// Try parse data in case server didn't return entire object
		var data;
		try {
			data = JSON.parse(evt.data);
		} catch (err) {
			window.console.log('The data returned is not correctly formatted JSON');
			return;
		}

		// Handle data depending on type
		switch (data.type) {
			case 'message':
				if (!this.isMuted(data)) {
					this.appendMessage(data);
					this.saveMessage(evt, data);
					this.updateTitle(data);
				}
				break;

			case 'client':
				var client = new Client(data.email, data.color, data.imageUrl, data.connectionId),
				i = this.arrayIndexOf(this.clients, function (obj) {
					return obj.id === client.id;
				});

				// If me update and save me
				if ( this.client.email === client.email ) {
					this.client = client;
					window.localStorage.setItem('client', JSON.stringify(this.client));
				}

				if ( i < 0 ) {
					this.clients.push(client);
					this.appendClient(client);

					if ( this.recipiants.indexOf(data.connectionId) < 0 ) {
						this.recipiants.push(data.connectionId);
					}
				}

				break;

			case 'removeClient':
				this.removeClient(data);
				break;
		}
	};

	Chat.prototype.getClients = function () {
		var message = new Message('none', this.client);
		message.type = 'getClients';
		this.sendMessage(message);
	};

	Chat.prototype.handleEvent = function (evt) {
		switch (evt.type) {
			case 'submit':
				this.messageToServer(evt);
				break;
			case 'message':
				this.messageFromServer(evt);
				break;
			case 'focus':
				this.isActive = true;
				this.unread = [];
				document.title = this.originalTitle;
				break;
			case 'blur':
				this.isActive = false;
				break;

			case 'click':
				this.toggleMute(evt);
				break;
		}
	};

	Chat.prototype.toggleMute = function ( evt ) {
		var clientId = parseInt(evt.target.getAttribute('data-user-id'), 10),
		clientsIndex = this.getClientById(clientId, true),
		clientInArr = this.clients[clientsIndex],
		recipiantsIndex = this.recipiants.indexOf(clientId);


		if ( recipiantsIndex >= 0 ) {
			window.console.log('Mutein\': ' + clientInArr.email);
			clientInArr.muted = true;
			this.updateClient(clientInArr);
			this.recipiants.splice(recipiantsIndex, 1);
		} else {
			window.console.log('Unmutein\': ' + clientInArr.email);
			clientInArr.muted = false;
			this.updateClient(clientInArr);
			this.recipiants.push(clientId);
		}
	};

	Chat.prototype.getClientById = function ( id, returnIndexInClients ) {

		var i = this.arrayIndexOf(this.clients, function(obj) {
			return obj.connectionId === id;
		});

		if ( returnIndexInClients ) {
			return i;
		} else {
			return this.clients[i];
		}
	};

	Chat.prototype.init = function () {

		this.client = new Client();

		// Fetch stuff from localStorage
		if (window.localStorage && window.localStorage.length > 0) {

			for (var key in window.localStorage) {
				var data = window.localStorage.getItem(key);
				if (key !== 'client') {
					this.appendMessage(JSON.parse(data));
				}

				// Retreive client from ls if needed
				else if (!this.client.email) {
					this.client = JSON.parse(data);
					this.sendMessage(this.client);

					// Change placeholder text
					this.config.messagesInput.setAttribute('placeholder', 'Go ahead and type...');
				}
			}
		}

		// Add event listners pass Chat instance and it will look for handleEvent method
		this.config.messagesForm.addEventListener('submit', this, false);
		this.config.connection.addEventListener('message', this, false);

		window.addEventListener('focus', this, false);
		window.addEventListener('blur', this, false);

		// Get clients on server now
		this.getClients();
	};

	Chat.prototype.signOff = function () {
		// Only signoff if email is registerd
		if (this.client.email) {
			// Remove client from server
			this.client.type = 'removeClient';
			this.sendMessage(this.client);

			// Close connection, empty list with messages and clear localStorage
			this.config.connection.close();
			this.config.messagesList.innerHTML = '';
			this.config.messagesList.classList.add('empty');
			window.localStorage.clear();
			window.location.reload();
		}
	};

	Chat.prototype.isMuted = function ( data ) {
		var i = this.arrayIndexOf(this.clients, function(obj) {
			return obj.email === data.author.email;
		});

		return this.clients[i].muted;
	};

	// Reveal to API
	return {
		Chat: Chat,
		Client: Client
	};
})(document, window);
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