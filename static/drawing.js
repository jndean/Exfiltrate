
  
var board = document.getElementById("board");


function drawBoard() {
  var players = state.players;
  var N = players.length;
  var phase = state.phase;
  var agents = state.agents;

  var rows = [];

  // Agents //
  var width = 22;
  var agent_rows = [[], [], [], []];
  for (var i=0; i<agents.length; i++) {
    var agent = agents[i];
    agent_rows[0].push('+' + '='.repeat(width-2) + '+');

    var lhs = '| ' + agent.name;
    var prob = Math.floor(agent.counter * 100);
    var rhs = '[' + red(prob + '%') + '] |';
    var ln = lhs + ' '.repeat(width - lhs.length - 7) + rhs;
    agent_rows[1].push(ln);

    prob = Math.floor(agent.hack * 100);
    lhs = '| > ' + drawSecrets(agent.secrets);
    rhs = '[<font color=\"#33cc33\">' + prob + '%</font>] |';
    lhs += ' '.repeat(width - secretsRenderLength(agent.secrets) - 11);
    agent_rows[2].push(lhs + rhs);

    agent_rows[3].push('+' + '='.repeat(width-2) + '+');
  }
  rows = rows.concat(agent_rows.map(row => row.join('   ')));

  rows.push(Array(agents.length).fill('|').join(' '.repeat(width+3)));
  var bar = Array(agents.length).fill('+').join('-'.repeat(width+3));
  var mid = Math.floor(bar.length / 2);
  rows.push(bar.slice(0, mid) + '+' + bar.slice(mid+1));


  // Firewall //
  rows.push('|');
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
  var secrets = '<font color=\"grey\">EMPTY</font>';
  var width = 7;
  if (state.secrets.length > 0) { 
    width = secretsRenderLength(state.secrets) + 2;
    secrets = drawSecrets(state.secrets);
    if (width % 2 == 0) {
      secrets = ' ' + secrets;
      width += 1;
    }
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

  board.innerHTML = rows.join('\n');	
}


function drawPlayers() {

	var pipes = [];
	var rows = [[], [], [], []];
	for (var i = 0; i < state.players.length; i++) {
		var player = state.players[i];
		var qmark = (player.state == 'choosing' && offBeat)
		            || player.state == 'chosen';
		if (qmark) {
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
		rows[2].push("| >           < |");
		rows[3].push("+===============+");
	}

	return [
		pipes.join('                 '), rows[0].join(' '),
		rows[1].join(' '), rows[2].join(' '), rows[3].join(' ')
	];
}


function drawSecrets(secrets) {
  var out = [];
  for (var i = 0; i < secrets.length; i++) {
    var secret = secrets[i];
    var color = {
      'D':'aqua', 'G':'gold', 'S': 'white'
    }[secret.substring(secret.length-1)];
    out.push('<font color=\"' + color + '\">' + secret + "</font>");
  }
  return out.join(' ');
}
function secretsRenderLength(secrets) {
  return secrets.join(' ').length;
}