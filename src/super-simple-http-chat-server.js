var gravatar = require('gravatar'),
	WebSocketServer = require('websocket').server,
	http = require('http'),
	listenOn = 1337;

var server = http.createServer(function (req, res) {
	// process HTTP request. Since we're writing just WebSockets server
	// we don't have to implement anything.
});
server.listen(listenOn, function () {
	console.log((new Date()) + " Server is listening on port " + listenOn);
});

// Global vars
var clients = [],
	connections = [],
	broadcast = function (connection, message, recipiants) {
		if (recipiants && typeof (recipiants) === 'number') {
			for (var i = 0; i < recipiants.length; i++) {
				connections[recipiants[i]].send(JSON.stringify(message));
			}
		} else {
			for (var i = 0; i < connections.length; i++) {
				connections[i].send(JSON.stringify(message));
			}
		}
	},
	arrayIndexOf = function (a, fnc) {
		if (!fnc || typeof (fnc) != 'function') {
			return -1;
		}

		if (!a || !a.length || a.length < 1) {
			return -1;
		}

		for (var i = 0; i < a.length; i++) {
			if (fnc(a[i])) return i;
		}

		return -1;
	},
	updateClients = function (connection, message) {

		// Check if client exist
		var i = arrayIndexOf(clients, function (obj) {
			return obj.email === message.email;
		});

		// If client does not exist already assign connectionId push to array and set 'i' to position of this client
		if (i === -1) {
			// Generate imageUrl
			message.imageUrl = gravatar.url(message.email, {
				s: '200'
			});

			// Push to clients and set connectionId
			clients.push(message);
			i = clients.indexOf(message);
			message.connectionId = connections.indexOf(connection);
		}

		// Return client from clients array
		broadcast(connection, clients[i]);
	},
	removeClient = function (connection, message) {
		var i = arrayIndexOf(clients, function (obj) {
			return obj.email === message.email;
		});

		clients.splice(i, 1);
		broadcast(connection, message);
	};

// Create server and pass in what HTTP server to use
var chatServer = new WebSocketServer({
	httpServer: server
});

// WebSocket server
chatServer.on('request', function (request) {
	// Log every new connection
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

	// Store all connections in array
	var connection = request.accept(null, request.origin);
	connections.push(connection);

	// Handle incomming messages
	connection.on('message', function (message) {
		if (message.type === 'utf8') {
			try {
				message = JSON.parse(message.utf8Data);
			} catch (err) {
				message = message.utf8Data;
				console.log('Not correctly formatted JSON string. Falling back to string.');
			}

			switch (message.type) {
				case 'message':
					// Update time to server time
					message.timeStamp = new Date();
					broadcast(connection, message, message.recipiants);
					break;

				case 'client':
					updateClients(connection, message);
					break;

				case 'removeClient':
					removeClient(connection, message);
					break;

				case 'getClients':
					for (var i = 0; i < clients.length; i++) {
						connection.send(JSON.stringify(clients[i]));
					}
					break;
			}
		}
	});

	connection.on('close', function () {
	});
});