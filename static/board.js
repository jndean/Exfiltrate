
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

	clearInterval(beatInterval);
	beatInterval = setInterval(
		function() {offBeat = !offBeat; drawBoard();},
		700
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
		case 'choosingAction':
			startPhase_choosingAction();
			break;
		case 'disconnect':
			startPhase_disconnect();
			break;
		case 'hacking':
			startPhase_hacking();
			break;
		default:
			setPromptText('');
	}
}



// ---------------- Prompt and log ------------------ //

var choiceInput = document.getElementById("choiceInput");
var choiceOutput = document.getElementById("choiceOutput");
var prompt = document.getElementById("prompt");
var animating_prompt = false;
var target_prompt = null;
var promptCallback = null;

function setPromptText(text, callback) {
	promptTarget = text;
	promptCallback = callback;
	if (animating_prompt || prompt.innerHTML == text) {
		return;
	}
	animatingPrompt = true;
	prompt.innerHTML = "";
	animate_typing(prompt, text, 10, function() {
		prompt.innerHTML = promptTarget;
		animatingPrompt = false;
		if (promptCallback != null) callback();
	});
}


// ----------------------------------------------- //

function startPhase_choosingAction() {
	setPromptText('> Stay connected?', function () {
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
				(t) => parseSecrets(t) != null,
				submitChooseSecrets
			);
		});
	} else {
		setPromptText(othersDisconnecting(otherNames), null);
	}
}

function parseSecrets(text) {
	var items = text.split(' ');
	var secrets = {"4": 0, "3": 0, "2": 0, "!4": 0, "!3": 0, "!2": 0};
	for (var i=0; i<items.length; ++i) {
		var item = items[i];
		if (['k', 'K'].includes(item.slice(-1))) {
			item = item.slice(0, -1);
		}
		if (!(item in secrets)) return null;
		secrets[item] += 1;
	}
	return secrets;
}

function submitChooseSecrets(text) {
	var secrets = parseSecrets(text);
	if (secrets == null) return;
	socket.emit('chooseSecrets', secrets);
}

// ----------------------------------------------------- //

function startPhase_hacking() {

}