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
		var pieces, pieceSize = 16, grid = [];
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

		grid.width = 16;
		grid.height = 32;
		grid.x = (width / 2) - (grid.width * pieceSize / 2);
		grid.y = 50;

		function renderPiece(ctx, piece, x, y) {
			var n, j, size = (piece.length === 9) && 3 || 4;

			for (n = 0;n < size; n += 1) {
				for (j = 0;j < size; j += 1) {
					if (piece[n * size + j] === '1') {
						ctx.fillRect(x + j * pieceSize, y + n * pieceSize, pieceSize, pieceSize);
					}
				}
			}
		}

		return ({
			update: function (delta) {
			},

			render: function (ctx) {
				ctx.clearStyle = '#fff';
				ctx.clearRect(0, 0, width, height);

				ctx.fillStyle = '#f00';
				pieces.forEach(function (piece, index) {
					renderPiece(ctx, piece[0], index * 128, 100);
				});

				ctx.strokeStyle = '#00f';
				ctx.strokeRect(grid.x, grid.y, grid.width * pieceSize, grid.height * pieceSize);
			}
		});
	}());

	init();
}());
