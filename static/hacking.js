
var hacking = document.getElementById("hacking");
var hackingLeft = document.getElementById("hackingLeft");
var hackingTopRight = document.getElementById("hackingTopRight");
var hackingPrompt = document.getElementById("hackingPrompt");
var hackingProgressBar = document.getElementById("hackingProgressBar");
var hackingExfiltrate = document.getElementById("hackingExfiltrate");

//document.getElementById("hackingDivide").innerHTML = '║<br>'.repeat(200);
document.getElementById("hackingRightDivide").innerHTML = '═'.repeat(100);

hacking.style.visibility = 'hidden';

var RHScontent, RHSpos, LHScontent, LHSpos, hackingProgress;


function showHacking() {
	hackingPrompt.innerHTML = hackerPrompt();
	RHScontent = '\n'.repeat(100);
	RHSpos = Math.floor(Math.random() * RHScode.length);
	LHScontent = "";
	hackingProgress = 0;
	LHSpos = Math.floor(Math.random() * LHScode.length);
	stepLHS(0);
	stepRHS(0);
	drawProgressBar();
	hackingExfiltrate.innerHTML = "";
	document.body.onkeydown = hackingKeyDown;
	hacking.style.visibility = 'visible';
}


function hideHacking() {
	document.body.onkeydown = null;
	hacking.style.visibility = 'hidden';
}

function hackingKeyDown(e) {
	if (!highentropy(e.keyCode)) return;
	hackingProgress += 0.005;

	if (hackingProgress >= 1) {
		hackingExfiltrate.innerHTML = red("[EXFILTRATE]");
	}

	drawProgressBar();
	stepLHS();
	stepRHS();
}

function drawProgressBar() {
	var width = 68;
	var completion = Math.floor(width * Math.min(1, hackingProgress));
	var bar = '[' + '▓'.repeat(completion);
	bar += '.'.repeat(width-completion) + ']';
	hackingProgressBar.innerHTML = bar;
}

function stepLHS() {
	var n = Math.round(Math.random() * hackingProgress * 100);
	var numLines = Math.floor(hackingLeft.offsetHeight / 18);
	LHScontent += LHScode.slice(LHSpos, LHSpos + n);
	var LHSlines = LHScontent.split('\n');
	while (LHSlines.length > numLines) LHSlines.shift();
	LHScontent = LHSlines.join('\n');
	LHSpos = (LHSpos + n) % LHScode.length;
	hackingLeft.innerHTML = LHScontent + '█';
}

function stepRHS() {
	var n = Math.ceil(Math.random() * hackingProgress * 60);
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

var prev_presses = [];
function highentropy(code) {
  if (prev_presses.includes(code)) return false;
  if (prev_presses.length >= 4) {
    prev_presses.shift()
  }
  prev_presses.push(code);
  return true;
}
