
  
var board = document.getElementById("board");
var topology = document.getElementById("topology");
var roundTitle = document.getElementById("roundTitle");


function drawBoard() {
  var players = state.players;
  var N = players.length;
  var phase = state.phase;
  var agents = state.agents;

  var rows = [];

  var round = state.round;
  if (round.number == 0) {
    roundTitle.innerHTML = 'LOBBY';
  } else {
    roundTitle.innerHTML = 'ROUND ' + round.number + ': ';
    roundTitle.innerHTML += round.title + ' (' + state.remainingAgents + ')';
  }
  rows.push('\n')
  rows = rows.concat(drawAgents());

  // Firewall //
  rows.push('|<b>');
  for (var i=0; i<3; i++) {
    var status = state.firewall[i];
    var colour = 'aqua', sym = '+';
    if (status == "off" || (status == "change" && offBlink)) {
      colour = 'red', sym = 'x';
    }
    rows.push('<font color=\"' + colour + "\">[" + sym + ']</font>');
  }
  rows.push('</b>|');


  // Server //
  var secrets = drawSecrets(state.secrets);
  var width = secrets.length + 2
  if (secrets.length == 0) {
	  secrets = '<font color=\"grey\">EMPTY</font>';
  	width = 7;
  }
  if (state.firewall[2] == 'off' && (offBlink || phase == 'roundEnd')) {
    rows.push('<font color=\"#ee2211\">+' + '='.repeat(width) + '+');
    rows.push('| ' + secrets + ' |');
    rows.push('+' + '='.repeat(width) + '+</font>');
  } else {
    rows.push('+' + '='.repeat(width) + '+');
    rows.push('| ' + secrets + ' |');
    rows.push('+' + '='.repeat(width) + '+');
  }


  // Pipes //
  rows.push('|');
  var bar = Array(N).fill('+').join('-----------------');
  var mid = Math.floor(bar.length / 2);
  rows.push(bar.slice(0, mid) + '+' + bar.slice(mid+1));

  rows = rows.concat(drawPlayers());

  topology.innerHTML = rows.join('\n');	
}

function drawAgents() {
  	var agents = state.agents;
    var width = 21;
    var agent_rows = [[], [], [], []];
    var pipes = [];
    var connectors = [];
    for (var i=0; i<agents.length; i++) {
        var agent = agents[i];

        if (agent.state == 'counter') {
          if (offBlink) {
            agent_rows[0].push(red('+-------------------+'));
            agent_rows[1].push(red('| ' + padText(agent.name + ' ;)', width-4) + ' |'));
            agent_rows[2].push(red('|  [x] HACKED YOU   |'));
            agent_rows[3].push(red('+---------X---------+'));
            pipes.push(' ');
            connectors.push('-');
          } else {
            agent_rows[0].push(red('+-------------------+'));
            agent_rows[1].push(red('| ' + padText(agent.name + ' :)', width-4) + ' |'));
            agent_rows[2].push(red('|  [+] Hacked you   |'));
            agent_rows[3].push(red('+---------') + '+' + red('---------+'));
            pipes.push('|');
            connectors.push('+');
          }
          continue;
        }
        if (agent.state == 'hacked') {
          if(offBlink) {
            agent_rows[0].push('+-------------------+');
            agent_rows[1].push('| ' + padText(agent.name + ' :O', width-4) + ' |');
            var ln = '|  GOT HACKED <b><font color=\"#FFD700\">';
            ln += padText('['+drawSecrets(agent.secrets)+']', 5) + '</font></b> |';
            agent_rows[2].push(ln);
            agent_rows[3].push('+---------' + red('X') + '---------+');
            pipes.push(' ');
            connectors.push('-');
          } else {
            agent_rows[0].push('+-------------------+');
            agent_rows[1].push('| ' + padText(agent.name + ' :(', width-4) + ' |');
            agent_rows[2].push('|  Got Hacked  ' + padText(drawSecrets(agent.secrets), 3) + '  |');
            agent_rows[3].push('+---------+---------+');
            pipes.push('|');
            connectors.push('+');
          }
          continue;
        }
        var title = '+======[LVL.' + agent.level +']======+';
        agent_rows[0].push(title);
   
        var ln = '| ' + padText(agent.name, 11);
        var prob = Math.floor(agent.pCounter * 100);
        if (prob > 25) ln += ' [' + red(prob + '%') + '] |';
        else ln += ' [<font color=\"orange\">' + prob + '%</font>] |';
        agent_rows[1].push(ln);
   
        ln = '| ' + padText(drawSecrets(agent.secrets), 11);
        prob = Math.floor(agent.pHack * 100);
        ln += ' [<font color=\"#33cc33\">' + prob + '%</font>] |';
        agent_rows[2].push(ln);
   

        if (agent.state == 'connecting' && offBlink) {
          agent_rows[3].push('+' + '='.repeat(width-2) + '+');
          pipes.push(' ');
          connectors.push('-');
        } else {
          agent_rows[3].push('+' + padText('+', width-2, '=') + '+');
          pipes.push('|');
          connectors.push('+');
        }
    }
  
    pipes = pipes.join(' '.repeat(width+2));
    if (connectors.length > 0) {
      var bar = connectors.join('-'.repeat(width+2));
      var mid = Math.floor(bar.length / 2);
      bar = bar.slice(0, mid) + '+' + bar.slice(mid+1);
    } else {
      if (offBlink) bar = red('+');
      else          bar = red('×');
    }
    return agent_rows.map(row => row.join('   '))
                     .concat([pipes, bar]);
}


