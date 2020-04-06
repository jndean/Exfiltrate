
var linesBox = document.getElementById("joinlines");
var nameInput = document.getElementById("nameInput");


animate_typing(
	linesBox, 
	"", //lobby_message,
	typing_delay,
	() => placeInputBox(nameInput, validNameCheck, joinWithName)
);

function joinWithName(name) {
	removeInputBox();
	linesBox.innerHTML += name + '\n';
	animate_typing(linesBox, "> Connecting...", typing_delay, function () {
		socket.emit('join game', name);
		socket.once('reject name', function (reason) {
			animate_typing(
				linesBox, 
				"\n> " + red("<b>Rejected</b>: ") + reason + 
				'\n> Enter your <b>real</b> name: ', 
				typing_delay, 
				() => placeInputBox(nameInput, joinWithName)
			);
		});
	});
}

function validNameCheck(name) {
	return name.length > 0 && name.length < 10;
}

function closeLobby() {
	socket.removeAllListeners('reject name');
	lobby.style.display = 'none';
}

