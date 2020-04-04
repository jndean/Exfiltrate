// Dependencies.
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);
var port = 1701;

app.set('port', port);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/design', function(request, response) {
  response.sendFile(path.join(__dirname, 'design.html'));
});
server.listen(port, function() {
  console.log('Starting server on port', port);
});


// Game setup //
var agent_types = [
  {secrets: ['G', 'S'], counter: 1/6, hack: 4/6}, // Bronze die
  {secrets: ['D', 'G', 'G'], counter: 2/6, hack: 3/6}, // Silver die
  {secrets: ['D'], counter: 2/6, hack: 2/6}, // Gold die
  {secrets: ['D', 'G', 'G'], counter: 2/6, hack: 3/6} // Red die
];

var agent_names = ["Lev.bot", "Mr Anderson", "Chuck Norris", "Obama", "C00k1e", "xXx_milh"];


var socket_to_name = {};
var name_to_pid = {};
var players = [];

var round = 0;
var phase = "lobby";
var secrets = []; // Types: 'D', 'G', 'S', '!D', '!G', '!S'
var firewall = ["off", "change", "on"]; // Types: "on", "off", "change"
var bag = shuffle([0,0,0,0,1,1,1,1,2,2,2,3]);
var agents = [];

newAgent();
newAgent();



// ------------------ Communication with clients ------------------ //

io.on('connection', function(socket) {

  var pid;

  socket.on('join game', function(name) {
    console.log('Connecting:', name);
    if (name in name_to_pid && players[name_to_pid[name]].online) {
      socket.emit('reject name', 'That user is already connected');
      return;
    } else if (phase != 'lobby' && !(name in name_to_pid)) {
      socket.emit('reject name', 'The hacking has already started');
      return;
    }
    socket_to_name[socket.id] = name;
    if (!(name in name_to_pid)){
      pid = players.length;
      name_to_pid[name] = pid;
      players[pid] = {
        name: name,
        money: 0,
        online: true,
        state: '',
        secrets: [],
      };
    } else {
      pid = name_to_pid[name];
      players[pid].online = true;
    }
    broadcastState();
    socket.emit('accept name');
  });


  socket.on('disconnect', function() {
    if (!(socket.id in socket_to_name)) return;
    var name = socket_to_name[socket.id];
    console.log('Disconnected:', name);
    delete socket_to_name[socket.id];
    players[pid].online = false;
    broadcastState();
  });


  socket.on('start', function(action) {
    if (action != "now" || phase != "lobby") return;
    var num_players = Object.keys(players).length;
    if (num_players < 0  || num_players > 6) {
      console.log('Incorrect number of players:', num_players);
      return;
    }
    startGame();
  });

});

function broadcastState() {
  io.sockets.emit('state', {
    players: players,
    phase: phase,
    secrets: secrets,
    firewall: firewall,
    agents: agents
  });
}



// ------------------ Game logic ------------------ //

function startGame() {
  for (var i=0; i<players.length; i++) {
    players[i].points = 0;
  }
  bag = shuffle([0,0,0,0,1,1,1,1,2,2,2,3]);
  firewall = ['on', 'on', 'on'];

  console.log("Starting", players);
  startRound(0);
}


function startRound(round_num) {
  round = round_num;
  newAgent();
  newAgent();
  broadcastState();
  setTimeout(function() {
    for (var i=0; i<agents.length; i++) agents[i].state = "";
    startChoosing();
  }, 2000);
}


function startChoosing() {
    phase = "choosing";
    for (var i=0; i<players.length; i++) players[i].state = 'choosing';
    broadcastState();
}


function newAgent() {
  if (bag.length == 0) {
    console.log("Drawing from empty bag");
    return;
  }
  var template = agent_types[bag.pop()];
  var hack = template.hack + (0.06 * Math.random()) - 0.03;
  var counter = template.counter + (0.06 * Math.random()) - 0.03;
  agent_names = shuffle(agent_names);
  var agent = {
    name: agent_names.pop(),
    hack: hack,
    counter: counter,
    secrets: template.secrets,
    state: 'connecting'
  };
  agents.push(agent);
}


function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}