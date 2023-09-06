Hooks.once('setup', function () {
	game.triggers.registerEffect('openScanOnShiftClick');
});

Hooks.on('TriggerHappy', (key, args) => {
	// 'key' is the reference name of the custom effect without the initial @
	// 'args' is the array of string to use like arguments for your code
	console.log(key);
	console.log(args);

	switch (key) {
		case "openScanOnShiftClick":
			var scanJournalID = args[1];
			if (window.event?.shiftKey)
				game.journal.get(scanJournalID).sheet.render(true)
			break;
	}

});