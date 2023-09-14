//Toggle bar display + Fix stress/structure

//Everything here goes in a world script (added with esmodules in world.json)
Hooks.once("init", function () {
	//This makes it so these functions can be called from macros.
	window["toggleBarVisibilityForToken"] = toggleBarVisibilityForToken
	window["toggleBarVisibilityForActor"] = toggleBarVisibilityForActor
})


Hooks.on("createToken", (tokenDocument, renderData, userID) => {
	if (game.userId != userID)
		return
	if (tokenDocument.actor.type == "pilot") {
		return
	}

	console.log("New token created")
	//Hide the bars by default, unless token was scanned:
	if (!game.actors.get(tokenDocument.actor.id).getFlag("world", "barsVisible")) {
		toggleBarVisibilityForToken(tokenDocument)
	}

	//Fix stress/structure
	if (tokenDocument.actor !== undefined) {
		let tokenBars = tokenDocument.getFlag("barbrawl", "resourceBars");
		let barNames = Object.keys(tokenBars);
		for (const barName of barNames) {
			/*
			Check if the bar has subdivisions
			If it does and the number doesn't match the bar max, fix it.
			*/
			let currentSubdivisions = tokenDocument.getFlag("barbrawl", "resourceBars." + barName + ".subdivisions");
			if (currentSubdivisions != undefined) {
				let propertyAssociated = tokenDocument.getFlag("barbrawl", "resourceBars." + barName + ".attribute");
				if (propertyAssociated.includes("derived"))	//It's a derived attribute, we get the actual attribute name by removing "derived."
					propertyAssociated = propertyAssociated.substring(propertyAssociated.indexOf('.') + 1);
				console.log(propertyAssociated);
				let maxValue = tokenDocument.actor.data.data.derived[propertyAssociated].max;
				console.log(maxValue);
				if (currentSubdivisions > maxValue) //There are more subdivisions than the maximum value for stress/structure, fix it
					tokenDocument.setFlag("barbrawl", "resourceBars." + barName + ".subdivisions", maxValue);
			}
		}
	}
});


async function toggleBarVisibilityForActor(sidebarActor) {
	//Let's get the current visibility for the prototype token to decide what to toggle it to.
	let newVisibility = undefined
	newVisibility = !(sidebarActor.getFlag("world", "barsVisible"));
	//Set the value
	await sidebarActor.setFlag("world", "barsVisible", newVisibility)

	//Now we get all currently active tokens and toggle the visibility for them.
	for (const actorToken of sidebarActor.getActiveTokens()) {
		await toggleBarVisibilityForToken(actorToken.document, newVisibility)
	}
}


async function toggleBarVisibilityForToken(tokenDocument, overrideVisibility = undefined) {
	let shouldBeVisible = false;
	let tokenBars = tokenDocument.getFlag("barbrawl", "resourceBars");
	const barNames = Object.keys(tokenBars);
	//if overrideVisibility is set, we set the visibility to that
	//if it's undefined, we simply toggle it from the current state
	if (overrideVisibility != undefined) {
		shouldBeVisible = overrideVisibility;
	} else {
		shouldBeVisible = (tokenDocument.getFlag("barbrawl", "resourceBars." + barNames[0] + ".otherVisibility") == 0)
	}


	let HPHidden = {
		"id": 'HPHidden',
		"label": 'HP Hidden',
		"icon": "modules/lancer-conditions/icons/util/blind.png"
	}

	//Toggle the HPHidden condition if needed
	let isEffectPresent = false;
	for (let item of tokenDocument.actor.effects.values()) {
		if (item.data.label.toLowerCase() == HPHidden.label.toLowerCase()) {
			isEffectPresent = true
			break
		}
	}
	console.log(isEffectPresent)
	console.log(shouldBeVisible)
	if (isEffectPresent == shouldBeVisible) {
		await tokenDocument.toggleActiveEffect(HPHidden);
	}



	for (const barName of barNames) {
		console.log(tokenDocument.getFlag("barbrawl", "resourceBars." + barName + ".otherVisibility"))
		/*
		We have the bar name, let's check the current visibility.
		All visiblities are synced together.
		Notes on the fields used by barbrawl:
		
		"visibility" is always 40. Doesn't seem to do anything?
		
		"otherVisibility" is the visibility for non-owners. 
		0 is never visible
		30 is on hover
		50 is always visible
		
		"ownerVisibility" is, well, the visibility for the owner
		-1 means it's inherited from "otherVisibility"
		0 is never visible
		10 is when selected
		30 is on hover
		35 is on hover or select
		50 is always visible
		*/

		//I'm going to assume that the GM should always be able to see the bars, so let's disable inheritance.
		if (tokenDocument.getFlag("barbrawl", "resourceBars." + barName + ".ownerVisibility") == -1)
			await tokenDocument.setFlag("barbrawl", "resourceBars." + barName + ".ownerVisibility", 50)

		console.log("shouldBeVisible: " + shouldBeVisible);
		console.log("current otherVisibility: " + tokenDocument.getFlag("barbrawl", "resourceBars." + barName + ".otherVisibility"));

		if (shouldBeVisible)
			await tokenDocument.setFlag("barbrawl", "resourceBars." + barName + ".otherVisibility", 50)
		else
			await tokenDocument.setFlag("barbrawl", "resourceBars." + barName + ".otherVisibility", 0)

		console.log("new otherVisibility: " + tokenDocument.getFlag("barbrawl", "resourceBars." + barName + ".otherVisibility"));
	}
}
