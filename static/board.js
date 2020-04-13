
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

  	lastChoice = choiceOutput.innerHTML;
  	choiceOutput.innerHTML = "";
	removeInputBox();
	switch (state.phase) {
		case 'newRound':
			startPhase_newRound();
			break;
		case 'connectingAgents':
			setPromptText(state.commonText, null);
			break;
		case 'choosingAction':
			startPhase_choosingAction();
			break;
		case 'disconnect':
			startPhase_disconnect();
			break;
		case 'finishDisconnects':
			setPromptText(state.commonText, null);
			break;
		case 'hacking':
			startPhase_hacking();
			break;
		case 'results':
			startPhase_results();
			break;
		case 'roundEnd':
			setPromptText(state.commonText, null);
			break;
		case 'moneySteal':
			setPromptText(state.commonText, null);
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
var lastChoice = "";

function setPromptText(text, callback) {
	if (promptText != null) {  // Prinitng in progress //
		printToLog(promptText);
		if (promptCallback != null) promptCallback();
		promptText = text;
		promptCallback = callback;
		return;
	}
	printToLog(prompt.innerHTML + lastChoice);
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


// ------------------------------------------------ //

var roundSplash = document.getElementById("roundSplash");
var roundSplashTitle = document.getElementById("roundSplashTitle");
var roundSplashRound = document.getElementById("roundSplashRound");
roundSplash.style.font = '30px Inconsolata, monospace';

function startPhase_newRound() {
	setPromptText("");
	roundSplash.style.visibility = 'visible';
	board.style.visibility = 'hidden';
	animate_typing(
		roundSplashRound,
		'ROUND ' + state.round.number + ': ',
		typing_delay * 2,
		() => setTimeout(function () {
				animate_typing(
					roundSplashRound,
					state.round.title,
					typing_delay * 2,
					() => setTimeout(
						finishRoundSplash,
						3000
					)
				);
		}, 1000)
	);
}

function finishRoundSplash() {
	printToLog("Round " + state.round.number + ' begins');
	roundSplashTitle.innerHTML = '';
	roundSplashRound.innerHTML = '';
	roundSplash.style.visibility = 'hidden';
	board.style.visibility = 'visible';
}

// ----------------------------------------------- //

function startPhase_choosingAction() {
	if (state.players[myPid].state == 'offline') {
		setPromptText("You are safely offline", null);
		return;
	}

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
	var secrets = {"4": 0, "3": 0, "2": 0, "!4": 0, "!3": 0, "!2": 0};
	if (text.length == 0) return secrets;
	var items = text.split(',');
	var total = 0;
	console.log(items);
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
	var secrets = parseSecrets(text, 3);
	if (secrets == null) return;
	choiceOutput.innerHTML = '[' + text + ']';
	socket.emit('chooseSecrets', secrets);
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


function startPhase_results() {
	setPromptText('');
	for (var i = 0; i < state.agents.length; ++i) {
		printToLog(state.agents[i].message);
	}
}

// ----------------------------------------------- //