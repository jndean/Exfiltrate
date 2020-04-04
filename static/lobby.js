
var linesBox = document.getElementById("joinlines");
var nameInput = document.getElementById("nameInput");


animate_typing(
	linesBox, 
	"> Connecting to www.dark.net/exfil.EXE\n> pr0xy: blitting registers - <b><font color=\"#22ff22\">[SUCCESS]</font></b>\n> Rasterising backdoor.jpg ... <b><font color=\"22ff22\">[SUCCESS]</font></b>\n> Spoofing creds ... <b><font color=\"#ee2211\">[FAILED]</font></b> - Users Detected!\n> Initialising mode -1 (MANUAL)\n> Enter your name: ",
	typing_delay,
	() => createInputBox(nameInput, joinWithName)
);


var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 _-!?#[]~:.$";
function filterInput(str) {
  return str.split('').filter(x => alphabet.includes(x)).join('').substring(0, 9);
}


function joinWithName(name) {
	linesBox.innerHTML += name + '\n';
	animate_typing(linesBox, "> Connecting...", typing_delay, function () {
		socket.emit('join game', name);
		socket.once('reject name', function (reason) {
			animate_typing(
				linesBox, 
				"\n> " + red("<b>Rejected</b>: ") + reason + 
				'\n> Enter your <b>real</b> name: ', 
				typing_delay, 
				() => createInputBox(nameInput, joinWithName)
			);
		});
	});
}


function createInputBox(location, action) {
	// Create the box and attach it to the global input field //
	var inputBox = document.createElement('span');
	location.appendChild(inputBox);
	inputField.value = "";
	inputField.focus();
	inputField.addEventListener('input', drawInputBox, false);

	// Animate the box //
	var caret = false;
	function drawInputBox(e) {
		inputField.value = filterInput(inputField.value);
	  	var fill = inputField.value + ' ';
	  	if (caret || e != undefined) {
		    var i = inputField.selectionStart;
		    fill = fill.slice(0, i) + "█" + fill.slice(i+1);
	  	}
	  	inputBox.innerHTML = fill;
	};
	var interval = setInterval(function () {caret=!caret; drawInputBox();}, 700);
	document.body.onkeyup = () => drawInputBox(true);
	document.body.onkeydown = function(e){
		inputField.focus();
		inputField.value = filterInput(inputField.value);

		// Remove the box and apply the callback action //
		if (e.keyCode == 13 && inputField.value.length > 0) {
			location.removeChild(inputBox);
			var value = inputField.value;
			inputField.value = "";
			inputField.blur();
			inputField.removeEventListener('input', drawInputBox, false);
			clearInterval(interval);
			document.body.onkeydown = null;
			document.body.onkeyup = null;
			action(value);
		}
	};
}


function closeLobby() {
	socket.removeAllListeners('reject name');
	lobby.style.display = 'none';
}

