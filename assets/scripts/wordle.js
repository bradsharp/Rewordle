const GUESS_LIMIT = 6;
const WORD_LENGTH = 5;

const FLIP_DELAY = 400;
const SHAKE_DELAY = 800;

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

const WordleStorage = new Storage('wordle', window.localStorage);

class Wordle {

	constructor(gameElement) {
		this.root = gameElement;
		this.board = gameElement.querySelector('#board');
	}

	day = 0;
	answer = '';
	currentGuess = '';
	guesses = [];
	solved = false;
	finished = false;
	valid = false;

	root = null;
	board = null;
	keyboard = null;

	checkWord(word) {
		if (word.length < WORD_LENGTH)
			return null;
		if (!words.includes(word))
			return null;
		let state = (new Array(WORD_LENGTH)).fill(TileState.Invalid);
		for (let i = 0; i < WORD_LENGTH; i++) {
			if (word.charAt(i) == this.answer.charAt(i))
				state[i] = TileState.Correct;
		}
		for (let i = 0; i < WORD_LENGTH; i++) {
			if (state[i] == TileState.Correct)
				continue;
			let answerChar = this.answer.charAt(i);
			for (let j = 0; j < WORD_LENGTH; j++) {
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
		let characterState = {};
		this.root.querySelectorAll('button[key]').forEach(button => {
			let key = button.getAttribute('key');
			characterState[key] = TileState.None
		});
		for (let i = 0; i < this.guesses.length; i++) {
			let word = this.guesses[i];
			let wordState = this.checkWord(word);
			if (wordState == null)
				continue;
			for (let j = 0; j < WORD_LENGTH; j++) {
				let char = word.charAt(j);
				if (DisplayPriority[wordState[j]] > DisplayPriority[characterState[char]])
					characterState[char] = wordState[j];
			}
		}
		this.root.querySelectorAll('button[key]').forEach(button => {
			let key = button.getAttribute('key');
			button.setAttribute('state', characterState[key])
		});
	}

	updateTile(tile, state) {
		tile.setAttribute('state', state);
		tile.setAttribute('flipped', state != TileState.None);
	}

	updateRow(index, word, result=null, instant=false) {
		let row = board.children[index];
		for (let i = 0; i < 5; i++) {
			let tile = row.children[i];
			let char = word.charAt(i);
			tile.querySelector('.front').textContent = char
			tile.querySelector('.back').textContent = char
		}
		if (result) {
			let delay = instant ? 0 : FLIP_DELAY;
			for (let i = 0; i < WORD_LENGTH; i++)
				setTimeout(this.updateTile.bind(this, row.children[i], result[i]), i * delay);
		}
	}

	shakeCurrentGuess(index, shake=true) {
		let row = board.children[this.guesses.length]
		if (row.classList.contains('shake'))
			return;
		row.classList.add('shake');
		setTimeout(row.classList.remove.bind(row.classList, 'shake'), SHAKE_DELAY);
	}

	updateCurrentGuess(word) {
		if (!this.active)
			return;
		this.currentGuess = word.substring(0, WORD_LENGTH);
		this.updateRow(this.guesses.length, this.currentGuess);
	}

	updateDay() {
		let label = this.root.querySelector('#day');
		label.textContent = '#' + this.getCode();
		label.href = `/?day=${this.getCode()}`;
	}

	onComplete() {
		this.board.dispatchEvent(new CustomEvent('finished'));
		this.updateKeyboard();
	}

	onRetry() {
		if (this.guesses.length >= GUESS_LIMIT) {
			this.onComplete();
			return;
		}
		this.active = true;
		this.updateKeyboard();
	}

	makeGuess(word) {
		if (!this.active)
			return;
		if (this.guesses.length >= GUESS_LIMIT)
			return;
		let result = this.checkWord(word);
		if (result) {
			this.active = false;
			this.guesses.push(word);
			this.currentGuess = '';
			this.solved = word == this.answer;
			this.updateRow(this.guesses.length - 1, word, result);
			this.board.dispatchEvent(new CustomEvent('updated'));
			setTimeout((word == this.answer ? this.onComplete : this.onRetry).bind(this), WORD_LENGTH * FLIP_DELAY);
		}
		else {
			this.shakeCurrentGuess();
		}
	}

	isFinished() {
		return this.solved || this.guesses.length >= GUESS_LIMIT;
	}

	getCode() {
		return this.day.toString(36).toUpperCase();
	}

	toString() {
		let lines = this.guesses.map(word => {
			let result = this.checkWord(word);
			if (result)
				return result.reduce((line, state) => {
					switch (state) {
						case TileState.Correct:
							return line + '🟩';
						case TileState.Valid:
							return line + '🟨';
						default:
							return line + '⬜';
					}
				}, '')
			return '⬜⬜⬜⬜⬜'
		})
		return lines.join('\n');
	}

	load() {
		let params = new URLSearchParams(window.location.search);
		let nowUtc = new Date();
		let nowLocalTimezone = nowUtc.getTime() - nowUtc.getTimezoneOffset() * 60 * 1000;
		let currentDay = Math.floor(nowLocalTimezone / (1000 * 3600 * 24));
		let customDay = parseInt(params.get('day') ?? '', 36);
		let day = currentDay > customDay ? customDay : currentDay;
		this.valid = day == currentDay;
		this.day = day;
		if (this.day == WordleStorage.get('day')) {
			this.answer = WordleStorage.get('answer', getAnswer(this.day));
			this.guesses = WordleStorage.get('guesses', []);
			this.solved = WordleStorage.get('solved', false);
			for (let i = 0; i < this.guesses.length; i++) {
				let word = this.guesses[i];
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

	save() {
		if (!this.valid)
			return;
		WordleStorage.set('answer', this.answer);
		WordleStorage.set('guesses', this.guesses);
		WordleStorage.set('solved', this.solved);
		WordleStorage.set('day', this.day);
		if (!this.isFinished())
			return;
		if (this.day <= WordleStorage.get('lastFinished', 0))
			return;
		WordleStorage.set('lastFinished', this.day);
		WordleStorage.set('totalGames', WordleStorage.get('totalGames', 0) + 1);
		if (this.solved) {
			let currentWinStreak = WordleStorage.get('currentWinStreak', 0) + 1;
			let bestWinStreak = WordleStorage.get('bestWinStreak', 0);
			WordleStorage.set('totalWins', WordleStorage.get('totalWins', 0) + 1);
			WordleStorage.set('currentWinStreak', currentWinStreak);
			WordleStorage.set('bestWinStreak', Math.max(currentWinStreak, bestWinStreak));
		}
		let guessDistribution = WordleStorage.get('guessDistribution', [0, 0, 0, 0, 0, 0]);
		guessDistribution[this.guesses.length - 1]++;
		WordleStorage.set('guessDistribution', guessDistribution);
	}

	reset() {
		this.answer = getAnswer(this.day);
		this.guesses = [];
		this.solved = false;
		this.active = true;
		this.save();
	}

}
