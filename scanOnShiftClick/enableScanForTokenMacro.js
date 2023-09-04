//This macro assigns a journal entry to an NPC and enables the hotkey for them.
//Format we need is:
//@Actor[actorID]{ActorName}@openScanOnDoubleClick[click]@JournalEntry[actorID entryID]{entryName}
const tokens = canvas.tokens.controlled;

for (const token of tokens) {
	let actor = token.actor;
	if (actor == undefined) {
		continue
	}

	actorData = token.actor.data;
	actorID = actorData._id;
	actorName = actorData.name;
	journalEntries = game.journal.contents;
	triggersEntry = undefined;
	for (const entry of journalEntries) {
		if (entry.name.indexOf("Trigger Happy") != -1) {
			//This is the entry containing all triggers
			triggersEntry = entry;
		}
	}

	if (triggersEntry == undefined) {
		ui.notifications.error("ERROR: 'Trigger Happy' journal is MISSING. Please create it. It should be inside a Journal Directory also called 'Trigger Happy'. If you're on v10, you'll need to update this macro yourself for the new journal system.")
		return
	}

	for (const entry of journalEntries) {
		if (entry.name.toLowerCase().indexOf(actorName.toLowerCase()) != -1) {
			//This is the entry corresponding to the actor we have selected
			scanEntryID = entry.data._id;
			scanEntryName = entry.data.name;
			triggerEntryContent = triggersEntry.data.content;
			newEntry = "<p>@Actor[" + actorID + "]{" + actorName + "}@Trigger[click]@openScanOnShiftClick[" + actorID + " "
			if (triggerEntryContent.indexOf(newEntry) != -1) {
				//We already have a trigger entry. Just update the ID to the new scan.
				oldIDStartIndex = triggerEntryContent.indexOf(newEntry) + newEntry.length;
				oldIDEndIndex = triggerEntryContent.indexOf("]", oldIDStartIndex);
				oldID = triggerEntryContent.substring(oldIDStartIndex, oldIDEndIndex);
				triggerEntryContent = triggerEntryContent.replace(oldID, scanEntryID);
			} else {
				triggerEntryContent += newEntry + scanEntryID + "]{" + scanEntryName + "}</p>\n<p>"
			}
			await triggersEntry.update({ content: triggerEntryContent });
		}

	}
}