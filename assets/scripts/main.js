function main() {

	function setupGame() {

		const StatExpressions = {
			played: () => WordleStorage.get('totalGames', 0),
			winRate: () => {
				let gamesPlayed = WordleStorage.get('totalGames', 0);
				let gamesWon = WordleStorage.get('totalWins', 0);
				if (gamesPlayed == 0)
					return `0%`;
				return `${Math.floor(100 * gamesWon / gamesPlayed)}%`
			},
			streak: () => WordleStorage.get('currentWinStreak', 0),
			bestStreak: () => WordleStorage.get('bestWinStreak', 0),
		}
	
		let results = document.getElementById('results');
		let share = results.querySelector('#share');
		let board = document.getElementById('board');
		let keyboard = document.getElementById('keyboard');
		let game = new Wordle(board, keyboard);

		let clipboardToast = Toastify({
			text: "Copied to Clipboard",
			className: 'toast',
			duration: 3000,
			close: false,
			gravity: 'bottom',
			position: 'center',
			stopOnFocus: true,
		});

		let solvedToast = Toastify({
			text: "Magnificent!",
			className: 'toast large',
			duration: 3000,
			close: false,
			gravity: 'top',
			position: 'center',
			offset: {
				y: 48
			},
			stopOnFocus: true,
		});

		function updateGameOutcome() {
			let outcome = results.querySelector('#game-outcome');
			if (game.isFinished()) {
				let solution = outcome.querySelector('#solution');
				let guesses = outcome.querySelector('#guesses');
				for (let i = 0; i < WORD_LENGTH; i++) {
					let tile = solution.children[i];
					tile.textContent = game.answer.charAt(i);
					tile.setAttribute('state', game.solved ? TileState.Correct : TileState.Wrong);
				}
				let guessCount = game.guesses.length;
				if (game.solved)
					guesses.textContent = `You guessed it in ${guessCount} ${guessCount > 1 ? "turns" : "turn"}!`;
				else
					guesses.textContent = 'You failed to guess the word.';
				outcome.classList.remove('hidden');
			}
			else {
				outcome.classList.add('hidden');
			}
		}

		function updateGameStats() {
			results.querySelectorAll(`.value[stat]`).forEach(element => {
				let stat = element.getAttribute('stat');
				if (stat in StatExpressions)
					element.textContent = StatExpressions[stat]();
			})
			let guessDistribution = WordleStorage.get('guessDistribution', [1, 1, 1, 1, 1, 1]);
			let max = Math.max(...guessDistribution);
			let heatmap = results.querySelector('#game-heatmap .heatmap');
			for (let i = 0; i < 6; i++) {
				let entry = heatmap.children[i];
				let bar = entry.querySelector('.bar');
				let value = guessDistribution[i] ?? 0;
				bar.style.width = `${100 * value / max}%`
			}
		}

		function updateTimer() {
			let timer = results.querySelector('#timer');
			let date = new Date();
			let hours = date.getHours();
			let minutes = date.getMinutes();
			let seconds = date.getSeconds();
			timer.textContent = `${23 - hours}:${59 - minutes}:${59 - seconds}` // TODO: 0-Padding
		}

		board.addEventListener('finished', event => {
			if (game.solved)
				solvedToast.showToast();
			updateGameOutcome();
			updateGameStats();
			window.location.hash = '#results';
		});

		board.addEventListener('updated', event => {
			game.save();
		});

		share.addEventListener('click', () => {
			let lines = [];
			lines.push(`Rewordle #${game.day} ${game.guesses.length}/6`);
			lines.push('');
			for (let i = 0; i < game.guesses.length; i++) {
				let result = game.checkWord(game.guesses[i]);
				lines.push(result ? result.map(state => {
					switch (state) {
						case TileState.Correct: return '🟩';
						case TileState.Valid: return '🟨';
						default: return '⬜';
					}
				}).join('') : '⬜⬜⬜⬜⬜')
			}
			lines.push('');
			lines.push('https://rewordle.app/');
			navigator.clipboard.writeText(lines.join('\n'));
			clipboardToast.showToast();
		})

		function isLetter(str) {
			return str.length === 1 && str.match(/[a-z]/i);
		}

		document.addEventListener('keydown', input => {
			if (input.key == "Enter")
				game.makeGuess(game.currentGuess);
			else if (input.key == "Backspace")
				game.updateCurrentGuess(game.currentGuess.slice(0, -1));
			else if (isLetter(input.key))
				game.updateCurrentGuess(game.currentGuess + input.key);
		});

		// game.reset();
		game.load();

		updateGameStats();
		updateGameOutcome();

		setInterval(updateTimer, 1000);

	}

	function setupNavigation() {

		function updateLocation() {
			document.querySelectorAll('.pane').forEach(element => element.classList.add('hidden'));
			if (window.location.hash.length > 0) {
				let selected = document.querySelector(window.location.hash);
				if (selected)
					selected.classList.remove('hidden');
			}
		}

		window.addEventListener('hashchange', updateLocation);
		updateLocation();

	}

	setupNavigation();
	setupGame();

	setTimeout(() => {
		document.body.classList.remove('preload');
	}, 500);

}

main();



