
var hackingLeft = document.getElementById("hackingLeft");
var hackingRight = document.getElementById("hackingRight");
var skewBox = document.getElementById("skewBox");
var flickerBox = document.getElementById("flickerBox");
var cmdPromptBox = document.getElementById("cmdPromptBox");
var hackingPromptBox = document.getElementById("hackingPromptBox");
var hackingProgressBar = document.getElementById("hackingProgressBar");
var hackingPrompt = document.getElementById("hackingPrompt");

hacking.style.visibility = 'hidden';
hackingPromptBox.style.display = 'none';
cmdPromptBox.style.display = 'block';

var RHScontent, RHSpos, LHScontent, LHSpos, hackingProgress;


function showHacking() {

	hackingProgress = 0;
	LHScontent = "";
	RHScontent = '\n'.repeat(200);
	RHSpos = Math.floor(Math.random() * RHScode.length);
	LHSpos = Math.floor(Math.random() * LHScode.length);
	hacking.style.visibility = 'visible';
	hackingPromptBox.style.display = 'block';
	hackingPrompt.style.font = '17px Inconsolata, monospace';
	cmdPromptBox.style.display = 'none';
	hackingPrompt.innerHTML = '';
	animate_typing(
		hackingPrompt,
		"Start hacking!<br>[Hint: " + state.commonText.split('.')[0] + ']',
		1
	);

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
	hackingPrompt.style.animation = "";
	hacking.style.visibility = 'hidden';
	hackingPromptBox.style.display = 'none';
	cmdPromptBox.style.display = 'block';
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
	var width = 75;
	var completion = Math.floor(width * Math.min(1, hackingProgress));
	var bar = '[' + '▓'.repeat(completion);
	bar += '.'.repeat(width-completion) + ']';
	hackingProgressBar.innerHTML = bar;

	if (hackingProgress >= 1) {
		hackingPrompt.style.font = '40px Inconsolata, monospace';
		var ex = '!'.repeat(Math.min(7, Math.floor(10*(hackingProgress-1))));
		hackingPrompt.innerHTML = red(
			"<b>[" + ex + "EXFILTRATE" + ex + "]</b>"
		);
	}
}

function stepLHS() {
	var n = Math.round(Math.random() * hackingProgress * 160);
	var numLines = Math.floor(hackingLeft.offsetHeight / 18);
	LHScontent += LHScode.slice(LHSpos, LHSpos + n);
	var LHSlines = LHScontent.split('\n');
	while (LHSlines.length > numLines) LHSlines.shift();
	LHScontent = LHSlines.join('\n');
	LHSpos = (LHSpos + n) % LHScode.length;
	hackingLeft.innerHTML = LHScontent + '█';
}

function stepRHS() {
	var n = Math.ceil(Math.random() * hackingProgress * 120);
	var lineHeight = Math.floor(hackingRight.offsetHeight / 18);
	RHScontent += RHScode.slice(RHSpos, RHSpos + n);
	RHSpos = (RHSpos + n) % RHScode.length;

	var RHSlines = RHScontent.split('\n');
	while (RHSlines.length < lineHeight) RHSlines.unshift('');
	while (RHSlines.length > lineHeight) RHSlines.shift();
	RHScontent = RHSlines.join('\n');

	hackingRight.innerHTML = RHSlines.slice(0,-1).join('\n');
	hackingRight.innerHTML += RHSlines.slice(-1) + '█';
}


function setEffects() {

	if (hackingProgress > 0.1) {
		document.body.style.animation = "jitterShadow 5.03s infinite";
	}

	var loThresh = 0.3, hiThresh = 0.8;	
	if (hackingProgress > loThresh && hackingProgress <= hiThresh) {
		var s = Math.max(loThresh, Math.min(hiThresh, hackingProgress));
		var s = (s - loThresh) / (hiThresh - loThresh);
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
		hackingPrompt.style.animation = "hackingFlicker 0.5s infinite";
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
