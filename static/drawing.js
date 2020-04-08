
  
var board = document.getElementById("board");
var topology = document.getElementById("topology");


function drawBoard() {
  var players = state.players;
  var N = players.length;
  var phase = state.phase;
  var agents = state.agents;

  var rows = [];

  rows = rows.concat(drawAgents());

  // Firewall //
  rows.push('|<b>');
  for (var i=0; i<3; i++) {
    var status = state.firewall[i];
    var colour = 'aqua', sym = '+';
    if (status == "off" || (status == "change" && offBeat)) {
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
  rows.push('+' + '='.repeat(width) + '+');
  rows.push('| ' + secrets + ' |');
  rows.push('+' + '='.repeat(width) + '+');


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
    for (var i=0; i<agents.length; i++) {
        var agent = agents[i];
        var outline = '=';
        var title = '+' + outline.repeat(6) + '[LVL.' + agent.level +']' + outline.repeat(6) + '+';
        agent_rows[0].push(title);
   
        var lhs = '| ' + padText(agent.name, 11);
        var prob = Math.floor(agent.pCounter * 100);
        var rhs = ' [' + red(prob + '%') + '] |';
        var ln = lhs + rhs;
        agent_rows[1].push(ln);
   
        prob = Math.floor(agent.pHack * 100);
        ln = '| ' + padText(drawSecrets(agent.secrets), 12);
        ln += '[<font color=\"#33cc33\">' + prob + '%</font>] |';
        agent_rows[2].push(ln);
   
        agent_rows[3].push('+' + padText('+', width-2, outline) + '+');
    }
  
    var pipes = Array(agents.length).fill('|').join(' '.repeat(width+2));
    var bar = Array(agents.length).fill('+').join('-'.repeat(width+2));
    var mid = Math.floor(bar.length / 2);
    bar = bar.slice(0, mid) + '+' + bar.slice(mid+1);
    return agent_rows.map(row => row.join('   '))
                     .concat([pipes, bar]);
}



function drawPlayers() {
	var pipes = [];
	var rows = [[], [], [], []];
	for (var i = 0; i < state.players.length; i++) {
		var player = state.players[i];
		if (player.state == 'disconnecting') {
			if (offBeat) {
				pipes.push(red('|'));
				rows[0].push("+=======" + red("X") + "=======+");
			} else {
				pipes.push(' ');
				rows[0].push("+=======+=======+");
			}
		} else if ((player.state == 'choosingAction' && offBeat)
		           || player.state == 'chosenAction') {
			pipes.push('?');
			rows[0].push("+=======?=======+");
		} else {
			pipes.push('|');
		    rows[0].push("+=======+=======+");
		};

		var name = player.name + " ".repeat(10-player.name.length);
		var money = "$" + player.money.toString(10);
		money = " ".repeat(3 - money.length) + money;
		rows[1].push("| " + name + money + " |");

		rows[2].push("| >" + centerText(drawSecrets(player.secrets), 11) + "< |");	

		rows[3].push("+===============+");

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
  for (var i = 0; i < secrets['4']; i++) out.push('4K');
  for (var i = 0; i < secrets['3']; i++) out.push('3K');
  for (var i = 0; i < secrets['2']; i++) out.push('2K');
  for (var i = 0; i < secrets['!4']; i++) out.push('!4K');
  for (var i = 0; i < secrets['!3']; i++) out.push('!3K');
  for (var i = 0; i < secrets['!2']; i++) out.push('!2K');
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