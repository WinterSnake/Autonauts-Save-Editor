// Constants
const CHUNK_WIDTH  = 21;
const CHUNK_HEIGHT = 12;

// Functions
function buildChunks(visibility, compressedTiles, size) {
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
		tiles[y][x][dY][dX] = tileIter.next().value;
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
	const chunks = buildChunks(worldJson['Plots']['PlotsVisible'], tileJson['TileTypes'], size);
	return new World(chunks);
}

// Classes
export class World {
	/* Constructor */
	constructor(chunks) {
		this.chunks = chunks;
	}
}
