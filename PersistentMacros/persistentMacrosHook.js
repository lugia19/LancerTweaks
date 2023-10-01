//I didn't like how re-importing a character meant that any weapon macros you had dragged into the bar at the bottom would break, so I made this.
//It just calls the correct macro based on the FallbackLID, which never changes, unlike the itemID.

Hooks.once("init", function () {
	//This makes it so these functions can be called from macros.
	window["callMacro"] = callMacro;
})



function callMacro(targetFallbackLID, isGrenadeMine, useAction, actionID) {
	for (const token of canvas.tokens.controlled) {
		if (!token.isOwner)
			continue;

		var actorData = token.actor.data.data;
		var mechID = token.actor.data._id;

		console.log("acquired actorData");
		if ("loadout" in actorData) {
			console.log("acquired loadout");
			var actorLoadout = actorData.loadout;
			var systemMounts = actorLoadout.system_mounts;
			var weaponMounts = actorLoadout.weapon_mounts;
			for (const systemMount of systemMounts) {
				var system = systemMount.system;
				if (system.fallback_lid == targetFallbackLID) {
					if (isGrenadeMine) {
						mineDialog(mechID, system.id)
					} else if (useAction) {
						game.lancer.prepareActivationMacro(mechID, system.id, "Action", actionID)
					}
					else {
						game.lancer.prepareItemMacro(mechID, system.id)
					}
					console.log("executionEnd");
					return;
				}
			}
			for (const weaponMount of weaponMounts) {
				var weaponSlots = weaponMount.slots;
				for (const weaponSlot of weaponSlots) {
					var weapon = weaponSlot.weapon;
					console.log(weapon.id);
					if (weapon.fallback_lid == targetFallbackLID) {
						game.lancer.prepareItemMacro(mechID, weapon.id);
						console.log("executionEnd");
						return;
					}
				}
			}
		}

		console.log("Haven't found it in the loadout, looking in the talents.")
		if ("pilot" in actorData) {
			let pilotActor = game.actors.get(actorData["pilot"]["id"])
			for (const talent of pilotActor.data.items.values()) {
				if (talent.data.type == "talent") {
					if (talent.data.data.lid == targetFallbackLID) {
						if (useAction) {
							game.lancer.prepareActivationMacro(mechID, talent.id, "Action", actionID)
						}
						else {
							game.lancer.prepareItemMacro(mechID, talent.id)
						}
					}
				}
			}
		}
		console.log("executionEnd");
	}
}

//Used for grenades, to let the user pick whether to post the mine or grenade description.
function mineDialog(mechID, systemID) {
	new Dialog({
		title: "Select",
		content: "Use a grenade or place a mine?",
		buttons: {
			button1: {
				label: "Grenade",
				callback: () => { game.lancer.prepareActivationMacro(mechID, systemID, "Action", 0) },
				icon: `<i class="fas fa-check"></i>`
			},
			button2: {
				label: "Mine",
				callback: () => { game.lancer.prepareActivationMacro(mechID, systemID, "Deployable", 0) },
				icon: `<i class="fas fa-times"></i>`
			}
		}
	}).render(true);
}