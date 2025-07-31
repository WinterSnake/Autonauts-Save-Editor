// Constants
const uploadButton = document.getElementById('uploadWorld');

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
			console.log(worldJson);
		}
		reader.readAsText(file);
	});
	fileInput.click();
});
