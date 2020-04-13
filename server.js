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
    '2': 2, '3': 2, '4': 0, '!3': 0, '!4': 0}}, 
  {level: 2, pCounter: 2/6, pHack: 3/6, secrets: { // Silver die
    '2': 0, '3': 2, '4': 1, '!3': 0, '!4': 0}}, 
  {level: 3, pCounter: 2/6, pHack: 2/6, secrets: { // Gold die
    '2': 0, '3': 0, '4': 2, '!3': 0, '!4': 0}}, 
  {level: 2, pCounter: 2/6, pHack: 3/6, secrets: { // Red die
    '2': 0, '3': 0, '4': 0, '!3': 2, '!4': 1}} 
];


var rounds = [
  {
    title: '' // Fake round for lobby //
  },
  {
    title: 'Nebuchadnezzar',
    names : ['Apoc', 'Cypher', 'Dozer', 'Gh0st', 'Morph3us', 'Mouse', 'Ne0', 'Switch', 'Tank', 'Tr1n1ty', 'M. Smith']
  },
  {
    title: '',
    names: ["-", "-", "-", "Komodo", "Anon", "DonCheadle", "Jackie4Chan", "MJ", "Mr Anderson", "Shroud", "C00k1e"]
  },
  {
    title: 'Annonymous',
    names : ["-", "-", "-", "-", "-", "-", "-", "Lev.bot", "Mr Bean", "Mr.Universe", "8ball"]
  },
  {
    title: 'NSA',
    names : ["-", "-", "-", "-", "-", "Obama", "Number 1", "Agent X", "Lex Murphy", "DennisNedry", "Theo"]
  },
  {
    title: 'GCHQ',
    names : ['Michael', 'Matt', 'John', 'Xena', 'Emily', 'Nick', 'Eleanor', 'Phil', 'Jamie', 'Graham', 'Sarah', 'Hayley']
  },
  {
    title: 'Introspection',
    names : []
  },
];


var socket_to_name = {};
var name_to_pid = {};
var players = [];

var round_num = 0;
var phase = "lobby";
var secrets = emptySecrets();
var firewall = ["on", "on", "on"];
var firewallsDown = 0;
var bag = [];
var agents = [];
var choices = [];
var currentHacker = -1;
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
        secrets: emptySecrets(),
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
    nextRound();
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
    currentHacker: currentHacker,
    round: {
      number: round_num,
      title: rounds[round_num].title
    }
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

function nextRound() {
  round_num += 1;

  firewallsDown = 2;
  firewall = ["off", "off", "on"];
  for (var i=0; i<players.length; ++i) {
    players[i].state = '';
  }
  agents = [];
  secrets = emptySecrets();

  // Initialise 'bag' of enemy dice //
  bag = [];
  var round = rounds[round_num];
  shuffle(round.names);
  var types = shuffle([0,0,0,0,1,1,1,1,2,2,2,3]);
  while (types.length > 1) {
    var agent_type = types.pop();
    var template = agent_types[agent_type];
    var pHack = template.pHack + (0.05 * Math.random()) - 0.025;
    var pCounter = template.pCounter + (0.05 * Math.random()) - 0.025;
    var name = '<font color=#666666>Shad0Broker</font>';
    if (agent_type != 3) name = round.names.pop();
    bag.push({
      level: template.level,
      name: name,
      pHack: pHack,
      pCounter: pCounter,
      secrets: template.secrets,
      state: 'connecting',
      message: 'NULL'
    });
  }

  // The final enemy die goes straight to the secrets server //
  var lowestValueMap = {0: '2', 1: '3', 2: '4', 3: '!3'};
  secrets[lowestValueMap[types.pop()]] = 1;

  roundSplashScreen();
}

function roundSplashScreen() {
  phase = 'newRound';
  broadcastState();
  setTimeout(startConnectingAgents, 5000);
}



// ----------------- Draw new agents ---------------- //


function startConnectingAgents() {
  phase = 'connectingAgents';
  commonText = connectingAgentsText();
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
      finishDisconnects();
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

  setTimeout(finishDisconnects, 500);
}

function sameChoice(a, b) {
  if (a == null || b == null) return false;
  for (s in a) if (a[s] != b[s]) return false;
  return true;
}

function emptySecrets(secrets) {
  for (s in secrets) {
    if (secrets[s] != 0) return false;
  }
  return true;
}

function finishDisconnects() {
  phase = 'finishDisconnects';
  var names = [];
  var secrets_taken = null;
  for (var i=0; i<players.length; ++i) {
    var p = players[i];
    if(p.state == 'disconnecting') {
      names.push(p.name);
      secrets_taken = p.secrets;
      p.state = 'offline';
      for (s in p.secrets) {
        secrets[s] -= p.secrets[s];
      }
      if (emptySecrets(p.secrets)) p.money += 1;
    }
  }
  commonText = playersTakeSecretsText(names, secrets_taken);
  broadcastState();

  if (players.every(p => p.state == 'offline')) {
    setTimeout(finishRound, 3000);
  } else {
    setTimeout(startHacking, 3000);
  }
}

// ---------------------- Hacking ---------------------- //

