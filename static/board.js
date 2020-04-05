
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
	switch (state.phase) {
		case 'choosingAction':
			updatePrompt_choosingAction()
			break;
		case 'disconnect':
			updatePrompt_disconnect()
			break;
		case 'test':
			setPromptText('The current phase is TEST', null);
			break;
		default:
			setPromptText('');
			removeInputBox();

	}
}


function submitChooseAction(choice) {
	choice = choice.toLowerCase();
	socket.emit('chooseAction', choice);
	choiceOutput.innerHTML = " [" + choice + "] ";
}



// ---------------- Prompt ------------------ //

var choiceInput = document.getElementById("choiceInput");
var choiceOutput = document.getElementById("choiceOutput");
var prompt = document.getElementById("prompt");
var animating_prompt = false;
var target_prompt = null;

function setPromptText(text, callback) {
	target_prompt = text;
	if (animating_prompt || prompt.innerHTML == text) {
		return;
	}
	animating_prompt = true;
	animate_typing(prompt, text, 10, function() {
		prompt.innerHTML = target_prompt;
		animating_prompt = false;
		if (callback != null) callback();
	});
}


function updatePrompt_choosingAction() {
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

function updatePrompt_disconnect() {
	var disconnects = [];
	var otherNames = [];
	for (var i=0; i<state.players.length; ++i) {
		var p = state.players[i];
		if (p.state == 'disconnecting') {
			disconnects.push();
			if (i != myPid) otherNames.push(p.name);
		}
	}
	if (state.players[myPid].state == 'disconnecting') {
		setPromptText(meDisconnecting(otherNames), function () {

		});
	} else {
		setPromptText(othersDisconnecting(otherNames), null);
	}
}