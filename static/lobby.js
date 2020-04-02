
var nameBox = document.getElementById('namebox');
var connectingBox = document.getElementById('connectingBox');
var linesBox = document.getElementById("joinlines");


nameBox.style.visibility = 'hidden';


animate_typing(
	linesBox, 
	"> Connecting to www.dark.net/exfil.EXE\n> pr0xy: blitting registers - <b><font color=\"#22ff22\">[SUCCESS]</font></b>\n> Rasterising backdoor.jpg ... <b><font color=\"22ff22\">[SUCCESS]</font></b>\n> Spoofing creds ... <b><font color=\"#ee2211\">[FAILED]</font></b> - Users Detected!\n> Initialising mode -1 (MANUAL)\n> Enter your name: ",
	typing_delay,
	enterName
);


var caret_interval = setInterval(function(){
	drawNameBox();
}, 700);


var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 _-!?#[]~:.$";
function filterInput(str) {
  return str.split('').filter(x => alphabet.includes(x)).join('').substring(0, 9);
}


function drawNameBox(e) {
  inputBox.value = filterInput(inputBox.value);
  var fill = inputBox.value + ' ';
  if (offBeat || e != undefined) {
    var i = inputBox.selectionStart;
    fill = fill.slice(0, i) + "█" + fill.slice(i+1);
  }
  nameBox.innerHTML = fill;
};


function enterName() {
	// Activate the box //
	namebox.style.visibility = 'visible';
	inputBox.focus();
	inputBox.addEventListener('input', drawNameBox, false);

	// Animate the box //
	document.body.onkeyup = function() {drawNameBox(true)};
	document.body.onkeydown = function nameBoxKeyDown(e){
		inputBox.value = filterInput(inputBox.value);
		var name = inputBox.value;
		inputBox.focus();

		// Set up deactivation of the box //
		if (e.keyCode == 13 && name.length > 0) {
			deactivateNameBox();
			linesBox.innerHTML += name + '\n';
			animate_typing(
				linesBox, 
				"> Connecting...", 
				typing_delay, 
				function(){
					nameBox.style.visibility = 'visible';
					tryName(name);
				}
			);
		}
	};

}

function deactivateNameBox() {
	nameBox.style.visibility = 'hidden';
	inputBox.value = "";
	inputBox.blur();
	document.body.onkeydown = null;
	document.body.onkeyup = null;
	drawNameBox();
}


function tryName(name) {
	socket.emit('join game', name);
	socket.once('reject name', function (reason) {
		deactivateNameBox();
		animate_typing(
			linesBox, 
			"\n> " + red("<b>Rejected</b>: ") + reason + 
			'\n> Enter your <b>real</b> name: ', 
			typing_delay, 
			enterName
		);
	});
}


function closeLobby() {
	clearInterval(caret_interval);
	deactivateNameBox();
	socket.removeAllListeners('reject name');
	lobby.style.visibility = 'hidden';
}