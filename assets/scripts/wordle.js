const STATE_KEY = 'wordle-5-state';
const STATS_KEY = 'wordle-5-stats';

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

function isLetter(str) {
	return str.length === 1 && str.match(/[a-z]/i);
}

class Wordle {
	
	static fetchStats() {
		var data = window.localStorage.getItem(STATE_KEY);
		return data ? JSON.parse(data) : {
			lastDay: 0,
			gamesPlayed: 0,
			gamesWon: 0,
			currentStreak: 0,
			bestStreak: 0,
			guessDistribution: (new Array(GUESS_LIMIT)).fill(0),
		};
	}

	constructor(boardElement, keyboardElement) {
		this.board = boardElement;
		this.keyboard = keyboardElement;
	}

	day = 0;
	answer = '';
	currentGuess = '';
	guesses = [];
	solved = false;
	finished = false;

	board = null;
	keyboard = null;

	checkWord(word) {
		if (word.length < WORD_LENGTH)
			return null;
		if (!words.includes(word))
			return null;
		var state = (new Array(WORD_LENGTH)).fill(TileState.Invalid);
		for (var i = 0; i < WORD_LENGTH; i++) {
			if (word.charAt(i) == this.answer.charAt(i))
				state[i] = TileState.Correct;
		}
		for (var i = 0; i < WORD_LENGTH; i++) {
			if (state[i] == TileState.Correct)
				continue;
			var answerChar = this.answer.charAt(i);
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

	updateKeyboard() {
		var characterState = {};
		this.keyboard.querySelectorAll('.letter').forEach(button => characterState[button.value] = TileState.None);
		for (var i = 0; i < this.guesses.length; i++) {
			var word = this.guesses[i];
			var wordState = this.checkWord(word);
			if (wordState == null)
				continue;
			for (var j = 0; j < WORD_LENGTH; j++) {
				var char = word.charAt(j);
				if (DisplayPriority[wordState[j]] > DisplayPriority[characterState[char]])
					characterState[char] = wordState[j];
			}
		}
		this.keyboard.querySelectorAll('.letter').forEach(button => button.setAttribute('state', characterState[button.value]));
	}

	updateTile(tile, state) {
		tile.setAttribute('state', state);
		tile.setAttribute('flipped', state != TileState.None);
	}

	updateRow(index, word, result=null, instant=false) {
		var row = board.children[index];
		for (var i = 0; i < 5; i++) {
			var tile = row.children[i];
			var char = word.charAt(i);
			tile.querySelector('.front').textContent = char
			tile.querySelector('.back').textContent = char
		}
		if (result) {
			var delay = instant ? 0 : FLIP_DELAY;
			for (var i = 0; i < WORD_LENGTH; i++)
				setTimeout(this.updateTile.bind(this, row.children[i], result[i]), i * delay);
		}
	}

	updateCurrentGuess(word) {
		if (!this.active)
			return;
		this.currentGuess = word.substring(0, WORD_LENGTH);
		this.updateRow(this.guesses.length, this.currentGuess);
	}

	updateDay() {
		this.board.querySelector('#day').textContent = `#${this.day}`;
	}

	onComplete() {
		this.board.dispatchEvent(new CustomEvent('finished'));
	}

	onRetry() {
		if (this.guesses.length >= GUESS_LIMIT) {
			this.onComplete();
			return;
		}
		this.active = true;
	}

	makeGuess(word) {
		if (!this.active)
			return;
		if (this.guesses.length >= GUESS_LIMIT)
			return;
		var result = this.checkWord(word);
		if (result) {
			this.active = false;
			this.guesses.push(word);
			this.currentGuess = '';
			this.solved = word == this.answer;
			this.updateRow(this.guesses.length - 1, word, result);
			this.updateKeyboard();
			this.board.dispatchEvent(new CustomEvent('updated'));
			setTimeout((word == this.answer ? this.onComplete : this.onRetry).bind(this), WORD_LENGTH * FLIP_DELAY);
		}
		else {
			if (row.classList.contains('shake'))
				return;
			row.classList.add('shake');
			setTimeout(row.classList.remove.bind(row.classList, 'shake'), SHAKE_DELAY);
		}
	}

	isFinished() {
		return this.solved || this.guesses.length >= GUESS_LIMIT;
	}

	load() {
		var data = window.localStorage.getItem(STATE_KEY);
		var state = data ? JSON.parse(data) : null;
		var now = new Date();
		this.day = Math.floor(now / (1000 * 3600 * 24));
		if (state && state.day == this.day) {
			this.answer = state.answer;
			this.guesses = state.guesses;
			this.solved = state.solved;
			for (var i = 0; i < this.guesses.length; i++) {
				var word = this.guesses[i];
				this.updateRow(i, word, this.checkWord(word), true)
			}
			this.active = !this.isFinished();
			this.updateKeyboard();
		}
		else {
			this.answer = getAnswer(this.day);
			this.guesses = [];
			this.solved = false;
			this.active = true;
		}
		this.updateDay();
	}

	reset() {
		this.answer = getAnswer(this.day);
		this.guesses = [];
		this.solved = false;
		this.active = true;
		this.save();
	}

	updateStats() {
		if (!this.isFinished())
			return;
		var stats = Wordle.fetchStats();
		if (stats.lastDay >= this.day)
			return;
		stats.gamesPlayed++;
		if (this.solved) {
			stats.gamesWon++;
			stats.currentStreak++;
			stats.bestStreak = Math.max(stats.currentStreak, stats.bestStreak);
		}
		else {
			stats.currentStreak = 0;
		}
		stats.guessDistribution[this.guesses.length - 1]++;
		stats.lastDay = this.day;
		window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
	}

	save() {
		this.updateStats();
		window.localStorage.setItem(STATE_KEY, JSON.stringify({
			answer: this.answer,
			guesses: this.guesses,
			solved: this.solved,
			day: this.day
		}));
	}

}