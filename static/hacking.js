
var hacking = document.getElementById("hacking");
var hackingLeft = document.getElementById("hackingLeft");
var hackingTopRight = document.getElementById("hackingTopRight");
var hackingPrompt = document.getElementById("hackingPrompt");
var hackingProgressBar = document.getElementById("hackingProgressBar");

document.getElementById("hackingDivide").innerHTML = '║<br>'.repeat(200);
document.getElementById("hackingRightDivide").innerHTML = '═'.repeat(100);

hacking.style.visibility = 'hidden';

var RHScontent, RHSpos, LHScontent, LHSpos, hackingProgress;


function showHacking() {
	hackingPrompt.innerHTML = hackerPrompt();
	RHScontent = "";
	RHSpos = 0;
	LHScontent = "";
	hackingProgress = 0;
	LHSpos = Math.floor(Math.random() * sourceCodeText.length);
	stepLHS(0);
	drawProgressBar();
	document.body.onkeydown = hackingKeyDown;
	hacking.style.visibility = 'visible';
}


function hideHacking() {
	document.body.onkeydown = null;
	hacking.style.visibility = 'hidden';
}

function hackingKeyDown(e) {
	if (!highentropy(e.keyCode)) return;
	hackingProgress += 0.007;

	if (hackingProgress >= 1) {

	}

	drawProgressBar();
	stepLHS(Math.round(hackingProgress * 50));
}

function drawProgressBar() {
	var width = 67;
	var completion = Math.floor(width * Math.min(1, hackingProgress));
	console.log(completion);
	var bar = '[' + '▓'.repeat(completion);
	bar += '.'.repeat(width-completion) + ']';
	hackingProgressBar.innerHTML = bar;
}

function stepLHS(n) {
	var numLines = Math.floor(hackingLeft.offsetHeight / 18);
	LHScontent += sourceCodeText.slice(LHSpos, LHSpos + n);
	LHSlines = LHScontent.split('\n');
	while (LHSlines.length > numLines) LHSlines.shift();
	LHScontent = LHSlines.join('\n');
	LHSpos = (LHSpos + n) % sourceCodeText.length;
	hackingLeft.innerHTML = LHScontent + '█';
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
