var socket = io();

// Params! //
var typing_delay = 1;


// State! //
var state = undefined;

var offBeat = false;  // For doing blinking characters etc
var beatInterval = setInterval(
	function(){offBeat = !offBeat},
	700
);


// DOM! //
var inputBox = document.getElementById('inputBox');
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


function red(text) {
	return '<font color=\"#ee2211\">' + text + '</font>';
}