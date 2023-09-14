
//This hook is for tokens that are unlinked from their actor.
Hooks.on("updateToken", (tokenDocument, tokenChanges, updateData, options) => {
	//If this is getting called, the token doesn't have an actorLink.
	console.log("Token update hook triggered")
	console.log(tokenDocument)
	console.log(tokenChanges)
	if (tokenDocument.actor.type == "pilot") {
		console.log("Cancelling token update because it's for pilot")
		return
	}


	updateTokenEffectsFromChanges(tokenChanges?.actorData, tokenDocument.actor, tokenDocument.object)
});


//This is the hook for tokens tied to actors.
Hooks.on("updateActor", (actor, actorChanges, context, userID) => {
	if (game.userId != userID)
		return

	if (actor.type == "pilot") {
		return
	}

	console.log("Actor update hook triggered")
	//Loop through all the tokens and only update the ones tied to the actor.
	//The rest will be updated by the other hook.
	for (var token of actor.getActiveTokens()) {
		if (token.data.actorLink) {
			updateTokenEffectsFromChanges(actorChanges, actor, token)
		}
	}
	return
});


//These two hooks handle when an activeEffect (icon) is added/removed.
Hooks.on("preCreateActiveEffect", (effectProperties, effectData, effectState, userID) => {
	if (game.userId != userID)
		return
	let token = effectProperties.parent.getActiveTokens()[0]

	//We've got the token and the effectData. Let's see which effect it is...
	toggleCondition(token, effectData.label, true)
});

Hooks.on("deleteActiveEffect", (effectProperties, effectState, userID) => {
	if (game.userId != userID)
		return
	let token = effectProperties.parent.getActiveTokens()[0]

	//We've got the token and the effectData. Let's see which effect it is...
	toggleCondition(token, effectProperties.data.label, false)
});


function updateTokenEffectsFromChanges(actorChanges, actor, token) {
	if (actorChanges?.data?.heat != undefined) {
		var currentHeat = actorChanges.data.heat
		/*if (token.data.actorLink) {
			var currentHeat = actor.data.data.derived.heat.value ?? 0
		} else {//No actorLink. Get the data directly.
			var currentHeat = token.data.actorData.data.heat ?? 0
		}*/

		var heatCap = actor.data.data.derived.heat.max ?? 1
		toggleCondition(token, "dangerzone", (currentHeat >= heatCap / 2))
	}

	if (actorChanges?.data?.hp != undefined || actorChanges?.data?.structure != undefined) {
		var currentHP = actorChanges.data.hp ?? actor.data.data.derived.hp.value
		var currentStructure = actorChanges.data.structure ?? actor.data.data.derived.structure.value
		toggleCondition(token, "destroyed", (currentHP == 0 && currentStructure == 0))
	}

	if (actorChanges?.data?.burn != undefined) {
		var currentBurn = actorChanges.data.burn
		toggleCondition(token, "burn", currentBurn > 0)
		let effect = {
			"id": "burnAE",
			"label": "Burn",
			"icon": "modules/lancer-conditions/icons/util/burn.png"
		}
		let isEffectPresent = false;
		for (let item of actor.effects.values()) {
			if (item.data.label.toLowerCase() == effect.label.toLowerCase()) {
				isEffectPresent = true
				break
			}
		}
		if (currentBurn > 0 && !isEffectPresent) {
			token.document.toggleActiveEffect(effect, { active: true });
		} else if (currentBurn <= 0 && isEffectPresent) {
			token.document.toggleActiveEffect(effect, { active: false });
		}
	}

	if (actorChanges?.data?.overshield != undefined) {
		var currentOvershield = actorChanges.data.overshield
		toggleCondition(token, "overshield", currentOvershield > 0)
		let effect = {
			"id": "overshieldAE",
			"label": "Overshield",
			"icon": "modules/lancer-conditions/icons/util/overshield.png"
		}
		let isEffectPresent = false;
		for (let item of actor.effects.values()) {
			if (item.data.label.toLowerCase() == effect.label.toLowerCase()) {
				isEffectPresent = true
				break
			}
		}
		if (currentOvershield > 0 && !isEffectPresent) {
			token.document.toggleActiveEffect(effect, { active: true });
		} else if (currentOvershield <= 0 && isEffectPresent) {
			token.document.toggleActiveEffect(effect, { active: false });
		}
	}
}




