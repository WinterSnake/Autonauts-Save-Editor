// Constants
const CHUNK_WIDTH  = 21;
const CHUNK_HEIGHT = 12;
const VERSION = "140.2";

// Functions
function globalToChunkPosition(x, y) {
	return [
		// Chunk (cX, cY)
		Math.floor(x / CHUNK_WIDTH),
		Math.floor(y / CHUNK_HEIGHT),
		// Offset (dX, dY)
		x % CHUNK_WIDTH,
		y % CHUNK_HEIGHT
	];
}

function compressChunks(chunks, size) {
	const entities = [];
	// Tile disassembler
	let tiles = [];
	const tileCompressor = function*() {
		let current = null;
		let counter = 0;
		let result = undefined;
		while (true) {
			const value = yield result;
			result = undefined;
			if (current === null) current = value;
			else if (value === null) break;
			else if (value !== current) {
				result = [current, counter];
				current = value;
				counter = 0;
			}
			counter += 1;
		}
		if (current === null) throw new Error("Expected current to be set before ending loop");
		yield [current, counter];
	};
	const tileIter = tileCompressor();
	tileIter.next();
	for (let y = 0; y < size[1]; ++y) {
		for (let x = 0; x < size[0]; ++x) {
			const [cX, cY, dX, dY] = globalToChunkPosition(x, y);
			const tile = chunks[cY][cX].tiles[dY][dX];
			const compressed = tileIter.next(tile.id);
			if (compressed.value !== undefined) {
				tiles = tiles.concat(compressed.value);
			}
			// Entities
			for (const entity of tile.entities) {
				const entityJson = {
					ID: entity.name,
					UID: entity.uid,
					TX: x,
					TY: y
				}
				entities.push(entityJson);
			}
		}
	}
	tiles = tiles.concat(tileIter.next(null).value);
	// Chunk disassembler
	const visibility = [];
	for (let y = 0; y < chunks.length; ++y) {
		for (let x = 0; x < chunks[y].length; ++x) {
			visibility.push(+chunks[y][x].isVisible);
		}
	}
	return [visibility, tiles, entities];
}

function decompressChunks(visibility, compressedTiles, size) {
	// Tile assembler
	const tiles = [...Array(size[1] / CHUNK_HEIGHT)].map(row => [...Array(size[0] / CHUNK_WIDTH)].map(y => [...Array(CHUNK_HEIGHT)].map(x => [...Array(CHUNK_WIDTH)])));
	const tileDecompresser = function*() {
		for (let i = 0; i < compressedTiles.length; i += 2) {
			for (let j = 0; j < compressedTiles[i + 1]; ++j) {
				yield compressedTiles[i + 0];
			}
		}
	};
	const tileIter = tileDecompresser();
	for (let i = 0; i < size[0] * size[1]; ++i) {
		const [x, y, dX, dY] = [
			// Chunk (x, y)
			Math.floor(i % size[0] / CHUNK_WIDTH),
			Math.floor(i / size[0] / CHUNK_HEIGHT),
			// Offset (dX, dY)
			i % CHUNK_WIDTH,
			Math.floor(i / size[0]) % CHUNK_HEIGHT
		];
		tiles[y][x][dY][dX] = {
			id: tileIter.next().value,
			entities: []
		};
	}
	// Chunk assembler
	const chunks = [...Array(size[1] / CHUNK_HEIGHT)].map(row => [...Array(size[0] / CHUNK_WIDTH)]);
	for (let i = 0; i < visibility.length; ++i) {
		const [x, y] = [
			i % Math.floor(size[0] / CHUNK_WIDTH),
			Math.floor(i / Math.floor(size[0] / CHUNK_WIDTH))
		];
		chunks[y][x] = {
			isVisible: Boolean(visibility[i]),
			tiles: tiles[y][x]
		};
	}
	return chunks;
}

export function deserializeWorld(worldJson) {
	// Chunks
	const tileJson = worldJson['Tiles'];
	const size = [tileJson['TilesWide'], tileJson['TilesHigh']];
	const chunks = decompressChunks(worldJson['Plots']['PlotsVisible'], tileJson['TileTypes'], size);
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
	// Chunks
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
	}
}

// Classes
class World {
	/* Constructor */
	constructor(chunks) {
		this.chunks = chunks;
	}
	/* Properties */
	get size() {
		return [this.chunks[0].length * CHUNK_WIDTH, this.chunks.length * CHUNK_HEIGHT];
	}
	get chunkSize() {
		return [this.chunks[0].length, this.chunks.length];
	}
}
