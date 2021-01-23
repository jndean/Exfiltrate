var lobbyOpen = true;

var splash = document.getElementById("splash");
var linesBox = document.getElementById("joinlines");
var nameInput = document.getElementById("nameInput");


document.body.onkeydown = function () {
	keyboardSoundsReturn.play();
	splash.parentNode.removeChild(splash);
	document.body.onkeydown = null;
	socket.emit('spectate');
}


function closeLobby() {
	socket.removeAllListeners('reject name');
	lobby.style.display = 'none';
	lobbyOpen = false;
}
