var Keyboard = document.getElementById('keyboard');

function invokeKeydown(key) {
	document.dispatchEvent(new KeyboardEvent('keydown', {
		key: key
	}))
}

Keyboard.querySelector('#delete').addEventListener('click', () => invokeKeydown('Backspace'));
Keyboard.querySelector('#submit').addEventListener('click', () => invokeKeydown('Enter'));

Keyboard.querySelectorAll('.letter').forEach(button => {
	button.addEventListener('click', () => invokeKeydown(button.value))
});