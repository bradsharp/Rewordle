var Keyboard = document.getElementById('keyboard');

Keyboard.querySelectorAll('button[key]').forEach(button => {
	button.addEventListener('click', () => document.dispatchEvent(new KeyboardEvent('keydown', {
		key: button.getAttribute('key')
	})))
});