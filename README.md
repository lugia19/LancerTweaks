# Miscellaneous LANCER tweaks

This repository just holds all the macros/code I've made for my LANCER campaign, which I hope might be helpful for others.

Note: most of these require you to add world scripts. See [here](https://foundryvtt.wiki/en/basics/world-scripts) for details on how to do so.

If you need help, you can find me on the LANCER discord (lugia19).

**WARNING: ALL OF THESE WERE DEVELOPED FOR V9. SOME OF THEM (ESPECIALLY THE SCAN) MAY REQUIRE CHANGES TO WORK WITH V10.**

## Open enemy scan on Shift+Click

**Demo**: 

https://github.com/lugia19/LancerTweaks/assets/21088033/f9ffc45b-6749-4df7-baae-750ae5a889db



**Prerequisites**: TriggerHappy 

Allows players to Shift+Click enemies and open their corresponding Scan entry. 

This assumes that the corresponding Scan is the one with the enemy's name in its title.


<details>
	<summary>Installation/Usage (Click to expand)</summary>
	
	- Add scanOnShiftClickHooks.js as a world script.
	
	- Copy the contents of enableScanForTokenMacro.js into a macro.

	- Create the 'Trigger Happy' journal directory, and a journal inside it also called 'Trigger Happy'.
	
	NOTE: The script assumes that you have not changed the default trigger happy settings (specifically, the triggers folder and journal entry should both be "Trigger Happy").

	- Create the Scan entry for an enemy (I believe there's a macro for that.)

	- Make sure the Scan entry's title contains the enemy's name.

	- Have the GM select the token and run the enableScanForToken marco added earlier. 
	
	- This will enable shift-clicking for all tokens of that actor (enemy type).

</details>

## Automated condition effects

**Demo**: 

https://github.com/lugia19/LancerTweaks/assets/21088033/3428fff8-209f-4c31-b8b4-35806892c3b0




**Prerequisites**: TokenMagicFX and Lancer Conditions.

It will automatically apply effects to tokens depending on their heat, overshield, conditions, burn, etc.

There's a bunch of stuff in the background to ensure that the effects look good no matter which order they're applied in, so you don't need to worry about that.

### Installation
Add automatedConditionsHooks.js as a world script.



## Fix Stress/Structure bars and toggle bar visibility for players

**Demo**:

https://github.com/lugia19/LancerTweaks/assets/21088033/a0318a11-9e65-4fab-8649-794dc339f1d4



**Prerequisites**: Bar Brawl

The world script does two things:
1) Allows you to have the correct stress/structure amounts without using the LANCER-specific Bar Brawl fork.
2) Hides the status bars of enemies for players by default.

The macro simply lets you toggle the bar visibility visibility of all selected tokens.

### Installation/Usage

- Add fixAndHideBarsHooks.js as a world script (this will automatically fix and hide bars when a token is added).

- Copy the contents of toggleBarVisibilityMacro.js into a macro. 

- Use the macro as the GM to show/re-hide the bars for all selected tokens.



## Prompt for effects on hit

**Demo**: 

https://github.com/lugia19/LancerTweaks/assets/21088033/d317a75a-1ba5-4ad2-8d9c-d155766dd1e7



**Prerequisites**: N/A

This is purely a world script, and it makes it so the game will prompt you for certain "on hit" effects.

So far, I've only implemented shock wreath (will only ask if you actually have the mod installed on the current weapon) and the exemplar's mark (will only ask if you have the talent).

### Installation

Add onHitEffectsHooks.js as a world script.



## Persistent weapon macros in the token bar

So this one is more niche and complicated to set up. 

Essentially, I noticed that when you re-import a character (such as when leveling up) if you dragged any weapon/system rolls from the sheet to the token bar at the bottom, they will break, as the IDs change.

The world script allows you to construct macros that will instead use the fallback_LID to trigger attacks.

There's also a couple additional things, such as letting you specify an action, or asking you if you'd like to use a grenade or place a mine.


### Installation/Usage

Add persistentMacrosHook.js as a world script.

Copy the contents of getFallbackLIDFromItemID.js into a macro and use it to figure out the fallbackLID of an item/weapon.

Create a new macro following the examples in persistentMacrosExample.js, and use it.
