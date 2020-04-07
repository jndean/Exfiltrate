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
  {secrets: ['3', '2'], counter: 1/6, hack: 4/6}, // Bronze die
  {secrets: ['4', '3', '3'], counter: 2/6, hack: 3/6}, // Silver die
  {secrets: ['4'], counter: 2/6, hack: 2/6}, // Gold die
  {secrets: ['!4', '!3', '!3'], counter: 2/6, hack: 3/6} // Red die
];

var agent_names = ["Lev.bot", "Mr Anderson", "Chuck Norris", "Obama", "C00k1e", "xXx_milh"];


var socket_to_name = {};
var name_to_pid = {};
var players = [];

var round = 0;
var phase = "lobby";
var secrets = {"4": 1, "3": 2, "2": 0, "!4": 0, "!3": 0};
var firewall = ["off", "change", "on"]; // Types: "on", "off", "change"
var bag = shuffle([0,0,0,0,1,1,1,1,2,2,2,3]);
var agents = [];
var choices = [];
var currentHacker = 0;
var commonText = '';

newAgent();
newAgent();



// ------------------ Communication with clients ------------------ //

io.on('connection', function(socket) {

  var pid;

  socket.on('join game', function(name) {
    console.log('Connecting:', name);
    if (name in name_to_pid && players[name_to_pid[name]].connected) {
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
        connected: true,
        state: '',
        message: null,
        secrets: [],
      };
    } else {
      pid = name_to_pid[name];
      players[pid].connected = true;
    }
    socket.emit('accept name', pid);
    broadcastState();
    socket.emit('open board');
  });


  socket.on('disconnect', function() {
    if (!(socket.id in socket_to_name)) return;
    var name = socket_to_name[socket.id];
    console.log('Disconnected:', name);
    delete socket_to_name[socket.id];
    players[pid].connected = false;
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

  socket.on(
    'chooseAction',
    (choice) => recieveActionChoice(pid, choice)
  );

  socket.on(
    'chooseSecrets',
    (choice) => recieveSecretsChoice(pid, choice)
  );

});

function broadcastState() {
  io.sockets.emit('state', {
    players: players,
    phase: phase,
    secrets: secrets,
    firewall: firewall,
    agents: agents, 
    commonText: commonText,
    currentHacker: currentHacker
  });
}


function setStateIfOnline(player, state) {
  if (player.state != 'offline') {
    player.state = state;
  }
}
function setStateOfAllOnlinePlayers(state) {
  for (var i=0; i<players.length; ++i) {
    setStateIfOnline(players[i], state);
  }
}


// ------------------ Init game, round ------------------ //

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
    startChoosingAction();
  }, 2000);
}

// ----------------- Choosing actions ---------------- //

function startChoosingAction() {
    phase = "choosingAction";
    choices = Array(players.length).fill(null);
    setStateOfAllOnlinePlayers('choosingAction');
    broadcastState();
}

function recieveActionChoice(pid, choice) {
    if (phase != 'choosingAction') return;
    choices[pid] = choice == 'y';
    players[pid].state = 'chosenAction';
    broadcastState();
    if (players.every(p => ['offline', 'chosenAction'].includes(p.state))) {
      startDisconnect();
    }
}


// ---------------------- Disconnecting (ingame) ---------------------- //

function startDisconnect() {
    phase = 'disconnect';

    // Set display states //
    var numDisconnects = 0;
    for (var i=0; i<players.length; i++) {
        if (choices[i] === true) {
          players[i].state = '';
        } else if (choices[i] === false) {
          players[i].state = 'disconnecting';
          numDisconnects += 1;
        }
    }

    if (numDisconnects == 0) {
      // Move onto hacking //
      // With delay to show everybody is connected? //
      phase = 'noDisconnects';
      broadcastState();
      setTimeout(startHacking, 2000);
    } else {
      // Wait for secret negotiation messages //
      choices = Array(players.length).fill(null);
    }

    commonText = randomInsult();
    broadcastState();
}

function recieveSecretsChoice(pid, choice) {
  if (phase != 'disconnect' || players[pid].state != 'disconnecting') return;
  choices[pid] = choice;
  players[pid].secrets = choice;
  broadcastState();

  var num = 0;
  for (var i=0; i<players.length; ++i) {
    if (players[i].state != 'disconnecting') continue;
    if (!sameChoice(choices[i], choice)) return;
    num += 1;
  }
  for (s in choice) if (choice[s] * num > secrets[s]) return;

  finaliseSecretChoices();
}

function sameChoice(a, b) {
  if (a == null || b == null) return false;
  for (s in a) if (a[s] != b[s]) return false;
  return true;
}

function finaliseSecretChoices() {
  for (var i=0; i<players.length; ++i) {
    var p = players[i];
    if(p.state == 'disconnecting') {
      p.state = 'offline';
      for (s in p.secrets) {
        secrets[s] -= p.secrets[s];
      }
    }
  }
  if (players.every(p => p.state == 'offline')) {
    finaliseRound();
  }
  startHacking();
}

// ---------------------- Hacking ---------------------- //

function startHacking() {
  phase = 'hacking';

  if (players[currentHacker].state == 'offline') {
    for (var i=0; i<players.length; ++i) {
      currentHacker += 1;
      if (players[currentHacker].state != 'offline') break;
    }
  }
  commonText = randomHackingText();

  broadcastState();
}

// -------------------------------------------------- //


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


// -------------------------------------------- //

function finaliseRound() {

  console.log('End of round');
}


function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function rng(items) {
  return items[Math.floor(Math.random() * items.length)];
}



// ----------------------- Text generation ------------------------------ //

var insultAdjective = [
    'two-bit',
    'depricated',
    'packet-dropping',
    'hackless',
    'gui-using',
    'bit-twiddling',
    'off-by-one'
];
var insultNoun = [
    'script kiddie',
    'socket hopper',
    'anti-pattern',
    'no-op',
    'code monkey',
    'core dump',
    'null pointer'
];
function randomInsult() {
  return rng(insultAdjective) + ' ' + rng(insultNoun);
}


var hackingVerb = [
    'download',
    'inject',
    'bootstrap',
    'escalate',
    'spoof',
    'whack',
    'side-load',
    'cross-compile',
];
var hackingNoun = [
    'a rootkit',
    'a key logger',
    'a packet sniffer',
    'a buffer overflow',
    'a ROP chain',
    'a zero-day',
    'a backdoor',
    'a modchip',
    'a hacked copy of MS paint',
    'a botnet',
    'the konami code',
    'more RAM',
    'spicey memes',
    'blue shellcode'
];
var hackingLocation = [
    'in the BIOS',
    'on the mainframe',
    'in system32',
    'in the blockchain',
    'in the source code',
    'through the PCIe slots',
    'through the encryption',
    'behind the firewall',
    'from stackoverflow',
    'from the dark cloud',
    'in the wifi'
];
var hackingComment = [
    'Surely they won\'t fall for that?',
    'That hasn\'t worked since the 90\'s...',
    'Classic.',
    'Their hacking skills are over 9000!',
    'Avert your eyes.',
    'Do they know that doesn\'t make any sense?',
    'It\'s an older move but it checks out.',
    'It must be a unix thing.',
    'That\'s a good trick.'
];

function randomHackingText() {
  return [rng(hackingVerb),
          rng(hackingNoun),
          rng(hackingLocation) + '.',
          rng(hackingComment),
         ].join(' ');
}
