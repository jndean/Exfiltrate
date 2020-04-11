
board.style.visibility = 'hidden';

var myPid = null;


// Main game entry point is when server accepts the player's name //
socket.on('accept name', function(pid) {
	myPid = pid;
	closeLobby();
});
socket.on('open board', openBoard);


function openBoard() {
	board.style.visibility = 'visible';
	drawBoard();

	clearInterval(blinkInterval);
	blinkInterval = setInterval(
		function() {offBlink = !offBlink; drawBoard();},
		blinkDelay
	);
}


socket.on('state', updateState);
function updateState(new_state) {
	phaseChange = (state == undefined) || state.phase != new_state.phase;
  	state = new_state;
  	console.log("Current state", state);
  	drawBoard();

  	if (!phaseChange) return;

  	choiceOutput.innerHTML = "";
	removeInputBox();
	switch (state.phase) {
		case 'connectingAgents':
			startPhase_connectingAgents();
			break;
		case 'choosingAction':
			startPhase_choosingAction();
			break;
		case 'disconnect':
			startPhase_disconnect();
			break;
		case 'noDisconnects':
			startPhase_noDisconnects();
			break;
		case 'hacking':
			startPhase_hacking();
			break;
		case 'results':
			startPhase_results();
			break;
		default:
			setPromptText('');
	}
}



// ---------------- Prompt and log ------------------ //

var choiceInput = document.getElementById("choiceInput");
var choiceOutput = document.getElementById("choiceOutput");
var prompt = document.getElementById("prompt");
var log = document.getElementById("log");
var promptText = null;
var promptCallback = null;

function setPromptText(text, callback) {
	if (promptText != null) {  // Prinitng in progress //
		printToLog(promptText);
		if (promptCallback != null) promptCallback();
		promptText = text;
		promptCallback = callback;
		return;
	}
	printToLog(prompt.innerHTML + choiceOutput.innerHTML);
	prompt.innerHTML = "";
	promptText = text;
	promptCallback = callback;
	animate_typing(prompt, text, typing_delay, function() {
		prompt.innerHTML = promptText;
		if (promptCallback != null) promptCallback();
		promptText = null;
		promptCallback = null;
	});
}

function printToLog(text) {
	if (text == null || text == '') return;
	var t = new Date();
	var stamp = [t.getHours(), t.getMinutes(), t.getSeconds()].join(':');
	var lines = log.innerHTML.split('<br>');
	while (lines.length > 8) lines.pop()
		lines.unshift('[' + stamp + '] ' + text);
	log.innerHTML = lines.join('<br>');
}


// ----------------------------------------------- //

function startPhase_connectingAgents() {
	setPromptText('More opponents are connecting...', null);
}

// ----------------------------------------------- //

function startPhase_choosingAction() {
	setPromptText('Stay connected?', function () {
		choiceOutput.innerHTML = " [y/n] ";
		maxInputLength = 1;
		placeInputBox(
			choiceInput, 
			(t) => ['y', 'n'].includes(t.toLowerCase()),
			submitChooseAction
		);
	});
}

function submitChooseAction(choice) {
	choice = choice.toLowerCase();
	socket.emit('chooseAction', choice);
	choiceOutput.innerHTML = " [" + choice + "] ";
}

// ----------------------------------------------- //

function startPhase_disconnect() {
	var numDisconnects = 0;
	var numRemain = 0;
	var otherNames = [];
	for (var i=0; i<state.players.length; ++i) {
		var p = state.players[i];
		if (p.state == 'disconnecting') {
			numDisconnects += 1;
			if (i != myPid) otherNames.push(p.name);
		} else if (p.state != 'offline') {
			numRemain += 1;
		}
	}
	if (state.players[myPid].state == 'disconnecting') {
		var numSecrets = 1 + (numDisconnects == 1 && numRemain == 0);
		setPromptText(meDisconnecting(otherNames, numSecrets), function () {
			maxInputLength = 4 * numSecrets;
			placeInputBox(
				choiceInput,
				(t) => parseSecrets(t, numSecrets) != null,
				submitChooseSecrets
			);
		});
	} else {
		setPromptText(othersDisconnecting(otherNames), null);
	}
}

function parseSecrets(text, maxSecrets) {
	var items = text.split(',');
	var secrets = {"4": 0, "3": 0, "2": 0, "!4": 0, "!3": 0, "!2": 0};
	var total = 0;
	for (var i=0; i<items.length; ++i) {
		var item = items[i];
		if (['k', 'K'].includes(item.slice(-1))) {
			item = item.slice(0, -1);
		}
		if (!(item in secrets)) return null;
		secrets[item] += 1;
		total += 1;
	}
	if (total > maxSecrets) return null;
	return secrets;
}

function submitChooseSecrets(text) {
	var secrets = parseSecrets(text);
	if (secrets == null) return;
	socket.emit('chooseSecrets', secrets);
}

function startPhase_noDisconnects() {
	setPromptText(noDisconnects(), null);
}

// ----------------------------------------------------- //

function startPhase_hacking() {

	if (state.currentHacker != myPid) {
		setPromptText(
		state.players[state.currentHacker].name + 
		' is trying to ' + state.commonText, null);
	} else {
		setPromptText(
			"You are the hacker!",
			() => setTimeout(showHacking, 1000)
		);
	}

}

// ----------------------------------------------------- //


var disconnectPosition;

function startPhase_results() {
	setPromptText('');
	disconnectPosition = 0;
	setTimeout(disconnectAgent, 3000);
}

// TODO: this should happen serverside, could be made synchronous with 
// blinks by having a phase check before drawBoard in state update message
function disconnectAgent() {
	if (state.phase != 'results') return;
	if (disconnectPosition >= state.agents.length) return;

	var agent = state.agents[disconnectPosition];
	
	if (agent.state == 'remain') {
		// No delay if no disconnect //
		disconnectPosition += 1;
		if (disconnectPosition == disconnectPosition.length) {
			setPromptText(agentRemains(agent.name), null);
		} else {
			printToLog(agentRemains(agent.name));
			disconnectAgent();
		}
		return;
	}

	var msg;
	if (agent.state == 'counter') {
		msg = agentCounterHacked(agent.name)
		for (var j=0; j<3; ++j) {
			if (state.firewall[j] == 'change') {
				state.firewall[j] = 'off';
				break;
			}
		}
	} else if (agent.state == 'hacked') {
		msg = agentHacked(agent.name, drawSecrets(agent.secrets));
		for (s in agent.secrets) {
			state.secrets[s] += agent.secrets[s];
		}
	}

	console.log(msg, agent.state, disconnectPosition);
	setPromptText(msg, null);
	state.agents.splice(disconnectPosition, 1);
	setTimeout(disconnectAgent, 1000);
}