// Constants
const GAME_FLAGS = {
	RandomObjects: 1 << 0,
	BadgeUnlocks:  1 << 1,
	Recording:     1 << 2,
	Tutorial:      1 << 3,
	BotRecharging: 1 << 4,
	BotLimit:      1 << 5,
}

// Functions
export function deserializeWorld(worldJson) {
	// Options
	const options = worldJson['GameOptions'];
	const planetName = options['Name'];
	const mode = options['GameModeName'].substring(4);
	const seed = options['Seed'];
	let flags = 0;
	if (options['RandomObjectsEnabled']) {
		flags |= GAME_FLAGS.RandomObjects;
	}
	if (options['BadgeUnlocksEnabled']) {
		flags |= GAME_FLAGS.BadgeUnlocks;
	}
	if (options['RecordingEnabled']) {
		flags |= GAME_FLAGS.Recording;
	}
	if (options['TutorialEnabled']) {
		flags |= GAME_FLAGS.Tutorial;
	}
	if (options['BotRechargingEnabled']) {
		flags |= GAME_FLAGS.BotRecharging;
	}
	if (options['BotLimitEnabled']) {
		flags |= GAME_FLAGS.BotLimit;
	}
	return new World(planetName, mode, seed, flags);
}

// Classes
export class World {
	/* Constructor */
	constructor(planetName, mode, seed, flags) {
		this.planetName = planetName;
		this.mode = mode;
		this.seed = seed;
		this.flags = flags;
	}
}