function startHacking() {
  phase = 'hacking';
  for (var i = 0; i < players.length; ++i) {
    currentHacker = (currentHacker + 1) % players.length;
    if (players[currentHacker].state != 'offline') break;
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
      agent.secrets = emptySecrets();
      agent.message = agentCounterHackText(agent.name);

    } else if (roll < agent.pCounter + agent.pHack) {
      agent.state = 'hacked';
      agent.secrets = randomSecret(agent.secrets);
      agent.message = agentHackText(agent.name, agent.secrets);
    
    } else {
      agent.state = '';
      numDisconnects -= 1;
      agent.message = agentRemainText(agent.name);
    }
  }
  broadcastState();
  setTimeout(finishResults, 3000 + 1000 * numDisconnects);
}

function randomSecret(secrets) {
  var pool = [];
  for (var s in secrets) {
    for (var i=0; i<secrets[s]; ++i) {
      pool.push(s);
    }
  }
  var ret = {'4':0, '3':0, '2':0, '!4':0, '!3':0};
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
  if (bag.length == 0) {
    // TODO: handle unlikly win condition //
  } else if (firewallsDown >= 3) {
    setTimeout(finishRound, 2000);
  } else {
    setTimeout(startConnectingAgents, 2000);
  }
}


// -------------------------------------------- //

function finishRound() {
  phase = 'roundEnd';

  var stealer = null;
  var stealAmt = null;
  for (var i=0; i<players.length; ++i) {
    var p = players[i];
    for (var s = 2; s <=4; ++s) {
      p.money += s * p.secrets[String(s)];
      p.secrets[String(s)] = 0;
    }
    if (p.secrets['!3']) {
      stealer = p, stealAmt = 3;
    } else if (p.secrets['!4']) {
      stealer = p, stealAmt = 4;
    }
  }
  secrets = emptySecrets();
  commonText = roundOverText();
  broadcastState();

  if (stealer != null) {
    setTimeout(() => moneySteal(stealer, stealAmt), 4000);
  }
  else if (round_num != 6) {
    setTimeout(nextRound, 5000);
  }
  //else                    setTimeout(finishGame, 5000);
}


function moneySteal(stealer, amt) {
  phase = 'moneySteal';
  var victims = [];
  var max = -1;
  for (var i=0; i<players.length; ++i) {
    var p = players[i];
    if (p.money > max) {
      max = p.money;
      victims = [p];
    } else if (p.money == max) {
      victims.push(p);
    }
  }

  shuffle(victims);
  amt = Math.min(amt, victims.length * max);
  var split = Math.floor(amt / victims.length);
  var remainder = amt - split * victims.length;
  for (var i = 0; i < victims.length; ++i) {
    if (remainder > 0) {
      remainder -= 1;
      victims[i].money -= split + 1;
      stealer.money += split + 1;  
    } else {
      victims[i].money -= split;
      stealer.money += split;
    }
  }

  commonText = moneyStealText(
    stealer.name,
    victims.map(p => p.name),
    amt
  );
  stealer.secrets = emptySecrets();
  broadcastState();

  if (round_num != 6) {
    setTimeout(nextRound, 4000);
  } else {
    setTimeout(finishGame, 5000);
  }
}


// ------------------------- Utilities ----------------------------- //

function emptySecrets() {
  return {"4": 0, "3": 0, "2": 0, "!4": 0, "!3": 0};
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

function agentCounterHackText(name) {
  return name + ' hacked your firewall';
}

function agentHackText(name, secrets) {
  return name + ' was hacked for ' + drawSecrets(secrets);
}

function drawSecrets(secrets) {
  var out = [];
  for (s in secrets) {
    for (var i=0; i<secrets[s]; ++i) {
      out.push(s + 'K');
    }
  }
  return out.join(' ');
}

function agentRemainText(name) {
  return name + ' remains connected';
}

function playersTakeSecretsText(names, secrets) {
  if (names.length == 0) {
    return 'Nobody disconnected. In for a bit, in for a byte';
  }

  var message;
  var each = 'each ';
  if (names.length == 1) {
    message = names[0] + ' takes ';
    each = '';
  } else {
    message = names.slice(1).join(', ') + ' and ' + names[0] + ' take ';
  }
  if (emptySecrets(secrets)) {
    message += 'no secrets, just 1K ' + each + 'from the swear jar';
  } else {
    message += drawSecrets(secrets) + ' ' + each;
  }
  return message;
}

function roundOverText() {
  var message;
  if (firewallsDown > 2) {
    message = rounds[round_num].title + ' has compromised your server';
  } else {
    message = 'Everybody has disconnected';
  }
  return message + ". The round is over";
}

function connectingAgentsText() {
  if (bag.length == 12) {
    return "Enemy agents are connecting to the network";
  }
  return "More agents are connecting...";
}

function moneyStealText(theifName, victimNames, amt) {
  if (victimNames.length == 0) {
    return "Nobody has any hush money for" + theifName;
  }
  var message;
  if (victimNames.length > 1) {
    message = victimNames.slice(1).join(', ') + ' and ' + victimNames[0];
    message += ' pay ' + theifName + ' ' + amt + 'K to keep their secret';
  } else {
    message = victimNames[0] + ' pays ' + theifName + ' ' + amt + 'K to keep their secret';
  }
  return message;
}