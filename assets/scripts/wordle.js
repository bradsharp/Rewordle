const FLIP_DELAY = 500;
const SHAKE_DELAY = 800;
const GUESS_LIMIT = 6;
const WORD_LENGTH = 5;

const TileState = {
	None: 'none', // No state
	Wrong: 'wrong', // Does not exist
	Invalid: 'invalid', // Does not exist
	Valid: 'valid', // Exists
	Correct: 'correct', // Exists, and is in the correct place
}

const DisplayPriority = {
	[TileState.Wrong]: 0,
	[TileState.None]: 1,
	[TileState.Invalid]: 2,
	[TileState.Valid]: 3,
	[TileState.Correct]: 4,
}

var Board = document.getElementById('board');
var Input = document.getElementById('keyboard');

var now = new Date();
var day = Math.floor(now / (1000 * 3600 * 24));
var answer = getAnswer(day);
var active = false;
var guesses = [];
var guess = '';

function saveState() {
	window.localStorage.setItem('state', JSON.stringify({
		guesses: guesses,
		solved: guess == answer,
		day: day
	}))
}

function isLetter(str) {
	return str.length === 1 && str.match(/[a-z]/i);
}

function setRowText(index, text) {
	var row = Board.children[index];
	for (var i = 0; i < 5; i++) {
		var tile = row.children[i];
		var char = text.charAt(i);
		tile.querySelector('.front').textContent = char
		tile.querySelector('.back').textContent = char
	}
}

function updateGuess(word) {
	guess = word.substring(0, WORD_LENGTH);
	window.sessionStorage.setItem('guess', guess);
	setRowText(guesses.length, guess);
}

function deleteLastCharacter() {
	updateGuess(guess.substring(0, guess.length - 1));
}

function updateKeyboard() {
	var characterState = {};
	Input.querySelectorAll('.letter').forEach(button => characterState[button.value] = TileState.None);
	for (var i = 0; i < guesses.length; i++) {
		var word = guesses[i];
		var wordState = checkWord(word);
		if (wordState == null)
			continue;
		for (var j = 0; j < WORD_LENGTH; j++) {
			var char = word.charAt(j);
			if (DisplayPriority[wordState[j]] > DisplayPriority[characterState[char]])
				characterState[char] = wordState[j];
		}
	}
	Input.querySelectorAll('.letter').forEach(button => button.setAttribute('state', characterState[button.value]));
}

function updateTile(tile, state) {
	tile.setAttribute('state', state);
	tile.setAttribute('flipped', true);
}

function stopShaking() {
	this.classList.remove('shake');
}

function checkWord(word) {
	if (word.length < WORD_LENGTH)
		return null;
	if (!words.includes(word))
		return null;
	var state = (new Array(WORD_LENGTH)).fill(TileState.Invalid);
	for (var i = 0; i < WORD_LENGTH; i++) {
		if (word.charAt(i) == answer.charAt(i))
			state[i] = TileState.Correct;
	}
	for (var i = 0; i < WORD_LENGTH; i++) {
		if (state[i] == TileState.Correct)
			continue;
		var answerChar = answer.charAt(i);
		for (var j = 0; j < WORD_LENGTH; j++) {
			if (state[j] != TileState.Invalid)
				continue;
			if (word.charAt(j) == answerChar) {
				state[j] = TileState.Valid;
				break;
			}
		}
	}
	return state;
}

function submitGuess() {
	if (guesses.length >= GUESS_LIMIT)
		return;
	var row = Board.children[guesses.length];
	var result = checkWord(guess)
	if (result) {
		active = false;
		for (var i = 0; i < WORD_LENGTH; i++)
			setTimeout(updateTile.bind(null, row.children[i], result[i]), i * FLIP_DELAY);
		guesses.push(guess);
		updateKeyboard();
		setTimeout(() => {
			if (guess == answer) {
				active = false;
				window.location.hash = "#results";
			}
			else {
				guess = '';
				active = true;
			}
		}, 5 * FLIP_DELAY);
		saveState();
	}
	else {
		if (row.classList.contains('shake'))
			return;
		row.classList.add('shake');
		setTimeout(stopShaking.bind(row), SHAKE_DELAY);
	}
}

function keypress(key) {
	if (!active)
		return;
	if (key == "Enter")
		submitGuess();
	else if (key == "Backspace")
		deleteLastCharacter();
	else if (isLetter(key))
		updateGuess(guess + key)
}

document.addEventListener('keydown', e => keypress(e.key));
Input.querySelector('#delete.button').addEventListener('click', () => keypress('Backspace'));
Input.querySelector('#submit.button').addEventListener('click', () => keypress('Enter'));
Input.querySelectorAll('.letter').forEach(button => {
	button.addEventListener('click', () => keypress(button.value))
});

function load() {
	var data = window.localStorage.getItem('state');
	var state = data ? JSON.parse(data) : null;
	console.log(state);
	if (state && state.day == day) {
		guesses = state.guesses;
		for (var i = 0; i < guesses.length; i++) {
			var word = guesses[i]
			var row = Board.children[i];
			setRowText(i, word);
			var result = checkWord(word)
			if (result) {
				for (var j = 0; j < WORD_LENGTH; j++)
					updateTile(row.children[j], result[j]);
			}
		}
		if (state.solved)
			return;
	}
	active = true;
}

load();