//This basically toggles a condition's visual effects
async function toggleCondition(token, effectLabel, enabled) {
	/*
	What this function does is the following:
	-Checks if the condition is already enabled/disabled (and returns doing nothing if so)
	-Removes every single effect
	-Re-adds them (including the new one, or minus the one we're removing)
	It does this following the order of filterIDsPerCondition. 
	This is done to avoid glitchy effects that can happen, for example, if applying burn first then invisibility.
	*/
	console.log("toggleCondition called")
	effectLabel = effectLabel.toLowerCase()

	//The order here matters - it's the order in which they'll be applied
	let filterIDsPerCondition = {
		"prone": ["proneFall"],
		"exposed": ["MeltdownGlow"],
		"impaired": ["Impaired"],
		"jammed": ["JammedStatic", "StaticLine"],
		"overshield": ["overshield"],
		"burn": ["BurnCondition"],
		"dangerzone": ["DangerZoneGlow", "DangerZoneBloom"],
		"destroyed": ["BlackenedMetal", "SmokingDestroyed"],
		"invisible": ["DataCrackle", "WhiteNoiseEdge", "ShiftingImage"],
		"flying": ["flight", "UnderShadow"],
	}
	let currentConditions = []

	//Check if a condition is present. If it is, add it to currentConditions to be re-applied later.
	//This runs in the order of filterIDsPerCondition.
	for (const [condition, filterIDs] of Object.entries(filterIDsPerCondition)) {
		console.log(`Checking condition ${condition}...`)
		let conditionCurrentlyEnabled = false
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID) && effectLabel == condition && enabled) {
				console.log("Condition was already enabled, return")
				return
			}
			if (token.TMFXhasFilterId(filterID) && effectLabel == condition) {
				conditionCurrentlyEnabled = true
			}

			if ((token.TMFXhasFilterId(filterID) || (effectLabel == condition && enabled))) {
				if (effectLabel == condition && enabled) {
					console.log("Condition should be enabled due to update, adding to array.")
					currentConditions.push(condition)
					break
				}
				if (token.TMFXhasFilterId(filterID)) {
					if (effectLabel == condition && !enabled) {
						console.log("Condition should be disabled due to update, not adding to array.")
					} else {
						console.log("Condition was already active, so needs to be re-applied. Adding to array.")
						currentConditions.push(condition)
						break
					}
				}
			}
		}

		if (!conditionCurrentlyEnabled && effectLabel == condition && !enabled) {
			console.log("Condition was already disabled, return")
			return
		}
	}
	console.log(currentConditions)
	//Clear all conditions, then re-apply them

	await token.TMFXdeleteFilters();
	//Run the associated function
	for (const condition of Object.keys(filterIDsPerCondition)) {
		let enabledCondition = currentConditions.includes(condition);
		console.log(`Setting condition ${condition} to ${enabledCondition}`)
		switch (condition) {
			case "invisible":
				await toggleInvisible(token, enabledCondition);
				break;
			case "impaired":
				await toggleImpaired(token, enabledCondition);
				break;
			case "jammed":
				await toggleJammed(token, enabledCondition);
				break;
			case "flying":
				await toggleFlight(token, enabledCondition);
				break;
			case "prone":
				await toggleProne(token, enabledCondition);
				break;
			case "exposed":
				await toggleExposed(token, enabledCondition);
				break;
			case "burn":
				await toggleBurn(token, enabledCondition);
				break;
			case "dangerzone":
				await toggleDangerZone(token, enabledCondition);
				break;
			case "destroyed":
				await toggleDestroyed(token, enabledCondition);
				break;
			case "overshield":
				await toggleOvershield(token, enabledCondition);
				break;
		}
	}
}


