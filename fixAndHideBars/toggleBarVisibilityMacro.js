//This macro lets the GM toggle bar visibility for all selected tokens

const tokens = canvas.tokens.controlled;

for (const token of tokens) {
	toggleBarVisibility(token.document)
}