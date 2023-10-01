//This is a helper macro. Basically, it lets you input an itemID and get back the fallbackLID.

const tokens = canvas.tokens.controlled;

const myContent = `
    Value:
  <input id="myInputID" type="text" value="" />
`;

new Dialog({
	title: "ID input",
	content: myContent,
	buttons: {
		button1: {
			label: "Input the ID of the weapon/system to find:",
			callback: (html) => findTargetID(html),
			icon: `<i class="fas fa-check"></i>`
		}
	}
}).render(true);

function showID(ID) {
	new Dialog({
		title: "Fallback lid:",
		content: ID,
		buttons: {}
	}).render(true);
}

function findTargetID(html) {
	const value = html.find("input#myInputID").val();
	let target_id = value;
	for (const token of tokens) {
		let actorData = token.actor.data.data;
		console.log("acquired actorData");
		if ("loadout" in actorData) {
			console.log("acquired loadout");
			let actorLoadout = actorData.loadout;
			let systemMounts = actorLoadout.system_mounts;
			let weaponMounts = actorLoadout.weapon_mounts;
			for (const systemMount of systemMounts) {
				let system = systemMount.system;
				if (system.id == target_id) {
					showID(system.fallback_lid)
					console.log("executionEnd");
					return;
				}
			}
			for (const weaponMount of weaponMounts) {
				let weaponSlots = weaponMount.slots;
				for (const weaponSlot of weaponSlots) {
					let weapon = weaponSlot.weapon;
					console.log(weapon.id);
					if (weapon.id == target_id) {
						showID(weapon.fallback_lid);
						console.log("executionEnd");
						return;
					}
				}
			}
		}
		if ("pilot" in actorData) {
			let pilotActor = game.actors.get(actorData["pilot"]["id"])
			let talent = pilotActor.items.get(target_id)
			showID(talent.data.data.lid)
		}
	}
}
