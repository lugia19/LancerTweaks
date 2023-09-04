//Toggle bar display + Fix stress/structure

//Everything here goes in a world script (added with esmodules in world.json)
Hooks.once("init", function () {
	//This makes it so these functions can be called from macros.
	window["toggleBarVisibility"] = toggleBarVisibility
})


Hooks.on("createToken", (tokenDocument, renderData, userID) => {
	console.log("New token created")

	//Hide the bars by default:
	toggleBarVisibility(tokenDocument)


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
				let maxValue = tokenDocument.actor.data.data[propertyAssociated];
				console.log(maxValue);
				if (currentSubdivisions > maxValue) //There are more subdivisions than the maximum value for stress/structure, fix it
					tokenDocument.setFlag("barbrawl", "resourceBars." + barName + ".subdivisions", maxValue);
			}
		}
	}
});


function toggleBarVisibility(tokenDocument) {
	let HPHidden = {
		"id": 'HPHidden',
		"label": 'HP Hidden',
		"icon": "modules/lancer-conditions/icons/util/blind.png"
	}

	let visibilityChecked = false;
	let shouldBeVisible = false;

	//Toggle the HPHidden condition
	tokenDocument.toggleActiveEffect(HPHidden, true, true);

	let tokenBars = tokenDocument.getFlag("barbrawl", "resourceBars");
	const barNames = Object.keys(tokenBars);
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
			tokenDocument.setFlag("barbrawl", "resourceBars." + barName + ".ownerVisibility", 50)


		if (!visibilityChecked) {
			visibilityChecked = true;
			shouldBeVisible = (tokenDocument.getFlag("barbrawl", "resourceBars." + barName + ".otherVisibility") == 0);
		}

		console.log("visibilityChecked: " + visibilityChecked);
		console.log("shouldBeVisible: " + shouldBeVisible);
		console.log("current otherVisibility: " + tokenDocument.getFlag("barbrawl", "resourceBars." + barName + ".otherVisibility"));

		if (shouldBeVisible)
			tokenDocument.setFlag("barbrawl", "resourceBars." + barName + ".otherVisibility", 50)
		else
			tokenDocument.setFlag("barbrawl", "resourceBars." + barName + ".otherVisibility", 0)

		console.log("new otherVisibility: " + tokenDocument.getFlag("barbrawl", "resourceBars." + barName + ".otherVisibility"));
	}
}

