// Imports
import { serializeEntity } from './entity.js';

// Constants
export const CHUNK_WIDTH  = 21;
export const CHUNK_HEIGHT = 12;

// Functions
export function globalToChunkPosition(x, y) {
	return [
		// Chunk (cX, cY)
		Math.floor(x / CHUNK_WIDTH),
		Math.floor(y / CHUNK_HEIGHT),
		// Offset (dX, dY)
		x % CHUNK_WIDTH,
		y % CHUNK_HEIGHT
	];
}

export function chunkToGlobalPosition(cX, cY, dX, dY) {
	return [cX * CHUNK_WIDTH + dX, cY * CHUNK_HEIGHT + dY];
}

export function indexToChunkPosition(idx, stride) {
	return [
		// Chunk (cX, cY)
		Math.floor(idx % stride / CHUNK_WIDTH),
		Math.floor(idx / stride / CHUNK_HEIGHT),
		// Offset (dX, dY)
		idx % CHUNK_WIDTH,
		Math.floor(idx / stride) % CHUNK_HEIGHT
	];
}

function* compressTiles() {
	let current = null;
	let counter = 0;
	let result = undefined;
	while (true) {
		const value = yield result;
		result = undefined;
		if (value === null) break;
		else if (current === null) current = value;
		else if (value !== current) {
			result = [current, counter];
			current = value;
			counter = 0;
		}
		counter += 1;
	}
	yield [current, counter];
}

export function compressChunks(chunks, size) {
	const [width, height] = [size[0], size[1]];
	// Tile disassembler
	const tiles = [];
	const entities = [];
	const despawnPool = [];
	const tileIter = compressTiles();
	tileIter.next();
	for (let y = 0; y < height; ++y) {
		for (let x = 0; x < width; ++x) {
			const [cX, cY, dX, dY] = globalToChunkPosition(x, y);
			const tile = chunks[cY][cX].tiles[dY][dX];
			const compressed = tileIter.next(tile.id);
			if (compressed.value !== undefined) {
				tiles.push(...compressed.value);
			}
			// Entities
			for (const entity of tile.entities) {
				entities.push(serializeEntity(entity, x, y));
				// Despawn
				if (entity.despawn) {
					despawnPool.push(entity.uid);
				}
			}
		}
	}
	tiles.push(...tileIter.next(null).value);
	// Chunk disassembler
	const visibility = [];
	for (let y = 0; y < chunks.length; ++y) {
		for (let x = 0; x < chunks[y].length; ++x) {
			visibility.push(+chunks[y][x].isVisible);
		}
	}
	return [visibility, tiles, entities, despawnPool];
}

function* decompressTiles(compressedTiles) {
	for (let i = 0; i < compressedTiles.length; i += 2) {
		for (let j = 0; j < compressedTiles[i + 1]; ++j) {
			yield compressedTiles[i + 0];
		}
	}
}

export function decompressChunks(visibility, compressedTiles, size) {
	const [width, height, chunkWidth, chunkHeight] = [
		size[0], size[1],
		size[0] / CHUNK_WIDTH, size[1] / CHUNK_HEIGHT
	];
	// Tile assembler
	const tiles = [...Array(chunkHeight)].map(row => [...Array(chunkWidth)].map(y => [...Array(CHUNK_HEIGHT)].map(x => [...Array(CHUNK_WIDTH)])));
	const tileIter = decompressTiles(compressedTiles);
	for (let i = 0; i < width * height; ++i) {
		const [cX, cY, dX, dY] = indexToChunkPosition(i, width);
		tiles[cY][cX][dY][dX] = {
			id: tileIter.next().value,
			entities: []
		};
	}
	// Chunk assembler
	const chunks = [...Array(chunkHeight)].map(row => [...Array(chunkWidth)]);
	for (let i = 0; i < visibility.length; ++i) {
		const [x, y] = [
			i % chunkWidth,
			Math.floor(i / chunkWidth)
		];
		chunks[y][x] = {
			isVisible: Boolean(visibility[i]),
			tiles: tiles[y][x]
		};
	}
	return chunks;
}
