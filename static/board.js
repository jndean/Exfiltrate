
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
}

