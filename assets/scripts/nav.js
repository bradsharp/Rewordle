function updateLocation() {
	document.querySelectorAll('.pane').forEach(element => element.classList.add('hidden'));
	var selected = document.querySelector(window.location.hash);
	if (selected)
		selected.classList.remove('hidden');
}

window.addEventListener('hashchange', updateLocation);
updateLocation();