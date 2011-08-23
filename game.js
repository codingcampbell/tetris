(function () {
	var width, height, repaint, context, lastUpdate, game;

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
		width = 800;
		height = 600;
		context = createCanvas(width, height, document.body);
		lastUpdate = Date.now();
		repaint(update);
	}

	game = (function () {
		return ({
			update: function (delta) {
			},

			render: function (ctx) {
			}
		});
	}());

	init();
}());