//This one's a bit redundant now, but still. This just ensures it doesn't apply an effect twice.
async function conditionCleanup(token, filterIDs) {
	for (const filterID of filterIDs) {
		if (token.TMFXhasFilterId(filterID)) {
			await token.TMFXdeleteFilters(filterID);
		}
	}
}

//All the code below here is taken from the lancer conditions FX macros (Don't remember where I got em from).
//These are just TokenMagicFX effects.
async function toggleDangerZone(token, enabled) {
	let filterIDs = ["DangerZoneGlow", "DangerZoneBloom"]
	if (!enabled) {
		conditionCleanup(token, filterIDs)
	} else {
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID)) {
				//We already have one of the filters - don't re-apply them.
				return
			}
		}
		//In the danger zone and without filters, add them.
		let params =
			[{
				filterType: "glow",
				filterId: "DangerZoneGlow",
				outerStrength: 4,
				innerStrength: 2,
				color: 0xff9633,
				quality: 0.5,
				padding: 10,
				animated:
				{
					color:
					{
						active: true,
						loopDuration: 6000,
						animType: "colorOscillation",
						val1: 0xEE5500,
						val2: 0xff9633
					},
					outerStrength:
					{
						active: true,
						loopDuration: 6000,
						animType: "cosOscillation",
						val1: 2,
						val2: 5
					}
				}
			},
			{
				filterType: "xbloom",
				filterId: "DangerZoneBloom",
				threshold: 0.35,
				bloomScale: 0,
				brightness: 1,
				blur: 0.1,
				padding: 10,
				quality: 15,
				blendMode: 0,
				animated:
				{
					bloomScale:
					{
						active: true,
						loopDuration: 6000,
						animType: "sinOscillation",
						val1: 0.4,
						val2: 1.0
					}
				}
			}];
		await token.TMFXaddUpdateFilters(params);
	}
};

async function toggleDestroyed(token, enabled) {
	let filterIDs = ["BlackenedMetal", "SmokingDestroyed"]
	if (!enabled) {
		//Not destroyed  and with the filters enabled, clear them.
		conditionCleanup(token, filterIDs)
		return
	} else {
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID)) {
				//We already have one of the filters - don't re-apply them.
				return
			}
		}

		let params =
			[{

				filterType: "shadow",
				filterId: "BlackenedMetal",
				rotation: 270,
				blur: 0.5,
				quality: 5,
				distance: 20,
				alpha: 0.5,
				padding: 300,
				shadowOnly: false,
				color: 0x808080,
				zOrder: 6000
			},
			{
				filterType: "smoke",
				filterId: "SmokingDestroyed",
				color: 0xDDDDDD,
				time: 0,
				blend: 8,
				dimX: 6,
				dimY: 1,
				animated:
				{
					time:
					{
						active: true,
						speed: 0.001,
						animType: "move"
					}
				}
			}];
		await token.TMFXaddUpdateFilters(params);
	}
};

async function toggleBurn(token, enabled) {
	let filterIDs = ["BurnCondition"]
	if (!enabled) {
		conditionCleanup(token, filterIDs)
	} else {
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID)) {
				//We already have one of the filters - don't re-apply them.
				return
			}
		}

		let params =
			[{
				filterType: "xglow",
				filterId: "BurnCondition",
				auraType: 2,
				color: 0x903010,
				thickness: 9.8,
				scale: 4.,
				time: 0,
				auraIntensity: 2,
				subAuraIntensity: 1.5,
				threshold: 0.40,
				discard: true,
				animated:
				{
					time:
					{
						active: true,
						speed: 0.0027,
						animType: "move"
					},
					thickness:
					{
						active: true,
						loopDuration: 3000,
						animType: "cosOscillation",
						val1: 2,
						val2: 5
					}
				}
			}];
		await token.TMFXaddUpdateFilters(params);
	}
};