function drawPlayers() {
	var pipes = [];
	var rows = [[], [], [], []];
	for (var i = 0; i < state.players.length; i++) {
		var player = state.players[i];
		if (player.state == 'disconnecting') {
			if (offBlink) {
				pipes.push(red('|'));
				rows[0].push("+=======" + red("X") + "=======+");
			} else {
				pipes.push(' ');
				rows[0].push("+=======+=======+");
			}
		} else if ((player.state == 'choosingAction' && offBlink)
		           || player.state == 'chosenAction') {
			pipes.push('?');
			rows[0].push("+=======?=======+");
		} else {
			pipes.push('|');
		    rows[0].push("+=======+=======+");
		};

		var name = player.name + " ".repeat(10-player.name.length);
		var money = player.money.toString(10) + 'K';
		money = " ".repeat(3 - money.length) + money;
    if (player.money >= 18) {
      money = '<font color=\"gold\">' + money + '</font>';
    } else if (state.phase == 'roundEnd' && offBlink) {
      money = '<font color=\"#44ff44\">' + money + '</font>';
    }
		rows[1].push("| " + name + money + " |");

		rows[2].push("| >" + centerText(drawSecrets(player.secrets), 11) + "< |");	

    if (player.connected) {
      rows[3].push("+===============+");  
    } else {
    	rows[3].push("+=========[" + grey('AFK') + "]=+");
    }

		if (player.state == 'offline') {
			pipes[pipes.length - 1] = ' ';
			for (var j=0; j<4; ++j) {
				rows[j][rows[j].length - 1] = grey(rows[j][rows[j].length - 1]);
			}
		}
	}

	return [
		pipes.join('                 '), rows[0].join(' '),
		rows[1].join(' '), rows[2].join(' '), rows[3].join(' ')
	];
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

function secretsRenderLength(secrets) {
  return drawSecrets(secrets).length;
}


function centerText(text, width) {
	var pad = Math.floor((width - text.length) / 2)
	text = ' '.repeat(pad) + text;
	text += ' '.repeat(width - text.length);
	return text;
}


var winGraph = document.getElementById("winGraph");

function drawWinGraph() {
  var graph = '';
  for (var i=0; i< state.players.length; ++i) {
    var player = state.players[i];
    graph += '          |\n';
    graph += ' '.repeat(9-player.name.length) + player.name;
    graph += ' | ' + '█'.repeat(player.money + Math.floor(Math.random() * 18)) + '\n'
    graph += '          |\n';
  }
  winGraph.innerHTML = graph;
}
