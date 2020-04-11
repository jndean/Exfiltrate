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
  {level: 1, pCounter: 1/6, pHack: 4/6, secrets: { // Bronze die
    '2': 1, '3': 1, '4': 0, '!3': 0, '!4': 0}}, 
  {level: 2, pCounter: 2/6, pHack: 3/6, secrets: { // Silver die
    '2': 0, '3': 2, '4': 1, '!3': 0, '!4': 0}}, 
  {level: 3, pCounter: 2/6, pHack: 2/6, secrets: { // Gold die
    '2': 0, '3': 0, '4': 1, '!3': 0, '!4': 0}}, 
  {level: 2, pCounter: 2/6, pHack: 3/6, secrets: { // Red die
    '2': 0, '3': 0, '4': 0, '!3': 2, '!4': 1}} 
];


var rounds = [
  {names: ["Lev.bot", "Mr Anderson", "ChuckNorris", "Obama", "C00k1e", "J0s3f", "Kat.bot", "Mr Bean", "Ne0", "Jackie4Chan", "MJ"],
  title: 'r/hacking',
  tagline: ''}
];


var socket_to_name = {};
var name_to_pid = {};
var players = [];

var round_num = 0;
var phase = "lobby";
var secrets = {"4": 0, "3": 0, "2": 0, "!4": 0, "!3": 0};
var firewall = ["on", "on", "on"];
var firewallsDown = 0;
var bag = [];
var agents = [];
var choices = [];
var currentHacker = 0;
var commonText = '';



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
    if (players.length < 0  || players.length > 6) {
      console.log('Incorrect number of players:', num_players);
      return;
    }
    startGame();
  });

  socket.on(
    'chooseAction',
    (choice) => receiveActionChoice(pid, choice)
  );
  socket.on(
    'chooseSecrets',
    (choice) => receiveSecretsChoice(pid, choice)
  );
  socket.on(
    'finishHacking',
    () => receiveFinishHacking(pid)
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
    players[i].money = 0;
  }
  startRound();
}


function startRound() {

  bag = [];
  var round = rounds[round_num];
  shuffle(round.names);
  var types = shuffle([0,0,0,0,1,1,1,1,2,2,2,3]);
  while (types.length > 0) {
    var agent_type = types.pop();
    var template = agent_types[agent_type];
    var pHack = template.pHack + (0.06 * Math.random()) - 0.03;
    var pCounter = template.pCounter + (0.06 * Math.random()) - 0.03;
    var name = '<font color=#666666>Shad0Broker</font>';
    if (agent_type != 3) name = round.names.pop();
    bag.push({
      level: template.level,
      name: name,
      pHack: pHack,
      pCounter: pCounter,
      secrets: template.secrets,
      state: 'connecting'
    });
  }

  firewallsDown = 0;
  firewall = ["on", "on", "on"];

  startConnectingAgents();
}

// ----------------- Draw new agents ---------------- //


function startConnectingAgents() {
  phase = 'connectingAgents';
  setTimeout(() => connectNewAgents(2), 1000)
  broadcastState();
}

function connectNewAgents(num) {
  if (bag.length == 0) return;
  var agent = bag.pop();
  agents.push(agent);
  broadcastState();
  if (num > 1) {
    setTimeout(() => connectNewAgents(num-1), 1000);
  } else {
    setTimeout(startChoosingAction, 3000);
  }
}

// ----------------- Choosing actions ---------------- //

function startChoosingAction() {
    phase = "choosingAction";
    for (var i=0; i<agents.length; ++i) {
      agents[i].state = '';
    }
    choices = Array(players.length).fill(null);
    setStateOfAllOnlinePlayers('choosingAction');
    broadcastState();
}

function receiveActionChoice(pid, choice) {
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
      // Move onto hacking with delay to show everybody is connected? //
      phase = 'noDisconnects';
      broadcastState();
      setTimeout(startHacking, 2000);
    } else {
      // Wait for secret negotiation messages //
      phase = 'disconnect';
      choices = Array(players.length).fill(null);
      commonText = randomInsult();
      broadcastState();
    }
}

function receiveSecretsChoice(pid, choice) {
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
  } else {
    startHacking();
  }
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

function receiveFinishHacking(pid) {
  if (phase != 'hacking' || currentHacker != pid) return;
  phase = 'results';
  var numDisconnects = agents.length;
  for (var i=0; i<agents.length; ++i) {
    var agent = agents[i];

    // Roll the die! //
    var roll = Math.random();

    if (roll < agent.pCounter) {
      agent.state = 'counter';
      if (firewallsDown < 3) firewall[firewallsDown] = "change";
      firewallsDown += 1;
      agent.secrets = [];

    } else if (roll < agent.pCounter + agent.pHack) {
      agent.state = 'hacked';
      agent.secrets = randomSecret(agent.secrets);
    
    } else {
      agent.state = '';
      numDisconnects -= 1;
    }
  }
  broadcastState();
  setTimeout(finishResults, 3500 + 1000 * numDisconnects);
}

function randomSecret(secrets) {
  var pool = [];
  for (var s in secrets) {
    for (var i=0; i<secrets[s]; ++i) {
      pool.push(s);
    }
  }
  var ret = {'4':0, '3':0, '2':0, '!4':0, '3!':0};
  ret[pool[Math.floor(pool.length * Math.random())]] = 1;
  return ret;
}

function finishResults() {
  for (var i=0; i<agents.length; ++i) {
    var agent = agents[i];
    if (agent.state == 'counter') {
      for (var j=0; j<3; ++j) {
        if (firewall[j] == 'change') {
          firewall[j] = 'off';
          break;
        }
      }
    } else if (agent.state == 'hacked') {
      for (s in agent.secrets) {
        secrets[s] += agent.secrets[s];
      }
    }
  }
  agents = agents.filter(a => a.state == '');
  broadcastState();
  finishTurn();
}


// -------------------------------------------------- //

function finishTurn() {
  phase = 'finishTurn';
  if (bag.length == 0) {
    // TODO: handle unlikly win condition //
  }
  setTimeout(startConnectingAgents, 2000);
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
    'into the source code',
    'through the PCIe slots',
    'through the encryption',
    'behind the firewall',
    'from stackoverflow',
    'from the dark cloud',
    'into the wifi'
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

function agentJoinText(names) {
  var message;
  if (names.length == 1) {
    message =  names[0] + ' has joined the fight';
  } else {
    message = names.join(' and ') + ' have joined the fight';
  }
  if (bag.length == 0) {
    message += '\n> There are no opponents left on the network'
  }
  return message;
}