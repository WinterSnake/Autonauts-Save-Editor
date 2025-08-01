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

function* compressTiles() {
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
}

export function compressChunks(chunks, size) {
	const entities = [];
	const chunkSize = [size[0] / CHUNK_WIDTH, size[1] / CHUNK_HEIGHT];
	// Tile disassembler
	let tiles = [];
	const tileIter = compressTiles();
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

function* decompressTiles(compressedTiles) {
	for (let i = 0; i < compressedTiles.length; i += 2) {
		for (let j = 0; j < compressedTiles[i + 1]; ++j) {
			yield compressedTiles[i + 0];
		}
	}
}

export function decompressChunks(visibility, compressedTiles, size) {
	const chunkSize = [size[0] / CHUNK_WIDTH, size[1] / CHUNK_HEIGHT];
	// Tile assembler
	const tiles = [...Array(chunkSize[1])].map(row => [...Array(chunkSize[0])].map(y => [...Array(CHUNK_HEIGHT)].map(x => [...Array(CHUNK_WIDTH)])));
	const tileIter = decompressTiles(compressedTiles);
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
	const chunks = [...Array(chunkSize[1])].map(row => [...Array(chunkSize[0])]);
	for (let i = 0; i < visibility.length; ++i) {
		const [x, y] = [
			i % chunkSize[0],
			Math.floor(i / chunkSize[0])
		];
		chunks[y][x] = {
			isVisible: Boolean(visibility[i]),
			tiles: tiles[y][x]
		};
	}
	return chunks;
}