async function toggleOvershield(token, enabled) {
	let filterIDs = ["overshield"]
	if (!enabled) {
		//Not enabled and with the filters enabled, clear them.
		conditionCleanup(token, filterIDs)
	} else if (enabled) {
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID)) {
				//We already have one of the filters - don't re-apply them.
				return
			}
		}
		let params =
			[{
				filterType: "smoke",
				filterId: "overshield",
				color: 0x1050FF,
				time: 0,
				blend: 2,
				dimX: 1,
				dimY: 1,
				animated:
				{
					time:
					{
						active: true,
						speed: 0.0015,
						animType: "move"
					}
				}
			}];
		await token.TMFXaddUpdateFilters(params);
	}
};

async function toggleInvisible(token, enabled) {
	let filterIDs = ["DataCrackle", "WhiteNoiseEdge", "ShiftingImage"]
	if (!enabled) {
		//Not enabled and with the filters enabled, clear them.
		conditionCleanup(token, filterIDs)
	} else if (enabled) {
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID)) {
				//We already have one of the filters - don't re-apply them.
				return
			}
		}
		let params =
			[{
				filterType: "oldfilm",
				filterId: "DataCrackle",
				sepia: 0,
				noise: 0.3,
				noiseSize: 1.0,
				alphaDiscard: true,
				scratch: 0.9,
				scratchDensity: 0.3,
				scratchWidth: 1.2,
				vignetting: 0.1,
				vignettingAlpha: .9,
				vignettingBlur: 0.5,
				animated:
				{
					seed:
					{
						active: true,
						animType: "randomNumber",
						val1: 0,
						val2: 1
					},
					vignetting:
					{
						active: true,
						animType: "syncCosOscillation",
						loopDuration: 6000,
						val1: 0.2,
						val2: 0.4
					}
				}
			},
			{
				filterType: "outline",
				filterId: "WhiteNoiseEdge",
				color: 0x000000,
				thickness: 0,
				zOrder: 61
			},
			{
				filterType: "liquid",
				filterId: "ShiftingImage",
				color: 0x20AAEE,
				time: 0,
				blend: 9,
				alphaDiscard: true,
				intensity: 2.25,
				spectral: true,
				scale: 0.8,
				animated:
				{
					time:
					{
						active: true,
						speed: 0.00015,
						animType: "move"
					},
					color:
					{
						active: true,
						loopDuration: 9000,
						animType: "colorOscillation",
						val1: 0xFFFFFF,
						val2: 0xDDDDDD
					}
				}
			}];
		await token.TMFXaddUpdateFilters(params);
	}
};

async function toggleImpaired(token, enabled) {
	let filterIDs = ["Impaired"]
	if (!enabled) {
		//Not enabled and with the filters enabled, clear them.
		conditionCleanup(token, filterIDs)
	} else if (enabled) {
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID)) {
				//We already have one of the filters - don't re-apply them.
				return
			}
		}
		let params =
			[{
				filterType: "xfire",
				filterId: "Impaired",
				color: 0xACC5C5,
				time: 0,
				blend: 2,
				amplitude: 1,
				dispersion: 0,
				chromatic: false,
				scaleX: 1,
				scaleY: 1,
				inlay: true,
				animated:
				{
					time:
					{
						active: true,
						speed: -0.0020,
						animType: "move"
					}
				}
			}];
		await token.TMFXaddUpdateFilters(params);
	}
};

