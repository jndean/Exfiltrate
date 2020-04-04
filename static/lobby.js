
var linesBox = document.getElementById("joinlines");
var nameInput = document.getElementById("nameInput");


animate_typing(
	linesBox, 
	"> Connecting to www.dark.net/exfil.EXE\n> pr0xy: blitting registers - <b><font color=\"#22ff22\">[SUCCESS]</font></b>\n> Rasterising backdoor.jpg ... <b><font color=\"22ff22\">[SUCCESS]</font></b>\n> Spoofing creds ... <b><font color=\"#ee2211\">[FAILED]</font></b> - Users Detected!\n> Initialising mode -1 (MANUAL)\n> Enter your name: ",
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

