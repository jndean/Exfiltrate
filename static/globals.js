var socket = io();

// Params! //
var typing_delay = 10;


// State! //
var state = undefined;
var myPid = null;

var offBlink = false;  // For doing blinking characters etc
var blinkDelay = 500;
var blinkInterval = setInterval(
	function(){offBlink = !offBlink},
	blinkDelay
);


// The different screens //
var lobby = document.getElementById("lobby");
var board = document.getElementById("board");
var hacking = document.getElementById("hacking");

board.style.visibility = 'hidden';


// bounce latency messages //
socket.on('pong', function(ms) {
    socket.emit('latency', ms);
});

// respond to request for debug state //
socket.on('debug', function () {
	var myName = null;
	if (state != undefined && myPid in state.players) {
		myName = state.players[myPid].name;
	}
	var debug ={
		myPidIs: myPid,
		myNameIs: myName,
		myStateIs: state
	}
	socket.emit('trace', debug);
});


// Utility functions! //

function animate_typing(dest, text, delay, finish, no_pause=false) {
	var pause_time = 0;
	var written_text = dest.innerHTML;
	var typing_interval = setInterval(function() {
		if (pause_time > 0) {
			pause_time -= 1;
			return;
		}
		if (text.length == 0) {
			clearInterval(typing_interval);
			if (finish !== undefined) finish();
			return;
		}
		var c = text[0];
		if (c == '\n' && !no_pause) pause_time = 30 + Math.random() * 70;
		text = text.substring(1);
		written_text += c;
		dest.innerHTML = written_text;
		if (text.length != 0) dest.innerHTML += '█';
		blipSound.play();
	}, delay);
}



function rng(items) {
	return items[Math.floor(Math.random() * items.length)];
}

// ----------- Sounds ------------- //

function sound(src, vol=1) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  this.sound.volume = vol;
  document.body.appendChild(this.sound);
  this.play = () => this.sound.play();
  this.stop = () => this.sound.pause();
  this.volume = (v) => this.sound.volume = v;
}

var keyboardSounds = [
	new sound("static/sounds/kb1.mp3"),
	new sound("static/sounds/kb2.mp3"),
	new sound("static/sounds/kb3.mp3"),
	new sound("static/sounds/kb4.mp3"),
	new sound("static/sounds/kb5.mp3"),
	new sound("static/sounds/kb6.mp3")
]
var keyboardSoundsReturn = new sound("static/sounds/kbenter.mp3", 0.45);
var blipSound = new sound("static/sounds/blip.mp3", 0.05);
/*
var counterSound = new sound("static/sounds/powerdown_short.mp3", 0.4);
var compromiseSound = new sound("static/sounds/wrong.mp3", 0.5);
var connectingSounds = [
	new sound("static/sounds/connecting_short.mp3", 0.5),
	new sound("static/sounds/connecting_short2.mp3", 0.5)
]
var dialSound = new sound("static/sounds/dial.mp3", 0.5);
*/

function playKeyboardSound(keycode) {
	// return;	
	if (keycode == 13) {
		keyboardSoundsReturn.play();
	} else {
		if (state == undefined || state.phase != 'hacking') {
			sound = rng(keyboardSounds);
			sound.volume(0.1 + Math.random() * 0.3);
			sound.play();
		}
	}
}

// ----------------- Global input capture ---------------- //
var inputField = document.getElementById('inputField');
var inputDisplay = document.createElement('span');
var maxInputLength = 9;

var caret = false;
var caretInterval = null;
function drawInputDisplay(e) {
	inputField.value = filterAlphabet(inputField.value);
  	var fill = inputField.value + ' ';
  	if (caret || e != undefined) {
	    var i = inputField.selectionStart;
	    fill = fill.slice(0, i) + "█" + fill.slice(i+1);
  	}
  	inputDisplay.innerHTML = fill;
};

function placeInputBox(location, validInput, action) {
	// Create the box and attach it to the global input field //
	location.appendChild(inputDisplay);
	inputField.value = "";
	inputField.focus();
	inputField.addEventListener('input', drawInputDisplay, false);
	drawInputDisplay();

	// Animate the box //
	document.body.onkeyup = () => drawInputDisplay(true);
	caretInterval = setInterval(function () {
		caret=!caret; drawInputDisplay();
	}, blinkDelay);

	// Callback on enter //
	document.body.onkeydown = function(e){
		playKeyboardSound(e.keyCode);
		inputField.focus();
		inputField.value = filterAlphabet(inputField.value);
		if (e.keyCode == 13 && validInput(inputField.value)) {
			var value = inputField.value;
			inputField.value = "";
			drawInputDisplay();
			action(value);
		}
	};
}

function removeInputBox() {
	if (inputDisplay.parentNode != null) {
		inputDisplay.parentNode.removeChild(inputDisplay);
		inputField.value = "";
		inputField.blur();
		inputField.removeEventListener('input', drawInputDisplay, false);
		clearInterval(caretInterval);
		document.body.onkeydown = null;
		document.body.onkeyup = null;
		return true;
	}
	return false;
}


function red(text) {
	return '<font color=\"#ee2211\">' + text + '</font>';
}

function grey(text) {
	return '<font color=\"#668866\">' + text + '</font>';
}



var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-!?#[]~:.,$";
function filterAlphabet(str) {
  return str.split('')
            .filter(x => alphabet.includes(x))
            .join('')
            .slice(0, maxInputLength);
}

function padText(text, width, padding = ' ') {
	if (text.includes('<font color=')) width += 27;
	if (text.includes('</b>')) width += 7;
	text += padding.repeat(
		Math.max(0, Math.ceil((width - text.length) / 2))
	);
	text = padding.repeat(
		Math.max(0, width - text.length)
	) + text;
	return text;
}


