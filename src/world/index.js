// Imports
import { CHUNK_WIDTH, CHUNK_HEIGHT, compressChunks, decompressChunks, globalToChunkPosition } from './chunk.js';
import { deserializeEntity } from './entity.js';

// Constants
const VERSION = "140.2";
const FLAGS = {
	RandomObjects: 1 << 0,
	BadgeUnlocks:  1 << 1,
	Recording:     1 << 2,
	Tutorial:      1 << 3,
	BotRecharging: 1 << 4,
	BotLimit:      1 << 5,
};

// Functions
export function deserializeWorld(worldJson) {
	// Options
	const optionsJson = worldJson['GameOptions'];
	let flags = 0;
	if (optionsJson['RandomObjectsEnabled']) flags |= FLAGS.RandomObjects;
	if (optionsJson['BadgeUnlocksEnabled'])  flags |= FLAGS.BadgeUnlocks;
	if (optionsJson['RecordingEnabled'])     flags |= FLAGS.Recording;
	if (optionsJson['TutorialEnabled'])      flags |= FLAGS.Tutorial;
	if (optionsJson['BotRechargingEnabled']) flags |= FLAGS.BotRecharging;
	if (optionsJson['BotLimitEnabled'])      flags |= FLAGS.BotLimit;
	const spawn = [optionsJson['StartPositionX'], optionsJson['StartPositionY']];
	const options = {
		mode: optionsJson['GameModeName'].substring(4),
		size: optionsJson['GameSize'],
		flags: flags,
		seed: optionsJson['Seed'],
		planetName: optionsJson['Name'],
	};
	// Chunks
	const tileJson = worldJson['Tiles'];
	const visibilityJson = worldJson['Plots']['PlotsVisible'];
	const size = [tileJson['TilesWide'], tileJson['TilesHigh']];
	const chunks = decompressChunks(visibilityJson, tileJson['TileTypes'], size);
	// Entities
	for (let i = 0; i < worldJson['Objects'].length; ++i) {
		const entityJson = worldJson['Objects'][i];
		const [cX, cY, dX, dY] = globalToChunkPosition(entityJson['TX'], entityJson['TY']);
		chunks[cY][cX].tiles[dY][dX].entities.push(deserializeEntity(entityJson));
	}
	return new World(options, spawn, chunks);
}

export function serializeWorld(world) {
	// Chunks | Entities
	const [visibility, tiles, entities] = compressChunks(world.chunks, world.size);
	// Autonauts world object
	return {
		AutonautsWorld: 1,
		Version: VERSION,
		External: 0,
		GameOptions: {
			GameModeName: `Mode${world.options.mode}`,
			GameSize: world.options.size,
			RandomObjectsEnabled: Boolean(world.options.flags & FLAGS.RandomObjects),
			BadgeUnlocksEnabled:  Boolean(world.options.flags & FLAGS.BadgeUnlocks),
			RecordingEnabled:     Boolean(world.options.flags & FLAGS.Recording),
			TutorialEnabled:      Boolean(world.options.flags & FLAGS.Tutorial),
			BotRechargingEnabled: Boolean(world.options.flags & FLAGS.BotRecharging),
			BotLimitEnabled:      Boolean(world.options.flags & FLAGS.BotLimit),
			Seed: world.options.seed,
			Name: world.options.planetName,
			StartPositionX: world.spawn[0],
			StartPositionY: world.spawn[1]
		},
		Tiles: {
			RLE: 1,
			TilesWide: world.size[0],
			TilesHigh: world.size[1],
			TileTypes: tiles
		},
		Plots: {
			PlotsVisible: visibility
		},
		Objects: entities
	};
}

// Classes
export class World {
	/* Constructor */
	constructor(options, spawn, chunks) {
		this.options = options;
		this.spawn = spawn;
		this.chunks = chunks;
	}
	/* Instance Methods */
	getChunk(x, y) {
		const [cX, cY, _] = globalToChunkPosition(x, y);
		return this.chunks[cY][cX];
	}
	getTile(x, y) {
		const [cX, cY, dX, dY] = globalToChunkPosition(x, y);
		return this.chunks[cY][cX].tiles[dY][dX];
	}
	/* Properties */
	get size() {
		return [this.chunks[0].length * CHUNK_WIDTH, this.chunks.length * CHUNK_HEIGHT];
	}
}
