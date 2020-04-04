
var prompt = document.getElementById("prompt");
board.style.visibility = 'hidden';


// Game entry point is when server accepts the player's name //
socket.on('accept name', function() {
	closeLobby();
	openBoard();
});


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
  state = new_state;
  console.log("Current state", state);
  drawBoard();
  updatePrompt();
}








// ---------------- Prompt ------------------ //

var animating_prompt = false;
var target_prompt = null;

function setPromptText(text) {
	target_prompt = text;
	if (animating_prompt || prompt.innerHTML == text) {
		return;
	}
	animating_prompt = true;
	animate_typing(
		prompt, 
		text,
		15,
		function() {
			prompt.innerHTML = target_prompt;
			animating_prompt = false;
		}
	);
}

function updatePrompt() {
	if (state.phase == 'choosing') {
		setPromptText('Stay connected?');
	} else if (state.phase == 'test') {
		setPromptText('The current phase is TEST');
	} else {
		setPromptText('');
	}
}