// Imports
import { deserializeWorld, serializeWorld } from './world/index.js';

// Constants
const uploadButton = document.getElementById('uploadWorld');
const downloadButton = document.getElementById('downloadWorld');
const menuDialog = document.getElementById('menu');

// Body
let world = undefined;
uploadButton.addEventListener('click', event => {
	const fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.addEventListener('change', async(event) => {
		const file = event.target.files[0];
		const reader = new FileReader();
		reader.onload = function() {
			const worldJson = JSON.parse(this.result);
			world = deserializeWorld(worldJson);
			downloadButton.disabled = false;
		}
		reader.readAsText(file);
	});
	fileInput.click();
});
downloadButton.addEventListener('click', event => {
	const worldJson = serializeWorld(world);
	const link = document.createElement('a');
	link.href = URL.createObjectURL(new Blob([JSON.stringify(worldJson)], { type: "application/json" }));
	link.download = "world.json";
	link.click();
});