async function toggleJammed(token, enabled) {
	let filterIDs = ["JammedStatic", "StaticLine"]
	if (!enabled) {
		//Not enabled and with the filters enabled, clear them.
		conditionCleanup(token, filterIDs)
	} else if (enabled) {
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID)) {
				//We already have one of the filters - don't re-apply them.
				return
			}
		}
		let params =
			[{
				filterType: "oldfilm",
				filterId: "JammedStatic",
				sepia: 0.0,
				noise: 0.5,
				noiseSize: 0.8,
				scratch: 0.8,
				scratchDensity: 0.6,
				scratchWidth: 1.3,
				vignetting: 0.9,
				vignettingAlpha: 0.6,
				vignettingBlur: 0.2,
				animated:
				{
					seed:
					{
						active: true,
						animType: "randomNumber",
						val1: 0,
						val2: 1
					},
					vignetting:
					{
						active: true,
						animType: "syncCosOscillation",
						loopDuration: 2000,
						val1: 0.2,
						val2: 0.4
					}
				}
			},
			{
				filterType: "outline",
				filterId: "StaticLine",
				color: 0x000000,
				thickness: 1,
				zOrder: 61
			}];
		await token.TMFXaddUpdateFilters(params);
	}
};

async function toggleProne(token, enabled) {
	let filterIDs = ["proneFall"]
	if (!enabled) {
		//Not enabled and with the filters enabled, clear them.
		conditionCleanup(token, filterIDs)
	} else if (enabled) {
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID)) {
				//We already have one of the filters - don't re-apply them.
				return
			}
		}
		let params =
			[{
				filterType: "transform",
				filterId: "proneFall",
				rotation: 270
			}];
		await token.TMFXaddUpdateFilters(params);
	}
};

async function toggleExposed(token, enabled) {
	let filterIDs = ["MeltdownGlow"]
	if (!enabled) {
		//Not enabled and with the filters enabled, clear them.
		conditionCleanup(token, filterIDs)
	} else if (enabled) {
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID)) {
				//We already have one of the filters - don't re-apply them.
				return
			}
		}
		let params =
			[{
				filterType: "xfire",
				filterId: "MeltdownGlow",
				time: 0,
				blend: 0,
				amplitude: 0.3,
				dispersion: -1,
				chromatic: false,
				scaleX: 1,
				scaleY: 1,
				inlay: true,
				animated:
				{
					time:
					{
						active: true,
						speed: -0.030,
						animType: "move"
					}
				}
			}];
		await token.TMFXaddUpdateFilters(params);
	}
};

async function toggleFlight(token, enabled) {
	let filterIDs = ["flight", "UnderShadow"]
	if (!enabled) {
		//Not enabled and with the filters enabled, clear them.
		conditionCleanup(token, filterIDs)
	} else if (enabled) {
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID)) {
				//We already have one of the filters - don't re-apply them.
				return
			}
		}
		let params =
			[{
				filterType: "transform",
				filterId: "flight",
				padding: 10,
				animated:
				{
					translationX:
					{
						animType: "sinOscillation",
						val1: -0.025,
						val2: +0.025,
						loopDuration: 3500,
					},
					translationY:
					{
						animType: "cosOscillation",
						val1: -0.025,
						val2: +0.025,
						loopDuration: 3500,
					}
				}
			},
			{
				filterType: "shadow",
				filterId: "UnderShadow",
				rotation: 55,
				blur: 1,
				quality: 5,
				distance: 20,
				alpha: 0.5,
				padding: 10,
				shadowOnly: false,
				color: 0x000000,
				zOrder: 6000,

			}];
		await token.TMFXaddUpdateFilters(params);
	}
};

//This is unused, just acts as a reference for all the others.
let toggleBase = async function (token, enabled) {
	let filterIDs = [""]
	if (!enabled) {
		//Not enabled and with the filters enabled, clear them.
		conditionCleanup(token, filterIDs)
	} else if (enabled) {
		for (const filterID of filterIDs) {
			if (token.TMFXhasFilterId(filterID)) {
				//We already have one of the filters - don't re-apply them.
				return
			}
		}
		let params = [

		]
		await token.TMFXaddUpdateFilters(params);
	}
};

