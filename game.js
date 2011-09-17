(function (window, document) {
	"use strict";
	var width = 400, height = 600, repaint, context, lastUpdate, game;

	function createCanvas(width, height, node) {
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		if (node) {
			node.appendChild(canvas);
			canvas.tabIndex = 0;
			canvas.focus();
			canvas.addEventListener('keydown', function (e) {
				if (game.captureKey(e.keyCode)) {
					game.keyPressed(e.keyCode);
					e.preventDefault();
					return false;
				}
			}, false);
			canvas.addEventListener('keyup', function (e) {
				if (game.captureKey(e.keyCode)) {
					game.keyReleased(e.keyCode);
					e.preventDefault();
					return false;
				}
			}, false);
		}

		return canvas.getContext('2d');
	}

	function rand(min, max) {
		return min + Math.floor(Math.random() * (max - min));
	}

	Math.toRadians = Math.toRadians || function (degrees) {
		return degrees * (Math.PI / 180);
	};

	repaint = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(function () {
				callback(Date.now());
			}, 20);
		};


	function update(time, force) {
		repaint(update);
		var delta = time - lastUpdate;
		if (delta >= 16 || force) { // Cap at 60 FPS
			lastUpdate = time;

			game.update(delta);
			game.render(context);
		}
	}

	function init() {
		context = createCanvas(width, height, document.body);
		lastUpdate = Date.now();
		update(lastUpdate);
	}

	game = (function () {
		var pieces, pieceSize = 26, colors, gradients, grid, pieces, timers, keys;

		keys = {
			spacebar: 32,
			left: 37,
			up: 38,
			right: 39,
			down: 40,
			c: 67
		};

		function renderSquare(ctx, color, x, y, rotation) {
			ctx.save();
			ctx.translate(x, y);

			if (rotation) {
				ctx.translate(pieceSize / 2, pieceSize / 2);
				ctx.rotate(Math.toRadians(rotation));
				ctx.translate(pieceSize / -2, pieceSize / -2);
			}

			ctx.fillRect(0, 0, pieceSize, pieceSize);
			ctx.strokeStyle = darkenColor(color);
			ctx.strokeRect(0, 0, pieceSize, pieceSize);
			ctx.restore();
		}

		function renderPiece(ctx, piece, x, y) {
			var n, j; 

			ctx.fillStyle = gradients[piece.color];
			ctx.lineWidth = 1.0;

			for (n = 0; n < piece.squareSize; n += 1) {
				for (j = 0; j < piece.squareSize; j += 1) {
					if (piece[piece.rotation][n * piece.squareSize + j] === '1') {
						renderSquare(ctx, colors[piece.color], x + j * pieceSize, y + n * pieceSize);
					}
				}
			}
		}

		/* Render a window that displays one piece */
		function renderPieceBox(ctx, piece, x, y, width, height) {
			if (piece) {
				renderPiece(ctx, piece, x + Math.floor((width / 2) - (piece.width * pieceSize / 2)), y + 10);
			}

			ctx.lineWidth = 2.0;
			ctx.strokeRect(x, y, width, height);
		}

		function validatePieceLocation(piece) {
			var x, y, p;
			p = piece[piece.rotation];
			for (y = 0; y < piece.squareSize; y += 1) {
				for (x = 0; x < piece.squareSize; x += 1) {

					/* Ignore white space */
					if (+p[y * piece.squareSize + x] !== 0) {
						/* Location is invalid if it is outside the grid */
						if ((piece.x + x >= grid.width) || (piece.x + x < 0)) {
							return false;
						}

						if ((piece.y + y >= grid.height) || (piece.y + y < 0)) {
							return false;
						}

						/* Location is invalid if it is on top of an existing piece */
						if (+grid[(piece.y + y) * grid.width + piece.x + x] !== 0) {
							return false;
						}
					}
				}
			}
			
			return true;
		}

		function fitPiece(piece) {
			var x, y, p;
			p = piece[piece.rotation];

			/* Step one: move as needed */
			for (y = 0; y < piece.squareSize; y += 1) {
				for (x = 0; x < piece.squareSize; x += 1) {

					/* Ignore white space */
					if (+p[y * piece.squareSize + x] !== 0) {
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
			}

			/* Step two: detect if move was successful */
			return validatePieceLocation(piece);
		}

		function placePiece(piece) {
			var x, y, p;
			p = piece[piece.rotation];

			for (y = 0; y < piece.squareSize; y += 1) {
				for (x = 0; x < piece.squareSize; x += 1) {

					/* Ignore white space */
					if (+p[y * piece.squareSize + x] !== 0) {
						grid[(piece.y + y) * grid.width + piece.x + x] = piece.color;
					}
				}
			}

			grid.clearFilledRows();
		}

		function dropFast(piece) {
			if (!validatePieceLocation(piece)) {
				return false;
			}

			while (validatePieceLocation(piece)) {
				piece.y += 1;
			}

			piece.y -= 1;
			return true;
		}

		function copyPiece(piece) {
			var copy = [].concat(piece);
			copy.rotation = piece.rotation;
			copy.squareSize = piece.squareSize;
			copy.x = piece.x;
			copy.y = piece.y;
			copy.color = piece.color;
			copy.width = piece.width;
			copy.type = piece.type;

			return copy;
		}

		/* Get piece location as if it was hard-dropped */
		function getGhostPiece(piece) {
			var copy = copyPiece(piece);
			if (dropFast(copy)) {
				return copy;
			}

			return null;
		}

		function initPiecePosition(piece) {
			piece.x = Math.floor((grid.width / 2) - (piece.squareSize / 2));
			piece.y = -1;
		}

		function getRandomPiece() {
			var piece, pieceType;

			pieceType = rand(0, pieces.length);
			piece = pieces[pieceType];
			piece.rotation = 0;
			piece.squareSize = (piece[0].length === 9 && 3) || 4;
			initPiecePosition(piece);
			piece.color = pieceType + 1;
			piece.width = 3;
			if (pieceType === 5) {
				piece.width = 2; // block piece
			}

			if (!fitPiece(piece)) {
				/* TODO: game over */
			}

			return piece;
		}

		function createGradients(ctx, colors) {
			return colors.map(function (color) {
				var gradient = ctx.createLinearGradient(0, 0, pieceSize, pieceSize);
				gradient.addColorStop(0, '#fff');
				gradient.addColorStop(1, color);

				return gradient;
			});
		}

		function darkenColor(color) {
			return color.replace(/[\da-f]/g, function (x) {
				return Math.max(0, parseInt(x, 16) - 7);
			});
		}

		colors = ['#fff', '#f00', '#0c0', '#00f', '#dd0', '#0af', '#c0f', '#E69019'];

		pieces = [
			// Reverse L-piece
			['000100111', '110100100', '000111001', '010010110'],

			// L-piece
			['000001111', '010010011', '000111100', '011001001'],

			// Z-piece
			['000110011', '010110100', '000110011', '010110100'],

			// Reverse Z-piece
			['000011110', '100110010', '000011110', '100110010'],

			// T-piece
			['000010111', '100110100', '000111010', '010110010'],

			// Block piece
			['000110110', '000110110', '000110110', '000110110'],

			// Line piece
			['0100010001000100', '0000111100000000', '0100010001000100', '0000111100000000']
		];

		grid = (function () {
			var j, grid = [], patterns, emptyRow = '';
			grid.width = 10;
			grid.height = 20;

			for (j = 0; j < grid.width * grid.height; j += 1) {
				grid.push(0);
			}

			for (j = 0;j < grid.width;j += 1) {
				emptyRow += '0';
			}

			patterns = {
				row: new RegExp('\\d{' + grid.width + '}', 'g'),
				filledRow: /^[1-9]+$/
			};

			grid.getRows = function () {
				return grid.join('').match(patterns.row);
			};

			grid.countFilledRows = function (rows) {
				if (!rows || !rows.length) {
					rows = grid.getRows();
				}

				return (
					rows.filter(function (row) {
						return patterns.filledRow.test(row);
					}).length
				);
			};

			grid.clearFilledRows = function () {
				var j, rows, rowCount, newRows;
				rows = grid.getRows();
				rowCount = grid.countFilledRows(rows);

				/* Remove filled rows */
				newRows = rows.filter(function (row) {
					return !patterns.filledRow.test(row);
				});

				/* Pad top with new empty rows */
				while (newRows.length < grid.height) {
					newRows.unshift(emptyRow);
				}

				/* Convert new rows into flat array of actual numbers */
				newRows = newRows.join('').split('').map(function (node) {
					return +node;
				});

				/* Replace grid with new rows */
				for (j = 0;j < grid.length;j += 1) {
					grid[j] = newRows[j];
				}

				return rowCount;
			};

			grid.render = function (ctx) {
				/* Ghost piece */
				if (pieces.ghost) {
					ctx.globalAlpha = .25;
					renderPiece(
						ctx,
						pieces.ghost,
						grid.x + pieces.ghost.x * pieceSize,
						grid.y + pieces.ghost.y * pieceSize
					);
					ctx.globalAlpha = 1;
				}

				/* Grid content */
				grid.forEach(function (cell, index) {
					if (cell !== 0) {
						ctx.fillStyle = gradients[cell];
						renderSquare(
							ctx,
							colors[cell],
							grid.x + (index % grid.width) * pieceSize,
							grid.y + Math.floor(index / grid.width) * pieceSize
						);
					}
				});

				/* Current piece */
				ctx.fillStyle = gradients[pieces.current.color];
				renderPiece(
					ctx,
					pieces.current,
					grid.x + pieces.current.x * pieceSize,
					grid.y + pieces.current.y * pieceSize
				);

				/* Grid outline */
				ctx.strokeStyle = '#aaa';
				ctx.lineWidth = 2.0;
				ctx.strokeRect(grid.x, grid.y, grid.width * pieceSize, grid.height * pieceSize);
			};

			return grid;
		}());

		grid.x = 1;
		grid.y = 1;

		pieces.current = getRandomPiece();
		pieces.next = getRandomPiece();
		pieces.ghost = getGhostPiece(pieces.current);
		pieces.hold = null;

		timers = {
			move: 0,
			drop: 0
		};

		return ({
			/* Return true if game should capture the provided key code */
			captureKey: (function () {
				var codes = {};
				Object.keys(keys).forEach(function (key) {
					codes[keys[key]] = true;
				});

				return function (code) {
					return !!codes[code];
				};
			}()),

			keyPressed: function (code) {
				/* -1 means user must release key before pressing it */
				if (keys[code] !== -1) {
					keys[code] = 1;
				}

				update(Date.now(), true);
			},

			keyReleased: function (code) {
				keys[code] = 0;
			},

			update: function (delta) {
				var oldPiece;
				timers.drop += delta;
				timers.move += delta;

				while (timers.move >= 100) {
					timers.move -= 100;
					oldPiece = copyPiece(pieces.current);
					if (keys[keys.left] > 0) {
						/* Delay movement for one cycle */
						if (keys[keys.left] === 1 || keys[keys.left] > 2) {
							pieces.current.x -= 1;
						}

						keys[keys.left] += 1;
					}

					if (keys[keys.right] > 0) {
						/* Delay movement for one cycle */
						if (keys[keys.right] === 1 || keys[keys.right] > 2) {
							pieces.current.x += 1;
						}

						keys[keys.right] += 1;
					}

					if (keys[keys.up] === 1) {
						pieces.current.rotation = (pieces.current.rotation + 1) % 4;
						keys[keys.up] = -1;
					}

					if (keys[keys.down] === 1) {
						timers.drop += 1000;
					}
					
					if (keys[keys.spacebar] === 1) {
						keys[keys.spacebar] = -1;
						placePiece(pieces.ghost);
						pieces.current = copyPiece(pieces.next);
						pieces.next = getRandomPiece();
					}

					if (fitPiece(pieces.current)) {
						pieces.ghost = getGhostPiece(pieces.current);
					} else {
						/* Revert invalid movement */
						pieces.current = copyPiece(oldPiece);
					}

					if (keys[keys.c] === 1) {
						keys[keys.c] = -1;
						if (pieces.hold !== null) {
							oldPiece = copyPiece(pieces.current);
							pieces.current = copyPiece(pieces.hold);
							pieces.hold = oldPiece;
						} else {
							pieces.hold = copyPiece(pieces.current);
							pieces.current = copyPiece(pieces.next);
							pieces.next = getRandomPiece();
						}

						initPiecePosition(pieces.current);
					}
				}

				while (timers.drop >= 1000) {
					timers.drop -= 1000;
					pieces.current.y += 1;
					if (!validatePieceLocation(pieces.current)) {
						timers.drop = 0;
						pieces.current.y -= 1;
						placePiece(pieces.current);
						pieces.current = copyPiece(pieces.next);
						pieces.next = getRandomPiece();
						pieces.ghost = getGhostPiece(pieces.current);
					}
				}
			},

			render: function (ctx) {
				if (!gradients) {
					gradients = createGradients(ctx, colors);
				}

				/* Clear screen */
				ctx.clearStyle = '#fff';
				ctx.clearRect(0, 0, width, height);

				/* Render grid */
				grid.render(ctx);

				/* Render next piece */
				renderPieceBox(ctx, pieces.next, width - 130, 1, 125, 125);

				/* Render hold piece */
				renderPieceBox(ctx, pieces.hold, width - 130, 135, 125, 125);
			}
		});
	}());

	init();
}(this, this.document));
