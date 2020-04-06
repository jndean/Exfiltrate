var socket = io();

// Params! //
var typing_delay = 2;


// State! //
var state = undefined;

var offBeat = false;  // For doing blinking characters etc
var beatInterval = setInterval(
	function(){offBeat = !offBeat},
	700
);


// DOM! //
var lobby = document.getElementById("lobby");
var board = document.getElementById("board");


// Utility functions! //

function animate_typing(dest, text, delay, finish) {
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
		if (c == '\n') pause_time = 30 + Math.random() * 70;
		text = text.substring(1);
		written_text += c;
		dest.innerHTML = written_text;
		if (text.length != 0) dest.innerHTML += '█';
	}, delay);
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
	}, 700);

	// Callback on enter //
	document.body.onkeydown = function(e){
		inputField.focus();
		inputField.value = filterAlphabet(inputField.value);
		if (e.keyCode == 13 && validInput(inputField.value)) {
			var value = inputField.value;
			inputField.value = "";
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


var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 _-!?#[]~:.$";
function filterAlphabet(str) {
  return str.split('')
            .filter(x => alphabet.includes(x))
            .join('')
            .slice(0, maxInputLength);
}

function rng(items) {
	return items[Math.floor(Math.random() * items.length)];
}