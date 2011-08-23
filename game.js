(function () {
	var width = 400, height = 600, repaint, context, lastUpdate, game;

	function createCanvas(width, height, node) {
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		if (node) {
			node.appendChild(canvas);
		}

		return canvas.getContext('2d');
	}

	function rand(min, max) {
		return min + Math.floor(Math.random() * max - min);
	}

	repaint = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
 		window.mozRequestAnimationFrame ||
 		window.oRequestAnimationFrame ||
 		function (callback) {
 			window.setTimeout(function () {
 				callback(Date.now());
			}, 20);
		};


	function update(time) {
		var delta = time - lastUpdate;
		lastUpdate = time;

		game.update(delta);
		game.render(context);

		repaint(update);
	}

	function init() {
		context = createCanvas(width, height, document.body);
		lastUpdate = Date.now();
		repaint(update);
	}

	game = (function () {
		var pieces, pieceSize = 16, grid, currentPiece, dropTimer = 0;

		function renderPiece(ctx, piece, x, y) {
			var n, j; 

			for (n = 0;n < piece.squareSize; n += 1) {
				for (j = 0;j < piece.squareSize; j += 1) {
					if (piece[piece.rotation][n * piece.squareSize + j] === '1') {
						ctx.fillRect(x + j * pieceSize, y + n * pieceSize, pieceSize, pieceSize);
					}
				}
			}
		}

		function fitPiece(piece) {
			var x, y, p;
			p = piece[piece.rotation];

			/* Step one: move as needed */
			for (y = 0;y < piece.squareSize;y += 1) {
				for (x = 0;x < piece.squareSize;x += 1) {
					if (+p[y * piece.squareSize + x] !== 1) {
						continue;
					}

					while (piece.x + x >= grid.width) {
						piece.x -= 1;
					}

					while (piece.x + x < 0) {
						piece.x += 1;
					}

					while (piece.y + y < 0) {
						piece.y += 1;
					}
				}
			}

			/* Step two: detect if move was successful */
			for (y = 0;y < p.squareSize;y += 1) {
				for (x = 0;x < p.squareSize;x += 1) {
					if ((piece.x + x >= grid.width) || (piece.x + x < 0)) {
						return false;
					}
				}
			}
			
			return true;
		}

		function getRandomPiece() {
			var piece = pieces[Math.floor(Math.random() * pieces.length)];
			piece.rotation = 0;
			piece.x = rand(-1, grid.width);
			piece.y = -1;
			piece.squareSize = (piece[0].length === 9) && 3 || 4;

			return piece;
		}

		pieces = [
			// Reverse L-piece
			['010010110', '000100111', '110100100', '000111001'],

			// L-piece
			['010010011', '000111100', '011001001', '000001111'],

			// Z-piece
			['000110011', '010110100', '000110011', '010110100'],

			// Reverse Z-piece
			['000011110', '100110010', '000011110', '100110010'],

			// T-piece
			['000010111', '100110100', '000111010', '010110010'],

			// Line piece
			['0100010001000100', '0000111100000000', '0100010001000100', '0000111100000000']
		];

		grid = (function () {
			var j, grid = [];
			grid.width = 16;
			grid.height = 32;

			for (j = 0;j < grid.width * grid.height;j += 1) {
				grid.push(0);
			}

			return grid;
		}());

		grid.x = (width / 2) - (grid.width * pieceSize / 2);
		grid.y = 50;

		currentPiece = getRandomPiece();
		fitPiece(currentPiece);

		return ({
			update: function (delta) {
				dropTimer += delta;
				while (dropTimer >= 1000) {
					dropTimer -= 1000;
					currentPiece.y += 1;
				}
			},

			render: function (ctx) {
				/* Clear screen */
				ctx.clearStyle = '#fff';
				ctx.clearRect(0, 0, width, height);

				/* Grid content */
				ctx.fillStyle = '#0f0';
				grid.forEach(function (cell, index) {
					if (cell === 1) {
						ctx.fillRect(
							grid.x + (index % grid.width) * pieceSize,
							grid.y + Math.floor(index / grid.width) * pieceSize,
							pieceSize, pieceSize
						);
					}
				});

				/* Current piece */
				ctx.fillStyle = '#f00';
				renderPiece(
					ctx, currentPiece,
					grid.x + currentPiece.x * pieceSize,
					grid.y + currentPiece.y * pieceSize
				);

				/* Grid outline */
				ctx.strokeStyle = '#00f';
				ctx.strokeRect(grid.x, grid.y, grid.width * pieceSize, grid.height * pieceSize);
			}
		});
	}());

	init();
}());
