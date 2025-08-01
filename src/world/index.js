// Imports
import { CHUNK_WIDTH, CHUNK_HEIGHT, compressChunks, decompressChunks, globalToChunkPosition } from './chunk.js';

// Constants
const VERSION = "140.2";

// Functions
export function deserializeWorld(worldJson) {
	// Chunks
	const tileJson = worldJson['Tiles'];
	const visibilityJson = worldJson['Plots']['PlotsVisible'];
	const size = [tileJson['TilesWide'], tileJson['TilesHigh']];
	const chunks = decompressChunks(visibilityJson, tileJson['TileTypes'], size);
	// Entities
	for (let i = 0; i < worldJson['Objects'].length; ++i) {
		const entityJson = worldJson['Objects'][i];
		const entity = {
			name: entityJson['ID'],
			uid: entityJson['UID'],
		};
		const [cX, cY, dX, dY] = globalToChunkPosition(entityJson['TX'], entityJson['TY']);
		chunks[cY][cX].tiles[dY][dX].entities.push(entity);
	}
	return new World(chunks);
}

export function serializeWorld(world) {
	// Chunks | Entities
	const [visibility, tiles, entities] = compressChunks(world.chunks, world.size);
	// Autonauts world object
	return {
		AutonautsWorld: 1,
		Version: VERSION,
		External: 0,
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
	constructor(chunks) {
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
