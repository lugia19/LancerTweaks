//The baseline for this was taken from lancer-weapon-fx: https://github.com/Z3nner/lancer-weapon-fx/blob/main/scripts/WeaponFX.js#L102C7-L102C7
//Except an older version, since I'm still on v9 - pretty sure this code would have to be different for v10
function _getTokenByIdOrActorId(id) {
	let token = canvas.tokens.get(id);
	if (!token) {
		token = canvas.tokens.ownedTokens.filter(t => t.actor.id == id)?.[0];
		if (!token) {
			console.log("No token with id '" + id + "' found.");
			return {};
		}
	}
	return token;
}

// Every time a chat message is posted...
Hooks.on("createChatMessage", (data) => {
	// output the chat message data to console for easy reading
	if (game.user.id !== data.user.id) return
	let chatMessageDataContent = data.data.content ?? '';
	console.log("Shock wreath hook...")
	// Parse the chat message as XML so that we can navigate through it
	const parser = new DOMParser();
	const chatMessage = parser.parseFromString(chatMessageDataContent, "text/html");
	// try to get macro details from reroll data
	// reroll data is embedded in the chat message under the reroll link in the `data-macro` attribute of the reroll <a> tag.
	// the reroll data is a JSON string that has been `encodeURIComponent`'d and then base64-encoded.
	let encodedRerollData = chatMessage.querySelectorAll("[data-macro]")?.[0]?.getAttribute("data-macro");
	if (!encodedRerollData) {
		return;
	}
	let rerollData = JSON.parse(decodeURIComponent(atob(encodedRerollData)));
	console.log(rerollData)
	const sourceInfo = rerollData.args[0];
	const weaponItemId = rerollData.args[1];
	let sourceToken = _getTokenByIdOrActorId(sourceInfo.id);
	let loadout = sourceToken.actor.data.data.loadout
	const targetTokens = rerollData.args[3].targets.map(t => _getTokenByIdOrActorId(t.target_id));
	console.log(targetTokens)


	//Let's check all the mods, to see what on hit effects we can apply.
	for (const weaponMount of loadout.weapon_mounts) {
		var weaponSlots = weaponMount.slots;
		for (const weaponSlot of weaponSlots) {
			var weapon = weaponSlot.weapon;
			if (weapon.id == weaponItemId) {
				if ("mod" in weaponSlot) {
					try {
						var weaponMod = weaponSlot.mod;
						if (weaponMod.fallback_lid == "wm_shock_wreath") {
							console.log("Has shock wreath")
							shockWreathDialog(sourceToken.actor.data.name);
						}

					} catch (e) {

					}
				}
			}
		}
	}

	let pilot = game.actors.get(sourceToken.actor.data.data.pilot.id)
	console.log(pilot)
	//Let's check all the pilot talents for any other effects.
	for (const item of pilot.data.items.values()) {
		if (item.data.type == "talent") {
			console.log(item)
			if (item.data.name == "EXEMPLAR") {
				if (item.data.data.ranks.length >= 1) {
					if (targetTokens.length >= 0)
						yesNoDialog(sourceToken.actor.data.name, "Apply exemplar's mark?", "Applied Exemplar's mark to target.")
					exemplarDialog(targetTokens[0])	//We only apply it to the first selected token.
				}
			}
		}
	}
});

function yesNoDialog(speaker, question, positiveReply) {
	new Dialog({
		title: "Select",
		content: question,
		buttons: {
			button1: {
				label: "Yes",
				callback: () => {
					ChatMessage.create({
						user: game.user._id,
						speaker: { alias: speaker },
						content: positiveReply
					});
				},
				icon: `<i class="fas fa-check"></i>`
			},
			button2: {
				label: "No",
				callback: () => { },
				icon: `<i class="fas fa-times"></i>`
			}
		}
	}).render(true);
}



function shockWreathDialog(speaker) {
	new Dialog({
		title: "Select",
		content: "Use shock wreath?",
		buttons: {
			button1: {
				label: "Yes",
				callback: () => {
					let roll = new Roll("1d6").evaluate({ async: false });
					let results_html = shockWreathConstructResultMessage(roll);

					ChatMessage.create({
						user: game.user._id,
						speaker: { alias: speaker },
						content: results_html
					});
					shockWreathSFX(1);
				},
				icon: `<i class="fas fa-check"></i>`
			},
			button2: {
				label: "Critical!",
				callback: () => {
					let roll = new Roll("2d6kh1").evaluate({ async: false });
					let results_html = shockWreathConstructResultMessage(roll);

					ChatMessage.create({
						user: game.user._id,
						speaker: { alias: speaker },
						content: results_html
					});
					shockWreathSFX(3);
				},
				icon: `<i class="fas fa-exclamation"></i>`
			},
			button3: {
				label: "No",
				callback: () => { },
				icon: `<i class="fas fa-times"></i>`
			}
		}
	}).render(true);
}

function shockWreathSFX(repeats) {
	let sequence = new Sequence();
	for (let target of Array.from(game.user.targets)) {
		sequence.sound()
			.file("modules/lancer-weapon-fx/soundfx/Missile_Impact.ogg")
			.delay(200)
			.volume(0.5)
			.repeats(repeats, 100)
		sequence.effect()
			.file("jb2a.explosion.01.orange")
			.atLocation(target, { randomOffset: 1 })
			.delay(200)
			.scale(0.5)
			.repeats(repeats, 100)
			.waitUntilFinished()
	}
	sequence.play();
}

function shockWreathConstructResultMessage(roll) {
	return `
	<div class="card clipped">
	<div class="lancer-mini-header collapse-trigger" data-collapse-id="b7cacfda-b2b9-4a3c-8e18-e87216226334-damage">// SHOCK WREATH DAMAGE //</div>
	<div class="dice-roll lancer-dice-roll collapse" data-collapse-id="b7cacfda-b2b9-4a3c-8e18-e87216226334-damage">
	<div class="dice-result">
		<div class="dice-formula lancer-dice-formula flexrow">
		<span style="text-align:left;margin-left:5px">`+ roll.formula + `</span>
		<span class="dice-total lancer-dice-total major">`+ roll.total + `</span>
		<i class="cci cci-burn i--m damage--burn"> </i>
		</div>
		<div style="text-align:left">
		<div class="dice-tooltip" style="display: none;">
			<section class="tooltip-part">
			<div class="dice">
				<header class="part-header flexrow">
				<span class="part-formula">`+ roll.formula + `</span>
				
				<span class="part-total">`+ roll.total + `</span>
				</header>
				<ol class="dice-rolls">
				<li class="roll die d6">`+ roll.result + `</li>
				</ol>
			</div>
			</section>
		</div>
		</div>
	</div>
	</div>
</div>

<div class="card clipped">
	<div class="lancer-mini-header">// EFFECT //</div>
	<span class="effect-text">If the target is already suffering from burn, it can only draw line of sight to adjacent spaces until the end of its next turn.</span>
</div>
`
}