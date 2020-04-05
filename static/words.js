
var lobby_message = "> Connecting to www.dark.net/exfil.EXE\n> pr0xy: blitting registers - <b><font color=\"#22ff22\">[SUCCESS]</font></b>\n> Rasterising backdoor.jpg ... <b><font color=\"22ff22\">[SUCCESS]</font></b>\n> Spoofing creds ... <b><font color=\"#ee2211\">[FAILED]</font></b> - Users Detected!\n> Initialising mode -1 (MANUAL)\n> Enter your name: ";




function othersDisconnecting(otherNames) {
	var message = otherNames.join(' and ');
	message += ' disconnected, '
	if (otherNames.length > 1) message += 'those ';
	else 	                   message += 'that ';
	message += state.commonText;
	return message;
}

function meDisconnecting(otherNames) {
	var message = 'You';
	for (var i = 1; i < otherNames.length; i++) 
		message += ', ' + otherNames[i];
	if (otherNames.length > 0) 
		message += ' and ' + otherNames[0];
	message += ' disconnected, you ' + state.commonText;
	if (otherNames.length > 0) 
		message += 's';
	return message;
}