//This macro lets the GM toggle bar visibility for all selected tokens

const tokens = canvas.tokens.controlled;

for (const token of tokens) {
	toggleBarVisibilityForToken(token.document)
}


//This macro lets the GM toggle bar visibility for all tokens of the currently selected enemy types, as well as any future tokens of that enemy.
let uniqueActorIds = new Set();
for (const token of canvas.tokens.controlled) {
	if (token.actor && token.actor.id) {
		uniqueActorIds.add(token.actor.id);
	}
}
uniqueActorIds = [...uniqueActorIds];
console.log('Unique actor IDs:', uniqueActorIds);

for (const id of uniqueActorIds) {
	toggleBarVisibilityForActor(game.actors.get(id))
}
