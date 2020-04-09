
var hackingLeft = document.getElementById("hackingLeft");
var hackingTopRight = document.getElementById("hackingTopRight");
var hackingPrompt = document.getElementById("hackingPrompt");
var hackingProgressBar = document.getElementById("hackingProgressBar");
var hackingExfiltrate = document.getElementById("hackingExfiltrate");
var skewBox = document.getElementById("skewBox");
var flickerBox = document.getElementById("flickerBox");

document.getElementById("hackingRightDivide").innerHTML = '═'.repeat(100);
hacking.style.visibility = 'hidden';

var RHScontent, RHSpos, LHScontent, LHSpos, hackingProgress;


function showHacking() {

	hackingProgress = 0;
	LHScontent = "";
	RHScontent = '\n'.repeat(100);
	RHSpos = Math.floor(Math.random() * RHScode.length);
	LHSpos = Math.floor(Math.random() * LHScode.length);
	hackingPrompt.innerHTML = hackerPrompt();
	hackingExfiltrate.innerHTML = "";
	hacking.style.visibility = 'visible';
	board.style.visibility = 'hidden';
	stepLHS(0);
	stepRHS(0);
	drawProgressBar();
	document.body.onkeydown = hackingKeyDown;
}

function hideHacking() {
	document.body.onkeydown = null;
	document.body.style.animation = '';
	document.body.style.backgroundImage = "radial-gradient(rgba(0, 75, 35, 1), black 120%)";
	document.body.style.color = '#44ff44';
	skewBox.style.animation = "";
	hackingProgressBar.style.animation = "";
	hackingExfiltrate.style.animation = "";
	hacking.style.visibility = 'hidden';
	board.style.visibility = 'visible';
}

function hackingKeyDown(e) {
	if (!highentropy(e.keyCode)) return;
	if (hackingProgress >= 1 && e.keyCode == 13) {
		socket.emit('finishHacking');
		hideHacking();
		return;
	}
	hackingProgress += 0.009;
	drawProgressBar();
	stepLHS();
	stepRHS();
	setEffects();
}

function drawProgressBar() {
	var width = 68;
	var completion = Math.floor(width * Math.min(1, hackingProgress));
	var bar = '[' + '▓'.repeat(completion);
	bar += '.'.repeat(width-completion) + ']';
	hackingProgressBar.innerHTML = bar;

	if (hackingProgress >= 1) {
		var ex = '!'.repeat(Math.min(7, Math.floor(10*(hackingProgress-1))));
		hackingExfiltrate.innerHTML = red(
			"<b>[" + ex + "EXFILTRATE" + ex + "]</b>"
		);
	}
}

function stepLHS() {
	var n = Math.round(Math.random() * hackingProgress * 130);
	var numLines = Math.floor(hackingLeft.offsetHeight / 18);
	LHScontent += LHScode.slice(LHSpos, LHSpos + n);
	var LHSlines = LHScontent.split('\n');
	while (LHSlines.length > numLines) LHSlines.shift();
	LHScontent = LHSlines.join('\n');
	LHSpos = (LHSpos + n) % LHScode.length;
	hackingLeft.innerHTML = LHScontent + '█';
}

function stepRHS() {
	var n = Math.ceil(Math.random() * hackingProgress * 75);
	var lineHeight = Math.floor(0.5 + hackingTopRight.offsetHeight / 18);
	RHScontent += RHScode.slice(RHSpos, RHSpos + n);
	RHSpos = (RHSpos + n) % RHScode.length;

	var RHSlines = RHScontent.split('\n');
	while (RHSlines.length < lineHeight) RHSlines.unshift('');
	while (RHSlines.length > lineHeight) RHSlines.shift();
	RHScontent = RHSlines.join('\n');

	hackingTopRight.innerHTML = RHSlines.slice(0,-1).join('\n');
	hackingTopRight.innerHTML += '\n> ' + RHSlines.slice(-1) + '█';
}


function setEffects() {

	if (hackingProgress > 0.1) {
		document.body.style.animation = "jitterShadow 5.03s infinite";
	}

	var cThresh = 0.4;
	if (hackingProgress > cThresh) {
		var s = Math.min(1, (hackingProgress-cThresh)/(1-cThresh));
		var t = 1-s;
		var rgb = [Math.round(t*0  + s*100),
				   Math.round(t*75 + s*20),
		           Math.round(t*35 + s*0)];
		var grad = "radial-gradient(rgba(" + rgb.join(',') + ", 1), black 120%";
		document.body.style.backgroundImage = grad;

		rgb = [Math.round(t*0x44 + s*0xff),
			   Math.round(t*0xff + s*0x44),
	           Math.round(t*0x44 + s*0x00)];
		document.body.style.color = 'rgba(' + rgb.join(',') + ', 1.0)';
	}

	if (hackingProgress > 0.6) {
		document.body.style.animation = "jitterShadow 3.03s infinite";
	}

	if (hackingProgress > 1) {
		skewBox.style.animation = "glitch-skew2 1.5s infinite";
		document.body.style.animation = "jitterShadow 1.03s infinite";
		hackingProgressBar.style.animation = "hackingFlicker 0.5s infinite";
		hackingExfiltrate.style.animation = "hackingFlicker 0.5s infinite";
	}
}


var prev_presses = [];
function highentropy(code) {
  if (prev_presses.includes(code)) return false;
  if (prev_presses.length >= 4) {
    prev_presses.shift()
  }
  prev_presses.push(code);
  return true;
}
