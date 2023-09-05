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
			if (game.data.release.generation == 9) {
				triggersEntry = entry;
			} else {
				triggersEntry = entry.pages.values().next().value
			}

		}
	}

	if (triggersEntry == undefined) {
		ui.notifications.error("ERROR: 'Trigger Happy' journal is missing. Please create it. It should be inside a Journal Directory also called 'Trigger Happy'.")
		return
	}

	for (const entry of journalEntries) {
		if (entry.name.toLowerCase().indexOf(actorName.toLowerCase()) != -1) {
			//This is the entry corresponding to the actor we have selected
			console.log(entry)
			scanEntryID = entry.data._id;
			scanEntryName = entry.data.name;
			if (game.data.release.generation == 9) {
				triggerEntryContent = triggersEntry.data.content;
			} else {
				triggerEntryContent = triggersEntry.text.content;
			}

			newEntry = "<p>@Actor[" + actorID + "]{" + actorName + "}@Trigger[click]@openScanOnShiftClick[" + actorID + " "
			if (triggerEntryContent.indexOf(newEntry) != -1) {
				console.log("Already found, updating")
				//We already have a trigger entry. Just update the ID to the new scan.
				oldIDStartIndex = triggerEntryContent.indexOf(newEntry) + newEntry.length;
				oldIDEndIndex = triggerEntryContent.indexOf("]", oldIDStartIndex);
				oldID = triggerEntryContent.substring(oldIDStartIndex, oldIDEndIndex);
				triggerEntryContent = triggerEntryContent.replace(oldID, scanEntryID);
			} else {
				console.log("Not found")
				triggerEntryContent += newEntry + scanEntryID + "]{" + scanEntryName + "}</p>\n<p>"
			}
			if (game.data.release.generation == 9) {
				await triggersEntry.update({ content: triggerEntryContent });
			} else {
				triggersEntry.update({ text: { content: triggerEntryContent } })
			}

		}

	}
}